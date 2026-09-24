'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import ShiftModal from '@/components/ShiftModal';
import { usePathname } from 'next/navigation';

interface AppContextType {
  user: any;
  store: any;
  activeShift: any;
  refreshShift: () => Promise<void>;
  openShiftModal: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within ClientShell');
  return context;
};

export default function ClientShell({
  children,
  initialUser,
  initialStore,
  initialActiveShift,
}: {
  children: React.ReactNode;
  initialUser: any;
  initialStore: any;
  initialActiveShift: any;
}) {
  const [user, setUser] = useState(initialUser);
  const [store, setStore] = useState(initialStore);
  const [activeShift, setActiveShift] = useState(initialActiveShift);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const pathname = usePathname();

  const isLoginPage = pathname === '/login';

  const refreshShift = async () => {
    try {
      const res = await fetch('/api/shifts');
      if (res.ok) {
        const data = await res.json();
        setActiveShift(data.activeShift);
      }
    } catch (e) {
      console.error('Failed to refresh shift:', e);
    }
  };

  useEffect(() => {
    setUser(initialUser);
    setStore(initialStore);
    setActiveShift(initialActiveShift);
  }, [initialUser, initialStore, initialActiveShift]);

  return (
    <AppContext.Provider
      value={{
        user,
        store,
        activeShift,
        refreshShift,
        openShiftModal: () => setIsShiftModalOpen(true),
      }}
    >
      <div className="flex flex-col min-h-screen">
        {!isLoginPage && user && (
          <Navbar
            user={user}
            storeName={store?.storeName}
            activeShift={activeShift}
            onOpenShiftModal={() => setIsShiftModalOpen(true)}
          />
        )}

        <main className={`flex-1 ${!isLoginPage && user ? 'pb-20 sm:pb-8' : ''}`}>
          {children}
        </main>

        {!isLoginPage && user && (
          <BottomNav
            userRole={user?.role}
            onOpenShiftModal={() => setIsShiftModalOpen(true)}
          />
        )}

        {user && (
          <ShiftModal
            isOpen={isShiftModalOpen}
            onClose={() => setIsShiftModalOpen(false)}
            activeShift={activeShift}
            onShiftUpdated={refreshShift}
          />
        )}
      </div>
    </AppContext.Provider>
  );
}

