"use client";

import { StudentBadgeAward } from "@/types";
import BadgeIconHelper from "./BadgeIconHelper";
import {
  X,
  Award,
  Calendar,
  User,
  School,
  GraduationCap,
  Sparkles,
  FileText,
  Clock,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

interface AwardDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  award: StudentBadgeAward | null;
  onChangeStatus?: (award: StudentBadgeAward) => void;
}

export function AwardDetailsModal({
  isOpen,
  onClose,
  award,
  onChangeStatus,
}: AwardDetailsModalProps) {
  if (!isOpen || !award) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="award-details-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
        {/* Certificate / Bestowal Header */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60 shadow-2xs">
              <BadgeIconHelper iconName={award.badge_icon} className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="award-details-title" className="text-base font-bold text-stone-900">
                  {award.badge_name}
                </h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold border ${
                    award.status === "awarded"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {award.status === "awarded" ? "Bestowed" : "Revoked"}
                </span>
              </div>
              <p className="text-xs font-mono text-stone-500 mt-0.5">
                Ref: {award.award_reference}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-3.5">
          {/* Recipient Details */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block">
              Honoree Information
            </span>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-stone-900 block">
                  {award.student_name}
                </span>
                <span className="text-xs text-stone-500 font-mono">
                  {award.student_identifier}
                </span>
              </div>
              {award.grade && (
                <span className="inline-flex items-center gap-1 rounded bg-stone-200/70 px-2 py-0.5 text-xs text-stone-700 font-medium">
                  <GraduationCap className="h-3 w-3" />
                  {award.grade}
                </span>
              )}
            </div>

            <div className="border-t border-stone-200/60 pt-2 flex items-center gap-1.5 text-xs text-stone-600">
              <School className="h-3.5 w-3.5 text-stone-400" />
              <span>{award.school_name}</span>
            </div>
          </div>

          {/* Points Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-stone-200 bg-white p-3">
              <span className="flex items-center gap-1 text-[11px] text-stone-400 font-medium mb-1">
                <Sparkles className="h-3 w-3 text-amber-600" /> Qualifying Points
              </span>
              <span className="text-base font-bold text-stone-900">
                {award.qualifying_points.toFixed(0)}{" "}
                <span className="text-xs font-normal text-stone-500">pts</span>
              </span>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-3">
              <span className="flex items-center gap-1 text-[11px] text-stone-400 font-medium mb-1">
                <ShieldCheck className="h-3 w-3 text-[#800000]" /> Frozen Threshold
              </span>
              <span className="text-base font-bold text-[#800000]">
                {award.threshold_at_award.toFixed(0)}{" "}
                <span className="text-xs font-normal text-stone-500">pts</span>
              </span>
            </div>
          </div>

          {/* Ceremonial Notes */}
          {award.notes && (
            <div className="rounded-xl border border-stone-200 bg-white p-3">
              <span className="flex items-center gap-1 text-[11px] text-stone-400 font-medium mb-1">
                <FileText className="h-3 w-3" /> Bestowal Remarks
              </span>
              <p className="text-xs text-stone-700 italic leading-relaxed">
                &ldquo;{award.notes}&rdquo;
              </p>
            </div>
          )}

          {/* Audit Trail Metadata */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3 text-xs text-stone-600 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-stone-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Bestowal Date
              </span>
              <span className="font-medium text-stone-800">{award.award_date}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400 flex items-center gap-1">
                <User className="h-3 w-3" /> Conferred By
              </span>
              <span className="font-medium text-stone-800">{award.awarded_by}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Ledger Timestamp
              </span>
              <span className="font-medium text-stone-800 font-mono text-[11px]">
                {new Date(award.created_at).toLocaleString("en-GB")}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-4">
          {onChangeStatus ? (
            <button
              onClick={() => {
                onClose();
                onChangeStatus(award);
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold border transition-colors cursor-pointer ${
                award.status === "awarded"
                  ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>{award.status === "awarded" ? "Revoke Award" : "Reinstate Award"}</span>
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AwardDetailsModal;
