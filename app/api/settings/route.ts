import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const store = await db.storeSetting.findUnique({
      where: { id: 'default-store' },
    });

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ store, users });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Gagal mengambil pengaturan' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const body = await request.json();
    const { storeName, address, phone, receiptFooter, qrisImageUrl, qrisText } = body;

    const updated = await db.storeSetting.upsert({
      where: { id: 'default-store' },
      update: {
        storeName: storeName || 'Toko Ruko Berkah',
        address: address || '',
        phone: phone || '',
        receiptFooter: receiptFooter || '',
        qrisImageUrl: qrisImageUrl || null,
        qrisText: qrisText || null,
      },
      create: {
        id: 'default-store',
        storeName: storeName || 'Toko Ruko Berkah',
        address: address || '',
        phone: phone || '',
        receiptFooter: receiptFooter || '',
        qrisImageUrl: qrisImageUrl || null,
        qrisText: qrisText || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating store settings:', error);
    return NextResponse.json({ error: 'Gagal menyimpan pengaturan toko' }, { status: 500 });
  }
}

// Create new user (Cashier or Owner)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'OWNER') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { name, email, password, role } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nama, Email/Username, dan Password wajib diisi.' }, { status: 400 });
    }

    const existing = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json({ error: 'Email/Username sudah digunakan.' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: role === 'OWNER' ? 'OWNER' : 'CASHIER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Gagal membuat pengguna baru' }, { status: 500 });
  }
}

// Change password
export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { userId, newPassword } = await request.json();

    if (!newPassword || newPassword.length < 5) {
      return NextResponse.json({ error: 'Password minimal 5 karakter' }, { status: 400 });
    }

    // Only owner can change other users' password. Regular cashier can only change their own.
    if (currentUser.role !== 'OWNER' && currentUser.id !== userId) {
      return NextResponse.json({ error: 'Tidak memiliki izin mengubah password pengguna lain' }, { status: 403 });
    }

    const passwordHash = await hashPassword(newPassword);

    await db.user.update({
      where: { id: userId || currentUser.id },
      data: { passwordHash },
    });

    return NextResponse.json({ success: true, message: 'Password berhasil diubah' });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Gagal mengubah password' }, { status: 500 });
  }
}

