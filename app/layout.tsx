import type { Metadata, Viewport } from 'next';
import './globals.css';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import ClientShell from '@/components/ClientShell';

export const metadata: Metadata = {
  title: 'POS Ruko - Aplikasi Kasir Toko',
  description: 'Aplikasi Kasir Mobile-First untuk Toko dan Ruko',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'POS Ruko',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#2563eb',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  let store: any = null;
  let activeShift: any = null;

  if (user) {
    store = await db.storeSetting.findUnique({
      where: { id: 'default-store' },
    });

    const shift = await db.shift.findFirst({
      where: {
        userId: user.id,
        status: 'OPEN',
      },
      include: {
        transactions: {
          select: {
            totalAmount: true,
            paymentMethod: true,
          },
        },
      },
      orderBy: { openedAt: 'desc' },
    });

    if (shift) {
      const cashSales = shift.transactions
        .filter((t) => t.paymentMethod === 'CASH')
        .reduce((sum, t) => sum + t.totalAmount, 0);

      const totalSales = shift.transactions.reduce((sum, t) => sum + t.totalAmount, 0);

      activeShift = {
        id: shift.id,
        startingCash: shift.startingCash,
        openedAt: shift.openedAt.toISOString(),
        summary: {
          cashSales,
          totalSales,
        },
      };
    }
  }

  return (
    <html lang="id">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 select-none sm:select-auto">
        <ClientShell
          initialUser={user}
          initialStore={store}
          initialActiveShift={activeShift}
        >
          {children}
        </ClientShell>
      </body>
    </html>
  );
}

