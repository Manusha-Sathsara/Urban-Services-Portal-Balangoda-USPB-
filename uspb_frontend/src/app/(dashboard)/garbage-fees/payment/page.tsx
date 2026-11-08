"use client";

/**
 * Payment Management Page
 * Route: /garbage-fees/payment
 *
 * Implements:
 *  A. Page Header — title, subtitle, "+ Record Payment" button
 *  B. Payment Summary Cards — Total Businesses, Paid, Unpaid, Total Collected (LKR)
 *  C. Search & Filter Section — by business/reg-number, fee year, status, business type, reset
 *  D. Payment Records Table — 8 columns, badges, formatted currency, action menu
 *  E. Record / Update Payment Drawer — right-side sliding overlay with business auto-fill,
 *     fee calculation, validation, duplicate prevention, and update mode for unpaid records
 *  F. View Payment Details Modal — dialog inspecting receipt, notes, and timestamp
 *
 * Data: Isolated mock data (mockData.ts) stored in component state.
 *       ⚠️ Temporary frontend state flow. No backend persistence yet.
 *       Connect to GET/POST/PUT /api/v1/garbage-fees/payments when available.
 *
 * Theme: Balangoda Urban Council brand colors (#5a0000, #800000, #fbbf24, #f0e0df, #dcc6c4).
 * Components: Reuses StatCard, PaymentStatusBadge from components/shared/.
 */

import { useState, useMemo, useRef, useEffect } from "react";
import { StatCard } from "@/components/shared/StatCard";
import { PaymentStatusBadge } from "@/components/shared/PaymentStatusBadge";
import {
  MOCK_BUSINESSES,
  BUSINESS_TYPES,
  INITIAL_PAYMENT_RECORDS,
  AVAILABLE_PAYMENT_YEARS,
  DEFAULT_PAYMENT_YEAR,
  getEstablishedFee,
  computePaymentStats,
  type PaymentRecord,
  type Business,
} from "./mockData";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 8;

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────
function formatLKR(amount: number): string {
  return `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getTodayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────────────────────────────────────
// File-Level Component: FormField (Declared outside render to satisfy React rules)
// ─────────────────────────────────────────────────────────────────────────────
interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function FormField({ id, label, required, error, children }: FormFieldProps) {
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

// ─────────────────────────────────────────────────────────────────────────────
// File-Level Component: Empty State
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({
  filtered,
  onReset,
}: {
  filtered: boolean;
  onReset: () => void;
}) {
  return (
    <div className="py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-[#f0e0df] text-[#5a0000] text-3xl grid place-items-center mx-auto mb-4">
        {filtered ? "🔍" : "💳"}
      </div>
      <p className="text-sm font-semibold text-[#5a0000] mb-1">
        {filtered ? "No payment records match your filters" : "No payment records available"}
      </p>
      <p className="text-xs text-[#8a5a58] max-w-[320px] mx-auto mb-4">
        {filtered
          ? "Try adjusting your search keyword, fee year, status, or business type filters."
          : "Click \"+ Record Payment\" above to record the first annual garbage collection fee."}
      </p>
      {filtered && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded border border-[#dcc6c4] bg-white px-3 py-1.5 text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df] transition-colors"
        >
          Reset All Filters
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// File-Level Component: Table Pagination
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
        Showing page {page} of {totalPages} ({total} records total)
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
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
            type="button"
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
          type="button"
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
// File-Level Component: Row Action Menu
// ─────────────────────────────────────────────────────────────────────────────
function ActionMenu({
  record,
  onView,
  onUpdatePayment,
}: {
  record: PaymentRecord;
  onView: (r: PaymentRecord) => void;
  onUpdatePayment: (r: PaymentRecord) => void;
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
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="p-1.5 rounded hover:bg-[#f0e0df] text-[#8a5a58] hover:text-[#5a0000] transition-colors"
        aria-label={`Actions for payment record ${record.id}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="text-lg leading-none">⋯</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-[#f0e6e5] bg-white shadow-[0_4px_16px_rgba(90,0,0,0.12)] py-1"
        >
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              onView(record);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#5a0000] hover:bg-[#fcf8f7] transition-colors text-left"
          >
            <span aria-hidden="true">👁️</span> View Details
          </button>

          {record.status === "unpaid" ? (
            <button
              role="menuitem"
              type="button"
              onClick={() => {
                onUpdatePayment(record);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors text-left"
            >
              <span aria-hidden="true">💳</span> Record Payment
            </button>
          ) : (
            <button
              role="menuitem"
              type="button"
              onClick={() => {
                onUpdatePayment(record);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#5a0000] hover:bg-[#fcf8f7] transition-colors text-left"
            >
              <span aria-hidden="true">✏️</span> Update Status
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// File-Level Component: View Payment Details Modal
// ─────────────────────────────────────────────────────────────────────────────
function ViewPaymentDetailsModal({
  record,
  onClose,
  onRecordPayment,
}: {
  record: PaymentRecord;
  onClose: () => void;
  onRecordPayment: (r: PaymentRecord) => void;
}) {
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
      aria-label={`Payment details for ${record.businessName}`}
    >
      <div
        className="absolute inset-0 bg-[#1a0000]/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-lg rounded-xl bg-white border border-[#f0e6e5] shadow-[0_8px_32px_rgba(90,0,0,0.18)]">
        {/* Modal Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#f0e6e5]">
          <div>
            <h3 className="font-serif text-[16px] text-[#5a0000]">
              Payment Record Details
            </h3>
            <p className="text-xs text-[#8a5a58] mt-0.5">
              Record ID: <span className="font-mono">{record.id}</span>
            </p>
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

        {/* Modal Body */}
        <div className="px-6 py-5 space-y-3.5">
          <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
            <span className="text-[#8a5a58] font-medium shrink-0">Business Name</span>
            <span className="font-semibold text-[#5a0000]">{record.businessName}</span>
          </div>
          <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
            <span className="text-[#8a5a58] font-medium shrink-0">Registration No.</span>
            <span className="font-mono text-[13px]">{record.registrationNumber}</span>
          </div>
          <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
            <span className="text-[#8a5a58] font-medium shrink-0">Business Type</span>
            <span>{record.businessType}</span>
          </div>
          <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
            <span className="text-[#8a5a58] font-medium shrink-0">Fee Assessment Year</span>
            <span className="font-semibold">FY {record.feeYear}</span>
          </div>
          <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
            <span className="text-[#8a5a58] font-medium shrink-0">Annual Fee Amount</span>
            <span className="font-bold text-[#5a0000]">{formatLKR(record.amount)}</span>
          </div>
          <div className="grid grid-cols-[160px_1fr] gap-2 text-sm items-center">
            <span className="text-[#8a5a58] font-medium shrink-0">Payment Status</span>
            <div>
              <PaymentStatusBadge status={record.status} />
            </div>
          </div>
          <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
            <span className="text-[#8a5a58] font-medium shrink-0">Payment Date</span>
            <span>{formatDate(record.paymentDate)}</span>
          </div>
          {record.receiptNumber && (
            <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
              <span className="text-[#8a5a58] font-medium shrink-0">Receipt / Ref No.</span>
              <span className="font-mono text-[#5a0000] bg-[#faf4f3] px-2 py-0.5 rounded border border-[#f0e6e5] w-fit">
                {record.receiptNumber}
              </span>
            </div>
          )}
          {record.notes && (
            <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
              <span className="text-[#8a5a58] font-medium shrink-0">Officer Remarks</span>
              <span className="text-[#555] bg-[#fcf8f7] p-2.5 rounded border border-[#f0e6e5] text-xs leading-relaxed">
                {record.notes}
              </span>
            </div>
          )}
          <div className="grid grid-cols-[160px_1fr] gap-2 text-xs text-[#8a5a58] pt-2 border-t border-[#f0e6e5]">
            <span>Last Updated</span>
            <span>{formatDate(record.updatedAt)}</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#f0e6e5] flex items-center justify-between bg-[#fcf8f7] rounded-b-xl">
          {record.status === "unpaid" ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onRecordPayment(record);
              }}
              className="btn-hover-fx inline-flex items-center gap-1.5 rounded bg-[#800000] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#5a0000]"
            >
              <span aria-hidden="true">💳</span> Record Payment Now
            </button>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded border border-[#dcc6c4] bg-white text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df] transition-colors ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// File-Level Component: Record / Update Payment Drawer Inner Form
// ─────────────────────────────────────────────────────────────────────────────
interface PaymentDrawerFormData {
  businessId: string;
  registrationNumber: string;
  businessType: string;
  feeYear: number;
  amount: string;
  status: "paid" | "unpaid";
  paymentDate: string;
  receiptNumber: string;
  notes: string;
}

interface PaymentDrawerErrors {
  businessId?: string;
  feeYear?: string;
  amount?: string;
  status?: string;
  paymentDate?: string;
  duplicate?: string;
}

function RecordPaymentDrawerForm({
  editRecord,
  allBusinesses,
  existingRecords,
  onClose,
  onSave,
}: {
  editRecord: PaymentRecord | null;
  allBusinesses: Business[];
  existingRecords: PaymentRecord[];
  onClose: () => void;
  onSave: (record: PaymentRecord, isUpdate: boolean) => void;
}) {
  const isEditMode = editRecord !== null;

  // Initialize form state directly from props (re-mounts via key on record switch)
  const [form, setForm] = useState<PaymentDrawerFormData>(() => ({
    businessId: editRecord ? editRecord.businessId : "",
    registrationNumber: editRecord ? editRecord.registrationNumber : "",
    businessType: editRecord ? editRecord.businessType : "",
    feeYear: editRecord ? editRecord.feeYear : DEFAULT_PAYMENT_YEAR,
    amount: editRecord ? String(editRecord.amount) : "",
    status: editRecord
      ? editRecord.status === "unpaid"
        ? "paid"
        : editRecord.status
      : "paid",
    paymentDate: editRecord?.paymentDate || getTodayISODate(),
    receiptNumber: editRecord?.receiptNumber || "",
    notes: editRecord?.notes || "",
  }));

  const [errors, setErrors] = useState<PaymentDrawerErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Close on Escape key
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [submitting, onClose]);

  // Handle business selection change
  function handleBusinessChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const selectedId = e.target.value;
    const selectedBiz = allBusinesses.find((b) => b.id === selectedId);

    if (selectedBiz) {
      const establishedAmount = getEstablishedFee(selectedBiz.id);
      setForm((prev) => ({
        ...prev,
        businessId: selectedBiz.id,
        registrationNumber: selectedBiz.registrationNumber,
        businessType: selectedBiz.businessType,
        amount: String(establishedAmount),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        businessId: "",
        registrationNumber: "",
        businessType: "",
        amount: "",
      }));
    }

    if (errors.businessId || errors.duplicate) {
      setErrors((prev) => ({ ...prev, businessId: undefined, duplicate: undefined }));
    }
  }

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof PaymentDrawerErrors] || errors.duplicate) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
        duplicate: undefined,
      }));
    }
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as "paid" | "unpaid";
    setForm((prev) => ({
      ...prev,
      status: newStatus,
      paymentDate: newStatus === "paid" ? prev.paymentDate || getTodayISODate() : "",
    }));
    if (errors.status || errors.paymentDate) {
      setErrors((prev) => ({ ...prev, status: undefined, paymentDate: undefined }));
    }
  }

  function validate(): PaymentDrawerErrors {
    const errs: PaymentDrawerErrors = {};

    if (!form.businessId) {
      errs.businessId = "Please select a registered business.";
    }

    if (!form.feeYear || isNaN(Number(form.feeYear))) {
      errs.feeYear = "Please select a valid fee assessment year.";
    }

    const numAmount = Number(form.amount);
    if (!form.amount || isNaN(numAmount) || numAmount <= 0) {
      errs.amount = "Annual fee amount must be greater than zero.";
    }

    if (form.status === "paid") {
      if (!form.paymentDate.trim()) {
        errs.paymentDate = "Payment date is required when status is Paid.";
      }
    }

    // Check for duplicate record for the same business and year (if not editing that record)
    if (form.businessId && form.feeYear) {
      const duplicate = existingRecords.find(
        (r) =>
          r.businessId === form.businessId &&
          r.feeYear === Number(form.feeYear) &&
          (!isEditMode || r.id !== editRecord?.id)
      );

      if (duplicate) {
        errs.duplicate = `An annual fee record (${duplicate.id} - ${duplicate.status.toUpperCase()}) already exists for this business in FY ${form.feeYear}. Please update the existing record instead of creating a duplicate.`;
      }
    }

    return errs;
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

    // Simulate network response
    await new Promise((r) => setTimeout(r, 700));

    const selectedBiz = allBusinesses.find((b) => b.id === form.businessId);
    const businessName = selectedBiz
      ? selectedBiz.businessName
      : editRecord?.businessName || "Unknown";

    const savedRecord: PaymentRecord = {
      id: editRecord
        ? editRecord.id
        : `PAY-${form.feeYear}-${String(Date.now()).slice(-4)}`,
      businessId: form.businessId,
      businessName,
      registrationNumber: form.registrationNumber,
      businessType: form.businessType,
      feeYear: Number(form.feeYear),
      amount: Number(form.amount),
      status: form.status,
      paymentDate: form.status === "paid" ? form.paymentDate : undefined,
      receiptNumber:
        form.status === "paid"
          ? form.receiptNumber.trim() ||
            `REC-${form.feeYear}-${String(Math.floor(1000 + Math.random() * 9000))}`
          : undefined,
      notes: form.notes.trim() || undefined,
      updatedAt: getTodayISODate(),
    };

    setSubmitting(false);
    onSave(savedRecord, isEditMode);
  }

  const inputCls = (err?: string) =>
    `w-full rounded border ${
      err
        ? "border-red-400 focus:ring-red-300"
        : "border-[#dcc6c4] focus:ring-[#800000]/30"
    } bg-white px-3 py-2 text-sm text-[#4a4a4a] shadow-xs focus:outline-none focus:ring-2 transition placeholder:text-[#c0a8a6]`;

  const readOnlyCls =
    "w-full rounded border border-[#e5d8d7] bg-[#faf4f3] px-3 py-2 text-sm text-[#5a0000] font-medium shadow-2xs cursor-not-allowed select-none";

  return (
    <>
      {/* Scrollable Form Body */}
      <form
        id="record-payment-form"
        onSubmit={handleSubmit}
        noValidate
        className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
      >
        {/* Duplicate Record Warning */}
        {submitted && errors.duplicate && (
          <div
            className="rounded-lg border border-red-300 bg-red-50 p-3.5 text-xs text-red-800 leading-relaxed flex items-start gap-2.5"
            role="alert"
          >
            <span className="text-base leading-none shrink-0" aria-hidden="true">
              ⚠️
            </span>
            <span>{errors.duplicate}</span>
          </div>
        )}

        {/* ── Section 1: Business Information ──────────────────────────── */}
        <section>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8a5a58] mb-4 pb-2 border-b border-[#f0e6e5]">
            Section 1: Business Information
          </h3>
          <div className="space-y-4">
            <FormField
              id="businessId"
              label="Select Business"
              required
              error={submitted ? errors.businessId : undefined}
            >
              {isEditMode ? (
                <input
                  type="text"
                  readOnly
                  value={`${editRecord?.businessName} (${editRecord?.registrationNumber})`}
                  className={readOnlyCls}
                  aria-label="Selected business"
                />
              ) : (
                <select
                  id="businessId"
                  name="businessId"
                  value={form.businessId}
                  onChange={handleBusinessChange}
                  className={inputCls(submitted ? errors.businessId : undefined)}
                  aria-required="true"
                  aria-describedby={
                    submitted && errors.businessId ? "businessId-error" : undefined
                  }
                >
                  <option value="" disabled>
                    Select a registered business…
                  </option>
                  {allBusinesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.businessName} — {b.registrationNumber} ({b.businessType})
                    </option>
                  ))}
                </select>
              )}
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <FormField
                id="registrationNumber"
                label="Business Registration Number"
              >
                <input
                  id="registrationNumber"
                  name="registrationNumber"
                  type="text"
                  readOnly
                  value={form.registrationNumber || "— Auto-filled upon selection —"}
                  className={readOnlyCls}
                  tabIndex={-1}
                  aria-label="Business registration number (read-only)"
                />
              </FormField>

              <FormField id="businessType" label="Business Type">
                <input
                  id="businessType"
                  name="businessType"
                  type="text"
                  readOnly
                  value={form.businessType || "— Auto-filled upon selection —"}
                  className={readOnlyCls}
                  tabIndex={-1}
                  aria-label="Business type (read-only)"
                />
              </FormField>
            </div>
          </div>
        </section>

        {/* ── Section 2: Payment Information ───────────────────────────── */}
        <section>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8a5a58] mb-4 pb-2 border-b border-[#f0e6e5]">
            Section 2: Payment Information
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <FormField
                id="feeYear"
                label="Fee Year"
                required
                error={submitted ? errors.feeYear : undefined}
              >
                <select
                  id="feeYear"
                  name="feeYear"
                  value={form.feeYear}
                  onChange={handleInputChange}
                  className={inputCls(submitted ? errors.feeYear : undefined)}
                  aria-required="true"
                >
                  {AVAILABLE_PAYMENT_YEARS.map((y) => (
                    <option key={y} value={y}>
                      FY {y}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                id="amount"
                label="Annual Fee Amount (LKR)"
                required
                error={submitted ? errors.amount : undefined}
              >
                <div className="relative">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8a5a58]"
                    aria-hidden="true"
                  >
                    LKR
                  </span>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="1"
                    step="50"
                    value={form.amount}
                    onChange={handleInputChange}
                    placeholder="e.g. 2000"
                    className={`${inputCls(
                      submitted ? errors.amount : undefined
                    )} pl-11 font-medium`}
                    aria-required="true"
                  />
                </div>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <FormField
                id="status"
                label="Payment Status"
                required
                error={submitted ? errors.status : undefined}
              >
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleStatusChange}
                  className={inputCls(submitted ? errors.status : undefined)}
                  aria-required="true"
                >
                  <option value="paid">Paid (Payment Completed)</option>
                  <option value="unpaid">Unpaid (Annual Fee Due)</option>
                </select>
              </FormField>

              <FormField
                id="paymentDate"
                label="Payment Date"
                required={form.status === "paid"}
                error={submitted ? errors.paymentDate : undefined}
              >
                <input
                  id="paymentDate"
                  name="paymentDate"
                  type="date"
                  disabled={form.status === "unpaid"}
                  value={form.paymentDate}
                  onChange={handleInputChange}
                  className={
                    form.status === "unpaid"
                      ? readOnlyCls
                      : inputCls(submitted ? errors.paymentDate : undefined)
                  }
                  aria-required={form.status === "paid"}
                />
                {form.status === "unpaid" && (
                  <p className="text-[10px] text-[#8a5a58]">
                    Date is not required for unpaid obligations.
                  </p>
                )}
              </FormField>
            </div>

            {form.status === "paid" && (
              <FormField id="receiptNumber" label="Receipt / Voucher Number (Optional)">
                <input
                  id="receiptNumber"
                  name="receiptNumber"
                  type="text"
                  value={form.receiptNumber}
                  onChange={handleInputChange}
                  maxLength={30}
                  placeholder="e.g. REC-2026-0841 (auto-generated if blank)"
                  className={inputCls()}
                />
              </FormField>
            )}

            <FormField id="notes" label="Officer Remarks / Notes (Optional)">
              <textarea
                id="notes"
                name="notes"
                rows={2}
                value={form.notes}
                onChange={handleInputChange}
                maxLength={250}
                placeholder="e.g. Paid in full via direct bank transfer / Counter cash payment."
                className={`${inputCls()} resize-none`}
              />
            </FormField>
          </div>
        </section>

        {/* Development state warning */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] text-amber-800 leading-relaxed">
          <strong>⚠️ Development Notice:</strong> Backend API is not yet connected.
          Changes are saved in temporary in-memory state for demonstration and will reset on page reload.
        </div>
      </form>

      {/* Drawer Footer */}
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
          form="record-payment-form"
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
              <span aria-hidden="true">💾</span>
              {isEditMode ? "Save Changes" : "Save Payment"}
            </>
          )}
        </button>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// File-Level Component: Record / Update Payment Drawer Container
// ─────────────────────────────────────────────────────────────────────────────
function RecordPaymentDrawer({
  open,
  editRecord,
  allBusinesses,
  existingRecords,
  onClose,
  onSave,
}: {
  open: boolean;
  editRecord: PaymentRecord | null;
  allBusinesses: Business[];
  existingRecords: PaymentRecord[];
  onClose: () => void;
  onSave: (record: PaymentRecord, isUpdate: boolean) => void;
}) {
  const isEditMode = editRecord !== null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-[#1a0000]/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sliding Drawer Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEditMode ? "Update Payment Record" : "Record Annual Fee Payment"}
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[540px] bg-white shadow-[0_0_40px_rgba(90,0,0,0.18)] flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#f0e6e5] bg-white shrink-0">
          <div>
            <h2 className="font-serif text-[18px] text-[#5a0000]">
              {isEditMode ? "Update Fee Payment Record" : "Record Annual Fee Payment"}
            </h2>
            <p className="text-[12px] text-[#8a5a58] mt-0.5 leading-snug max-w-[360px]">
              {isEditMode
                ? `Update payment receipt details or fee obligation for ${editRecord?.businessName}.`
                : "Enter the payment information for a registered business."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 mt-0.5 p-1.5 rounded hover:bg-[#f0e0df] text-[#8a5a58] hover:text-[#5a0000] transition-colors shrink-0"
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable form body rendered with key to re-mount on record change */}
        {open && (
          <RecordPaymentDrawerForm
            key={editRecord ? `edit-${editRecord.id}` : "create"}
            editRecord={editRecord}
            allBusinesses={allBusinesses}
            existingRecords={existingRecords}
            onClose={onClose}
            onSave={onSave}
          />
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// File-Level Component: Toast Notification
// ─────────────────────────────────────────────────────────────────────────────
function ToastNotification({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border border-emerald-200 bg-white px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.12)] animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <span className="text-emerald-600 text-lg" aria-hidden="true">
        ✓
      </span>
      <p className="text-sm font-medium text-emerald-800">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-2 text-[#8a5a58] hover:text-[#5a0000] text-xs"
        aria-label="Dismiss toast"
      >
        ✕
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function PaymentManagementPage() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [records, setRecords] = useState<PaymentRecord[]>(INITIAL_PAYMENT_RECORDS);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState<number | "all">(DEFAULT_PAYMENT_YEAR);
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Drawer & modal controls
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PaymentRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<PaymentRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Derived Statistics ────────────────────────────────────────────────────
  // Uses the currently selected fee year for consistent metrics
  const stats = useMemo(
    () => computePaymentStats(records, yearFilter),
    [records, yearFilter]
  );

  // ── Filtered & Paginated Records ──────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      const matchesSearch =
        !q ||
        r.businessName.toLowerCase().includes(q) ||
        r.registrationNumber.toLowerCase().includes(q);

      const matchesYear =
        yearFilter === "all" || r.feeYear === Number(yearFilter);

      const matchesStatus =
        statusFilter === "all" || r.status === statusFilter;

      const matchesType =
        typeFilter === "all" || r.businessType === typeFilter;

      return matchesSearch && matchesYear && matchesStatus && matchesType;
    });
  }, [records, search, yearFilter, statusFilter, typeFilter]);

  const paginatedRecords = useMemo(() => {
    return filteredRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredRecords, page]);

  const hasActiveFilters =
    search.trim() !== "" ||
    yearFilter !== DEFAULT_PAYMENT_YEAR ||
    statusFilter !== "all" ||
    typeFilter !== "all";

  // ── Event Handlers (Updating page without setState in useEffect) ─────────
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleYearChange = (value: string) => {
    setYearFilter(value === "all" ? "all" : Number(value));
    setPage(1);
  };

  const handleStatusChange = (value: "all" | "paid" | "unpaid") => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setYearFilter(DEFAULT_PAYMENT_YEAR);
    setStatusFilter("all");
    setTypeFilter("all");
    setPage(1);
  };

  const handleOpenAddDrawer = () => {
    setEditingRecord(null);
    setDrawerOpen(true);
  };

  const handleOpenEditDrawer = (record: PaymentRecord) => {
    setEditingRecord(record);
    setDrawerOpen(true);
  };

  const handleSavePayment = (savedRecord: PaymentRecord, isUpdate: boolean) => {
    if (isUpdate) {
      setRecords((prev) =>
        prev.map((r) => (r.id === savedRecord.id ? savedRecord : r))
      );
      setToastMessage(
        `Payment record for "${savedRecord.businessName}" updated successfully.`
      );
    } else {
      setRecords((prev) => [savedRecord, ...prev]);
      setToastMessage(
        `Annual fee payment recorded for "${savedRecord.businessName}".`
      );
    }
    setDrawerOpen(false);
    setEditingRecord(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* A. Page Header                                                       */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-[22px] text-[#5a0000] leading-tight">
            Payment Management
          </h2>
          <p className="text-[13px] text-[#8a5a58] mt-1 max-w-[520px]">
            Record and manage annual garbage collection fee payments for registered businesses.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddDrawer}
          className="btn-hover-fx inline-flex items-center gap-1.5 rounded bg-[#800000] px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-[#5a0000]"
          aria-label="Open payment recording drawer"
        >
          <span aria-hidden="true" className="text-[15px] leading-none">
            +
          </span>
          Record Payment
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* B. Payment Summary Cards                                             */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <section aria-label="Payment summary metrics">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a5a58]">
            Overview Metrics {yearFilter === "all" ? "(All Years)" : `(FY ${yearFilter})`}
          </p>
          <span className="text-[11px] text-[#8a5a58]">
            Calculated from {records.length} total municipal payment entries
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Businesses"
            value={stats.totalBusinesses}
            description={
              yearFilter === "all"
                ? "Total fee obligations across all years"
                : `Eligible registered businesses for FY ${yearFilter}`
            }
            icon="🏪"
            variant="default"
          />
          <StatCard
            label="Paid Businesses"
            value={stats.paidBusinesses}
            description={
              yearFilter === "all"
                ? "Total settled annual payments"
                : `Businesses that completed payments for ${yearFilter}`
            }
            icon="✅"
            variant="success"
          />
          <StatCard
            label="Unpaid Businesses"
            value={stats.unpaidBusinesses}
            description={
              yearFilter === "all"
                ? "Total outstanding fee balances"
                : `Businesses with pending fees for ${yearFilter}`
            }
            icon="⏳"
            variant="warning"
          />
          <StatCard
            label="Total Fee Collected"
            value={formatLKR(stats.totalCollected)}
            description={
              yearFilter === "all"
                ? "Cumulative garbage fee revenue collected"
                : `Total revenue collected in FY ${yearFilter}`
            }
            icon="💰"
            variant="revenue"
          />
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* C. Search and Filter Section                                         */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <section
        className="bg-white rounded-lg border border-[#f0e6e5] shadow-[0_2px_10px_rgba(90,0,0,0.06)] p-4"
        aria-label="Search and filter payment records"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-4">
          {/* Search bar */}
          <div className="flex-1 min-w-0">
            <label
              htmlFor="payment-search"
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
                id="payment-search"
                type="search"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by business name or registration number..."
                className="w-full rounded border border-[#dcc6c4] bg-white pl-9 pr-8 py-2 text-sm text-[#4a4a4a] placeholder:text-[#c0a8a6] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#800000]/30"
                aria-label="Search payment records"
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

          {/* Payment Year Filter */}
          <div className="sm:min-w-[150px]">
            <label
              htmlFor="year-filter"
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#8a5a58] mb-1.5"
            >
              Payment Year
            </label>
            <select
              id="year-filter"
              value={yearFilter}
              onChange={(e) => handleYearChange(e.target.value)}
              className="w-full rounded border border-[#dcc6c4] bg-white px-3 py-2 text-sm text-[#5a0000] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#800000]/30 cursor-pointer font-medium"
              aria-label="Filter by payment year"
            >
              <option value="all">All Years</option>
              {AVAILABLE_PAYMENT_YEARS.map((y) => (
                <option key={y} value={y}>
                  FY {y}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="sm:min-w-[150px]">
            <label
              htmlFor="payment-status-filter"
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#8a5a58] mb-1.5"
            >
              Payment Status
            </label>
            <select
              id="payment-status-filter"
              value={statusFilter}
              onChange={(e) =>
                handleStatusChange(e.target.value as "all" | "paid" | "unpaid")
              }
              className="w-full rounded border border-[#dcc6c4] bg-white px-3 py-2 text-sm text-[#5a0000] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#800000]/30 cursor-pointer font-medium"
              aria-label="Filter by payment status"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          {/* Business Type Filter */}
          <div className="sm:min-w-[190px]">
            <label
              htmlFor="business-type-filter"
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#8a5a58] mb-1.5"
            >
              Business Type
            </label>
            <select
              id="business-type-filter"
              value={typeFilter}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full rounded border border-[#dcc6c4] bg-white px-3 py-2 text-sm text-[#5a0000] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#800000]/30 cursor-pointer font-medium"
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

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="whitespace-nowrap rounded border border-[#dcc6c4] bg-white px-3 py-2 text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df] transition-colors"
                aria-label="Reset all search filters"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* D. Payment Records Table                                             */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <section
        className="bg-white rounded-lg border border-[#f0e6e5] shadow-[0_2px_10px_rgba(90,0,0,0.08)]"
        aria-label="Registered business payment records table"
      >
        {/* Table header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0e6e5]">
          <div>
            <h3 className="font-serif text-[15px] text-[#5a0000]">
              Annual Payment Records
            </h3>
            <p className="text-[11.5px] text-[#8a5a58] mt-0.5">
              {hasActiveFilters
                ? `Showing ${filteredRecords.length} matching payment record${
                    filteredRecords.length !== 1 ? "s" : ""
                  }`
                : `All registered payment records (${records.length} records total)`}
            </p>
          </div>
        </div>

        {/* Table Content */}
        {paginatedRecords.length === 0 ? (
          <EmptyState
            filtered={hasActiveFilters}
            onReset={handleResetFilters}
          />
        ) : (
          <div className="overflow-x-auto">
            <table
              className="min-w-full divide-y divide-[#f0e6e5] text-left text-sm"
              aria-label="Annual garbage collection fee payment records"
            >
              <thead className="bg-[#fcf8f7] text-[11px] uppercase font-semibold text-[#8a5a58]">
                <tr>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Business Name
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Registration No.
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Business Type
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Fee Year
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap text-right">
                    Annual Fee (LKR)
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Payment Date
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0e6e5] text-[#4a4a4a]">
                {paginatedRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-[#fcf8f7] transition-colors"
                  >
                    {/* Business Name */}
                    <td className="px-5 py-3">
                      <span className="font-semibold text-[13px] text-[#5a0000] whitespace-nowrap">
                        {record.businessName}
                      </span>
                    </td>

                    {/* Registration No */}
                    <td className="px-5 py-3">
                      <span className="font-mono text-[11px] text-[#8a5a58] whitespace-nowrap">
                        {record.registrationNumber}
                      </span>
                    </td>

                    {/* Business Type */}
                    <td className="px-5 py-3">
                      <span className="text-[12px] text-[#8a5a58] whitespace-nowrap">
                        {record.businessType}
                      </span>
                    </td>

                    {/* Fee Year */}
                    <td className="px-5 py-3 text-[13px] whitespace-nowrap font-medium text-[#5a0000]">
                      FY {record.feeYear}
                    </td>

                    {/* Annual Fee Amount (LKR) */}
                    <td className="px-5 py-3 text-right font-medium text-[13px] whitespace-nowrap">
                      {formatLKR(record.amount)}
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-3">
                      <PaymentStatusBadge status={record.status} />
                    </td>

                    {/* Payment Date */}
                    <td className="px-5 py-3 text-[13px] text-[#8a5a58] whitespace-nowrap">
                      {formatDate(record.paymentDate)}
                    </td>

                    {/* Actions Menu */}
                    <td className="px-5 py-3 text-right">
                      <ActionMenu
                        record={record}
                        onView={setViewingRecord}
                        onUpdatePayment={handleOpenEditDrawer}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        <Pagination
          total={filteredRecords.length}
          page={page}
          pageSize={PAGE_SIZE}
          onPage={setPage}
        />

        {/* Data Source Footnote */}
        <div className="px-6 py-3 border-t border-[#f0e6e5] bg-[#fcf8f7] rounded-b-lg">
          <p className="text-[10.5px] text-[#8a5a58]">
            ⚠️ Displaying mock payment data for development. Connect to{" "}
            <code className="font-mono text-[10px]">
              GET /api/v1/garbage-fees/payments?year={yearFilter}
            </code>{" "}
            when the backend API is connected.
          </p>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* E. Record / Update Payment Drawer                                    */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <RecordPaymentDrawer
        open={drawerOpen}
        editRecord={editingRecord}
        allBusinesses={MOCK_BUSINESSES}
        existingRecords={records}
        onClose={() => {
          setDrawerOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSavePayment}
      />

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* F. View Payment Details Modal                                        */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {viewingRecord && (
        <ViewPaymentDetailsModal
          record={viewingRecord}
          onClose={() => setViewingRecord(null)}
          onRecordPayment={handleOpenEditDrawer}
        />
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* G. Success Toast Notification                                        */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {toastMessage && (
        <ToastNotification
          message={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
