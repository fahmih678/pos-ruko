'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calculator,
  Package,
  History,
  BarChart3,
  Settings,
  Clock,
} from 'lucide-react';

interface BottomNavProps {
  userRole?: string;
  onOpenShiftModal?: () => void;
}

export default function BottomNav({ userRole = 'CASHIER', onOpenShiftModal }: BottomNavProps) {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  const isOwner = userRole === 'OWNER';

  const navItems = [
    {
      name: 'Kasir',
      href: '/',
      icon: Calculator,
      match: (p: string) => p === '/',
    },
    {
      name: 'Produk',
      href: '/products',
      icon: Package,
      match: (p: string) => p.startsWith('/products'),
    },
    {
      name: 'Riwayat',
      href: '/history',
      icon: History,
      match: (p: string) => p.startsWith('/history'),
    },
    ...(isOwner
      ? [
          {
            name: 'Rekap',
            href: '/reports',
            icon: BarChart3,
            match: (p: string) => p.startsWith('/reports'),
          },
          {
            name: 'Pengaturan',
            href: '/settings',
            icon: Settings,
            match: (p: string) => p.startsWith('/settings'),
          },
        ]
      : [
          {
            name: 'Shift',
            action: onOpenShiftModal,
            icon: Clock,
            match: () => false,
          },
        ]),
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40 pb-safe print:hidden shadow-lg">
      <div className="max-w-md sm:max-w-xl mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map((item, idx) => {
          const isActive = item.href ? item.match(pathname) : false;
          const Icon = item.icon;

          if (item.action) {
            return (
              <button
                key={idx}
                onClick={item.action}
                className="flex-1 flex flex-col items-center justify-center py-1 text-slate-500 hover:text-blue-600 transition-colors"
              >
                <div className="p-1 rounded-xl">
                  <Icon className="w-5 h-5 text-slate-600" />
                </div>
                <span className="text-[11px] font-medium mt-0.5 text-slate-600">
                  {item.name}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={idx}
              href={item.href!}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
                isActive
                  ? 'text-blue-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-blue-50 text-blue-600' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              </div>
              <span className="text-[11px] mt-0.5 leading-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

