"use client";

import { useState, useEffect } from "react";
import { StudentBadgeAward, UpdateAwardStatusDto } from "@/types";
import BadgeIconHelper from "./BadgeIconHelper";
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Ban,
  ShieldAlert,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface AwardStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  award: StudentBadgeAward | null;
  onSubmit: (id: number, dto: UpdateAwardStatusDto) => Promise<void>;
  isSubmitting: boolean;
}

export function AwardStatusModal({
  isOpen,
  onClose,
  award,
  onSubmit,
  isSubmitting,
}: AwardStatusModalProps) {
  const [targetStatus, setTargetStatus] = useState<"awarded" | "revoked">("awarded");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (award) {
      // Toggle to the opposite status by default for convenience
      setTargetStatus(award.status === "awarded" ? "revoked" : "awarded");
      setReason("");
      setNotes(award.notes || "");
      setValidationError(null);
    }
  }, [award]);

  if (!isOpen || !award) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setValidationError("An official municipal justification/reason is required.");
      return;
    }

    setValidationError(null);
    await onSubmit(award.id, {
      status: targetStatus,
      reason: reason.trim(),
      notes: notes.trim(),
    });
  };

  const isRevoking = targetStatus === "revoked";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="award-status-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl border shadow-2xs ${
                isRevoking
                  ? "bg-rose-50 text-rose-800 border-rose-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}
            >
              {isRevoking ? (
                <ShieldAlert className="h-6 w-6" />
              ) : (
                <CheckCircle2 className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="award-status-title" className="text-base font-bold text-stone-900">
                  Modify Award Status
                </h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold border ${
                    award.status === "awarded"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  Current: {award.status === "awarded" ? "Active" : "Revoked"}
                </span>
              </div>
              <p className="text-xs font-mono text-stone-500 mt-0.5">
                Ref: {award.award_reference}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Recipient Snapshot */}
        <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-900">
              {award.student_name}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800">
              <BadgeIconHelper iconName={award.badge_icon} className="h-3.5 w-3.5 text-amber-700" />
              <span>{award.badge_name}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-500">
            <span>{award.school_name}</span>
            <span>Awarded: {award.award_date}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Target Status Choice */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Select Target Status <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTargetStatus("awarded")}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  targetStatus === "awarded"
                    ? "border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500"
                    : "border-stone-200 bg-white hover:bg-stone-50"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Awarded (Active)</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Active honor; student holds distinction in council records.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTargetStatus("revoked")}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  targetStatus === "revoked"
                    ? "border-rose-500 bg-rose-50/50 ring-1 ring-rose-500"
                    : "border-stone-200 bg-white hover:bg-stone-50"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-rose-800">
                  <Ban className="h-4 w-4 text-rose-600" />
                  <span>Revoked (Withdrawn)</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Rescinds distinction; decrements active count and permits re-evaluation.
                </p>
              </button>
            </div>
          </div>

          {/* Statutory Notice */}
          <div
            className={`rounded-xl p-3 border text-xs flex items-start gap-2.5 ${
              isRevoking
                ? "bg-amber-50/80 border-amber-200 text-amber-900"
                : "bg-emerald-50/80 border-emerald-200 text-emerald-900"
            }`}
          >
            <AlertTriangle
              className={`h-4 w-4 shrink-0 mt-0.5 ${
                isRevoking ? "text-amber-600" : "text-emerald-600"
              }`}
            />
            <div className="leading-relaxed text-[11px]">
              {isRevoking ? (
                <>
                  <strong>Council Audit Notice:</strong> Revoking this award will mark the
                  milestone distinction as withdrawn. The historical award reference remains in
                  the audit trail, but municipal KPI award totals will decrease by 1.
                </>
              ) : (
                <>
                  <strong>Council Audit Notice:</strong> Reinstating this award will restore the
                  student&apos;s active badge honor and increment municipal award KPI metrics.
                </>
              )}
            </div>
          </div>

          {/* Official Reason */}
          <div>
            <label
              htmlFor="award-status-reason"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              Official Revision Justification / Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              id="award-status-reason"
              rows={2}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder={
                isRevoking
                  ? "e.g. Physical medal verification failed, academic transfer, duplicate entry, or disciplinary review..."
                  : "e.g. Administrative appeal approved by municipal committee, verification audit cleared..."
              }
              className="w-full rounded-lg border border-stone-300 bg-white p-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors"
            />
          </div>

          {/* Optional Notes */}
          <div>
            <label
              htmlFor="award-status-notes"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              Administrative Notes (Optional)
            </label>
            <input
              id="award-status-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal record notes or council memo reference..."
              className="w-full rounded-lg border border-stone-300 bg-white p-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors"
            />
          </div>

          {/* Error Message */}
          {validationError && (
            <p className="text-xs font-semibold text-red-600 animate-in fade-in">
              {validationError}
            </p>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 border-t border-stone-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer ${
                isRevoking
                  ? "bg-rose-700 hover:bg-rose-800"
                  : "bg-emerald-700 hover:bg-emerald-800"
              }`}
            >
              {isSubmitting && <RotateCcw className="h-3.5 w-3.5 animate-spin" />}
              <span>{isRevoking ? "Confirm Revocation" : "Confirm Reinstatement"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AwardStatusModal;
