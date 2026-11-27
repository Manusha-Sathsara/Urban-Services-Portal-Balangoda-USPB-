"use client";

import { useEffect, useState } from "react";
import { BadgeDefinition, UpdateThresholdDto } from "@/types";
import { X, TrendingUp, AlertCircle, ShieldAlert, Check } from "lucide-react";

interface BadgeThresholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  badge: BadgeDefinition | null;
  onSubmitThreshold: (id: number, dto: UpdateThresholdDto) => Promise<void>;
  isSubmitting: boolean;
}

export function BadgeThresholdModal({
  isOpen,
  onClose,
  badge,
  onSubmitThreshold,
  isSubmitting,
}: BadgeThresholdModalProps) {
  const [threshold, setThreshold] = useState<string>("");
  const [metric, setMetric] = useState<"lifetime_earned" | "available_points">("lifetime_earned");
  const [reason, setReason] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (badge) {
      setThreshold(badge.milestone_threshold.toString());
      setMetric(badge.eligibility_metric);
      setReason("");
      setError(null);
    }
  }, [badge, isOpen]);

  if (!isOpen || !badge) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedThreshold = parseFloat(threshold);
    if (isNaN(parsedThreshold) || parsedThreshold <= 0) {
      setError("Please enter a valid milestone threshold greater than zero.");
      return;
    }

    if (
      parsedThreshold === badge.milestone_threshold &&
      metric === badge.eligibility_metric
    ) {
      setError("New configuration must differ from current threshold or metric.");
      return;
    }

    if (!reason.trim()) {
      setError("An official reason or justification for the threshold revision is required.");
      return;
    }

    await onSubmitThreshold(badge.id, {
      milestone_threshold: parsedThreshold,
      eligibility_metric: metric,
      reason: reason.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="threshold-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 id="threshold-modal-title" className="text-base font-bold text-stone-900">
                Revise Milestone Threshold
              </h2>
              <p className="text-xs text-stone-500">{badge.name}</p>
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
          {/* Current Threshold Card */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-500 block">
                Current Active Threshold
              </span>
              <span className="text-lg font-bold text-stone-900">
                {badge.milestone_threshold.toFixed(0)}{" "}
                <span className="text-xs font-normal text-stone-600">points</span>
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <Check className="h-3 w-3" /> In Effect
            </span>
          </div>

          {/* New Threshold */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              New Milestone Threshold (Points) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="1"
                placeholder="e.g. 150"
                value={threshold}
                onChange={(e) => {
                  setThreshold(e.target.value);
                  setError(null);
                }}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors"
                required
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-stone-400 pointer-events-none">
                points
              </span>
            </div>
          </div>

          {/* Measurement Metric */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Eligibility Measurement Basis <span className="text-red-500">*</span>
            </label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as "lifetime_earned" | "available_points")}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors"
            >
              <option value="lifetime_earned">Lifetime Earned Points</option>
              <option value="available_points">Available Net Points</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Official Revision Justification / Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Council resolution to align milestone progression with secondary school recyclable collection yields..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors resize-none"
              required
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Statutory notice */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 flex-shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Award Preservation Notice</p>
              <p className="text-[11px] leading-relaxed text-amber-700">
                Updating this milestone creates an auditable record in the threshold
                history table. Previously recorded student awards permanently preserve their
                original thresholds and will <strong>never</strong> be retroactively revoked.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-stone-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#800000] px-4 py-2 text-xs font-semibold text-white hover:bg-[#660000] disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Applying Threshold...
                </>
              ) : (
                <>
                  <TrendingUp className="h-3.5 w-3.5" />
                  Confirm & Apply Threshold
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BadgeThresholdModal;
