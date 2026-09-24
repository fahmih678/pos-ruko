'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/ClientShell';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Banknote,
  QrCode,
  Award,
} from 'lucide-react';
import { formatRupiah, formatDate, formatTimeOnly } from '@/lib/format';
import * as XLSX from 'xlsx';

export default function ReportsPage() {
  const { user } = useApp();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [selectedDate]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports?date=${selectedDate}`);
      if (res.ok) {
        setReport(await res.json());
      }
    } catch (e) {
      console.error('Error fetching report:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!report || !report.transactions) return;

    // Sheet 1: Ringkasan
    const summaryData = [
      ['Laporan Penjualan Harian - POS Ruko'],
      ['Tanggal', report.date],
      [''],
      ['Metrik', 'Nilai'],
      ['Total Omset', report.summary.totalRevenue],
      ['Total Modal (COGS)', report.summary.totalCost],
      ['Estimasi Laba Kotor', report.summary.grossProfit],
      ['Margin Keuntungan (%)', `${report.summary.profitMargin}%`],
      ['Total Transaksi', report.summary.transactionCount],
      ['Penjualan Tunai', report.summary.cashTotal],
      ['Penjualan QRIS', report.summary.qrisTotal],
      ['Penjualan Transfer', report.summary.transferTotal],
    ];

    // Sheet 2: Daftar Transaksi
    const txHeaders = ['No. Invoice', 'Waktu', 'Kasir', 'Pelanggan', 'Metode Bayar', 'Total Belanja'];
    const txRows = report.transactions.map((t: any) => [
      t.invoiceNumber,
      formatDate(t.createdAt),
      t.user?.name || '-',
      t.customerName || 'Umum',
      t.paymentMethod,
      t.totalAmount,
    ]);

    // Sheet 3: Top Produk
    const prodHeaders = ['Nama Produk', 'Jumlah Terjual', 'Total Omset', 'Estimasi Laba'];
    const prodRows = report.topProducts.map((p: any) => [
      p.name,
      p.quantity,
      p.revenue,
      p.profit,
    ]);

    const wb = XLSX.utils.book_new();

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

    const wsTx = XLSX.utils.aoa_to_sheet([txHeaders, ...txRows]);
    XLSX.utils.book_append_sheet(wb, wsTx, 'Daftar Transaksi');

    const wsProd = XLSX.utils.aoa_to_sheet([prodHeaders, ...prodRows]);
    XLSX.utils.book_append_sheet(wb, wsProd, 'Produk Terlaris');

    XLSX.writeFile(wb, `Laporan_POS_Ruko_${report.date}.xlsx`);
  };

  if (user?.role !== 'OWNER') {
    return (
      <div className="p-8 text-center text-slate-600">
        Hanya Pemilik Toko yang berhak mengakses halaman laporan.
      </div>
    );
  }

  const summary = report?.summary;
  const avgBasket =
    summary && summary.transactionCount > 0
      ? summary.totalRevenue / summary.transactionCount
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Rekap Harian & Laba Toko
          </h1>
          <p className="text-xs text-slate-500">
            Laporan omset, estimasi laba kotor, dan performa penjualan
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleExportExcel}
            disabled={!report || report.transactions?.length === 0}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-white rounded-2xl border animate-pulse" />
            ))}
          </div>
        </div>
      ) : !report ? (
        <div className="p-8 text-center text-slate-500">Gagal memuat laporan</div>
      ) : (
        <div className="space-y-4 pb-24">
          {/* Main Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            {/* Omset */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Total Omset Penjualan
              </span>
              <p className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                {formatRupiah(summary?.totalRevenue || 0)}
              </p>
            </div>

            {/* Laba Kotor */}
            <div className="bg-emerald-50/70 p-3.5 sm:p-4 rounded-2xl border border-emerald-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-800">
                  Estimasi Laba Kotor
                </span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.5 rounded">
                  {summary?.profitMargin}%
                </span>
              </div>
              <p className="text-lg sm:text-xl font-black text-emerald-700 mt-1">
                {formatRupiah(summary?.grossProfit || 0)}
              </p>
            </div>

            {/* Total Transaksi */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Total Transaksi
              </span>
              <p className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                {summary?.transactionCount || 0} Struk
              </p>
            </div>

            {/* Rata-rata Belanja */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Rata-rata Transaksi
              </span>
              <p className="text-lg sm:text-xl font-black text-blue-600 mt-1">
                {formatRupiah(avgBasket)}
              </p>
            </div>
          </div>

          {/* Breakdown Metode Pembayaran */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Rincian Metode Pembayaran
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Uang Tunai (Cash)</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    {formatRupiah(summary?.cashTotal || 0)}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">QRIS</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    {formatRupiah(summary?.qrisTotal || 0)}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Transfer Bank</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    {formatRupiah(summary?.transferTotal || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Shift Kasir Hari Ini */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Shift Kasir ({report.shifts?.length || 0} Shift)
            </h3>
            {report.shifts?.length === 0 ? (
              <p className="text-xs text-slate-400">Tidak ada data shift pada tanggal ini.</p>
            ) : (
              <div className="space-y-2">
                {report.shifts.map((s: any) => {
                  const variance =
                    s.status === 'CLOSED'
                      ? (s.endingCashActual || 0) - (s.endingCashExpected || 0)
                      : null;

                  return (
                    <div
                      key={s.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">
                            {s.user?.name || 'Kasir'}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              s.status === 'OPEN'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {s.status === 'OPEN' ? 'Shift Aktif' : 'Shift Selesai'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Mulai: {formatTimeOnly(s.openedAt)}{' '}
                          {s.closedAt && `• Selesai: ${formatTimeOnly(s.closedAt)}`}
                        </p>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Modal Awal</span>
                          <span className="font-semibold">{formatRupiah(s.startingCash)}</span>
                        </div>

                        {s.status === 'CLOSED' && (
                          <div>
                            <span className="text-[10px] text-slate-400 block">Selisih Kas</span>
                            <span
                              className={`font-bold ${
                                variance === 0
                                  ? 'text-emerald-600'
                                  : variance! > 0
                                  ? 'text-blue-600'
                                  : 'text-rose-600'
                              }`}
                            >
                              {variance === 0
                                ? 'Pas'
                                : formatRupiah(Math.abs(variance!))}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top 10 Produk Terlaris */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Produk Paling Laris Hari Ini</span>
            </h3>

            {report.topProducts?.length === 0 ? (
              <p className="text-xs text-slate-400">Belum ada data produk terjual.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {report.topProducts.map((p: any, idx: number) => (
                  <div
                    key={p.name}
                    className="py-2.5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-slate-900 block">{p.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {p.quantity} pcs terjual
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-slate-900 block">
                        {formatRupiah(p.revenue)}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-medium">
                        Laba: {formatRupiah(p.profit)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

