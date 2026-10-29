'use client';

import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  History,
  Pencil,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import { useKesflow } from '@/context/KesflowContext';
import { ActivityLogItem, ActivityLogType } from '@/types';
import { formatRelativeDate } from '@/lib/format';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Badge } from '@/components/ui/Badge';

export interface ActivityMutationSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

type LogFilter = 'ALL' | 'EDITS' | 'SETTLEMENTS';

export function ActivityMutationSheet({
  isOpen,
  onClose,
}: ActivityMutationSheetProps) {
  const { activityLogs, userAId } = useKesflow();
  const [filter, setFilter] = useState<LogFilter>('ALL');

  const filteredLogs = useMemo(() => {
    if (filter === 'EDITS') {
      return activityLogs.filter(
        (item) =>
          item.action_type === 'TX_UPDATED' || item.action_type === 'TX_DELETED'
      );
    }
    if (filter === 'SETTLEMENTS') {
      return activityLogs.filter(
        (item) => item.action_type === 'SETTLEMENT_ADDED'
      );
    }
    return activityLogs;
  }, [activityLogs, filter]);

  const getActionBadge = (type: ActivityLogType) => {
    switch (type) {
      case 'TX_CREATED':
        return (
          <Badge variant="neutral">
            <PlusCircle className="h-3 w-3 shrink-0" />
            <span>Catat Baru</span>
          </Badge>
        );
      case 'TX_UPDATED':
        return (
          <Badge variant="amber">
            <Pencil className="h-3 w-3 shrink-0" />
            <span>Diedit</span>
          </Badge>
        );
      case 'TX_DELETED':
        return (
          <Badge variant="coral">
            <Trash2 className="h-3 w-3 shrink-0" />
            <span>Dihapus</span>
          </Badge>
        );
      case 'SETTLEMENT_ADDED':
        return (
          <Badge variant="emerald">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            <span>Pelunasan</span>
          </Badge>
        );
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Buku Mutasi & Log Aktivitas"
      description="Rekam jejak siapa yang mencatat, mengubah, menghapus, atau melunasi transaksi"
    >
      <div className="space-y-4">
        <div
          role="tablist"
          aria-label="Filter riwayat mutasi"
          className="grid grid-cols-3 gap-1.5 rounded-xl bg-stone-200/80 p-1 dark:bg-stone-800"
        >
          {(
            [
              { id: 'ALL', label: 'Semua Mutasi' },
              { id: 'EDITS', label: 'Edit & Hapus' },
              { id: 'SETTLEMENTS', label: 'Pelunasan' },
            ] as const
          ).map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(tab.id)}
                className={`min-h-[38px] rounded-lg px-2 py-1.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${
                  active
                    ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-950 dark:text-stone-100'
                    : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {filteredLogs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center dark:border-stone-800 dark:bg-stone-950 space-y-1.5">
            <History className="mx-auto h-6 w-6 text-stone-400" />
            <p className="text-sm font-bold text-stone-800 dark:text-stone-200">
              Belum ada catatan mutasi pada filter ini
            </p>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Setiap kali kamu atau pasangan mencatat, mengedit, menghapus, atau
              mencicil pelunasan, statusnya tercatat otomatis di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredLogs.map((log: ActivityLogItem) => {
              const isUserA = log.actor_id === userAId;
              return (
                <div
                  key={log.id}
                  className="rounded-xl border border-stone-200 bg-white p-3.5 dark:border-stone-800 dark:bg-stone-950 space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {getActionBadge(log.action_type)}
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${
                          isUserA
                            ? 'bg-orange-100 text-orange-900 dark:bg-orange-950/60 dark:text-orange-200'
                            : 'bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200'
                        }`}
                      >
                        Oleh {log.actor_name}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 whitespace-nowrap">
                      {formatRelativeDate(log.created_at)}
                    </span>
                  </div>

                  <p className="text-xs font-bold leading-snug break-words text-stone-900 dark:text-stone-100">
                    {log.title}
                  </p>
                  <p className="text-xs leading-relaxed break-words text-stone-600 dark:text-stone-300">
                    {log.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
