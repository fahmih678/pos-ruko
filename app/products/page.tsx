'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/components/ClientShell';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  Camera,
  Layers,
  Check,
  TrendingUp,
  Folder,
  Tag,
  Lock,
  AlertCircle,
  FolderPlus,
} from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import BarcodeScannerModal from '@/components/BarcodeScannerModal';

export default function ProductsPage() {
  const { user } = useApp();
  const isOwner = user?.role === 'OWNER';

  // Navigation tab: 'products' | 'categories'
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Product Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Product Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    costPrice: '',
    sellPrice: '',
    stock: '',
    minStockAlert: '5',
    categoryId: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category Management State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);

  // Category Delete State
  const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [deleteCategoryError, setDeleteCategoryError] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (e) {
      console.error('Error fetching products:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        setCategories(await res.json());
      }
    } catch (e) {
      console.error('Error fetching categories:', e);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchQuery =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchLowStock = !filterLowStockOnly || p.stock <= p.minStockAlert;
      return matchCat && matchQuery && matchLowStock;
    });
  }, [products, selectedCategory, searchQuery, filterLowStockOnly]);

  // Product Modals
  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      costPrice: '',
      sellPrice: '',
      stock: '',
      minStockAlert: '5',
      categoryId: categories[0]?.id || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku || '',
      costPrice: p.costPrice !== undefined ? String(p.costPrice) : '0',
      sellPrice: String(p.sellPrice),
      stock: String(p.stock),
      minStockAlert: String(p.minStockAlert || 5),
      categoryId: p.categoryId || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    try {
      const url = '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      const body = {
        ...(editingProduct && { id: editingProduct.id }),
        name: formData.name,
        sku: formData.sku || null,
        costPrice: Number(formData.costPrice) || 0,
        sellPrice: Number(formData.sellPrice) || 0,
        stock: Number(formData.stock) || 0,
        minStockAlert: Number(formData.minStockAlert) || 5,
        categoryId: formData.categoryId || null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan data produk');

      setIsModalOpen(false);
      fetchProducts();
      fetchCategories();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (confirm(`Yakin ingin menonaktifkan produk "${name}"?`)) {
      try {
        const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchProducts();
          fetchCategories();
        }
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  // Category Actions
  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCategoryNameInput('');
    setCategoryError('');
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: any) => {
    setEditingCategory(cat);
    setCategoryNameInput(cat.name);
    setCategoryError('');
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryNameInput.trim()) return;

    setIsCategorySubmitting(true);
    setCategoryError('');

    try {
      const url = '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      const body = editingCategory
        ? { id: editingCategory.id, name: categoryNameInput.trim() }
        : { name: categoryNameInput.trim() };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan kategori');

      setIsCategoryModalOpen(false);
      fetchCategories();
      fetchProducts();

      // If user was adding product and created a new category, auto-select it
      if (isModalOpen && data.id) {
        setFormData((prev) => ({ ...prev, categoryId: data.id }));
      }
    } catch (err: any) {
      setCategoryError(err.message);
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsDeletingCategory(true);
    setDeleteCategoryError('');

    try {
      const res = await fetch(`/api/categories?id=${categoryToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus kategori');
      }

      setCategoryToDelete(null);
      fetchCategories();
      fetchProducts();
    } catch (err: any) {
      setDeleteCategoryError(err.message);
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= p.minStockAlert).length,
    [products]
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Katalog & Kategori Produk
          </h1>
          <p className="text-xs text-slate-500">
            Kelola barang dagangan dan kelompok kategori toko ruko
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center space-x-2 bg-slate-200/80 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'products'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Produk ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'categories'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Kategori ({categories.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAFTAR PRODUK */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-3">
          {/* Action Row */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              Daftar Barang Dagangan
            </span>

            {isOwner && (
              <button
                onClick={openAddModal}
                className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/25 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk</span>
              </button>
            )}
          </div>

          {/* Filter / Low Stock Alerts */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setFilterLowStockOnly(false)}
              className={`p-2.5 rounded-xl border text-left transition ${
                !filterLowStockOnly
                  ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <span className="text-[11px] block text-slate-500">Semua Produk</span>
              <span className="text-base font-bold">{products.length} Item</span>
            </button>

            <button
              onClick={() => setFilterLowStockOnly(true)}
              className={`p-2.5 rounded-xl border text-left transition ${
                filterLowStockOnly
                  ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center space-x-1 text-[11px] text-amber-600 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Stok Menipis</span>
              </div>
              <span className="text-base font-bold text-amber-800">
                {lowStockCount} Item
              </span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama produk atau SKU/barcode..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-slate-900"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Semua Kategori
            </button>

            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === c.id
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Products List */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse"
                />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center my-6">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">
                Tidak ada produk ditemukan.
              </p>
            </div>
          ) : (
            <div className="space-y-2 pb-24">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stock <= 0;
                const isLow = p.stock > 0 && p.stock <= p.minStockAlert;
                const estimatedMargin =
                  p.sellPrice > 0 && p.costPrice > 0
                    ? (((p.sellPrice - p.costPrice) / p.sellPrice) * 100).toFixed(0)
                    : null;

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex-1 pr-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                          {p.category?.name || 'Tanpa Kategori'}
                        </span>
                        {p.sku && (
                          <span className="text-[10px] font-mono text-slate-400">
                            #{p.sku}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 mt-1">
                        {p.name}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs">
                        <span className="font-extrabold text-blue-600">
                          {formatRupiah(p.sellPrice)}
                        </span>

                        {isOwner && (
                          <span className="text-slate-500 text-[11px]">
                            Modal: {formatRupiah(p.costPrice)}{' '}
                            {estimatedMargin && (
                              <span className="text-emerald-700 font-semibold bg-emerald-50 px-1 rounded">
                                +{estimatedMargin}%
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-1 rounded-lg text-xs font-bold ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.stock} pcs
                        </span>
                        {isLow && (
                          <span className="block text-[9px] text-amber-600 mt-0.5">
                            Min: {p.minStockAlert}
                          </span>
                        )}
                      </div>

                      {isOwner && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                            title="Edit Produk"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                            title="Nonaktifkan Produk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KELOLA KATEGORI PRODUK */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-3 pb-24">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Daftar Kategori ({categories.length})
              </h2>
              <p className="text-[11px] text-slate-500">
                Pengelompokan barang untuk mempermudah transaksi kasir
              </p>
            </div>

            {isOwner && (
              <button
                onClick={openAddCategoryModal}
                className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/25 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kategori</span>
              </button>
            )}
          </div>

          {/* Info Card tentang Kebijakan Proteksi Hapus */}
          <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-2xl flex items-start space-x-2 text-xs text-blue-900">
            <Tag className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p>
              <strong>Aturan Keamanan:</strong> Kategori yang sedang digunakan oleh produk tidak dapat dihapus. Anda harus memindahkan atau menghapus produk di dalamnya terlebih dahulu sebelum kategori dapat dihapus.
            </p>
          </div>

          {/* Categories Grid / List */}
          {categories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center my-6">
              <Folder className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">
                Belum ada kategori produk.
              </p>
              {isOwner && (
                <button
                  onClick={openAddCategoryModal}
                  className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold inline-flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Kategori Pertama</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {categories.map((cat) => {
                const count = cat._count?.products || 0;
                const hasProducts = count > 0;

                return (
                  <div
                    key={cat.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          hasProducts
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Folder className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">
                          {cat.name}
                        </h3>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              hasProducts
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {count} Produk Aktif
                          </span>
                        </div>
                      </div>
                    </div>

                    {isOwner && (
                      <div className="flex items-center space-x-1">
                        {/* Edit Button */}
                        <button
                          onClick={() => openEditCategoryModal(cat)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                          title="Ubah Nama Kategori"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete Button with Protected Tooltip */}
                        {hasProducts ? (
                          <button
                            onClick={() =>
                              alert(
                                `Kategori "${cat.name}" tidak dapat dihapus karena masih digunakan oleh ${count} produk. Silakan ubah atau hapus produk terkait terlebih dahulu.`
                              )
                            }
                            className="p-2 text-slate-300 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition cursor-not-allowed"
                            title={`Terkunci: Ada ${count} produk`}
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setDeleteCategoryError('');
                              setCategoryToDelete(cat);
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                            title="Hapus Kategori Kosong"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH / EDIT KATEGORI */}
      {/* ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>
                  {editingCategory ? 'Ubah Nama Kategori' : 'Tambah Kategori Baru'}
                </span>
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-5 space-y-4">
              {categoryError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{categoryError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kategori *
                </label>
                <input
                  type="text"
                  value={categoryNameInput}
                  onChange={(e) => setCategoryNameInput(e.target.value)}
                  required
                  placeholder="Misal: Elektronik & Baterai"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900"
                  autoFocus
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-xs hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCategorySubmitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/25 transition disabled:opacity-50"
                >
                  {isCategorySubmitting ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: KONFIRMASI HAPUS KATEGORI KOSONG */}
      {/* ========================================================================= */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Hapus Kategori "{categoryToDelete.name}"?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Kategori ini sedang tidak memiliki produk. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            {deleteCategoryError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs text-left flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{deleteCategoryError}</span>
              </div>
            )}

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-xs hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                disabled={isDeletingCategory}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-500/25 transition disabled:opacity-50"
              >
                {isDeletingCategory ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH / EDIT PRODUK */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingProduct ? 'Ubah Data Produk' : 'Tambah Produk Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 overflow-y-auto space-y-3.5">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Produk *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Misal: Minyak Goreng 2L"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Barcode / SKU + Scan Button */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Barcode / SKU
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Contoh: 899123456789"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center space-x-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Scan</span>
                  </button>
                </div>
              </div>

              {/* Category + Quick Add Category Shortcut */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Kategori
                  </label>
                  <button
                    type="button"
                    onClick={openAddCategoryModal}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Kategori Baru</span>
                  </button>
                </div>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pricing (Cost & Sell) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Modal (Rp)
                  </label>
                  <input
                    type="number"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    placeholder="0"
                    min={0}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Jual (Rp) *
                  </label>
                  <input
                    type="number"
                    value={formData.sellPrice}
                    onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                    required
                    placeholder="0"
                    min={0}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Stock & Alert */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jumlah Stok *
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                    placeholder="0"
                    min={0}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Peringatan Stok Min.
                  </label>
                  <input
                    type="number"
                    value={formData.minStockAlert}
                    onChange={(e) =>
                      setFormData({ ...formData, minStockAlert: e.target.value })
                    }
                    placeholder="5"
                    min={0}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 text-sm transition mt-3 disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Produk'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal for Product Form */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(code) => setFormData((prev) => ({ ...prev, sku: code }))}
      />
    </div>
  );
}
