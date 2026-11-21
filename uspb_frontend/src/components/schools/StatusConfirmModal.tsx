"use client";

import { School } from "@/types";

interface StatusConfirmModalProps {
  school: School | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export function StatusConfirmModal({
  school,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: StatusConfirmModalProps) {
  if (!isOpen || !school) return null;

  const isDeactivating = school.status === "active";
  const actionTitle = isDeactivating ? "Deactivate School" : "Activate School";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs transition-opacity animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-md rounded-xl border border-[#dcc6c4] bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
              isDeactivating
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {isDeactivating ? "⚠️" : "✅"}
          </div>
          <div>
            <h3
              id="confirm-modal-title"
              className="font-serif text-lg font-bold text-[#5a0000]"
            >
              {actionTitle}?
            </h3>
            <p className="text-xs text-[#8a5a58] font-mono">{school.school_code}</p>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-[#faf4f3] border border-[#f0e6e5] p-3 text-xs text-[#4a4a4a]">
          <p className="font-semibold text-[#5a0000]">{school.school_name}</p>
          <p className="mt-2 text-[#8a5a58]">
            {isDeactivating ? (
              <>
                Are you sure you want to <strong>deactivate</strong> this school?
                Deactivating suspends waste collection point accruals and reward redemptions.
                <br />
                <span className="mt-1 block font-medium text-[#5a0000]">
                  Note: Historical collection, weight, and financial audit records are permanently preserved.
                </span>
              </>
            ) : (
              <>
                Are you sure you want to <strong>activate</strong> this school?
                Activating restores access for waste collection logging and eco-rewards eligibility.
              </>
            )}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-[#dcc6c4] bg-white px-4 py-2 text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df] transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`btn-hover-fx flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50 ${
              isDeactivating
                ? "bg-amber-700 hover:bg-amber-800"
                : "bg-emerald-700 hover:bg-emerald-800"
            }`}
          >
            {isLoading ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Updating...
              </>
            ) : isDeactivating ? (
              "Yes, Deactivate"
            ) : (
              "Yes, Activate"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StatusConfirmModal;
