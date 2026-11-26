"use client";

import { useEffect, useState } from "react";
import { CreateAwardDto, StudentEligibility } from "@/types";
import BadgeIconHelper from "./BadgeIconHelper";
import { X, Award, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";

interface AwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: StudentEligibility | null;
  onSubmitAward: (dto: CreateAwardDto) => Promise<void>;
  isSubmitting: boolean;
}

export function AwardModal({
  isOpen,
  onClose,
  candidate,
  onSubmitAward,
  isSubmitting,
}: AwardModalProps) {
  const [awardDate, setAwardDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [physicalConfirmed, setPhysicalConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAwardDate(new Date().toISOString().slice(0, 10));
      setNotes("");
      setPhysicalConfirmed(true);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !candidate) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!candidate.is_eligible) {
      setError("This student does not meet the authoritative threshold for this badge.");
      return;
    }

    if (candidate.is_awarded) {
      setError("This badge has already been awarded to this student.");
      return;
    }

    await onSubmitAward({
      student_id: candidate.student_id,
      badge_id: candidate.badge_id,
      award_date: awardDate,
      notes: notes.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="award-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 id="award-modal-title" className="text-base font-bold text-stone-900">
                Bestow Eco-Badge Award
              </h2>
              <p className="text-xs text-stone-500">
                Official Balangoda Municipal Honours Bestowal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Candidate & Badge Summary Card */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 block">
                  Candidate Student
                </span>
                <span className="text-sm font-bold text-stone-900">
                  {candidate.student_name}
                </span>
                <span className="text-xs text-stone-500 block">
                  {candidate.student_identifier} • {candidate.school_name}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" /> Eligible
              </span>
            </div>

            <div className="border-t border-stone-200/60 pt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                  <BadgeIconHelper iconName={candidate.badge_icon} className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-900 block">
                    {candidate.badge_name}
                  </span>
                  <span className="text-[11px] text-stone-500">
                    Threshold: {candidate.milestone_threshold.toFixed(0)} pts
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-stone-400 block">Qualifying Points</span>
                <span className="text-sm font-bold text-[#800000]">
                  {candidate.qualifying_points.toFixed(0)} pts
                </span>
              </div>
            </div>
          </div>

          {/* Award Date */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Bestowal / Award Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={awardDate}
              onChange={(e) => setAwardDate(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors"
              required
            />
          </div>

          {/* Bestowal Notes */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Ceremonial Notes / Assembly Remarks (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Presented during morning school assembly by Principal in recognition of PET bottle sorting..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors resize-none"
            />
          </div>

          {/* Physical bestowment confirmation checkbox */}
          <div className="rounded-lg border border-stone-200 bg-white p-3">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-stone-700">
              <input
                type="checkbox"
                checked={physicalConfirmed}
                onChange={(e) => setPhysicalConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-stone-300 text-[#800000] focus:ring-[#800000]"
              />
              <span>
                <strong>Physical Insignia Verification:</strong> I confirm that the physical badge / medal has been handed to the student or is queued for official assembly presentation.
              </span>
            </label>
          </div>

          {/* Statutory Notice */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 flex-shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Permanent Award Ledger Policy</p>
              <p className="text-[11px] leading-relaxed text-amber-700">
                Recording this award issues an irreversible municipal award reference and freezes the qualification threshold. Duplicate awards for the same student and badge are strictly prohibited.
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
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
              disabled={isSubmitting || !physicalConfirmed}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#800000] px-4 py-2 text-xs font-semibold text-white hover:bg-[#660000] disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Recording Award...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Confirm & Bestow Award
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AwardModal;
