import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const isOwner = user?.role === 'OWNER';

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const categoryId = searchParams.get('category') || '';
    const barcode = searchParams.get('barcode')?.trim() || '';
    const lowStock = searchParams.get('lowStock') === 'true';

    const where: any = {
      isActive: true,
    };

    if (barcode) {
      where.sku = barcode;
    } else if (q) {
      where.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
      ];
    }

    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId;
    }

    const products = await db.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });

    let filteredProducts = products;
    if (lowStock) {
      filteredProducts = products.filter((p) => p.stock <= p.minStockAlert);
    }

    // Hide costPrice for non-owner
    const sanitizedProducts = filteredProducts.map((p) => {
      const { costPrice, ...rest } = p;
      return isOwner ? p : { ...rest, costPrice: 0 };
    });

    return NextResponse.json(sanitizedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Gagal mengambil data produk' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Pemilik yang dapat menambah produk.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, sku, costPrice, sellPrice, stock, minStockAlert, categoryId } = body;

    if (!name || sellPrice === undefined || sellPrice === null) {
      return NextResponse.json({ error: 'Nama produk dan harga jual wajib diisi' }, { status: 400 });
    }

    // Check SKU duplication if provided
    if (sku && sku.trim()) {
      const existing = await db.product.findUnique({
        where: { sku: sku.trim() },
      });
      if (existing) {
        return NextResponse.json({ error: `Barcode/SKU "${sku}" sudah digunakan oleh produk ${existing.name}` }, { status: 400 });
      }
    }

    const product = await db.product.create({
      data: {
        name: name.trim(),
        sku: sku ? sku.trim() : null,
        costPrice: Number(costPrice) || 0,
        sellPrice: Number(sellPrice),
        stock: Number(stock) || 0,
        minStockAlert: Number(minStockAlert) || 5,
        categoryId: categoryId || null,
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: error.message || 'Gagal menyimpan produk' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Pemilik yang dapat mengubah produk.' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, sku, costPrice, sellPrice, stock, minStockAlert, categoryId, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID produk tidak ditemukan' }, { status: 400 });
    }

    // Check SKU conflict with another product
    if (sku && sku.trim()) {
      const existing = await db.product.findFirst({
        where: {
          sku: sku.trim(),
          id: { not: id },
        },
      });
      if (existing) {
        return NextResponse.json({ error: `Barcode/SKU "${sku}" sudah digunakan oleh produk ${existing.name}` }, { status: 400 });
      }
    }

    const updated = await db.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(sku !== undefined && { sku: sku ? sku.trim() : null }),
        ...(costPrice !== undefined && { costPrice: Number(costPrice) }),
        ...(sellPrice !== undefined && { sellPrice: Number(sellPrice) }),
        ...(stock !== undefined && { stock: Number(stock) }),
        ...(minStockAlert !== undefined && { minStockAlert: Number(minStockAlert) }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { category: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui produk' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID produk diperlukan' }, { status: 400 });
    }

    // Soft delete product by setting isActive = false
    await db.product.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: 'Produk berhasil dinonaktifkan' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus produk' }, { status: 500 });
  }
}

