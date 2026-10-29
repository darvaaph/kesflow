'use client';

import React, { useMemo, useState } from 'react';
import {
  CalendarHeart,
  ChevronDown,
  ChevronUp,
  Info,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useKesflow } from '@/context/KesflowContext';
import { formatRupiah, formatShortDate } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TransactionList } from '@/components/dashboard/TransactionList';
import { AddTransactionDrawer } from '@/components/transactions/AddTransactionDrawer';

export default function EventsPage() {
  const {
    events,
    transactions,
    addDateEvent,
    toggleEventActive,
    deleteDateEvent,
  } = useKesflow();

  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    events[0]?.id ?? null
  );
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [showNewForm, setShowNewForm] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      setFormError('Masukkan nama momen (contoh: Trip Jogja).');
      return;
    }

    try {
      const created = await addDateEvent(title, startDate);
      setTitle('');
      setShowNewForm(false);
      setSelectedEventId(created.id);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal bikin momen.'
      );
    }
  };

  const eventStats = useMemo(() => {
    const totals = new Map<string, { amount: number; count: number }>();
    for (const tx of transactions) {
      if (tx.event_id) {
        const prev = totals.get(tx.event_id) ?? { amount: 0, count: 0 };
        totals.set(tx.event_id, {
          amount: prev.amount + Number(tx.amount),
          count: prev.count + 1,
        });
      }
    }
    return totals;
  }, [transactions]);

  const selectedEvent = events.find((e) => e.id === selectedEventId) ?? null;

  return (
    <div className="space-y-5">
      {/* Header & Tombol Buat Momen */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            Momen Date
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-1">
            Kelompokkan pengeluaran liburan atau acara spesial kalian.
          </p>
        </div>
        <Button
          type="button"
          variant={showNewForm ? 'outline' : 'primary'}
          size="sm"
          className="shrink-0 whitespace-nowrap h-9 px-3 gap-1.5"
          onClick={() => setShowNewForm((prev) => !prev)}
        >
          <Plus className="h-4 w-4" />
          <span>{showNewForm ? 'Batal' : 'Bikin Momen'}</span>
        </Button>
      </div>

      {/* Kotak Tips Cara Kerja (Dismissible) */}
      {showTips && (
        <div className="relative flex items-center justify-between gap-2 rounded-xl border border-stone-200/90 bg-stone-100/70 p-2.5 text-xs text-stone-700 dark:border-stone-800 dark:bg-stone-900/60 dark:text-stone-300">
          <div className="flex items-center gap-2 pr-2">
            <Info className="h-4 w-4 shrink-0 text-orange-700 dark:text-orange-400" />
            <p className="leading-snug">
              <strong>Tips:</strong> Klik kartu untuk membuka rincian transaksi. Nyalakan switch agar transaksi baru otomatis masuk ke momen itu.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowTips(false)}
            aria-label="Tutup tips"
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Form Pembuatan Momen Baru */}
      {showNewForm && (
        <Card elevated className="space-y-4 p-4">
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
            Bikin Momen Baru
          </h2>
          <form onSubmit={handleCreateEvent} className="space-y-3" noValidate>
            <Input
              label="Nama Momen / Trip"
              placeholder="Contoh: Liburan Bandung / Anniversary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Input
              label="Tanggal Acara"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            {formError && (
              <p
                role="alert"
                className="text-xs font-medium text-red-700 dark:text-red-400"
              >
                {formError}
              </p>
            )}
            <Button type="submit" fullWidth>
              Simpan Momen
            </Button>
          </form>
        </Card>
      )}

      {/* Daftar Kartu Momen */}
      {events.length === 0 ? (
        <Card className="p-6 text-center space-y-2">
          <CalendarHeart className="mx-auto h-7 w-7 text-orange-700 dark:text-orange-400" />
          <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
            Belum ada momen
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Bikin momen baru di atas untuk mulai mengelompokkan biaya trip
            atau acara spesial kalian.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((evt) => {
            const stat = eventStats.get(evt.id) ?? { amount: 0, count: 0 };
            const isSelected = selectedEventId === evt.id;
            return (
              <Card
                key={evt.id}
                className={`overflow-hidden transition-all duration-200 ${
                  isSelected
                    ? 'border-orange-600 bg-orange-50/50 dark:border-orange-500/80 dark:bg-orange-950/20 shadow-sm'
                    : 'hover:border-stone-300 dark:hover:border-stone-700'
                }`}
              >
                {/* Header kartu yang bisa di-klik untuk membuka/menutup rincian (Accordion) */}
                <button
                  type="button"
                  onClick={() =>
                    setSelectedEventId(isSelected ? null : evt.id)
                  }
                  className="w-full p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 space-y-2.5 transition-colors"
                  aria-expanded={isSelected}
                  aria-label={`${evt.title}, ${
                    isSelected ? 'tutup rincian' : 'buka rincian transaksi'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-base font-bold text-stone-900 dark:text-stone-100 truncate">
                          {evt.title}
                        </span>
                        {evt.is_active && (
                          <span
                            title="Momen Sedang Aktif"
                            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100/90 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
                            <span className="sm:hidden">Aktif</span>
                            <span className="hidden sm:inline">Sedang Berlangsung</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {formatShortDate(evt.start_date)} &middot; {stat.count} transaksi
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                          Total Momen
                        </p>
                        <p className="text-sm font-extrabold text-stone-900 dark:text-stone-100 tabular-nums whitespace-nowrap">
                          {formatRupiah(stat.amount)}
                        </p>
                      </div>

                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                        {isSelected ? (
                          <ChevronUp className="h-4 w-4 text-orange-700 dark:text-orange-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Footer kartu: Toggle status aktif + tombol hapus */}
                <div className="flex items-center justify-between border-t border-stone-200/80 bg-stone-50/60 px-4 py-2.5 dark:border-stone-800/80 dark:bg-stone-900/40">
                  {/* Switch Toggle */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={evt.is_active}
                    onClick={() => toggleEventActive(evt.id)}
                    className="flex items-center gap-2 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 rounded-lg py-1 px-1.5 -ml-1.5 transition-colors"
                  >
                    <div
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
                        evt.is_active
                          ? 'bg-orange-700 dark:bg-orange-600'
                          : 'bg-stone-300 dark:bg-stone-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                          evt.is_active ? 'translate-x-4.5' : 'translate-x-1'
                        }`}
                      />
                    </div>
                    <span className="text-xs font-medium text-stone-700 group-hover:text-stone-900 dark:text-stone-300 dark:group-hover:text-stone-100">
                      {evt.is_active
                        ? 'Otomatis catat ke sini'
                        : 'Jadikan momen aktif'}
                    </span>
                  </button>

                  {/* Tombol Hapus */}
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Hapus momen "${evt.title}"? Transaksi di dalamnya tetap tersimpan, hanya tag momennya yang dilepas.`
                        )
                      ) {
                        deleteDateEvent(evt.id);
                        if (selectedEventId === evt.id) {
                          setSelectedEventId(null);
                        }
                      }
                    }}
                    aria-label={`Hapus momen ${evt.title}`}
                    title="Hapus momen"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50 dark:hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Bagian Rincian Transaksi Momen Terpilih */}
      {selectedEvent && (
        <section className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-0.5 min-w-0">
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                Rincian Transaksi: &ldquo;{selectedEvent.title}&rdquo;
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Total biaya acara:{' '}
                <strong className="text-orange-800 dark:text-orange-300 tabular-nums whitespace-nowrap">
                  {formatRupiah(
                    eventStats.get(selectedEvent.id)?.amount ?? 0
                  )}
                </strong>
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 whitespace-nowrap h-8 px-2.5 text-xs"
              onClick={() => setIsAddTxOpen(true)}
            >
              <Plus className="h-3.5 w-3.5 text-orange-700 dark:text-orange-400" />
              <span>Catat di Momen Ini</span>
            </Button>
          </div>

          <TransactionList
            eventFilterId={selectedEvent.id}
            onOpenAddTransaction={() => setIsAddTxOpen(true)}
          />
        </section>
      )}

      <AddTransactionDrawer
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        defaultEventId={selectedEvent?.id ?? null}
      />
    </div>
  );
}
