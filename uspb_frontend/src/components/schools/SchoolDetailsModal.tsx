"use client";

import { School } from "@/types";
import SchoolStatusBadge from "./SchoolStatusBadge";
import { X, Building2, Phone, Calendar, Clock, Edit2 } from "lucide-react";

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
      <div className="w-full max-w-xl rounded-xl border border-stone-200 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-200 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Educational Institution Profile
            </span>
            <h3
              id="details-title"
              className="mt-1 font-sans text-xl font-bold text-stone-900"
            >
              {school.school_name}
            </h3>
            <div className="mt-2 flex items-center gap-3">
              <span className="rounded bg-[#f0e0df]/60 px-2 py-0.5 font-mono text-xs font-semibold text-[#800000]">
                {school.school_code}
              </span>
              <SchoolStatusBadge status={school.status} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Details */}
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3.5">
              <div className="flex items-center gap-1.5 text-stone-500">
                <Building2 className="h-3.5 w-3.5" />
                <p className="text-[11px] font-semibold uppercase tracking-wider">
                  Official Address
                </p>
              </div>
              <p className="mt-1.5 text-sm font-medium text-stone-800">
                {school.address || "No official address recorded"}
              </p>
            </div>

            <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3.5">
              <div className="flex items-center gap-1.5 text-stone-500">
                <Phone className="h-3.5 w-3.5" />
                <p className="text-[11px] font-semibold uppercase tracking-wider">
                  Contact Number
                </p>
              </div>
              <p className="mt-1.5 text-sm font-medium text-stone-800">
                {school.contact_number || "No contact phone recorded"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3.5">
              <div className="flex items-center gap-1.5 text-stone-500">
                <Calendar className="h-3.5 w-3.5" />
                <p className="text-[11px] font-semibold uppercase tracking-wider">
                  Registration Date
                </p>
              </div>
              <p className="mt-1.5 text-xs font-medium text-stone-800">
                {formatDate(school.created_at)}
              </p>
            </div>

            <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3.5">
              <div className="flex items-center gap-1.5 text-stone-500">
                <Clock className="h-3.5 w-3.5" />
                <p className="text-[11px] font-semibold uppercase tracking-wider">
                  Last Profile Update
                </p>
              </div>
              <p className="mt-1.5 text-xs font-medium text-stone-800">
                {formatDate(school.updated_at)}
              </p>
            </div>
          </div>

          {/* Student Statistics Section (Requirement D) */}
          <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                Student Enrollment & Recycling Network
              </span>
              <span className="rounded bg-stone-200/80 px-2 py-0.5 text-[10px] font-medium text-stone-600">
                Phase 2 Integration
              </span>
            </div>

            {school.student_count !== undefined && school.student_count !== null ? (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-2xl font-bold text-stone-900">
                  {school.student_count}
                </span>
                <span className="text-xs text-stone-500">
                  Verified student recyclers registered in portal
                </span>
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-dashed border-stone-300 bg-white p-3 text-center">
                <p className="text-xs font-semibold text-stone-800">
                  Student Roster Data Unavailable
                </p>
                <p className="mt-1 text-[11px] text-stone-500">
                  The Student Waste Management & Individual Badge tracking module has not been linked to this institution yet. Student metrics will display automatically once student onboarding is enabled.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-stone-200 pt-4">
          <button
            type="button"
            onClick={() => onToggleStatus(school)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
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
              className="rounded-lg border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(school);
              }}
              className="btn-hover-fx inline-flex items-center gap-1.5 rounded-lg bg-[#800000] px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#680000] transition cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SchoolDetailsModal;
