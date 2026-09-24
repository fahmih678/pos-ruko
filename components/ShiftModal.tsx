'use client';

import React, { useState } from 'react';
import { X, Clock, AlertCircle, CheckCircle2, Wallet, ArrowRight } from 'lucide-react';
import { formatRupiah, formatDate } from '@/lib/format';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeShift: any;
  onShiftUpdated: () => void;
}

export default function ShiftModal({
  isOpen,
  onClose,
  activeShift,
  onShiftUpdated,
}: ShiftModalProps) {
  const [startingCash, setStartingCash] = useState<number | string>(100000);
  const [endingCashActual, setEndingCashActual] = useState<number | string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleStartShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startingCash: Number(startingCash) || 0,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memulai shift');

      onShiftUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/shifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId: activeShift.id,
          endingCashActual: Number(endingCashActual) || 0,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menutup shift');

      onShiftUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const expectedCash = activeShift?.summary?.expectedCashInDrawer ?? 0;
  const countedCash = Number(endingCashActual) || 0;
  const variance = countedCash - expectedCash;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-base">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>{activeShift ? 'Detail Shift Kasir Aktif' : 'Buka Shift Baru'}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!activeShift ? (
            /* Form Buka Shift */
            <form onSubmit={handleStartShift} className="space-y-4">
              <p className="text-sm text-slate-600">
                Masukkan nominal <strong>modal awal kas</strong> di laci sebelum memulai melayani transaksi.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Modal Awal Kasir (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 font-semibold text-sm">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={startingCash}
                    onChange={(e) => setStartingCash(e.target.value)}
                    required
                    min={0}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-lg text-slate-900"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Tombol Cepat Nominal */}
              <div className="grid grid-cols-3 gap-2">
                {[50000, 100000, 200000].map((nominal) => (
                  <button
                    key={nominal}
                    type="button"
                    onClick={() => setStartingCash(nominal)}
                    className="py-1.5 px-2 text-xs font-medium border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition"
                  >
                    {formatRupiah(nominal)}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Catatan Awal (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Misal: Uang receh 2 ribuan 20 lembar..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{loading ? 'Menyimpan...' : 'Buka Shift Sekarang'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Detail & Tutup Shift */
            <form onSubmit={handleCloseShift} className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Waktu Dibuka</span>
                  <span className="font-semibold text-slate-900">
                    {formatDate(activeShift.openedAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Modal Awal Kas</span>
                  <span className="font-semibold text-slate-900">
                    {formatRupiah(activeShift.startingCash)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Penjualan Tunai</span>
                  <span className="font-semibold text-emerald-600">
                    +{formatRupiah(activeShift.summary?.cashSales || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Penjualan QRIS / Transfer</span>
                  <span className="font-semibold text-blue-600">
                    {formatRupiah((activeShift.summary?.qrisSales || 0) + (activeShift.summary?.transferSales || 0))}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm">
                  <span className="font-bold text-slate-800">Uang Fisik Seharusnya</span>
                  <span className="font-bold text-blue-700">
                    {formatRupiah(expectedCash)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Hitungan Uang Fisik di Laci Kasir (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 font-semibold text-sm">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={endingCashActual}
                    onChange={(e) => setEndingCashActual(e.target.value)}
                    required
                    min={0}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-lg text-slate-900"
                    placeholder="Masukkan jumlah uang fisik di laci"
                  />
                </div>
              </div>

              {/* Status Selisih Kas */}
              {endingCashActual !== '' && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between font-semibold ${
                    variance === 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : variance > 0
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    {variance === 0 ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span>
                      {variance === 0
                        ? 'Kas Pas (Sesuai)'
                        : variance > 0
                        ? 'Selisih Kas Lebih'
                        : 'Selisih Kas Kurang'}
                    </span>
                  </div>
                  <span>{formatRupiah(Math.abs(variance))}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Catatan Tutup Shift (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Catatan kendala atau penyerahan kas..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-200 transition-all disabled:opacity-50"
              >
                {loading ? 'Menutup Shift...' : 'Tutup Shift Sekarang'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

