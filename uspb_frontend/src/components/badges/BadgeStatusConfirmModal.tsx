"use client";

import { BadgeDefinition } from "@/types";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

interface BadgeStatusConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  badge: BadgeDefinition | null;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export function BadgeStatusConfirmModal({
  isOpen,
  onClose,
  badge,
  onConfirm,
  isLoading,
}: BadgeStatusConfirmModalProps) {
  if (!isOpen || !badge) return null;

  const isDeactivating = badge.status === "active";

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="badge-status-confirm-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                isDeactivating
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {isDeactivating ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2 id="badge-status-confirm-title" className="text-base font-bold text-stone-900">
                {isDeactivating ? "Deactivate Badge Definition" : "Activate Badge Definition"}
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">{badge.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 text-xs leading-relaxed text-stone-600">
          {isDeactivating ? (
            <p>
              Are you sure you want to deactivate <strong className="text-stone-900">{badge.name}</strong>?
              Deactivating this badge will pause new awards from being bestowed for this milestone.
              All existing award records for students will remain fully preserved.
            </p>
          ) : (
            <p>
              Are you sure you want to activate <strong className="text-stone-900">{badge.name}</strong>?
              Activating this badge will make it eligible for council supervisors and teachers to bestow
              when students meet the threshold of <strong className="text-stone-900">{badge.milestone_threshold.toFixed(0)} points</strong>.
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-stone-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors shadow-2xs cursor-pointer ${
              isDeactivating
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {isLoading ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Updating Status...
              </>
            ) : isDeactivating ? (
              "Confirm Deactivation"
            ) : (
              "Confirm Activation"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BadgeStatusConfirmModal;
