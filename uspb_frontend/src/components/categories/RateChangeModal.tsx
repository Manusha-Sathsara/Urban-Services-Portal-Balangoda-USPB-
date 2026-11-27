"use client";

import { useEffect, useState } from "react";
import { UpdateRateDto, WasteCategory } from "@/types";
import { X, TrendingUp, AlertCircle, ShieldAlert, Check } from "lucide-react";

interface RateChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: WasteCategory | null;
  onSubmitRate: (id: number, dto: UpdateRateDto) => Promise<void>;
  isSubmitting: boolean;
}

export function RateChangeModal({
  isOpen,
  onClose,
  category,
  onSubmitRate,
  isSubmitting,
}: RateChangeModalProps) {
  const [newRate, setNewRate] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setNewRate(category.current_points_per_unit.toString());
      setReason("");
      setError(null);
    }
  }, [category, isOpen]);

  if (!isOpen || !category) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedRate = parseFloat(newRate);
    if (isNaN(parsedRate) || parsedRate <= 0) {
      setError("Please enter a valid positive points rate greater than zero.");
      return;
    }

    if (parsedRate === category.current_points_per_unit) {
      setError(
        `The new rate (${parsedRate}) must be different from the current active rate (${category.current_points_per_unit}).`
      );
      return;
    }

    if (!reason.trim()) {
      setError("A justification or official reason for the rate revision is required.");
      return;
    }

    await onSubmitRate(category.id, {
      points_per_unit: parsedRate,
      reason: reason.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rate-change-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="rate-change-modal-title"
                className="text-base font-bold text-stone-900"
              >
                Revise Points Rate
              </h2>
              <p className="text-xs text-stone-500">{category.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Current Rate Display */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-500 block">
                Current Active Rate
              </span>
              <span className="text-lg font-bold text-stone-900">
                {category.current_points_per_unit.toFixed(1)}{" "}
                <span className="text-xs font-normal text-stone-600">
                  pts / {category.measurement_unit}
                </span>
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <Check className="h-3 w-3" /> In Effect
            </span>
          </div>

          {/* New Points Rate Input */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              New Points Rate (pts / {category.measurement_unit}){" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                placeholder="e.g. 12.5"
                value={newRate}
                onChange={(e) => {
                  setNewRate(e.target.value);
                  setError(null);
                }}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors"
                required
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-stone-400 pointer-events-none">
                pts / {category.measurement_unit}
              </span>
            </div>
          </div>

          {/* Reason for Revision */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Council Revision Justification / Reason{" "}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Annual recycling incentive revision approved by council health committee resolution..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors resize-none"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Legal / Audit Notice */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 flex-shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Statutory Points Calculation Notice</p>
              <p className="text-[11px] leading-relaxed text-amber-700">
                Revising this rate will only affect collections logged in the future.
                Previously recorded collections will permanently retain the exact rate
                effective at their date of entry and will <strong>never</strong> be
                recalculated.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-stone-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#800000] px-4 py-2 text-xs font-semibold text-white hover:bg-[#660000] disabled:opacity-50 transition-colors shadow-2xs"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Applying New Rate...
                </>
              ) : (
                <>
                  <TrendingUp className="h-3.5 w-3.5" />
                  Confirm & Apply New Rate
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RateChangeModal;
