"use client";

import { School } from "@/types";
import SchoolStatusBadge from "./SchoolStatusBadge";

interface SchoolDetailsModalProps {
  school: School | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (school: School) => void;
  onToggleStatus: (school: School) => void;
}

export function SchoolDetailsModal({
  school,
  isOpen,
  onClose,
  onEdit,
  onToggleStatus,
}: SchoolDetailsModalProps) {
  if (!isOpen || !school) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs transition-opacity animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="details-title"
    >
      <div className="w-full max-w-xl rounded-xl border border-[#dcc6c4] bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#f0e6e5] pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a5a58]">
              Educational Institution Profile
            </span>
            <h3
              id="details-title"
              className="mt-1 font-serif text-xl font-bold text-[#5a0000]"
            >
              {school.school_name}
            </h3>
            <div className="mt-2 flex items-center gap-3">
              <span className="rounded bg-[#f0e0df] px-2 py-0.5 font-mono text-xs font-semibold text-[#5a0000]">
                {school.school_code}
              </span>
              <SchoolStatusBadge status={school.status} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[#8a5a58] hover:bg-[#f0e0df] hover:text-[#5a0000] transition"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Content Details */}
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-[#f0e6e5] bg-[#faf4f3] p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a5a58]">
                Official Address
              </p>
              <p className="mt-1 text-sm font-medium text-[#4a4a4a]">
                {school.address || "No official address recorded"}
              </p>
            </div>

            <div className="rounded-lg border border-[#f0e6e5] bg-[#faf4f3] p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a5a58]">
                Contact Number
              </p>
              <p className="mt-1 text-sm font-medium text-[#4a4a4a]">
                {school.contact_number || "No contact phone recorded"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-[#f0e6e5] bg-[#faf4f3] p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a5a58]">
                Registration Date
              </p>
              <p className="mt-1 text-xs font-medium text-[#4a4a4a]">
                {formatDate(school.created_at)}
              </p>
            </div>

            <div className="rounded-lg border border-[#f0e6e5] bg-[#faf4f3] p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a5a58]">
                Last Profile Update
              </p>
              <p className="mt-1 text-xs font-medium text-[#4a4a4a]">
                {formatDate(school.updated_at)}
              </p>
            </div>
          </div>

          {/* Student Statistics Section (Requirement D) */}
          <div className="rounded-lg border border-[#dcc6c4] bg-[#fcf8f7] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5a0000]">
                Student Enrollment & Recycling Network
              </span>
              <span className="rounded bg-[#fbbf24]/20 border border-[#fbbf24]/50 px-2 py-0.5 text-[10px] font-bold text-[#854d0e]">
                Phase 2 Integration
              </span>
            </div>

            {school.student_count !== undefined && school.student_count !== null ? (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-2xl font-bold text-[#5a0000]">
                  {school.student_count}
                </span>
                <span className="text-xs text-[#8a5a58]">
                  Verified student recyclers registered in portal
                </span>
              </div>
            ) : (
              <div className="mt-3 rounded border border-dashed border-[#dcc6c4] bg-white p-3 text-center">
                <p className="text-xs font-medium text-[#5a0000]">
                  Student Roster Data Unavailable
                </p>
                <p className="mt-1 text-[11px] text-[#8a5a58]">
                  The Student Waste Management & Individual Badge tracking module has not been linked to this institution yet. Student metrics will display automatically once student onboarding is enabled.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-[#f0e6e5] pt-4">
          <button
            type="button"
            onClick={() => onToggleStatus(school)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              school.status === "active"
                ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            {school.status === "active" ? "Deactivate School" : "Activate School"}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#dcc6c4] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df] transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(school);
              }}
              className="btn-hover-fx rounded-lg bg-[#800000] px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#680000] transition"
            >
              Edit Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SchoolDetailsModal;
