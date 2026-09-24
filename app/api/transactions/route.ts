import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { generateInvoiceNumber } from '@/lib/format';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // YYYY-MM-DD
    const shiftId = searchParams.get('shiftId');
    const query = searchParams.get('q');
    const limit = Number(searchParams.get('limit')) || 50;

    const where: any = {};

    // Cashier can only see their own transactions or current shift if specified
    if (user.role === 'CASHIER') {
      where.userId = user.id;
    }

    if (shiftId) {
      where.shiftId = shiftId;
    }

    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      where.createdAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (query) {
      where.OR = [
        { invoiceNumber: { contains: query } },
        { customerName: { contains: query } },
      ];
    }

    const transactions = await db.transaction.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const isOwner = user.role === 'OWNER';

    // Sanitize costPrice and profit if user is Cashier
    const sanitized = transactions.map((t) => {
      const items = t.items.map((item) => {
        const { costPrice, ...rest } = item;
        return isOwner ? item : { ...rest, costPrice: 0 };
      });
      return {
        ...t,
        items,
      };
    });

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Gagal mengambil data transaksi' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items, paymentMethod, paidAmount, customerName } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Keranjang belanja tidak boleh kosong' }, { status: 400 });
    }

    // Get active shift for this user if any
    const activeShift = await db.shift.findFirst({
      where: {
        userId: user.id,
        status: 'OPEN',
      },
      orderBy: { openedAt: 'desc' },
    });

    // Execute atomic transaction in SQLite
    const result = await db.$transaction(async (tx) => {
      // 1. Fetch products & validate stock
      const productIds = items.map((i: any) => i.productId);
      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      const productMap = new Map(dbProducts.map((p) => [p.id, p]));

      let calculatedTotal = 0;
      const orderItemsToCreate: Array<{
        productId: string;
        productName: string;
        quantity: number;
        costPrice: number;
        sellPrice: number;
        subtotal: number;
      }> = [];

      for (const item of items) {
        const prod = productMap.get(item.productId);
        if (!prod) {
          throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
        }
        if (prod.stock < item.quantity) {
          throw new Error(
            `Stok untuk "${prod.name}" tidak mencukupi (Tersisa: ${prod.stock}, Diminta: ${item.quantity}).`
          );
        }

        const subtotal = prod.sellPrice * item.quantity;
        calculatedTotal += subtotal;

        orderItemsToCreate.push({
          productId: prod.id,
          productName: prod.name,
          quantity: item.quantity,
          costPrice: prod.costPrice,
          sellPrice: prod.sellPrice,
          subtotal,
        });

        // Deduct stock
        await tx.product.update({
          where: { id: prod.id },
          data: { stock: prod.stock - item.quantity },
        });
      }

      const totalAmount = calculatedTotal;
      const paid = Number(paidAmount) || totalAmount;

      if (paymentMethod === 'CASH' && paid < totalAmount) {
        throw new Error(
          `Nominal pembayaran tunai kurang dari total belanja (${paid} < ${totalAmount})`
        );
      }

      const changeAmount = paymentMethod === 'CASH' ? paid - totalAmount : 0;
      const invoiceNumber = generateInvoiceNumber();

      // 2. Create Transaction
      const transaction = await tx.transaction.create({
        data: {
          invoiceNumber,
          userId: user.id,
          shiftId: activeShift ? activeShift.id : null,
          totalAmount,
          paymentMethod: paymentMethod || 'CASH',
          paidAmount: paid,
          changeAmount,
          customerName: customerName ? customerName.trim() : null,
          status: 'COMPLETED',
          items: {
            create: orderItemsToCreate,
          },
        },
        include: {
          items: true,
          user: { select: { id: true, name: true } },
        },
      });

      return transaction;
    });

    const store = await db.storeSetting.findUnique({
      where: { id: 'default-store' },
    });

    return NextResponse.json(
      {
        success: true,
        transaction: result,
        store,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses transaksi' }, { status: 400 });
  }
}

