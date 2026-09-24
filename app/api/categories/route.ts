import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const categories = await db.category.findMany({
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error getting categories:', error);
    return NextResponse.json({ error: 'Gagal mengambil kategori' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Pemilik yang dapat menambah kategori.' },
        { status: 403 }
      );
    }

    const { name } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi.' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check if category name already exists
    const existing = await db.category.findFirst({
      where: {
        name: {
          equals: trimmedName,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Kategori dengan nama "${trimmedName}" sudah ada.` },
        { status: 400 }
      );
    }

    const category = await db.category.create({
      data: { name: trimmedName },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Gagal menambah kategori.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Pemilik yang dapat mengubah kategori.' },
        { status: 403 }
      );
    }

    const { id, name } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID kategori wajib disertakan.' }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi.' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check if another category is already using this name
    const existing = await db.category.findFirst({
      where: {
        name: trimmedName,
        id: { not: id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Kategori dengan nama "${trimmedName}" sudah digunakan.` },
        { status: 400 }
      );
    }

    const updated = await db.category.update({
      where: { id },
      data: { name: trimmedName },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Gagal memperbarui kategori.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Pemilik yang dapat menghapus kategori.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID kategori tidak ditemukan.' }, { status: 400 });
    }

    const category = await db.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan.' }, { status: 404 });
    }

    // STRICT CHECK: Cannot delete if products exist
    const productCount = category._count.products;
    if (productCount > 0) {
      return NextResponse.json(
        {
          error: `Kategori "${category.name}" tidak dapat dihapus karena masih digunakan oleh ${productCount} produk aktif. Pindahkan atau hapus produk terlebih dahulu.`,
        },
        { status: 400 }
      );
    }

    // Safe to delete because no products are in this category
    await db.category.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Kategori "${category.name}" berhasil dihapus.`,
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Gagal menghapus kategori.' }, { status: 500 });
  }
}
