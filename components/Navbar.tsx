'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Store, LogOut, Clock, ShieldCheck, User as UserIcon } from 'lucide-react';
import { formatRupiah } from '@/lib/format';

interface NavbarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  storeName?: string;
  activeShift?: {
    id: string;
    startingCash: number;
    openedAt: string;
    summary?: {
      totalSales: number;
      cashSales: number;
    };
  } | null;
  onOpenShiftModal?: () => void;
}

export default function Navbar({
  user,
  storeName = 'POS Ruko',
  activeShift,
  onOpenShiftModal,
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin logout?')) {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
  };

  if (!user || pathname === '/login') return null;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Store Info */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 leading-tight truncate max-w-[180px] sm:max-w-xs">
                {storeName}
              </h1>
              <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${
                    user.role === 'OWNER'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {user.role === 'OWNER' ? 'Pemilik' : 'Kasir'}
                </span>
                <span className="truncate max-w-[120px]">{user.name}</span>
              </div>
            </div>
          </div>

          {/* Right Action: Shift & Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Shift Indicator / Trigger Button */}
            {onOpenShiftModal && (
              <button
                onClick={onOpenShiftModal}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeShift
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 animate-pulse'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {activeShift ? 'Shift Aktif' : 'Mulai Shift'}
                </span>
                {activeShift && (
                  <span className="font-semibold text-emerald-800">
                    ({formatRupiah(activeShift.summary?.totalSales || 0)})
                  </span>
                )}
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Keluar"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

