'use client';

import React, { useState } from 'react';
import {
  Check,
  Edit2,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  Zap,
} from 'lucide-react';
import { useKesflow } from '@/context/KesflowContext';
import { formatNumberInput, formatRupiah, parseNumberInput } from '@/lib/format';
import { QuickPresetItem, SplitType } from '@/types';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const AVAILABLE_PRESET_ICONS = [
  'Zap',
  'Bike',
  'Car',
  'Fuel',
  'Coffee',
  'Cookie',
  'UtensilsCrossed',
  'Film',
  'ShoppingBag',
  'Building2',
  'Heart',
  'Gift',
];

export function QuickPresets() {
  const {
    addTransaction,
    categories,
    currentUser,
    partnerUser,
    events,
    userAId,
    userBId,
    quickPresets,
    addQuickPreset,
    updateQuickPreset,
    deleteQuickPreset,
    resetQuickPresets,
  } = useKesflow();

  const myId = currentUser?.id || userAId;
  const partnerId = partnerUser?.id || userBId;
  const myName = currentUser?.display_name || 'Kamu';
  const partnerName = partnerUser?.display_name || 'Pasangan';

  // Transaction quick log sheet state
  const [selectedPreset, setSelectedPreset] = useState<QuickPresetItem | null>(
    null
  );
  const [customTitle, setCustomTitle] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [payerId, setPayerId] = useState<string>(myId);
  const [splitType, setSplitType] = useState<SplitType>('EQUAL_50_50');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentSuccess, setRecentSuccess] = useState<string | null>(null);

  // Manage presets sheet state
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<QuickPresetItem | null>(
    null
  );
  const [formLabel, setFormLabel] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('Transport & Parkir');
  const [formIcon, setFormIcon] = useState('Zap');
  const [presetFormError, setPresetFormError] = useState<string | null>(null);
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  const handleTapPreset = (preset: QuickPresetItem) => {
    const activeEvent = events.find((e) => e.is_active);
    setSelectedPreset(preset);
    setCustomTitle(preset.label);
    setAmountInput(formatNumberInput(preset.amount));
    setPayerId(currentUser?.id || userAId);
    setSplitType('EQUAL_50_50');
    setSelectedEventId(activeEvent?.id || '');
  };

  const handleConfirmSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPreset || isSubmitting) return;

    const finalAmount = parseNumberInput(amountInput) || selectedPreset.amount;
    const finalTitle = customTitle.trim() || selectedPreset.label;
    const payerName = payerId === myId ? myName : partnerName;

    setIsSubmitting(true);
    try {
      const matchedCategory =
        categories.find((c) => c.name === selectedPreset.categoryName) ??
        categories[0];

      await addTransaction({
        title: finalTitle,
        amount: finalAmount,
        category_id: matchedCategory?.id || 'cat-transport',
        payer_id: payerId,
        split_type: splitType,
        event_id: selectedEventId ? selectedEventId : null,
        notes: null,
      });

      setSelectedPreset(null);
      setRecentSuccess(
        `${finalTitle} (${formatRupiah(finalAmount)}) dibayar ${payerName} berhasil dicatat!`
      );
      setTimeout(() => {
        setRecentSuccess(null);
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAddPreset = () => {
    setEditingPreset(null);
    setFormLabel('');
    setFormAmount('');
    setFormCategory(categories[0]?.name || 'Transport & Parkir');
    setFormIcon('Zap');
    setPresetFormError(null);
    setIsFormOpen(true);
    setIsManageOpen(true);
  };

  const handleOpenEditPreset = (preset: QuickPresetItem) => {
    setEditingPreset(preset);
    setFormLabel(preset.label);
    setFormAmount(formatNumberInput(preset.amount));
    setFormCategory(preset.categoryName);
    setFormIcon(preset.iconName);
    setPresetFormError(null);
    setIsFormOpen(true);
  };

  const handleSavePresetForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setPresetFormError(null);

    const cleanLabel = formLabel.trim();
    if (!cleanLabel) {
      setPresetFormError('Nama pintasan wajib diisi.');
      return;
    }

    const parsedAmount = parseNumberInput(formAmount);
    if (parsedAmount <= 0) {
      setPresetFormError('Nominal harus lebih besar dari Rp 0.');
      return;
    }

    setIsSavingPreset(true);
    try {
      if (editingPreset) {
        await updateQuickPreset(editingPreset.id, {
          label: cleanLabel,
          amount: parsedAmount,
          categoryName: formCategory,
          iconName: formIcon,
        });
      } else {
        await addQuickPreset({
          label: cleanLabel,
          amount: parsedAmount,
          categoryName: formCategory,
          iconName: formIcon,
        });
      }
      setIsFormOpen(false);
      setEditingPreset(null);
    } catch (err) {
      setPresetFormError(
        err instanceof Error ? err.message : 'Gagal menyimpan pintasan.'
      );
    } finally {
      setIsSavingPreset(false);
    }
  };

  const handleDeletePresetItem = async (id: string) => {
    if (quickPresets.length <= 1) {
      setPresetFormError('Minimal harus tersisa 1 pintasan.');
      return;
    }
    await deleteQuickPreset(id);
  };

  const handleResetPresets = async () => {
    if (window.confirm('Kembalikan semua pintasan ke daftar bawaan?')) {
      await resetQuickPresets();
      setIsFormOpen(false);
      setEditingPreset(null);
    }
  };

  return (
    <section aria-labelledby="quick-presets-heading" className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Zap className="h-4 w-4 shrink-0 text-orange-700 dark:text-orange-400" />
          <h2
            id="quick-presets-heading"
            className="text-sm font-bold text-stone-900 dark:text-stone-100"
          >
            Catat Kilat
          </h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs font-semibold text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 gap-1.5 px-2"
          onClick={() => {
            setIsFormOpen(false);
            setEditingPreset(null);
            setIsManageOpen(true);
          }}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Kelola</span>
        </Button>
      </div>

      {recentSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
        >
          <Check className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
          <span>{recentSuccess}</span>
        </div>
      )}

      <div className="w-full flex items-center gap-2 overflow-x-auto pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x">
        {quickPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handleTapPreset(preset)}
            className="group flex shrink-0 snap-start items-center gap-2.5 rounded-2xl border border-stone-200/80 bg-white p-2.5 pr-3.5 text-left shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all hover:border-orange-400 hover:shadow-sm active:scale-[0.98] dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700 dark:bg-stone-800 dark:text-orange-400 transition-colors group-hover:bg-orange-100 dark:group-hover:bg-stone-700">
              <CategoryIcon name={preset.iconName} className="h-4 w-4" />
            </div>
            <div className="whitespace-nowrap">
              <p className="text-xs font-bold leading-tight text-stone-900 dark:text-stone-100">
                {preset.label}
              </p>
              <p className="text-xs font-bold text-orange-700 dark:text-orange-400 tabular-nums">
                {formatRupiah(preset.amount)}
              </p>
            </div>
          </button>
        ))}

        <button
          type="button"
          onClick={handleOpenAddPreset}
          className="flex shrink-0 snap-start items-center gap-1.5 rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 px-3.5 py-2.5 text-xs font-semibold text-stone-600 transition-all hover:border-orange-400 hover:bg-orange-50/30 hover:text-orange-600 active:scale-95 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah</span>
        </button>
      </div>

      {/* Sheet 1: Konfirmasi Catat Pengeluaran Preset */}
      <BottomSheet
        isOpen={Boolean(selectedPreset)}
        onClose={() => setSelectedPreset(null)}
        title={`Catat Kilat: ${selectedPreset?.label || ''}`}
        description="Pastikan siapa yang membayar dan cara pembagiannya sebelum disimpan."
      >
        {selectedPreset && (
          <form onSubmit={handleConfirmSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nama Pengeluaran"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                required
              />
              <Input
                label="Nominal"
                prefixText="Rp"
                inputMode="numeric"
                value={amountInput}
                onChange={(e) =>
                  setAmountInput(formatNumberInput(e.target.value))
                }
                className="font-bold tabular-nums"
                required
              />
            </div>

            <div className="space-y-1.5">
              <span className="block text-sm font-medium text-stone-800 dark:text-stone-200">
                Siapa yang Membayar?
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayerId(myId)}
                  aria-pressed={payerId === myId}
                  className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${
                    payerId === myId
                      ? 'border-orange-700 bg-orange-700 text-white dark:border-orange-600 dark:bg-orange-600'
                      : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200'
                  }`}
                >
                  Dibayar {myName} (Kamu)
                </button>
                <button
                  type="button"
                  onClick={() => setPayerId(partnerId)}
                  aria-pressed={payerId === partnerId}
                  className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${
                    payerId === partnerId
                      ? 'border-orange-700 bg-orange-700 text-white dark:border-orange-600 dark:bg-orange-600'
                      : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200'
                  }`}
                >
                  Dibayar {partnerName}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-sm font-medium text-stone-800 dark:text-stone-200">
                Mode Bagi
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'EQUAL_50_50' as const, label: 'Split 50:50' },
                  { id: 'FULL_TREAT' as const, label: 'Treat 100%' },
                  { id: 'FULL_OWE' as const, label: 'Talangin' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSplitType(m.id)}
                    aria-pressed={splitType === m.id}
                    className={`min-h-[44px] rounded-xl border px-2.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${
                      splitType === m.id
                        ? 'border-orange-700 bg-orange-50 text-orange-950 dark:border-orange-500 dark:bg-orange-950/60 dark:text-orange-100'
                        : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {events.length > 0 && (
              <div className="space-y-1.5">
                <label
                  htmlFor="quick-preset-event"
                  className="block text-xs font-medium text-stone-700 dark:text-stone-300"
                >
                  Masuk ke Momen? (opsional)
                </label>
                <select
                  id="quick-preset-event"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                >
                  <option value="">Harian Biasa (tanpa Momen)</option>
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      Momen: {evt.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedPreset(null)}
              >
                Batal
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
              </Button>
            </div>
          </form>
        )}
      </BottomSheet>

      {/* Sheet 2: Kelola Pintasan Preset Dinamis */}
      <BottomSheet
        isOpen={isManageOpen}
        onClose={() => {
          setIsManageOpen(false);
          setIsFormOpen(false);
          setEditingPreset(null);
        }}
        title={
          isFormOpen
            ? editingPreset
              ? 'Edit Pintasan'
              : 'Tambah Pintasan Baru'
            : 'Kelola Catat Kilat'
        }
        description={
          isFormOpen
            ? 'Sesuaikan nama, harga, dan ikon pintasan cepat ini.'
            : 'Ubah atau tambahkan pintasan belanja yang sering kalian beli berdua.'
        }
      >
        {isFormOpen ? (
          <form onSubmit={handleSavePresetForm} className="space-y-4">
            {presetFormError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
                {presetFormError}
              </div>
            )}

            <div className="space-y-3">
              <Input
                label="Nama Pintasan"
                placeholder="Contoh: Bensin Motor, Kopi Susu"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                required
              />

              <Input
                label="Nominal Default"
                prefixText="Rp"
                inputMode="numeric"
                placeholder="20.000"
                value={formAmount}
                onChange={(e) =>
                  setFormAmount(formatNumberInput(e.target.value))
                }
                className="font-bold tabular-nums"
                required
              />

              <div className="space-y-1.5">
                <label
                  htmlFor="preset-category-select"
                  className="block text-xs font-medium text-stone-700 dark:text-stone-300"
                >
                  Kategori
                </label>
                <select
                  id="preset-category-select"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Pilih Ikon
                </span>
                <div className="grid grid-cols-6 gap-2">
                  {AVAILABLE_PRESET_ICONS.map((iconName) => {
                    const isSelected = formIcon === iconName;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setFormIcon(iconName)}
                        className={`flex h-11 items-center justify-center rounded-xl border transition-all ${
                          isSelected
                            ? 'border-orange-600 bg-orange-50 text-orange-700 ring-2 ring-orange-500/20 dark:border-orange-500 dark:bg-orange-950/50 dark:text-orange-300'
                            : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300'
                        }`}
                      >
                        <CategoryIcon name={iconName} className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingPreset(null);
                }}
              >
                Kembali
              </Button>
              <Button type="submit" variant="primary" disabled={isSavingPreset}>
                {isSavingPreset ? 'Menyimpan...' : 'Simpan Pintasan'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <Button
              type="button"
              variant="primary"
              className="w-full gap-2"
              onClick={() => {
                setEditingPreset(null);
                setFormLabel('');
                setFormAmount('');
                setFormCategory(categories[0]?.name || 'Transport & Parkir');
                setFormIcon('Zap');
                setPresetFormError(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Pintasan Baru</span>
            </Button>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {quickPresets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-stone-200/80 bg-white p-3 dark:border-stone-800 dark:bg-stone-900"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-700 dark:bg-stone-800 dark:text-orange-400">
                      <CategoryIcon
                        name={preset.iconName}
                        className="h-4 w-4"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                        {preset.label}
                      </p>
                      <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 tabular-nums">
                        {formatRupiah(preset.amount)} &middot;{' '}
                        <span className="text-stone-500 font-normal">
                          {preset.categoryName}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label={`Edit ${preset.label}`}
                      onClick={() => handleOpenEditPreset(preset)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Hapus ${preset.label}`}
                      onClick={() => handleDeletePresetItem(preset.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={handleResetPresets}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Kembalikan ke Preset Bawaan</span>
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </section>
  );
}
