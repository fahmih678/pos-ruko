'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/components/ClientShell';
import {
  Search,
  Camera,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  CreditCard,
  QrCode,
  Banknote,
  Clock,
  AlertCircle,
  CheckCircle,
  Package,
  Layers,
} from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import BarcodeScannerModal from '@/components/BarcodeScannerModal';
import ReceiptModal from '@/components/ReceiptModal';

interface CartItem {
  productId: string;
  name: string;
  sellPrice: number;
  stock: number;
  quantity: number;
}

export default function CashierPage() {
  const { user, store, activeShift, refreshShift, openShiftModal } = useApp();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | 'TRANSFER'>('CASH');
  const [paidAmount, setPaidAmount] = useState<number | string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string>('');

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [completedTransaction, setCompletedTransaction] = useState<any>(null);

  // Fetch initial products and categories
  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
      ]);
      if (prodRes.ok) setProducts(await prodRes.json());
      if (catRes.ok) setCategories(await catRes.json());
    } catch (e) {
      console.error('Error fetching catalog:', e);
    } finally {
      setLoading(false);
    }
  };

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchQuery =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart operations
  const addToCart = (product: any) => {
    if (product.stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Stok maksimal untuk ${product.name} telah tercapai (${product.stock})`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sellPrice: product.sellPrice,
          stock: product.stock,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.stock) {
              alert(`Stok tidak mencukupi (Tersisa: ${item.stock})`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    if (confirm('Kosongkan keranjang belanja?')) {
      setCart([]);
      setIsCartOpen(false);
    }
  };

  // Totals
  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );
  const totalAmount = useMemo(
    () => cart.reduce((sum, item) => sum + item.sellPrice * item.quantity, 0),
    [cart]
  );

  // Barcode scanned
  const handleBarcodeScanned = (barcode: string) => {
    const matched = products.find(
      (p) => p.sku && p.sku.toLowerCase() === barcode.trim().toLowerCase()
    );

    if (matched) {
      addToCart(matched);
      setSearchQuery('');
    } else {
      setSearchQuery(barcode);
      alert(`Produk dengan barcode "${barcode}" tidak ditemukan di database.`);
    }
  };

  // Open Checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setPaidAmount(totalAmount); // default to exact amount
    setCheckoutError('');
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  // Process Checkout
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const paid = Number(paidAmount) || totalAmount;
    if (paymentMethod === 'CASH' && paid < totalAmount) {
      setCheckoutError('Nominal bayar tunai kurang dari total belanja.');
      return;
    }

    setIsProcessing(true);
    setCheckoutError('');

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          paymentMethod,
          paidAmount: paid,
          customerName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Checkout gagal');
      }

      // Reset and trigger receipt
      setCompletedTransaction(data.transaction);
      setCart([]);
      setCustomerName('');
      setIsCheckoutOpen(false);

      // Refresh catalog stock & shift
      fetchCatalog();
      refreshShift();
    } catch (err: any) {
      setCheckoutError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const changeDue = Math.max(0, (Number(paidAmount) || 0) - totalAmount);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
      {/* Shift Alert Banner if Shift is not opened */}
      {!activeShift && (
        <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2.5">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-amber-900">
                Shift Kasir Belum Dibuka
              </p>
              <p className="text-[11px] text-amber-700">
                Disarankan membuka shift & mencatat modal kas awal sebelum mulai transaksi.
              </p>
            </div>
          </div>
          <button
            onClick={openShiftModal}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow transition shrink-0"
          >
            Buka Shift
          </button>
        </div>
      )}

      {/* Search Bar & Barcode Camera Trigger */}
      <div className="flex items-center space-x-2 mb-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari produk atau ketik barcode..."
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-slate-900"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scan Barcode Button */}
        <button
          onClick={() => setIsScannerOpen(true)}
          title="Scan Barcode Kamera"
          className="flex items-center space-x-1 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm text-xs font-semibold shrink-0 transition"
        >
          <Camera className="w-4 h-4" />
          <span className="hidden sm:inline">Scan Barcode</span>
        </button>
      </div>

      {/* Category Pills (Horizontal Swipeable) */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none mb-3">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Semua Produk ({products.length})
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.name} ({cat._count?.products ?? 0})
          </button>
        ))}
      </div>

      {/* Product Catalog Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="bg-white p-3 rounded-2xl border border-slate-200 animate-pulse h-32"
            />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center my-6">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-600">
            Tidak ada produk yang cocok dengan pencarian.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Coba kata kunci lain atau pilih kategori Semua.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5 pb-20">
          {filteredProducts.map((product) => {
            const inCart = cart.find((i) => i.productId === product.id);
            const isOutOfStock = product.stock <= 0;
            const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;

            return (
              <div
                key={product.id}
                onClick={() => !isOutOfStock && addToCart(product)}
                className={`relative bg-white rounded-2xl p-3 sm:p-4 border transition-all flex flex-col justify-between cursor-pointer select-none active:scale-[0.98] ${
                  isOutOfStock
                    ? 'opacity-60 border-slate-200 bg-slate-50 cursor-not-allowed'
                    : inCart
                    ? 'border-blue-500 shadow-md ring-1 ring-blue-500 shadow-blue-100'
                    : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                {/* Quantity Badge if in cart */}
                {inCart && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white font-bold text-[11px] w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-bounce">
                    {inCart.quantity}
                  </span>
                )}

                <div>
                  {/* Category & Stock Tag */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                      {product.category?.name || 'Umum'}
                    </span>

                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        isOutOfStock
                          ? 'bg-rose-100 text-rose-700'
                          : isLowStock
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {isOutOfStock ? 'Habis' : `Stok: ${product.stock}`}
                    </span>
                  </div>

                  {/* Product Name */}
                  <h3 className="font-semibold text-xs sm:text-sm text-slate-800 line-clamp-2 leading-snug">
                    {product.name}
                  </h3>

                  {product.sku && (
                    <p className="text-[10px] text-slate-600 mt-0.5 font-mono">
                      #{product.sku}
                    </p>
                  )}
                </div>

                {/* Price and Add Button */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold text-blue-700">
                    {formatRupiah(product.sellPrice)}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition ${
                      isOutOfStock
                        ? 'bg-slate-200 text-slate-400'
                        : inCart
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bottom Cart Bar (Sticky when cart has items) */}
      {cart.length > 0 && (
        <div className="fixed bottom-16 sm:bottom-4 inset-x-0 z-30 px-3 max-w-lg mx-auto print:hidden">
          <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3 sm:p-3.5 shadow-2xl flex items-center justify-between border border-white/10">
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center space-x-3 text-left"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Total Belanja</p>
                <p className="text-sm sm:text-base font-extrabold text-white">
                  {formatRupiah(totalAmount)}
                </p>
              </div>
            </button>

            <button
              onClick={handleOpenCheckout}
              className="py-2.5 px-4 sm:px-5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition active:scale-95 flex items-center space-x-1.5"
            >
              <span>Bayar</span>
              <span className="hidden sm:inline">Sekarang</span>
            </button>
          </div>
        </div>
      )}

      {/* Cart Bottom Sheet / Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[85vh] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Keranjang ({totalItems} item)
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={clearCart}
                  title="Kosongkan Keranjang"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <div className="flex-1 pr-2">
                    <p className="font-semibold text-xs sm:text-sm text-slate-800 line-clamp-1">
                      {item.name}
                    </p>
                    <p className="text-xs font-bold text-blue-600 mt-0.5">
                      {formatRupiah(item.sellPrice)}
                    </p>
                  </div>

                  {/* Quantity Controllers */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 flex items-center justify-center hover:bg-slate-100 active:scale-95"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-xs text-slate-900 w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Summary & Proceed */}
            <div className="p-4 border-t border-slate-100 bg-white space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Total Tagihan:</span>
                <span className="text-base font-extrabold text-slate-900">
                  {formatRupiah(totalAmount)}
                </span>
              </div>

              <button
                onClick={handleOpenCheckout}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 text-sm transition"
              >
                Lanjut ke Pembayaran &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Payment Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                Pembayaran Kasir
              </h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="p-5 overflow-y-auto space-y-4">
              {checkoutError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{checkoutError}</span>
                </div>
              )}

              {/* Total Display */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
                <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider">
                  Total yang Harus Dibayar
                </span>
                <p className="text-2xl sm:text-3xl font-black text-blue-900 mt-0.5">
                  {formatRupiah(totalAmount)}
                </p>
              </div>

              {/* Customer Name (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Pelanggan (Opsional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Misal: Bu Ani / Pelanggan Umum"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('CASH');
                      setPaidAmount(totalAmount);
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition ${
                      paymentMethod === 'CASH'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span>Tunai</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('QRIS');
                      setPaidAmount(totalAmount);
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition ${
                      paymentMethod === 'QRIS'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                    <span>QRIS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('TRANSFER');
                      setPaidAmount(totalAmount);
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition ${
                      paymentMethod === 'TRANSFER'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Transfer</span>
                  </button>
                </div>
              </div>

              {/* Payment Method Specific Inputs */}
              {paymentMethod === 'CASH' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Uang Diterima (Rp)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                        Rp
                      </span>
                      <input
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        required
                        className="w-full pl-10 pr-3 py-2 text-base font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Cash Quick Suggestions */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPaidAmount(totalAmount)}
                      className="py-1.5 px-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold"
                    >
                      Uang Pas
                    </button>
                    {[20000, 50000, 100000].map((nom) => (
                      <button
                        key={nom}
                        type="button"
                        onClick={() => setPaidAmount(nom)}
                        className="py-1.5 px-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-medium"
                      >
                        {formatRupiah(nom)}
                      </button>
                    ))}
                  </div>

                  {/* Change / Kembalian Calculation */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Kembalian:</span>
                    <span
                      className={`text-base font-extrabold ${
                        changeDue >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {formatRupiah(changeDue)}
                    </span>
                  </div>
                </div>
              )}

              {paymentMethod === 'QRIS' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                  <QrCode className="w-16 h-16 text-slate-800 mx-auto" />
                  <p className="text-xs font-semibold text-slate-800">
                    Scan QRIS {store?.storeName || 'Toko'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Minta pelanggan melakukan scan kode QRIS ruko di meja kasir sebesar{' '}
                    <strong>{formatRupiah(totalAmount)}</strong>.
                  </p>
                </div>
              )}

              {paymentMethod === 'TRANSFER' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                  <CreditCard className="w-12 h-12 text-slate-800 mx-auto" />
                  <p className="text-xs font-semibold text-slate-800">
                    Transfer Bank Ruko
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Pastikan bukti transfer telah dicek dan dana sejumlah{' '}
                    <strong>{formatRupiah(totalAmount)}</strong> sudah masuk ke rekening.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 text-sm transition disabled:opacity-50 mt-4"
              >
                {isProcessing ? 'Memproses Transaksi...' : 'Konfirmasi & Selesaikan Transaksi'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleBarcodeScanned}
      />

      {/* Printable / Shareable Receipt Modal */}
      <ReceiptModal
        isOpen={!!completedTransaction}
        onClose={() => setCompletedTransaction(null)}
        transaction={completedTransaction}
        store={store}
      />
    </div>
  );
}

