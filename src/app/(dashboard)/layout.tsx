'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKesflow } from '@/context/KesflowContext';
import { NavigationProvider, useNavigation } from '@/context/NavigationContext';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { AddTransactionDrawer } from '@/components/transactions/AddTransactionDrawer';
import { getSkeletonForPath } from '@/components/ui/Skeleton';
import { LiveToastBanner } from '@/components/ui/LiveToastBanner';
import { IosInstallBanner } from '@/components/pwa/IosInstallBanner';

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isLoading, isAuthenticated, space } = useKesflow();
  const { isNavigating, targetPath } = useNavigation();
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (!space) {
        router.replace('/onboarding');
      }
    }
  }, [isLoading, isAuthenticated, space, router]);

  return (
    <div className="min-h-screen bg-warm-bg dark:bg-stone-950 flex flex-col relative">
      {/* Top Navigation Shimmer Progress Bar */}
      {isNavigating && (
        <div
          role="progressbar"
          aria-label="Memuat menu..."
          className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 animate-pulse shadow-sm"
        />
      )}

      <LiveToastBanner />
      <Header />
      <IosInstallBanner />
      <main className="mx-auto w-full max-w-md sm:max-w-lg md:max-w-xl flex-1 px-4 pt-4 pb-36 sm:pb-32">
        {isNavigating || isLoading ? (
          <div className="animate-fadeIn">
            {getSkeletonForPath(targetPath || '/')}
          </div>
        ) : (
          <div className="animate-fadeIn">
            {children}
          </div>
        )}
      </main>
      <BottomNav
        onOpenAddTransaction={() => setIsAddDrawerOpen(true)}
        isAddOpen={isAddDrawerOpen}
      />
      <AddTransactionDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
      />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavigationProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </NavigationProvider>
  );
}
