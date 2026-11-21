"use client";

import { useEffect, useState } from "react";
import { CreateSchoolDto, School, UpdateSchoolDto } from "@/types";

interface SchoolFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSchoolDto | UpdateSchoolDto) => Promise<void>;
  schoolToEdit?: School | null;
  isSubmitting?: boolean;
}

export function SchoolFormModal({
  isOpen,
  onClose,
  onSubmit,
  schoolToEdit,
  isSubmitting = false,
}: SchoolFormModalProps) {
  const isEditMode = !!schoolToEdit;

  const [schoolName, setSchoolName] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (schoolToEdit) {
      setSchoolName(schoolToEdit.school_name || "");
      setSchoolCode(schoolToEdit.school_code || "");
      setAddress(schoolToEdit.address || "");
      setContactNumber(schoolToEdit.contact_number || "");
      setStatus(schoolToEdit.status || "active");
    } else {
      setSchoolName("");
      setSchoolCode("");
      setAddress("");
      setContactNumber("");
      setStatus("active");
    }
    setErrors({});
    setServerError(null);
  }, [schoolToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!schoolName.trim()) {
      errs.schoolName = "School name is required.";
    } else if (schoolName.trim().length < 2) {
      errs.schoolName = "School name must be at least 2 characters.";
    } else if (schoolName.trim().length > 255) {
      errs.schoolName = "School name cannot exceed 255 characters.";
    }

    if (!schoolCode.trim()) {
      errs.schoolCode = "Unique school code is required.";
    } else if (schoolCode.trim().length < 2) {
      errs.schoolCode = "School code must be at least 2 characters.";
    } else if (schoolCode.trim().length > 50) {
      errs.schoolCode = "School code cannot exceed 50 characters.";
    } else if (!/^[A-Za-z0-9\-_]+$/.test(schoolCode.trim())) {
      errs.schoolCode =
        "School code can only contain letters, numbers, hyphens, and underscores.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    try {
      await onSubmit({
        school_name: schoolName.trim(),
        school_code: schoolCode.trim().toUpperCase(),
        address: address.trim(),
        contact_number: contactNumber.trim(),
        status,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError("An unexpected error occurred while saving school details.");
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs transition-opacity animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-[#dcc6c4] bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-[#f0e6e5] pb-4">
          <div>
            <h3
              id="modal-title"
              className="font-serif text-xl font-bold text-[#5a0000]"
            >
              {isEditMode ? "Edit School Details" : "Register New School"}
            </h3>
            <p className="mt-1 text-xs text-[#8a5a58]">
              {isEditMode
                ? "Update municipal school registry records."
                : "Add an educational institution to Balangoda Urban Council Green Rewards."}
            </p>
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

        {serverError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            <span className="font-semibold">Error: </span>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* School Name */}
          <div>
            <label
              htmlFor="school_name"
              className="block text-xs font-semibold uppercase tracking-wider text-[#5a0000]"
            >
              School Name <span className="text-red-600">*</span>
            </label>
            <input
              id="school_name"
              type="text"
              required
              value={schoolName}
              onChange={(e) => {
                setSchoolName(e.target.value);
                if (errors.schoolName) {
                  setErrors((prev) => ({ ...prev, schoolName: "" }));
                }
              }}
              placeholder="e.g. Balangoda Central College"
              className={`mt-1.5 block w-full rounded-lg border px-3 py-2 text-sm text-[#4a4a4a] placeholder-stone-400 focus:outline-none transition ${
                errors.schoolName
                  ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400"
                  : "border-[#dcc6c4] focus:border-[#800000] focus:ring-1 focus:ring-[#800000]"
              }`}
            />
            {errors.schoolName && (
              <p className="mt-1 text-xs text-red-600">{errors.schoolName}</p>
            )}
          </div>

          {/* School Code */}
          <div>
            <label
              htmlFor="school_code"
              className="block text-xs font-semibold uppercase tracking-wider text-[#5a0000]"
            >
              Unique School Code <span className="text-red-600">*</span>
            </label>
            <input
              id="school_code"
              type="text"
              required
              value={schoolCode}
              onChange={(e) => {
                setSchoolCode(e.target.value.toUpperCase());
                if (errors.schoolCode) {
                  setErrors((prev) => ({ ...prev, schoolCode: "" }));
                }
              }}
              placeholder="e.g. BAMCC-001"
              className={`mt-1.5 block w-full rounded-lg border px-3 py-2 text-sm font-mono text-[#4a4a4a] placeholder-stone-400 focus:outline-none uppercase transition ${
                errors.schoolCode
                  ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400"
                  : "border-[#dcc6c4] focus:border-[#800000] focus:ring-1 focus:ring-[#800000]"
              }`}
            />
            <p className="mt-1 text-[11px] text-[#8a5a58]">
              Used for tracking collection sacks, QR badges, and reward redemptions.
            </p>
            {errors.schoolCode && (
              <p className="mt-1 text-xs text-red-600">{errors.schoolCode}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label
              htmlFor="address"
              className="block text-xs font-semibold uppercase tracking-wider text-[#5a0000]"
            >
              Postal / Physical Address
            </label>
            <textarea
              id="address"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Hospital Road, Balangoda, Sri Lanka"
              className="mt-1.5 block w-full rounded-lg border border-[#dcc6c4] px-3 py-2 text-sm text-[#4a4a4a] placeholder-stone-400 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition"
            />
          </div>

          {/* Contact Number */}
          <div>
            <label
              htmlFor="contact_number"
              className="block text-xs font-semibold uppercase tracking-wider text-[#5a0000]"
            >
              Official Contact Number
            </label>
            <input
              id="contact_number"
              type="tel"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="e.g. +94 45 228 7210"
              className="mt-1.5 block w-full rounded-lg border border-[#dcc6c4] px-3 py-2 text-sm text-[#4a4a4a] placeholder-stone-400 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#5a0000]">
              Operational Status
            </label>
            <div className="mt-2 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-[#4a4a4a]">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={status === "active"}
                  onChange={() => setStatus("active")}
                  className="accent-[#800000] h-4 w-4"
                />
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Active
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-[#4a4a4a]">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={status === "inactive"}
                  onChange={() => setStatus("inactive")}
                  className="accent-[#800000] h-4 w-4"
                />
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#8a5a58]" />
                  Inactive
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#f0e6e5] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-[#dcc6c4] bg-white px-4 py-2 text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df] transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-hover-fx rounded-lg bg-[#800000] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#680000] transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Register School"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SchoolFormModal;
