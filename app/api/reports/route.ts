import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Pemilik yang dapat mengakses laporan.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    const transactions = await db.transaction.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'COMPLETED',
      },
      include: {
        items: true,
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalRevenue = 0;
    let totalCost = 0;
    let cashTotal = 0;
    let qrisTotal = 0;
    let transferTotal = 0;

    const productSalesMap: Record<string, { name: string; quantity: number; revenue: number; profit: number }> = {};

    for (const tx of transactions) {
      totalRevenue += tx.totalAmount;

      if (tx.paymentMethod === 'CASH') cashTotal += tx.totalAmount;
      else if (tx.paymentMethod === 'QRIS') qrisTotal += tx.totalAmount;
      else if (tx.paymentMethod === 'TRANSFER') transferTotal += tx.totalAmount;

      for (const item of tx.items) {
        const itemCost = item.costPrice * item.quantity;
        const itemRevenue = item.subtotal;
        const itemProfit = itemRevenue - itemCost;

        totalCost += itemCost;

        if (!productSalesMap[item.productName]) {
          productSalesMap[item.productName] = {
            name: item.productName,
            quantity: 0,
            revenue: 0,
            profit: 0,
          };
        }
        productSalesMap[item.productName].quantity += item.quantity;
        productSalesMap[item.productName].revenue += itemRevenue;
        productSalesMap[item.productName].profit += itemProfit;
      }
    }

    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Shifts for today
    const shifts = await db.shift.findMany({
      where: {
        openedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { openedAt: 'asc' },
    });

    return NextResponse.json({
      date: dateStr,
      summary: {
        totalRevenue,
        totalCost,
        grossProfit,
        profitMargin: Number(profitMargin.toFixed(1)),
        transactionCount: transactions.length,
        cashTotal,
        qrisTotal,
        transferTotal,
      },
      topProducts,
      shifts,
      transactions,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Gagal membuat laporan' }, { status: 500 });
  }
}

