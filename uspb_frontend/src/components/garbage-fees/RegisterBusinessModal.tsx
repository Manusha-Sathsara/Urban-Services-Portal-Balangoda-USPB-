"use client";

import { useState, useEffect, useRef } from "react";
import {
  BUSINESS_CATEGORIES,
  BusinessCategory,
  getCategoryById,
  formatLKR,
} from "@/lib/businessCategories";

export interface NewBusinessData {
  businessName: string;
  address: string;
  ownerName: string;
  categoryId: number;
  categoryName: string;
  categorySinhalaName: string;
  ownerIdNumber: string;
  contactNumber: string;
  price: number;
  ward: string;
  registrationNumber: string;
}

interface FormErrors {
  businessName?: string;
  address?: string;
  ownerName?: string;
  categoryId?: string;
  ownerIdNumber?: string;
  contactNumber?: string;
  price?: string;
}

interface RegisterBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewBusinessData) => Promise<void> | void;
  nextRegistrationNumber?: string;
  defaultFeeYear?: number;
}

// Balangoda Urban Council Wards
const BALANGODA_WARDS = [
  "Ward 01 - Balangoda Town",
  "Ward 02 - Kirindigala",
  "Ward 03 - Pettigala",
  "Ward 04 - Meddekanda",
  "Ward 05 - Rassagala Road",
  "Ward 06 - Hospital Road",
  "Ward 07 - Barnes Ratwatte Mawatha",
  "Ward 08 - Pahala Balangoda",
  "Ward 09 - Seelogama",
  "Ward 10 - Galwatte",
  "Ward 11 - Wewelwatte Road",
  "Ward 12 - New Town",
];

export function RegisterBusinessModal({
  isOpen,
  onClose,
  onSubmit,
  nextRegistrationNumber = "BAL-BUS-2026-009",
  defaultFeeYear = 2026,
}: RegisterBusinessModalProps) {
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "">("");
  const [ownerIdNumber, setOwnerIdNumber] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [customPrice, setCustomPrice] = useState<string>("");
  const [ward, setWard] = useState("Ward 01 - Balangoda Town");
  const [registrationNumber, setRegistrationNumber] = useState(nextRegistrationNumber);

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const selectedCategory: BusinessCategory | undefined =
    selectedCategoryId !== "" ? getCategoryById(Number(selectedCategoryId)) : undefined;

  // Handle category selection and automatically set the price
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : "";
    setSelectedCategoryId(val);
    if (errors.categoryId) {
      setErrors((p) => ({ ...p, categoryId: undefined }));
    }

    if (val !== "") {
      const cat = getCategoryById(val);
      if (cat && cat.price !== null) {
        setCustomPrice(String(cat.price));
      } else {
        setCustomPrice("");
      }
    } else {
      setCustomPrice("");
    }
  };

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, onClose]);

  // Focus first input on mount
  useEffect(() => {
    if (isOpen) {
      firstInputRef.current?.focus();
    }
  }, [isOpen]);

  // Validate fields
  function validate(): FormErrors {
    const errs: FormErrors = {};

    if (!businessName.trim()) {
      errs.businessName = "Business name is required.";
    } else if (businessName.trim().length > 150) {
      errs.businessName = "Business name must not exceed 150 characters.";
    }

    if (!address.trim()) {
      errs.address = "Business address is required.";
    } else if (address.trim().length > 300) {
      errs.address = "Address must not exceed 300 characters.";
    }

    if (!ownerName.trim()) {
      errs.ownerName = "Owner name is required.";
    } else if (ownerName.trim().length > 100) {
      errs.ownerName = "Owner name must not exceed 100 characters.";
    }

    if (selectedCategoryId === "") {
      errs.categoryId = "Please select a business category.";
    }

    if (!ownerIdNumber.trim()) {
      errs.ownerIdNumber = "Owner ID (NIC) number is required.";
    } else {
      const cleanNic = ownerIdNumber.trim();
      const isOldNic = /^[0-9]{9}[vVxX]$/.test(cleanNic);
      const isNewNic = /^[0-9]{12}$/.test(cleanNic);
      if (!isOldNic && !isNewNic && cleanNic.length < 9) {
        errs.ownerIdNumber = "Enter a valid Sri Lankan NIC (e.g. 851234567V or 198512345678).";
      }
    }

    if (!contactNumber.trim()) {
      errs.contactNumber = "Contact number is required.";
    } else {
      const cleanPhone = contactNumber.replace(/[\s-]/g, "");
      const isSriLankanPhone = /^(\+94|0)[0-9]{9}$/.test(cleanPhone);
      if (!isSriLankanPhone) {
        errs.contactNumber = "Enter a valid 10-digit Sri Lankan phone number (e.g. 0712345678).";
      }
    }

    if (selectedCategory && selectedCategory.price === null) {
      if (customPrice.trim() !== "") {
        const val = parseFloat(customPrice);
        if (isNaN(val) || val < 0) {
          errs.price = "Please enter a valid price amount.";
        }
      }
    }

    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!selectedCategory) return;

    const finalPrice =
      selectedCategory.price !== null
        ? selectedCategory.price
        : customPrice.trim() !== ""
        ? parseFloat(customPrice) || 0
        : 0;

    setSubmitting(true);

    try {
      await onSubmit({
        businessName: businessName.trim(),
        address: address.trim(),
        ownerName: ownerName.trim(),
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.englishName,
        categorySinhalaName: selectedCategory.sinhalaName,
        ownerIdNumber: ownerIdNumber.trim(),
        contactNumber: contactNumber.trim(),
        price: finalPrice,
        ward,
        registrationNumber: registrationNumber.trim() || nextRegistrationNumber,
      });
      onClose();
    } catch (err) {
      console.error("Failed to register business:", err);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-business-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1a0000]/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={() => !submitting && onClose()}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-2xl max-h-[92vh] flex flex-col rounded-xl bg-white border border-[#f0e6e5] shadow-[0_12px_40px_rgba(90,0,0,0.22)] my-auto transition-all duration-200"
      >
        {/* ── Modal Header ── */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#f0e6e5] bg-linear-to-r from-[#fcf8f7] to-white rounded-t-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#f0e0df] text-[#5a0000] grid place-items-center text-xl shrink-0 shadow-2xs">
              🏢
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="register-business-title"
                  className="font-serif text-[18px] sm:text-[20px] font-bold text-[#5a0000] leading-tight"
                >
                  Register New Business
                </h3>
                <span className="rounded bg-[#fbbf24]/20 border border-[#fbbf24]/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#5a3a00]">
                  FY {defaultFeeYear}
                </span>
              </div>
              <p className="text-[12px] text-[#8a5a58] mt-0.5">
                Garbage Fee Management • Health Division — Balangoda Urban Council
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="p-1.5 rounded-lg text-[#8a5a58] hover:text-[#5a0000] hover:bg-[#f0e0df] transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* ── Scrollable Form ── */}
        <form
          id="register-business-form"
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
        >
          {/* Section: Business Details */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-1 border-b border-[#f0e6e5]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a5a58]">
                1. Business Identity & Location
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Business Name */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="reg-business-name"
                  className="block text-[12px] font-semibold text-[#5a0000] mb-1"
                >
                  Business Name <span className="text-[#800000]">*</span>
                </label>
                <input
                  ref={firstInputRef}
                  id="reg-business-name"
                  type="text"
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    if (errors.businessName) setErrors((p) => ({ ...p, businessName: undefined }));
                  }}
                  placeholder="e.g. Balangoda Green Supermarket & Bakery"
                  maxLength={150}
                  className={`w-full rounded-lg border ${
                    submitted && errors.businessName
                      ? "border-red-400 focus:ring-red-200"
                      : "border-[#dcc6c4] focus:ring-[#800000]/25"
                  } bg-white px-3.5 py-2 text-sm text-[#4a4a4a] shadow-2xs focus:outline-none focus:ring-2 placeholder:text-[#c0a8a6] transition-colors`}
                  aria-required="true"
                  aria-invalid={submitted && !!errors.businessName}
                  aria-describedby={submitted && errors.businessName ? "reg-biz-name-err" : undefined}
                />
                {submitted && errors.businessName && (
                  <p id="reg-biz-name-err" className="text-[11px] text-red-600 mt-1" role="alert">
                    {errors.businessName}
                  </p>
                )}
              </div>

              {/* Registration Number (Preview/Edit) */}
              <div>
                <label
                  htmlFor="reg-number"
                  className="block text-[12px] font-semibold text-[#5a0000] mb-1"
                >
                  Registration Number
                </label>
                <input
                  id="reg-number"
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="e.g. BAL-BUS-2026-009"
                  className="w-full rounded-lg border border-[#dcc6c4] bg-[#fcf8f7] px-3.5 py-2 font-mono text-xs text-[#5a0000] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#800000]/25"
                />
                <span className="text-[10px] text-[#8a5a58] mt-0.5 block">
                  Auto-assigned council registration reference
                </span>
              </div>

              {/* Ward Selector */}
              <div>
                <label
                  htmlFor="reg-ward"
                  className="block text-[12px] font-semibold text-[#5a0000] mb-1"
                >
                  Municipal Ward <span className="text-[#800000]">*</span>
                </label>
                <select
                  id="reg-ward"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full rounded-lg border border-[#dcc6c4] bg-white px-3.5 py-2 text-sm text-[#5a0000] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#800000]/25 cursor-pointer font-medium"
                >
                  {BALANGODA_WARDS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              {/* Address */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="reg-address"
                  className="block text-[12px] font-semibold text-[#5a0000] mb-1"
                >
                  Business Address <span className="text-[#800000]">*</span>
                </label>
                <textarea
                  id="reg-address"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) setErrors((p) => ({ ...p, address: undefined }));
                  }}
                  rows={2}
                  maxLength={300}
                  placeholder="e.g. No. 48, Main Street, Balangoda, Ratnapura District"
                  className={`w-full rounded-lg border ${
                    submitted && errors.address
                      ? "border-red-400 focus:ring-red-200"
                      : "border-[#dcc6c4] focus:ring-[#800000]/25"
                  } bg-white px-3.5 py-2 text-sm text-[#4a4a4a] shadow-2xs focus:outline-none focus:ring-2 placeholder:text-[#c0a8a6] resize-none transition-colors`}
                  aria-required="true"
                  aria-invalid={submitted && !!errors.address}
                  aria-describedby={submitted && errors.address ? "reg-address-err" : undefined}
                />
                {submitted && errors.address && (
                  <p id="reg-address-err" className="text-[11px] text-red-600 mt-1" role="alert">
                    {errors.address}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Category & Garbage Fee */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-1 border-b border-[#f0e6e5]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a5a58]">
                2. Category & Annual Garbage Collection Fee
              </span>
            </div>

            <div className="space-y-3">
              {/* Category Dropdown */}
              <div>
                <label
                  htmlFor="reg-category"
                  className="block text-[12px] font-semibold text-[#5a0000] mb-1"
                >
                  Business Category (35 Council Standard Categories){" "}
                  <span className="text-[#800000]">*</span>
                </label>
                <select
                  id="reg-category"
                  value={selectedCategoryId}
                  onChange={handleCategoryChange}
                  className={`w-full rounded-lg border ${
                    submitted && errors.categoryId
                      ? "border-red-400 focus:ring-red-200"
                      : "border-[#dcc6c4] focus:ring-[#800000]/25"
                  } bg-white px-3.5 py-2.5 text-sm text-[#5a0000] shadow-2xs focus:outline-none focus:ring-2 cursor-pointer font-medium`}
                  aria-required="true"
                  aria-invalid={submitted && !!errors.categoryId}
                  aria-describedby={submitted && errors.categoryId ? "reg-cat-err" : undefined}
                >
                  <option value="" disabled>
                    -- Select Category / ප්‍රවර්ගය තෝරන්න --
                  </option>
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.id}. {cat.englishName} ({cat.sinhalaName}) —{" "}
                      {cat.price !== null ? `LKR ${cat.formattedPrice}` : "Assessed Rate (—)"}
                    </option>
                  ))}
                </select>
                {submitted && errors.categoryId && (
                  <p id="reg-cat-err" className="text-[11px] text-red-600 mt-1" role="alert">
                    {errors.categoryId}
                  </p>
                )}
              </div>

              {/* Automatic Price Calculation Display Box */}
              {selectedCategory && (
                <div className="rounded-lg border border-[#dcc6c4] bg-linear-to-r from-[#fcf8f7] via-[#f0e0df]/50 to-white p-3.5 transition-all duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#8a5a58] uppercase tracking-wide">
                          Selected Category
                        </span>
                        <span className="rounded-full bg-[#800000]/10 px-2 py-0.5 text-[11px] font-bold text-[#800000]">
                          #{selectedCategory.id}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[#5a0000] mt-0.5">
                        {selectedCategory.englishName}
                      </p>
                      <p className="text-xs text-[#8a5a58]">
                        {selectedCategory.sinhalaName}
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0 bg-white sm:bg-transparent p-2.5 sm:p-0 rounded-md border sm:border-0 border-[#f0e6e5]">
                      <span className="block text-[11px] font-semibold text-[#8a5a58] uppercase tracking-wide">
                        Annual Garbage Fee
                      </span>
                      {selectedCategory.price !== null ? (
                        <div className="flex items-baseline gap-1 sm:justify-end">
                          <span className="font-mono text-lg font-extrabold text-[#5a0000]">
                            {formatLKR(selectedCategory.price)}
                          </span>
                          <span className="rounded bg-[#fbbf24]/30 px-1.5 py-0.5 text-[10px] font-bold text-[#5a3a00]">
                            Auto Standard
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 sm:justify-end">
                          <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
                            Variable Rate (Assessed)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* If variable rate (categories 14-35), allow custom assessment input */}
                  {selectedCategory.price === null && (
                    <div className="mt-3 pt-3 border-t border-[#dcc6c4]/60">
                      <label
                        htmlFor="custom-price"
                        className="block text-[11.5px] font-semibold text-[#5a0000] mb-1"
                      >
                        Assessed Garbage Fee Amount (LKR)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#8a5a58]">LKR</span>
                        <input
                          id="custom-price"
                          type="number"
                          min="0"
                          step="100"
                          value={customPrice}
                          onChange={(e) => {
                            setCustomPrice(e.target.value);
                            if (errors.price) setErrors((p) => ({ ...p, price: undefined }));
                          }}
                          placeholder="Enter assessed amount (or 0 if pending assessment)"
                          className="w-full sm:w-60 rounded-lg border border-[#dcc6c4] bg-white px-3 py-1.5 text-sm text-[#4a4a4a] focus:outline-none focus:ring-2 focus:ring-[#800000]/25 font-mono"
                        />
                      </div>
                      <p className="text-[10.5px] text-[#8a5a58] mt-1">
                        Categories 14–35 are assessed by council health inspectors based on floor area and garbage volume.
                      </p>
                      {submitted && errors.price && (
                        <p className="text-[11px] text-red-600 mt-1" role="alert">
                          {errors.price}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section: Owner & Contact Information */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-1 border-b border-[#f0e6e5]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a5a58]">
                3. Owner & Contact Information
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Owner Name */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="reg-owner-name"
                  className="block text-[12px] font-semibold text-[#5a0000] mb-1"
                >
                  Owner Full Name <span className="text-[#800000]">*</span>
                </label>
                <input
                  id="reg-owner-name"
                  type="text"
                  value={ownerName}
                  onChange={(e) => {
                    setOwnerName(e.target.value);
                    if (errors.ownerName) setErrors((p) => ({ ...p, ownerName: undefined }));
                  }}
                  placeholder="e.g. Sunil K. Perera / සුනිල් කේ. පෙරේරා"
                  maxLength={100}
                  className={`w-full rounded-lg border ${
                    submitted && errors.ownerName
                      ? "border-red-400 focus:ring-red-200"
                      : "border-[#dcc6c4] focus:ring-[#800000]/25"
                  } bg-white px-3.5 py-2 text-sm text-[#4a4a4a] shadow-2xs focus:outline-none focus:ring-2 placeholder:text-[#c0a8a6] transition-colors`}
                  aria-required="true"
                  aria-invalid={submitted && !!errors.ownerName}
                  aria-describedby={submitted && errors.ownerName ? "reg-owner-name-err" : undefined}
                />
                {submitted && errors.ownerName && (
                  <p id="reg-owner-name-err" className="text-[11px] text-red-600 mt-1" role="alert">
                    {errors.ownerName}
                  </p>
                )}
              </div>

              {/* Owner ID Number (NIC) */}
              <div>
                <label
                  htmlFor="reg-owner-id"
                  className="block text-[12px] font-semibold text-[#5a0000] mb-1"
                >
                  Owner ID Number (NIC) <span className="text-[#800000]">*</span>
                </label>
                <input
                  id="reg-owner-id"
                  type="text"
                  value={ownerIdNumber}
                  onChange={(e) => {
                    setOwnerIdNumber(e.target.value);
                    if (errors.ownerIdNumber) setErrors((p) => ({ ...p, ownerIdNumber: undefined }));
                  }}
                  placeholder="e.g. 198512345678 or 851234567V"
                  maxLength={15}
                  className={`w-full rounded-lg border ${
                    submitted && errors.ownerIdNumber
                      ? "border-red-400 focus:ring-red-200"
                      : "border-[#dcc6c4] focus:ring-[#800000]/25"
                  } bg-white px-3.5 py-2 text-sm text-[#4a4a4a] shadow-2xs focus:outline-none focus:ring-2 placeholder:text-[#c0a8a6] transition-colors font-mono`}
                  aria-required="true"
                  aria-invalid={submitted && !!errors.ownerIdNumber}
                  aria-describedby={submitted && errors.ownerIdNumber ? "reg-owner-id-err" : "reg-owner-id-hint"}
                />
                <span id="reg-owner-id-hint" className="text-[10px] text-[#8a5a58] mt-0.5 block">
                  Sri Lankan National Identity Card number
                </span>
                {submitted && errors.ownerIdNumber && (
                  <p id="reg-owner-id-err" className="text-[11px] text-red-600 mt-1" role="alert">
                    {errors.ownerIdNumber}
                  </p>
                )}
              </div>

              {/* Contact Number */}
              <div>
                <label
                  htmlFor="reg-contact"
                  className="block text-[12px] font-semibold text-[#5a0000] mb-1"
                >
                  Contact Number <span className="text-[#800000]">*</span>
                </label>
                <input
                  id="reg-contact"
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => {
                    setContactNumber(e.target.value);
                    if (errors.contactNumber) setErrors((p) => ({ ...p, contactNumber: undefined }));
                  }}
                  placeholder="e.g. 0712345678"
                  maxLength={15}
                  className={`w-full rounded-lg border ${
                    submitted && errors.contactNumber
                      ? "border-red-400 focus:ring-red-200"
                      : "border-[#dcc6c4] focus:ring-[#800000]/25"
                  } bg-white px-3.5 py-2 text-sm text-[#4a4a4a] shadow-2xs focus:outline-none focus:ring-2 placeholder:text-[#c0a8a6] transition-colors font-mono`}
                  aria-required="true"
                  aria-invalid={submitted && !!errors.contactNumber}
                  aria-describedby={submitted && errors.contactNumber ? "reg-contact-err" : "reg-contact-hint"}
                />
                <span id="reg-contact-hint" className="text-[10px] text-[#8a5a58] mt-0.5 block">
                  Sri Lankan phone or mobile (10 digits)
                </span>
                {submitted && errors.contactNumber && (
                  <p id="reg-contact-err" className="text-[11px] text-red-600 mt-1" role="alert">
                    {errors.contactNumber}
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* ── Modal Footer ── */}
        <div className="shrink-0 px-6 py-3.5 border-t border-[#f0e6e5] bg-[#fcf8f7] rounded-b-xl flex items-center justify-between gap-3">
          <span className="text-[11px] text-[#8a5a58] hidden sm:inline">
            <span className="text-[#800000] font-bold">*</span> All marked fields are mandatory for registration
          </span>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={() => !submitting && onClose()}
              disabled={submitting}
              className="px-4 py-2 rounded-lg border border-[#dcc6c4] bg-white text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="register-business-form"
              disabled={submitting}
              className="btn-hover-fx inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#800000] text-xs font-semibold text-white shadow-sm hover:bg-[#5a0000] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span
                    className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin shrink-0"
                    aria-hidden="true"
                  />
                  <span>Registering…</span>
                </>
              ) : (
                <>
                  <span aria-hidden="true">✓</span>
                  <span>Register Business</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
