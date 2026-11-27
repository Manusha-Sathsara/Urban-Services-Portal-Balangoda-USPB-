"use client";

import { useState, useEffect } from "react";
import { TakeBackAwardDto } from "@/types";
import BadgeIconHelper from "./BadgeIconHelper";
import {
  X,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Undo2,
  FileText,
  User,
  GraduationCap,
} from "lucide-react";

export interface TakeBackTarget {
  award_id?: number | null;
  student_id: number;
  badge_id: number;
  student_name: string;
  student_identifier?: string;
  school_name?: string;
  badge_name: string;
  badge_icon?: string;
  award_reference?: string | null;
}

interface TakeBackModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: TakeBackTarget | null;
  onSubmit: (dto: TakeBackAwardDto) => Promise<void>;
  isSubmitting: boolean;
}

export function TakeBackModal({
  isOpen,
  onClose,
  target,
  onSubmit,
  isSubmitting,
}: TakeBackModalProps) {
  const [hardDelete, setHardDelete] = useState(false);
  const [reason, setReason] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (target) {
      setHardDelete(false);
      setReason("Administrative fault correction — bestowed erroneously");
      setValidationError(null);
    }
  }, [target]);

  if (!isOpen || !target) return null;

  const quickReasons = [
    "Administrative fault correction — bestowed erroneously",
    "Incorrect points qualification applied",
    "Wrong candidate selected accidentally",
    "Revoked pursuant to school committee review",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setValidationError("A municipal audit reason / justification is required to take back this award.");
      return;
    }

    setValidationError(null);
    await onSubmit({
      award_id: target.award_id ? target.award_id : undefined,
      student_id: target.student_id,
      badge_id: target.badge_id,
      reason: reason.trim(),
      hard_delete: hardDelete,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="take-back-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-800">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="take-back-title"
                className="text-lg font-bold text-stone-900 font-serif"
              >
                Take Back Bestowed Badge
              </h2>
              <p className="text-xs text-stone-500">
                Correct administrative bestowal faults or entry errors
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Target Recipient Card */}
        <div className="my-4 rounded-xl border border-stone-200 bg-stone-50/60 p-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-xs border border-stone-200">
              <BadgeIconHelper
                iconName={target.badge_icon || "Award"}
                className="h-6 w-6 text-[#800000]"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-stone-900 truncate">
                  {target.badge_name}
                </h3>
                {target.award_reference && (
                  <span className="font-mono text-[11px] font-semibold text-stone-600 bg-white px-2 py-0.5 rounded border border-stone-200">
                    {target.award_reference}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600">
                <span className="inline-flex items-center gap-1 font-medium text-stone-800">
                  <User className="h-3 w-3 text-stone-400" />
                  {target.student_name}
                </span>
                {target.student_identifier && (
                  <span className="font-mono text-stone-400 text-[11px]">
                    ({target.student_identifier})
                  </span>
                )}
                {target.school_name && (
                  <span className="inline-flex items-center gap-1 text-stone-500 truncate max-w-[200px]">
                    <GraduationCap className="h-3 w-3 text-stone-400" />
                    {target.school_name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Type & Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {validationError && (
            <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Mode Selection */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Resolution Action <span className="text-[#800000]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setHardDelete(false)}
                className={`flex flex-col text-left p-3 rounded-xl border text-xs transition cursor-pointer ${
                  !hardDelete
                    ? "border-amber-500 bg-amber-50/50 text-amber-950 font-medium ring-1 ring-amber-500/30"
                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Undo2 className="h-3.5 w-3.5 text-amber-700" />
                  <span>Revoke Award</span>
                </div>
                <span className="text-[11px] text-stone-500 leading-tight">
                  Preserve municipal audit record as &apos;revoked&apos;. Student returns to candidate eligibility roster immediately.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setHardDelete(true)}
                className={`flex flex-col text-left p-3 rounded-xl border text-xs transition cursor-pointer ${
                  hardDelete
                    ? "border-rose-500 bg-rose-50/50 text-rose-950 font-medium ring-1 ring-rose-500/30"
                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1 text-rose-700">
                  <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                  <span>Permanent Deletion</span>
                </div>
                <span className="text-[11px] text-stone-500 leading-tight">
                  Completely erase faulty award record from the database. Use only for erroneous test or mistaken data entries.
                </span>
              </button>
            </div>
          </div>

          {/* Warning Message */}
          <div
            className={`flex items-start gap-2.5 rounded-xl p-3 text-xs border ${
              hardDelete
                ? "border-rose-200 bg-rose-50/60 text-rose-800"
                : "border-amber-200 bg-amber-50/60 text-amber-800"
            }`}
          >
            <AlertTriangle
              className={`h-4 w-4 shrink-0 mt-0.5 ${
                hardDelete ? "text-rose-600" : "text-amber-600"
              }`}
            />
            <p className="leading-relaxed">
              {hardDelete ? (
                <>
                  <strong className="font-semibold">Permanent deletion:</strong> This action cannot be undone. The award row will be purged from the municipal database and KPI award counts will decrease by 1.
                </>
              ) : (
                <>
                  <strong className="font-semibold">Take back & revoke:</strong> The bestowed badge status will be switched to revoked. The student will immediately show as non-awarded in the eligibility roster, enabling you to bestow it again once data errors are resolved.
                </>
              )}
            </p>
          </div>

          {/* Reason */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="take-back-reason"
                className="text-xs font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-1"
              >
                <FileText className="h-3 w-3 text-stone-400" />
                Administrative Reason / Fault Explanation <span className="text-[#800000]">*</span>
              </label>
              <span className="text-[10px] text-stone-400">Recorded for municipal audit</span>
            </div>
            <textarea
              id="take-back-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the fault or administrative reason for taking back this award..."
              className="w-full rounded-xl border border-stone-200 p-2.5 text-xs text-stone-900 placeholder-stone-400 focus:border-[#800000] focus:ring-1 focus:ring-[#800000] focus:outline-hidden"
              required
            />
            {/* Quick reason suggestions */}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {quickReasons.map((qr) => (
                <button
                  key={qr}
                  type="button"
                  onClick={() => setReason(qr)}
                  className="rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition cursor-pointer"
                >
                  {qr}
                </button>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-stone-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs transition cursor-pointer disabled:opacity-50 ${
                hardDelete
                  ? "bg-rose-700 hover:bg-rose-800"
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {isSubmitting ? (
                <span>Processing...</span>
              ) : (
                <>
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{hardDelete ? "Confirm Permanent Delete" : "Confirm Take Back"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TakeBackModal;
