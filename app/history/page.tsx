'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/ClientShell';
import {
  History as HistoryIcon,
  Search,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  FileText,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { formatRupiah, formatDate } from '@/lib/format';
import ReceiptModal from '@/components/ReceiptModal';

export default function HistoryPage() {
  const { store } = useApp();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [selectedDate]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const url = selectedDate
        ? `/api/transactions?date=${selectedDate}`
        : '/api/transactions';
      const res = await fetch(url);
      if (res.ok) {
        setTransactions(await res.json());
      }
    } catch (e) {
      console.error('Error fetching transactions:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = transactions.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.invoiceNumber.toLowerCase().includes(q) ||
      (t.customerName && t.customerName.toLowerCase().includes(q))
    );
  });

  const totalOmsetToday = filtered.reduce((sum, t) => sum + t.totalAmount, 0);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Riwayat Transaksi
          </h1>
          <p className="text-xs text-slate-500">
            Daftar transaksi penjualan toko & cetak struk
          </p>
        </div>

        {/* Date Picker */}
        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Summary Card for Selected Date */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-4 shadow-lg shadow-blue-500/20 mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-blue-100 font-medium">Total Penjualan</p>
          <p className="text-xl sm:text-2xl font-black mt-0.5">
            {formatRupiah(totalOmsetToday)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-blue-100 font-medium">Jumlah Struk</p>
          <p className="text-xl sm:text-2xl font-black mt-0.5">
            {filtered.length} Transaksi
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nomor struk atau nama pelanggan..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-slate-900"
        />
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center my-6">
          <HistoryIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600">
            Belum ada transaksi pada tanggal ini.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 pb-24">
          {filtered.map((tx) => {
            const itemCount = tx.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0;

            return (
              <div
                key={tx.id}
                onClick={() => setSelectedTransaction(tx)}
                className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm hover:border-blue-300 transition cursor-pointer flex items-center justify-between active:scale-[0.99]"
              >
                <div className="flex-1 pr-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {tx.invoiceNumber}
                    </span>

                    {/* Payment Badge */}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                        tx.paymentMethod === 'CASH'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : tx.paymentMethod === 'QRIS'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {tx.paymentMethod === 'CASH' && <Banknote className="w-3 h-3" />}
                      {tx.paymentMethod === 'QRIS' && <QrCode className="w-3 h-3" />}
                      {tx.paymentMethod === 'TRANSFER' && <CreditCard className="w-3 h-3" />}
                      <span>{tx.paymentMethod}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1">
                    {formatDate(tx.createdAt)} &bull; Kasir: {tx.user?.name || '-'}
                  </p>

                  <p className="text-xs text-slate-600 mt-1">
                    {itemCount} barang
                    {tx.customerName && (
                      <span className="font-medium text-slate-800">
                        {' '}&bull; {tx.customerName}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-blue-600 block">
                      {formatRupiah(tx.totalAmount)}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center justify-end space-x-0.5 mt-0.5">
                      <Printer className="w-3 h-3" />
                      <span>Cetak Struk</span>
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail / Reprint Modal */}
      <ReceiptModal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
        store={store}
      />
    </div>
  );
}

