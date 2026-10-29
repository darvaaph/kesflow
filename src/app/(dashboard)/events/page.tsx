'use client';

import React, { useMemo, useState } from 'react';
import {
  CalendarHeart,
  FolderOpen,
  Info,
  Plus,
  Radio,
  Trash2,
} from 'lucide-react';
import { useKesflow } from '@/context/KesflowContext';
import { formatRupiah, formatShortDate } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
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
      {/* Header & Tombol Buat Album */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            Momen Date
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            Kelompokkan pengeluaran per acara spesial (seperti liburan bareng
            atau malam minggu) agar total biayanya rapi dan tidak tercampur
            pengeluaran harian.
          </p>
        </div>
        <Button
          type="button"
          variant={showNewForm ? 'outline' : 'primary'}
          size="sm"
          className="shrink-0 whitespace-nowrap self-start sm:self-auto"
          onClick={() => setShowNewForm((prev) => !prev)}
        >
          <Plus className="h-4 w-4" />
          <span>{showNewForm ? 'Tutup Form' : 'Bikin Momen Baru'}</span>
        </Button>
      </div>

      {/* Kotak Penjelasan Singkat Cara Kerja Album Kencan */}
      <div className="flex items-start gap-2.5 rounded-xl border border-stone-200/90 bg-stone-100/70 p-3 text-xs text-stone-700 dark:border-stone-800 dark:bg-stone-900/60 dark:text-stone-300">
        <Info className="h-4 w-4 shrink-0 text-orange-700 dark:text-orange-400 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Tips:</strong> Ketuk <strong>Lihat Rincian</strong> untuk melihat daftar transaksi acara di bawah.
          Aktifkan <strong>Jadikan Acara Aktif</strong> jika kalian sedang menjalani acara tersebut hari
          ini, agar setiap pengeluaran baru otomatis ditandai ke momen ini.
        </p>
      </div>

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
                className={`p-4 space-y-3 transition-colors ${
                  isSelected
                    ? 'border-orange-700 bg-orange-50/70 dark:border-orange-500 dark:bg-orange-950/30'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedEventId(evt.id)}
                    className="flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 rounded-lg space-y-1"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-stone-900 dark:text-stone-100">
                        {evt.title}
                      </span>
                      {evt.is_active && (
                        <Badge variant="emerald">Sedang Berlangsung</Badge>
                      )}
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      Tanggal: {formatShortDate(evt.start_date)} &middot;{' '}
                      {stat.count} transaksi
                    </p>
                  </button>

                  <div className="text-right shrink-0">
                    <p className="text-[11px] font-medium text-stone-600 dark:text-stone-400">
                      Total Momen
                    </p>
                    <p className="text-sm font-extrabold text-stone-900 dark:text-stone-100 tabular-nums whitespace-nowrap">
                      {formatRupiah(stat.amount)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200/80 pt-3 dark:border-stone-800">
                  <div className="flex flex-wrap items-center gap-2">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-950 dark:text-orange-200 py-1.5 px-3 rounded-xl bg-orange-100/80 dark:bg-orange-950/60 border border-orange-200/60 dark:border-orange-900/50">
                        <FolderOpen className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                        <span>Rincian Ditampilkan</span>
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap"
                        onClick={() => setSelectedEventId(evt.id)}
                      >
                        <FolderOpen className="h-3.5 w-3.5 text-stone-500" />
                        <span>Lihat Rincian</span>
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant={evt.is_active ? 'secondary' : 'outline'}
                      size="sm"
                      className="whitespace-nowrap"
                      onClick={() => toggleEventActive(evt.id)}
                    >
                      <Radio
                        className={`h-3.5 w-3.5 ${
                          evt.is_active
                            ? 'text-emerald-700 dark:text-emerald-400 animate-pulse'
                            : 'text-stone-400'
                        }`}
                      />
                      <span>
                        {evt.is_active
                          ? 'Nonaktifkan Acara'
                          : 'Jadikan Acara Aktif'}
                      </span>
                    </Button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      deleteDateEvent(evt.id);
                      if (selectedEventId === evt.id) {
                        setSelectedEventId(null);
                      }
                    }}
                    aria-label={`Hapus momen ${evt.title}`}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-stone-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50 dark:hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {selectedEvent && (
        <section className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Rincian Transaksi: &ldquo;{selectedEvent.title}&rdquo;
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Total biaya acara ini:{' '}
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
              className="shrink-0 whitespace-nowrap self-start sm:self-auto"
              onClick={() => setIsAddTxOpen(true)}
            >
              <Plus className="h-4 w-4 text-orange-700 dark:text-orange-400" />
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
