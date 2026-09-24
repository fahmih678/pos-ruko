import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeShift = await db.shift.findFirst({
      where: {
        userId: user.id,
        status: 'OPEN',
      },
      include: {
        transactions: {
          select: {
            id: true,
            totalAmount: true,
            paymentMethod: true,
            paidAmount: true,
            changeAmount: true,
            createdAt: true,
          },
        },
      },
      orderBy: { openedAt: 'desc' },
    });

    if (!activeShift) {
      return NextResponse.json({ activeShift: null });
    }

    // Calculate current shift totals
    const cashSales = activeShift.transactions
      .filter((t) => t.paymentMethod === 'CASH')
      .reduce((sum, t) => sum + t.totalAmount, 0);

    const qrisSales = activeShift.transactions
      .filter((t) => t.paymentMethod === 'QRIS')
      .reduce((sum, t) => sum + t.totalAmount, 0);

    const transferSales = activeShift.transactions
      .filter((t) => t.paymentMethod === 'TRANSFER')
      .reduce((sum, t) => sum + t.totalAmount, 0);

    const totalSales = cashSales + qrisSales + transferSales;
    const expectedCashInDrawer = activeShift.startingCash + cashSales;

    return NextResponse.json({
      activeShift: {
        ...activeShift,
        summary: {
          transactionCount: activeShift.transactions.length,
          cashSales,
          qrisSales,
          transferSales,
          totalSales,
          expectedCashInDrawer,
        },
      },
    });
  } catch (error) {
    console.error('Error getting shift:', error);
    return NextResponse.json({ error: 'Gagal mengambil data shift' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if there is already an open shift
    const existing = await db.shift.findFirst({
      where: {
        userId: user.id,
        status: 'OPEN',
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Anda masih memiliki shift kasir yang aktif.' }, { status: 400 });
    }

    const { startingCash, notes } = await request.json();

    const newShift = await db.shift.create({
      data: {
        userId: user.id,
        startingCash: Number(startingCash) || 0,
        notes: notes || '',
        status: 'OPEN',
      },
    });

    return NextResponse.json(newShift, { status: 201 });
  } catch (error) {
    console.error('Error starting shift:', error);
    return NextResponse.json({ error: 'Gagal membuka shift' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shiftId, endingCashActual, notes } = await request.json();

    const shift = await db.shift.findUnique({
      where: { id: shiftId },
      include: { transactions: true },
    });

    if (!shift || shift.status !== 'OPEN') {
      return NextResponse.json({ error: 'Shift tidak valid atau sudah ditutup.' }, { status: 400 });
    }

    const cashSales = shift.transactions
      .filter((t) => t.paymentMethod === 'CASH')
      .reduce((sum, t) => sum + t.totalAmount, 0);

    const endingCashExpected = shift.startingCash + cashSales;

    const closedShift = await db.shift.update({
      where: { id: shiftId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        endingCashExpected,
        endingCashActual: Number(endingCashActual) || 0,
        notes: notes !== undefined ? notes : shift.notes,
      },
    });

    return NextResponse.json({
      success: true,
      closedShift,
      variance: (Number(endingCashActual) || 0) - endingCashExpected,
    });
  } catch (error) {
    console.error('Error closing shift:', error);
    return NextResponse.json({ error: 'Gagal menutup shift' }, { status: 500 });
  }
}

