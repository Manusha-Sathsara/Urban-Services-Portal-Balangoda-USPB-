"use client";

/**
 * Business Management Page
 * Route: /garbage-fees/business
 *
 * Implements:
 *  A. Page Header   — title, subtitle, "+ Add Business" button
 *  B. Summary Cards — Total / Active / Inactive businesses
 *  C. Search & Filter — by name, owner, reg. number; filter by status and type
 *  D. Business Table — paginated, with action menu per row
 *  E. Add Business Drawer — right-side sliding overlay with full form + validation
 *
 * Data: Isolated mock data (mockData.ts) stored in component state.
 *       ⚠️  New businesses are saved in-memory only (temporary frontend state).
 *       Connect to GET /api/v1/garbage-fees/businesses and
 *                  POST /api/v1/garbage-fees/businesses when backend is ready.
 *
 * Theme: Reuses landing page brand colors (#5a0000, #800000, #fbbf24, #f0e0df).
 * Components: Reuses StatCard, BusinessStatusBadge from shared/.
 */

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { StatCard } from "@/components/shared/StatCard";
import { BusinessStatusBadge } from "@/components/shared/BusinessStatusBadge";
import {
  MOCK_BUSINESSES,
  BUSINESS_TYPES,
  computeBusinessStats,
  generateRegistrationNumber,
  type Business,
  type BusinessStatus,
  type BusinessType,
} from "./mockData";
import {
  BUSINESS_CATEGORIES,
  getCategoryByName,
  formatLKR,
} from "@/lib/businessCategories";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 8;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface AddBusinessFormData {
  businessName: string;
  registrationNumber: string;
  businessType: BusinessType | "";
  categorySinhalaName: string;
  ownerName: string;
  ownerIdNumber: string;
  address: string;
  contactNumber: string;
  price: number;
  status: BusinessStatus;
}

interface FormErrors {
  businessName?: string;
  registrationNumber?: string;
  businessType?: string;
  address?: string;
  ownerName?: string;
  ownerIdNumber?: string;
  contactNumber?: string;
  price?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function validateContactNumber(value: string): boolean {
  // Accept Sri Lankan mobile / landline: 10-digit, optionally starting with +94
  return /^(\+94|0)[0-9]{9}$/.test(value.replace(/\s/g, ""));
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Empty State
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-[#f0e0df] text-[#5a0000] text-3xl grid place-items-center mx-auto mb-4">
        {filtered ? "🔍" : "🏪"}
      </div>
      <p className="text-sm font-semibold text-[#5a0000] mb-1">
        {filtered ? "No businesses match your search" : "No businesses registered yet"}
      </p>
      <p className="text-xs text-[#8a5a58] max-w-[300px] mx-auto">
        {filtered
          ? "Try adjusting your search or filter criteria."
          : "Click \"+ Add Business\" to register the first business."}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Pagination
// ─────────────────────────────────────────────────────────────────────────────
function Pagination({
  total,
  page,
  pageSize,
  onPage,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-[#f0e6e5] bg-[#fcf8f7] rounded-b-lg">
      <p className="text-[11px] text-[#8a5a58]">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="px-2.5 py-1 rounded border border-[#dcc6c4] text-xs text-[#5a0000] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f0e0df] transition-colors"
          aria-label="Previous page"
        >
          ←
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`px-2.5 py-1 rounded border text-xs font-medium transition-colors ${
              p === page
                ? "border-[#800000] bg-[#800000] text-white"
                : "border-[#dcc6c4] bg-white text-[#5a0000] hover:bg-[#f0e0df]"
            }`}
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="px-2.5 py-1 rounded border border-[#dcc6c4] text-xs text-[#5a0000] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f0e0df] transition-colors"
          aria-label="Next page"
        >
          →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Row Action Menu
// ─────────────────────────────────────────────────────────────────────────────
function ActionMenu({
  business,
  onView,
}: {
  business: Business;
  onView: (b: Business) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="p-1.5 rounded hover:bg-[#f0e0df] text-[#8a5a58] hover:text-[#5a0000] transition-colors"
        aria-label={`Actions for ${business.businessName}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="text-lg leading-none">⋯</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-[#f0e6e5] bg-white shadow-[0_4px_16px_rgba(90,0,0,0.12)] py-1"
        >
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              onView(business);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#5a0000] hover:bg-[#fcf8f7] transition-colors text-left"
          >
            <span aria-hidden="true">👁️</span> View Details
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: View Details Modal
// ─────────────────────────────────────────────────────────────────────────────
function ViewDetailsModal({
  business,
  onClose,
}: {
  business: Business;
  onClose: () => void;
}) {
  // Close on Escape key
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${business.businessName}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1a0000]/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white border border-[#f0e6e5] shadow-[0_8px_32px_rgba(90,0,0,0.18)]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#f0e6e5]">
          <div>
            <h3 className="font-serif text-[16px] text-[#5a0000]">Business Details</h3>
            <p className="text-xs text-[#8a5a58] mt-0.5">{business.registrationNumber}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 p-1.5 rounded hover:bg-[#f0e0df] text-[#8a5a58] hover:text-[#5a0000] transition-colors"
            aria-label="Close details"
          >
            ✕
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          {[
            { label: "Business Name", value: business.businessName },
            { label: "Owner Name", value: business.ownerName },
            { label: "Owner ID (NIC)", value: business.ownerIdNumber || "—" },
            {
              label: "Business Category",
              value: business.categorySinhalaName
                ? `${business.businessType} (${business.categorySinhalaName})`
                : business.businessType,
            },
            {
              label: "Annual Fee",
              value:
                business.price !== undefined
                  ? business.price > 0
                    ? formatLKR(business.price)
                    : "Variable / Assessed"
                  : "—",
            },
            { label: "Address", value: business.address },
            { label: "Contact Number", value: business.contactNumber },
            { label: "Registered On", value: formatDate(business.createdAt) },
          ].map(({ label, value }) => (
            <div key={label} className="grid grid-cols-[140px_1fr] gap-2 text-sm">
              <span className="text-[#8a5a58] font-medium shrink-0">{label}</span>
              <span className="text-[#4a4a4a]">{value}</span>
            </div>
          ))}
          <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
            <span className="text-[#8a5a58] font-medium shrink-0">Status</span>
            <BusinessStatusBadge status={business.status} />
          </div>
        </div>
        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#f0e6e5] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded border border-[#dcc6c4] bg-white text-sm font-semibold text-[#5a0000] hover:bg-[#f0e0df] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shared field wrapper ────────────────────────────────────────────────
function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-[12px] font-semibold text-[#5a0000] flex items-center gap-1"
      >
        {label}
        {required && (
          <span className="text-[#800000]" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p className="text-[11px] text-red-600" role="alert" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls = (err?: string) =>
  `w-full rounded border ${
    err
      ? "border-red-400 focus:ring-red-300"
      : "border-[#dcc6c4] focus:ring-[#800000]/30"
  } bg-white px-3 py-2 text-sm text-[#4a4a4a] shadow-xs focus:outline-none focus:ring-2 transition placeholder:text-[#c0a8a6]`;

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Add Business Drawer
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_FORM: AddBusinessFormData = {
  businessName: "",
  registrationNumber: "",
  businessType: "",
  categorySinhalaName: "",
  ownerName: "",
  ownerIdNumber: "",
  address: "",
  contactNumber: "",
  price: 0,
  status: "active",
};

function AddBusinessDrawer({
  open,
  onClose,
  onSuccess,
  existingRegNumbers,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (business: Business) => void;
  existingRegNumbers: string[];
}) {
  const [form, setForm] = useState<AddBusinessFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => firstInputRef.current?.focus(), 150);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, submitting, onClose]);

  function validate(): FormErrors {
    const errs: FormErrors = {};

    if (!form.businessName.trim())
      errs.businessName = "Business name is required.";
    else if (form.businessName.trim().length > 150)
      errs.businessName = "Business name must not exceed 150 characters.";

    if (
      form.registrationNumber.trim() &&
      existingRegNumbers.includes(form.registrationNumber.trim())
    )
      errs.registrationNumber =
        "This registration number is already in use.";

    if (!form.businessType)
      errs.businessType = "Please select a business category.";

    if (!form.address.trim())
      errs.address = "Business address is required.";
    else if (form.address.trim().length > 300)
      errs.address = "Address must not exceed 300 characters.";

    if (!form.ownerName.trim())
      errs.ownerName = "Owner name is required.";
    else if (form.ownerName.trim().length > 100)
      errs.ownerName = "Owner name must not exceed 100 characters.";

    if (!form.ownerIdNumber.trim())
      errs.ownerIdNumber = "Owner ID (NIC) number is required.";

    if (!form.contactNumber.trim())
      errs.contactNumber = "Contact number is required.";
    else if (!validateContactNumber(form.contactNumber))
      errs.contactNumber =
        "Enter a valid Sri Lankan phone number (e.g. 0712345678).";

    return errs;
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;
    if (name === "businessType") {
      const cat = getCategoryByName(value) || BUSINESS_CATEGORIES.find((c) => c.englishName === value);
      setForm((prev) => ({
        ...prev,
        businessType: value as BusinessType,
        categorySinhalaName: cat?.sinhalaName || "",
        price: cat?.price || 0,
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    // Clear individual field error on change
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);

    // ⚠️ No real backend API available yet — simulate async operation.
    await new Promise((r) => setTimeout(r, 800));

    const newBusiness: Business = {
      id: `biz-${Date.now()}`,
      registrationNumber:
        form.registrationNumber.trim() ||
        generateRegistrationNumber(
          existingRegNumbers.map((r, i) => ({ id: String(i) }) as Business)
        ),
      businessName: form.businessName.trim(),
      ownerName: form.ownerName.trim(),
      ownerIdNumber: form.ownerIdNumber.trim(),
      businessType: form.businessType as BusinessType,
      categorySinhalaName: form.categorySinhalaName,
      price: form.price,
      address: form.address.trim(),
      contactNumber: form.contactNumber.trim(),
      status: form.status,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setSubmitting(false);
    onSuccess(newBusiness);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-[#1a0000]/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => !submitting && onClose()}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add New Business"
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[520px] bg-white shadow-[0_0_40px_rgba(90,0,0,0.18)] flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ── Drawer Header ──────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#f0e6e5] bg-white shrink-0">
          <div>
            <h2 className="font-serif text-[18px] text-[#5a0000]">Add New Business</h2>
            <p className="text-[12px] text-[#8a5a58] mt-0.5 leading-snug max-w-[340px]">
              Enter the business details to register it for garbage collection services.
            </p>
          </div>
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="ml-3 mt-0.5 p-1.5 rounded hover:bg-[#f0e0df] text-[#8a5a58] hover:text-[#5a0000] transition-colors disabled:opacity-50 shrink-0"
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>

        {/* ── Scrollable Form Body ────────────────────────────────────────── */}
        <form
          id="add-business-form"
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
        >
          {/* ── SECTION 1: Business Information ─────────────────────────── */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8a5a58] mb-4 pb-2 border-b border-[#f0e6e5]">
              Business Information
            </h3>
            <div className="space-y-4">
              <Field
                id="businessName"
                label="Business Name"
                required
                error={submitted ? errors.businessName : undefined}
              >
                <input
                  ref={firstInputRef}
                  id="businessName"
                  name="businessName"
                  type="text"
                  value={form.businessName}
                  onChange={handleChange}
                  maxLength={150}
                  placeholder="e.g. Balangoda General Store"
                  className={inputCls(submitted ? errors.businessName : undefined)}
                  aria-required="true"
                  aria-describedby={
                    submitted && errors.businessName ? "businessName-error" : undefined
                  }
                />
              </Field>

              <Field
                id="registrationNumber"
                label="Business Registration Number"
                error={submitted ? errors.registrationNumber : undefined}
              >
                <input
                  id="registrationNumber"
                  name="registrationNumber"
                  type="text"
                  value={form.registrationNumber}
                  onChange={handleChange}
                  maxLength={50}
                  placeholder="e.g. BAL-BUS-2026-011 (auto-generated if left blank)"
                  className={inputCls(submitted ? errors.registrationNumber : undefined)}
                  aria-describedby={
                    submitted && errors.registrationNumber
                      ? "registrationNumber-error"
                      : "registrationNumber-hint"
                  }
                />
                <p
                  id="registrationNumber-hint"
                  className="text-[10.5px] text-[#8a5a58]"
                >
                  Leave blank to auto-generate based on existing records.
                </p>
              </Field>

              <Field
                id="businessType"
                label="Business Category (35 Standard Categories)"
                required
                error={submitted ? errors.businessType : undefined}
              >
                <select
                  id="businessType"
                  name="businessType"
                  value={form.businessType}
                  onChange={handleChange}
                  className={inputCls(submitted ? errors.businessType : undefined)}
                  aria-required="true"
                  aria-describedby={
                    submitted && errors.businessType ? "businessType-error" : undefined
                  }
                >
                  <option value="" disabled>
                    -- Select Category / ප්‍රවර්ගය තෝරන්න --
                  </option>
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.englishName}>
                      {cat.id}. {cat.englishName} ({cat.sinhalaName}) — {cat.price !== null ? `LKR ${cat.formattedPrice}` : "Assessed Rate (—)"}
                    </option>
                  ))}
                </select>
              </Field>

              {form.businessType && (
                <div className="rounded border border-[#dcc6c4] bg-[#fcf8f7] p-2.5 text-xs text-[#5a0000] flex items-center justify-between">
                  <div>
                    <span className="font-semibold block">{form.businessType}</span>
                    {form.categorySinhalaName && (
                      <span className="text-[#8a5a58] text-[11px] block">{form.categorySinhalaName}</span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-sm text-[#800000]">
                    {form.price > 0 ? formatLKR(form.price) : "Assessed Rate"}
                  </span>
                </div>
              )}

              <Field
                id="address"
                label="Business Address"
                required
                error={submitted ? errors.address : undefined}
              >
                <textarea
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  maxLength={300}
                  rows={3}
                  placeholder="No. 00, Street Name, Balangoda, Ratnapura"
                  className={`${inputCls(submitted ? errors.address : undefined)} resize-none`}
                  aria-required="true"
                  aria-describedby={
                    submitted && errors.address ? "address-error" : undefined
                  }
                />
              </Field>
            </div>
          </section>

          {/* ── SECTION 2: Owner / Contact Information ───────────────────── */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8a5a58] mb-4 pb-2 border-b border-[#f0e6e5]">
              Owner / Contact Information
            </h3>
            <div className="space-y-4">
              <Field
                id="ownerName"
                label="Owner Name"
                required
                error={submitted ? errors.ownerName : undefined}
              >
                <input
                  id="ownerName"
                  name="ownerName"
                  type="text"
                  value={form.ownerName}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="e.g. Sunil K. Perera"
                  className={inputCls(submitted ? errors.ownerName : undefined)}
                  aria-required="true"
                  aria-describedby={
                    submitted && errors.ownerName ? "ownerName-error" : undefined
                  }
                />
              </Field>

              <Field
                id="ownerIdNumber"
                label="Owner ID Number (NIC)"
                required
                error={submitted ? errors.ownerIdNumber : undefined}
              >
                <input
                  id="ownerIdNumber"
                  name="ownerIdNumber"
                  type="text"
                  value={form.ownerIdNumber}
                  onChange={handleChange}
                  maxLength={15}
                  placeholder="e.g. 198512345678 or 851234567V"
                  className={inputCls(submitted ? errors.ownerIdNumber : undefined)}
                  aria-required="true"
                  aria-describedby={
                    submitted && errors.ownerIdNumber
                      ? "ownerIdNumber-error"
                      : "ownerIdNumber-hint"
                  }
                />
                <p id="ownerIdNumber-hint" className="text-[10.5px] text-[#8a5a58]">
                  Sri Lankan National Identity Card (NIC) number.
                </p>
              </Field>

              <Field
                id="contactNumber"
                label="Contact Number"
                required
                error={submitted ? errors.contactNumber : undefined}
              >
                <input
                  id="contactNumber"
                  name="contactNumber"
                  type="tel"
                  value={form.contactNumber}
                  onChange={handleChange}
                  maxLength={15}
                  placeholder="e.g. 0712345678"
                  className={inputCls(submitted ? errors.contactNumber : undefined)}
                  aria-required="true"
                  aria-describedby={
                    submitted && errors.contactNumber ? "contactNumber-error" : "contactNumber-hint"
                  }
                />
                <p id="contactNumber-hint" className="text-[10.5px] text-[#8a5a58]">
                  Sri Lankan mobile or landline (10 digits, e.g. 0712345678).
                </p>
              </Field>
            </div>
          </section>

          {/* ── SECTION 3: Business Status ───────────────────────────────── */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8a5a58] mb-4 pb-2 border-b border-[#f0e6e5]">
              Business Status
            </h3>
            <Field id="status" label="Status" required>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className={inputCls()}
                aria-required="true"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </section>

          {/* Dev note */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] text-amber-800 leading-relaxed">
            <strong>⚠️ Development Note:</strong> The backend API is not yet connected.
            Submitted businesses are stored in temporary in-memory state only and will
            be lost on page refresh.
          </div>
        </form>

        {/* ── Drawer Footer ───────────────────────────────────────────────── */}
        <div className="shrink-0 px-6 py-4 border-t border-[#f0e6e5] bg-white flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="px-4 py-2 rounded border border-[#dcc6c4] bg-white text-sm font-semibold text-[#5a0000] hover:bg-[#f0e0df] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-business-form"
            disabled={submitting}
            className="btn-hover-fx inline-flex items-center gap-2 px-5 py-2 rounded bg-[#800000] text-sm font-semibold text-white shadow-sm hover:bg-[#5a0000] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <span
                  className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin shrink-0"
                  aria-hidden="true"
                />
                Saving…
              </>
            ) : (
              <>
                <span aria-hidden="true">+</span> Add Business
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Success Toast
// ─────────────────────────────────────────────────────────────────────────────
function SuccessToast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border border-emerald-200 bg-white px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.12)]"
    >
      <span className="text-emerald-600 text-lg" aria-hidden="true">
        ✓
      </span>
      <p className="text-sm font-medium text-emerald-800">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-2 text-[#8a5a58] hover:text-[#5a0000] text-xs"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function BusinessManagementPage() {
  // ── State ──────────────────────────────────────────────────────────────
  const [businesses, setBusinesses] = useState<Business[]>(MOCK_BUSINESSES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | BusinessStatus>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<Business | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // ── Derived / filtered data ────────────────────────────────────────────
  const stats = useMemo(() => computeBusinessStats(businesses), [businesses]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return businesses.filter((b) => {
      const matchesSearch =
        !q ||
        b.businessName.toLowerCase().includes(q) ||
        b.ownerName.toLowerCase().includes(q) ||
        b.registrationNumber.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || b.status === statusFilter;

      const matchesType =
        typeFilter === "all" || b.businessType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [businesses, search, statusFilter, typeFilter]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusFilterChange = (val: "all" | BusinessStatus) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleTypeFilterChange = (val: string) => {
    setTypeFilter(val);
    setPage(1);
  };

  const handleResetFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setPage(1);
  }, []);

  const handleBusinessAdded = useCallback((newBusiness: Business) => {
    setBusinesses((prev) => [newBusiness, ...prev]);
    setDrawerOpen(false);
    setToast(`"${newBusiness.businessName}" has been registered successfully.`);
  }, []);

  const existingRegNumbers = useMemo(
    () => businesses.map((b) => b.registrationNumber),
    [businesses]
  );

  const hasActiveFilters =
    search.trim() !== "" || statusFilter !== "all" || typeFilter !== "all";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* A. Page Header                                                       */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-[22px] text-[#5a0000] leading-tight">
            Business Management
          </h2>
          <p className="text-[13px] text-[#8a5a58] mt-1 max-w-[500px]">
            Manage registered businesses and their garbage collection service information.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="btn-hover-fx inline-flex items-center gap-1.5 rounded bg-[#800000] px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-[#5a0000]"
          aria-label="Open add business form"
        >
          <span aria-hidden="true" className="text-[15px] leading-none">
            +
          </span>
          Add Business
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* B. Summary Cards                                                     */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard
          label="Total Registered Businesses"
          value={stats.total}
          description="All registered businesses in the system"
          icon="🏪"
          variant="default"
        />
        <StatCard
          label="Active Businesses"
          value={stats.active}
          description="Currently active and operational businesses"
          icon="✅"
          variant="success"
        />
        <StatCard
          label="Inactive Businesses"
          value={stats.inactive}
          description="Deactivated or temporarily closed businesses"
          icon="⏸️"
          variant="warning"
        />
      </div>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* C. Search & Filters                                                  */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <section
        className="bg-white rounded-lg border border-[#f0e6e5] shadow-[0_2px_10px_rgba(90,0,0,0.06)] p-4"
        aria-label="Search and filter businesses"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
          {/* Search input */}
          <div className="flex-1 min-w-0">
            <label
              htmlFor="business-search"
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#8a5a58] mb-1.5"
            >
              Search
            </label>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a5a58] text-sm pointer-events-none"
                aria-hidden="true"
              >
                🔍
              </span>
              <input
                id="business-search"
                type="search"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by business name, owner name, or registration number..."
                className="w-full rounded border border-[#dcc6c4] bg-white pl-9 pr-4 py-2 text-sm text-[#4a4a4a] placeholder:text-[#c0a8a6] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#800000]/30"
                aria-label="Search businesses"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a5a58] hover:text-[#5a0000] text-xs p-0.5"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Status filter */}
          <div className="sm:min-w-[160px]">
            <label
              htmlFor="status-filter"
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#8a5a58] mb-1.5"
            >
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value as "all" | BusinessStatus)}
              className="w-full rounded border border-[#dcc6c4] bg-white px-3 py-2 text-sm text-[#5a0000] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#800000]/30 cursor-pointer"
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Type filter */}
          <div className="sm:min-w-[200px]">
            <label
              htmlFor="type-filter"
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#8a5a58] mb-1.5"
            >
              Business Type
            </label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => handleTypeFilterChange(e.target.value)}
              className="w-full rounded border border-[#dcc6c4] bg-white px-3 py-2 text-sm text-[#5a0000] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#800000]/30 cursor-pointer"
              aria-label="Filter by business type"
            >
              <option value="all">All Types</option>
              {BUSINESS_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Reset button */}
          {hasActiveFilters && (
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="whitespace-nowrap rounded border border-[#dcc6c4] bg-white px-3 py-2 text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df] transition-colors"
                aria-label="Reset all filters"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* D. Business Table                                                    */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <section
        className="bg-white rounded-lg border border-[#f0e6e5] shadow-[0_2px_10px_rgba(90,0,0,0.08)]"
        aria-label="Registered businesses table"
      >
        {/* Table header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0e6e5]">
          <div>
            <h3 className="font-serif text-[15px] text-[#5a0000]">
              Registered Businesses
            </h3>
            <p className="text-[11.5px] text-[#8a5a58] mt-0.5">
              {hasActiveFilters
                ? `Showing ${filtered.length} of ${businesses.length} businesses`
                : `${businesses.length} registered business${businesses.length !== 1 ? "es" : ""}`}
            </p>
          </div>
        </div>

        {/* Table */}
        {paginated.length === 0 ? (
          <EmptyState filtered={hasActiveFilters} />
        ) : (
          <div className="overflow-x-auto">
            <table
              className="min-w-full divide-y divide-[#f0e6e5] text-left text-sm"
              aria-label="Registered businesses"
            >
              <thead className="bg-[#fcf8f7] text-[11px] uppercase font-semibold text-[#8a5a58]">
                <tr>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Reg. Number
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Business Name
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Owner Name
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Business Type
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Address
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Contact
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0e6e5] text-[#4a4a4a]">
                {paginated.map((business) => (
                  <tr
                    key={business.id}
                    className="hover:bg-[#fcf8f7] transition-colors"
                  >
                    {/* Reg. Number */}
                    <td className="px-5 py-3">
                      <span className="font-mono text-[11px] text-[#8a5a58] whitespace-nowrap">
                        {business.registrationNumber}
                      </span>
                    </td>

                    {/* Business Name */}
                    <td className="px-5 py-3">
                      <span className="font-semibold text-[13px] text-[#5a0000] whitespace-nowrap">
                        {business.businessName}
                      </span>
                    </td>

                    {/* Owner Name */}
                    <td className="px-5 py-3 text-[13px] whitespace-nowrap">
                      <span>{business.ownerName}</span>
                      {business.ownerIdNumber && (
                        <span className="block font-mono text-[10.5px] text-[#8a5a58]">
                          NIC: {business.ownerIdNumber}
                        </span>
                      )}
                    </td>

                    {/* Business Type */}
                    <td className="px-5 py-3">
                      <span className="text-[12px] text-[#8a5a58] whitespace-nowrap">
                        {business.businessType}
                      </span>
                    </td>

                    {/* Address */}
                    <td className="px-5 py-3">
                      <span
                        className="text-[12px] text-[#4a4a4a] block max-w-[200px] leading-snug"
                        title={business.address}
                      >
                        {business.address}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-3 text-[13px] whitespace-nowrap">
                      <a
                        href={`tel:${business.contactNumber}`}
                        className="text-[#5a0000] hover:underline"
                      >
                        {business.contactNumber}
                      </a>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3">
                      <BusinessStatusBadge status={business.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3 text-right">
                      <ActionMenu
                        business={business}
                        onView={setViewTarget}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          total={filtered.length}
          page={page}
          pageSize={PAGE_SIZE}
          onPage={setPage}
        />

        {/* Data source note */}
        <div className="px-6 py-3 border-t border-[#f0e6e5] bg-[#fcf8f7] rounded-b-lg">
          <p className="text-[10.5px] text-[#8a5a58]">
            ⚠️ Displaying mock data for development. Connect to{" "}
            <code className="font-mono text-[10px]">
              GET /api/v1/garbage-fees/businesses
            </code>{" "}
            when the backend is available.
          </p>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* E. Add Business Drawer                                               */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {drawerOpen && (
        <AddBusinessDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onSuccess={handleBusinessAdded}
          existingRegNumbers={existingRegNumbers}
        />
      )}

      {/* View Details Modal */}
      {viewTarget && (
        <ViewDetailsModal
          business={viewTarget}
          onClose={() => setViewTarget(null)}
        />
      )}

      {/* Success Toast */}
      {toast && (
        <SuccessToast message={toast} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}

