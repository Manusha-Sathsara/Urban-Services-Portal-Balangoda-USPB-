"use client";

import { WasteCategory } from "@/types";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

interface CategoryStatusConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: WasteCategory | null;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export function CategoryStatusConfirmModal({
  isOpen,
  onClose,
  category,
  onConfirm,
  isLoading,
}: CategoryStatusConfirmModalProps) {
  if (!isOpen || !category) return null;

  const isDeactivating = category.status === "active";

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-status-confirm-title"
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
              <h2
                id="category-status-confirm-title"
                className="text-base font-bold text-stone-900"
              >
                {isDeactivating ? "Deactivate Waste Category" : "Activate Waste Category"}
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">{category.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 text-xs leading-relaxed text-stone-600">
          {isDeactivating ? (
            <p>
              Are you sure you want to deactivate{" "}
              <strong className="text-stone-900">{category.name}</strong>? Deactivating
              this category will immediately hide it from schools and teachers during waste
              logging. All previously recorded collections and points history will remain
              preserved.
            </p>
          ) : (
            <p>
              Are you sure you want to activate{" "}
              <strong className="text-stone-900">{category.name}</strong>? Activating
              this category will immediately make it selectable for teachers and schools
              to log recyclable collections at the current rate of{" "}
              <strong className="text-stone-900">
                {category.current_points_per_unit.toFixed(1)} pts / {category.measurement_unit}
              </strong>
              .
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-stone-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors shadow-2xs ${
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

export default CategoryStatusConfirmModal;
