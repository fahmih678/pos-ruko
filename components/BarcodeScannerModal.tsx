'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, AlertCircle, RefreshCw } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
}: BarcodeScannerModalProps) {
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = 'pos-reader-viewport';

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setError('');
      setIsScanning(true);

      const html5QrCode = new Html5Qrcode(elementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 180 },
        aspectRatio: 1.333333,
      };

      await html5QrCode.start(
        { facingMode: 'environment' }, // Back camera on mobile
        config,
        (decodedText) => {
          // Play a small beep audio context or vibrate
          if (navigator.vibrate) {
            navigator.vibrate(100);
          }
          onScanSuccess(decodedText);
          stopScanner();
          onClose();
        },
        () => {
          // ignore frame errors while scanning
        }
      );
    } catch (err: any) {
      console.error('Scanner error:', err);
      setError(
        'Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan atau gunakan input manual.'
      );
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
            <Camera className="w-4 h-4 text-blue-600" />
            <span>Scan Barcode Produk</span>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="p-4 flex flex-col items-center">
          <div
            id={elementId}
            className="w-full h-64 bg-black rounded-xl overflow-hidden shadow-inner relative flex items-center justify-center text-white"
          >
            {!isScanning && !error && (
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Menghubungkan kamera...</span>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start space-x-2 w-full">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="mt-3 text-xs text-slate-500 text-center">
            Arahkan kamera ke barcode atau kode QR produk pada kemasan.
          </p>
        </div>
      </div>
    </div>
  );
}

