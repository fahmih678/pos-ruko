'use client';

import React from 'react';
import { X, Printer, Share2, CheckCircle2, RotateCcw } from 'lucide-react';
import { formatRupiah, formatDate } from '@/lib/format';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  store: any;
}

export default function ReceiptModal({
  isOpen,
  onClose,
  transaction,
  store,
}: ReceiptModalProps) {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const storeName = store?.storeName || 'Toko Ruko';
    const invoice = transaction.invoiceNumber;
    const date = formatDate(transaction.createdAt);

    let itemsText = '';
    transaction.items?.forEach((item: any) => {
      itemsText += `• ${item.productName}\n  ${item.quantity} x ${formatRupiah(item.sellPrice)} = ${formatRupiah(item.subtotal)}\n`;
    });

    const text = `*STRUK PEMBELIAN - ${storeName}*\n` +
      `No. Struk: ${invoice}\n` +
      `Waktu: ${date}\n` +
      `Kasir: ${transaction.user?.name || '-'}\n` +
      `Pelanggan: ${transaction.customerName || 'Pelanggan Umum'}\n` +
      `--------------------------------\n` +
      `${itemsText}` +
      `--------------------------------\n` +
      `*TOTAL: ${formatRupiah(transaction.totalAmount)}*\n` +
      `Metode: ${transaction.paymentMethod}\n` +
      `Bayar: ${formatRupiah(transaction.paidAmount)}\n` +
      `Kembali: ${formatRupiah(transaction.changeAmount)}\n\n` +
      `${store?.receiptFooter || 'Terima kasih telah berbelanja!'}`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-emerald-50">
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Transaksi Berhasil</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Area */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-100/50">
          <div
            id="thermal-receipt"
            className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-slate-900 font-mono text-xs leading-relaxed max-w-[320px] mx-auto"
          >
            {/* Store Header */}
            <div className="text-center pb-2 border-b border-dashed border-slate-400">
              <h2 className="text-sm font-bold tracking-tight uppercase">
                {store?.storeName || 'TOKO RUKO BERKAH'}
              </h2>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {store?.address || 'Jl. Niaga Ruko'}
              </p>
              <p className="text-[11px] text-slate-600">
                Telp: {store?.phone || '-'}
              </p>
            </div>

            {/* Meta Info */}
            <div className="py-2 border-b border-dashed border-slate-400 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>No. Struk:</span>
                <span className="font-semibold">{transaction.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{formatDate(transaction.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{transaction.user?.name || '-'}</span>
              </div>
              {transaction.customerName && (
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span>{transaction.customerName}</span>
                </div>
              )}
            </div>

            {/* Item List */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-1.5">
              {transaction.items?.map((item: any, idx: number) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-semibold">{item.productName}</div>
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>
                      {item.quantity} x {formatRupiah(item.sellPrice)}
                    </span>
                    <span className="font-medium text-slate-900">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span>TOTAL:</span>
                <span>{formatRupiah(transaction.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Metode Bayar:</span>
                <span>{transaction.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Bayar:</span>
                <span>{formatRupiah(transaction.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-[11px] font-semibold">
                <span>Kembali:</span>
                <span>{formatRupiah(transaction.changeAmount)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 text-center text-[10px] text-slate-500">
              <p>{store?.receiptFooter || 'Terima kasih atas kunjungan Anda!'}</p>
              <p className="mt-1 font-sans text-[9px] text-slate-400">
                POS Ruko System
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 border-t border-slate-100 bg-white grid grid-cols-2 gap-2">
          <button
            onClick={handlePrint}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm transition"
          >
            <Share2 className="w-4 h-4" />
            <span>Kirim WA</span>
          </button>

          <button
            onClick={onClose}
            className="col-span-2 py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Selesai / Transaksi Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
}

