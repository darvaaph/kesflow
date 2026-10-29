'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKesflow } from '@/context/KesflowContext';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { AddTransactionDrawer } from '@/components/transactions/AddTransactionDrawer';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useKesflow();
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-warm-bg dark:bg-stone-950 flex flex-col">
      <Header />
      <main className="mx-auto w-full max-w-md sm:max-w-lg md:max-w-xl flex-1 px-4 pt-4 pb-28">
        {children}
      </main>
      <BottomNav onOpenAddTransaction={() => setIsAddDrawerOpen(true)} />
      <AddTransactionDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
      />
    </div>
  );
}
