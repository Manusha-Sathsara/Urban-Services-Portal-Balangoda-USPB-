"use client";

import { useEffect, useRef } from "react";
import { formatLKR } from "@/lib/businessCategories";

export interface ReportBusinessItem {
  businessId: string;
  registrationNumber: string;
  businessName: string;
  ownerName: string;
  ownerIdNumber?: string;
  address: string;
  contactNumber: string;
  businessType: string;
  categorySinhalaName?: string;
  feeYear: number;
  amount: number;
  paymentStatus: "paid" | "unpaid";
  paymentDate?: string;
  businessStatus: "active" | "inactive";
  receiptNumber?: string;
  notes?: string;
}

interface AnnualPaymentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  records: ReportBusinessItem[];
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

export function AnnualPaymentReportModal({
  isOpen,
  onClose,
  year,
  records,
}: AnnualPaymentReportModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Split records into Paid and Unpaid separately
  const paidRecords = records.filter((r) => r.paymentStatus === "paid");
  const unpaidRecords = records.filter((r) => r.paymentStatus === "unpaid");

  const totalCollected = paidRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalOutstanding = unpaidRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalAssessment = totalCollected + totalOutstanding;
  const collectionRate =
    totalAssessment > 0 ? ((totalCollected / totalAssessment) * 100).toFixed(1) : "0.0";

  const generatedDateStr = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=1200,height=850");
    if (!printWindow) {
      alert("Please allow popups to export the PDF report.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Annual_Payment_Report_FY${year}_Balangoda_UC</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm 12mm 12mm 12mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #2a2a2a;
            background: #ffffff;
            margin: 0;
            padding: 10px;
            font-size: 11px;
            line-height: 1.4;
          }
          .header {
            border-bottom: 2.5px solid #5a0000;
            padding-bottom: 10px;
            margin-bottom: 12px;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
          }
          .title-area h1 {
            margin: 0;
            font-size: 18px;
            color: #5a0000;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 800;
          }
          .title-area h2 {
            margin: 2px 0 0 0;
            font-size: 13px;
            color: #800000;
            font-weight: 600;
          }
          .title-area p {
            margin: 3px 0 0 0;
            font-size: 10.5px;
            color: #555555;
          }
          .meta-box {
            text-align: right;
            font-size: 10px;
            color: #444444;
          }
          .meta-box strong {
            color: #5a0000;
          }
          .summary-strip {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
            margin-bottom: 16px;
          }
          .summary-card {
            background-color: #fcf8f7;
            border: 1px solid #dcc6c4;
            border-radius: 4px;
            padding: 8px 10px;
            text-align: center;
          }
          .summary-card.highlight {
            background-color: #fbf5f4;
            border-color: #800000;
          }
          .summary-card .label {
            font-size: 9.5px;
            text-transform: uppercase;
            font-weight: 700;
            color: #8a5a58;
            margin-bottom: 3px;
          }
          .summary-card .value {
            font-size: 13.5px;
            font-weight: 800;
            color: #5a0000;
            font-family: monospace;
          }
          .section-title {
            background-color: #5a0000;
            color: #ffffff;
            padding: 6px 10px;
            font-size: 11.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-radius: 3px;
            margin: 16px 0 6px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .section-title.unpaid {
            background-color: #800000;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            font-size: 10px;
          }
          th {
            background-color: #f7edec;
            color: #5a0000;
            font-weight: 700;
            text-transform: uppercase;
            padding: 5px 6px;
            border: 1px solid #e5d2d0;
            text-align: left;
            font-size: 9px;
            letter-spacing: 0.3px;
          }
          td {
            padding: 4.5px 6px;
            border: 1px solid #e5d2d0;
            vertical-align: top;
          }
          tr:nth-child(even) td {
            background-color: #faf7f7;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .font-mono {
            font-family: monospace;
          }
          .badge-paid {
            display: inline-block;
            background-color: #e6f4ea;
            color: #137333;
            padding: 1px 5px;
            border-radius: 3px;
            font-weight: 700;
            font-size: 9px;
          }
          .badge-unpaid {
            display: inline-block;
            background-color: #fef7e0;
            color: #b06000;
            padding: 1px 5px;
            border-radius: 3px;
            font-weight: 700;
            font-size: 9px;
          }
          .subtotal-row td {
            background-color: #f0e0df !important;
            font-weight: 800;
            color: #5a0000;
            border-top: 2px solid #5a0000;
          }
          .signatures {
            margin-top: 25px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            page-break-inside: avoid;
          }
          .sig-box {
            border-top: 1px dashed #8a5a58;
            padding-top: 6px;
            text-align: center;
            font-size: 9.5px;
            color: #444444;
          }
          .sig-box strong {
            display: block;
            color: #5a0000;
            font-size: 10px;
          }
          .footer-note {
            margin-top: 15px;
            border-top: 1px solid #dcc6c4;
            padding-top: 6px;
            font-size: 8.5px;
            color: #777777;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <div class="title-area">
            <h1>Balangoda Urban Council • බලන්ගොඩ නගර සභාව</h1>
            <h2>Annual Garbage Collection Fee Assessment & Payment Report</h2>
            <p>Health Division & Solid Waste Management Service • Fiscal Year <strong>FY ${year}</strong></p>
          </div>
          <div class="meta-box">
            <div><strong>Report ID:</strong> BUC/HMD/GF-REP/${year}</div>
            <div><strong>Generated:</strong> ${generatedDateStr}</div>
            <div><strong>Total Scope:</strong> ${records.length} Registered Businesses</div>
          </div>
        </div>

        <!-- Executive Summary Cards -->
        <div class="summary-strip">
          <div class="summary-card">
            <div class="label">Total Businesses</div>
            <div class="value">${records.length}</div>
          </div>
          <div class="summary-card">
            <div class="label">Paid Businesses</div>
            <div class="value" style="color: #137333;">${paidRecords.length}</div>
          </div>
          <div class="summary-card">
            <div class="label">Unpaid Businesses</div>
            <div class="value" style="color: #b06000;">${unpaidRecords.length}</div>
          </div>
          <div class="summary-card highlight">
            <div class="label">Total Fee Collected</div>
            <div class="value">${formatLKR(totalCollected)}</div>
          </div>
          <div class="summary-card highlight">
            <div class="label">Total Outstanding</div>
            <div class="value" style="color: #800000;">${formatLKR(totalOutstanding)}</div>
          </div>
        </div>

        <!-- 1. PAID BUSINESSES SECTION -->
        <div class="section-title">
          <span>Part 1: Paid Businesses / ගෙවීම් සම්පූර්ණ කළ ව්‍යාපාර (${paidRecords.length})</span>
          <span>Subtotal: ${formatLKR(totalCollected)}</span>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 25px;" class="text-center">#</th>
              <th style="width: 105px;">Reg. Number</th>
              <th style="width: 170px;">Business Name & Category</th>
              <th style="width: 140px;">Owner & NIC Number</th>
              <th style="width: 180px;">Business Address</th>
              <th style="width: 95px;">Contact Number</th>
              <th style="width: 85px;" class="text-right">Fee (LKR)</th>
              <th style="width: 100px;">Payment Date & Ref</th>
            </tr>
          </thead>
          <tbody>
            ${
              paidRecords.length === 0
                ? `<tr><td colspan="8" class="text-center" style="padding: 15px; color: #777;">No paid business records for FY ${year}.</td></tr>`
                : paidRecords
                    .map(
                      (r, idx) => `
              <tr>
                <td class="text-center font-mono">${idx + 1}</td>
                <td class="font-mono"><strong>${r.registrationNumber}</strong></td>
                <td>
                  <strong>${r.businessName}</strong>
                  <div style="font-size: 8.5px; color: #666;">${r.businessType}</div>
                </td>
                <td>
                  ${r.ownerName}
                  ${
                    r.ownerIdNumber
                      ? `<div style="font-size: 8.5px; color: #5a0000; font-family: monospace;">NIC: ${r.ownerIdNumber}</div>`
                      : ""
                  }
                </td>
                <td style="font-size: 9px;">${r.address || "—"}</td>
                <td class="font-mono">${r.contactNumber || "—"}</td>
                <td class="text-right font-mono"><strong>${formatLKR(r.amount)}</strong></td>
                <td>
                  <div>${formatDate(r.paymentDate)}</div>
                  ${
                    r.receiptNumber
                      ? `<div style="font-size: 8px; color: #5a0000; font-family: monospace;">Rec: ${r.receiptNumber}</div>`
                      : ""
                  }
                </td>
              </tr>
            `
                    )
                    .join("")
            }
            <tr class="subtotal-row">
              <td colspan="6" class="text-right">PAID BUSINESSES SUBTOTAL (${paidRecords.length} Businesses):</td>
              <td class="text-right font-mono">${formatLKR(totalCollected)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <!-- 2. UNPAID BUSINESSES SECTION -->
        <div class="section-title unpaid">
          <span>Part 2: Unpaid / Outstanding Businesses / ගෙවීම් නොකළ ව්‍යාපාර (${unpaidRecords.length})</span>
          <span>Outstanding Subtotal: ${formatLKR(totalOutstanding)}</span>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 25px;" class="text-center">#</th>
              <th style="width: 105px;">Reg. Number</th>
              <th style="width: 170px;">Business Name & Category</th>
              <th style="width: 140px;">Owner & NIC Number</th>
              <th style="width: 180px;">Business Address</th>
              <th style="width: 95px;">Contact Number</th>
              <th style="width: 85px;" class="text-right">Outstanding (LKR)</th>
              <th style="width: 100px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${
              unpaidRecords.length === 0
                ? `<tr><td colspan="8" class="text-center" style="padding: 15px; color: #777;">All businesses have settled their dues for FY ${year}.</td></tr>`
                : unpaidRecords
                    .map(
                      (r, idx) => `
              <tr>
                <td class="text-center font-mono">${idx + 1}</td>
                <td class="font-mono"><strong>${r.registrationNumber}</strong></td>
                <td>
                  <strong>${r.businessName}</strong>
                  <div style="font-size: 8.5px; color: #666;">${r.businessType}</div>
                </td>
                <td>
                  ${r.ownerName}
                  ${
                    r.ownerIdNumber
                      ? `<div style="font-size: 8.5px; color: #5a0000; font-family: monospace;">NIC: ${r.ownerIdNumber}</div>`
                      : ""
                  }
                </td>
                <td style="font-size: 9px;">${r.address || "—"}</td>
                <td class="font-mono">${r.contactNumber || "—"}</td>
                <td class="text-right font-mono" style="color: #800000;"><strong>${formatLKR(r.amount)}</strong></td>
                <td><span class="badge-unpaid">UNPAID (Pending)</span></td>
              </tr>
            `
                    )
                    .join("")
            }
            <tr class="subtotal-row">
              <td colspan="6" class="text-right">OUTSTANDING ARREARS SUBTOTAL (${unpaidRecords.length} Businesses):</td>
              <td class="text-right font-mono" style="color: #800000;">${formatLKR(totalOutstanding)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <!-- Signatures Block -->
        <div class="signatures">
          <div class="sig-box">
            <div style="height: 35px;"></div>
            <strong>Revenue Collection Officer</strong>
            Health Division — Balangoda Urban Council
          </div>
          <div class="sig-box">
            <div style="height: 35px;"></div>
            <strong>Chief Public Health Inspector (PHI)</strong>
            Supervising Officer
          </div>
          <div class="sig-box">
            <div style="height: 35px;"></div>
            <strong>Municipal Commissioner / Secretary</strong>
            Balangoda Urban Council (Official Seal)
          </div>
        </div>

        <!-- Footer -->
        <div class="footer-note">
          <span>Official Document • Urban Services Portal Balangoda (USPB)</span>
          <span>Collection Rate: ${collectionRate}% • Generated on: ${generatedDateStr}</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1a0000]/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Window */}
      <div className="relative z-10 w-full max-w-5xl max-h-[94vh] flex flex-col rounded-xl bg-white border border-[#f0e6e5] shadow-[0_16px_48px_rgba(90,0,0,0.25)] my-auto overflow-hidden">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-b border-[#f0e6e5] bg-[#fcf8f7] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#800000] text-white flex items-center justify-center text-lg font-bold shadow-2xs">
              📄
            </div>
            <div>
              <h3
                id="report-modal-title"
                className="font-serif text-[17px] sm:text-[18px] font-bold text-[#5a0000] leading-tight"
              >
                Annual Payment Compliance Report — FY {year}
              </h3>
              <p className="text-[11.5px] text-[#8a5a58]">
                Official PDF report preview with separate Paid and Unpaid business schedules
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-hover-fx inline-flex items-center gap-2 rounded-lg bg-[#800000] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#5a0000] transition-colors cursor-pointer"
            >
              <span aria-hidden="true">🖨️</span> Print / Save as PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#dcc6c4] bg-white px-3 py-2 text-xs font-semibold text-[#5a0000] hover:bg-[#f0e0df] transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Scrollable Report Document Body (A4 styled layout) */}
        <div className="flex-1 overflow-y-auto bg-[#e5dfde] p-4 sm:p-6">
          <div
            ref={printAreaRef}
            className="max-w-[980px] mx-auto bg-white rounded-lg shadow-md p-6 sm:p-8 text-[#2a2a2a] border border-[#dcc6c4]"
          >
            {/* Document Header */}
            <div className="border-b-2 border-[#5a0000] pb-4 mb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#800000] uppercase block">
                  Democratic Socialist Republic of Sri Lanka
                </span>
                <h1 className="font-serif text-[20px] sm:text-[22px] font-bold text-[#5a0000] leading-snug">
                  Balangoda Urban Council • බලන්ගොඩ නගර සභාව
                </h1>
                <h2 className="text-[13.5px] font-semibold text-[#800000] mt-0.5">
                  Annual Garbage Collection Fee Assessment & Payment Report
                </h2>
                <p className="text-[11.5px] text-[#8a5a58] mt-1">
                  Health Division & Municipal Solid Waste Management Service • Assessment Year: <strong>FY {year}</strong>
                </p>
              </div>

              <div className="text-left sm:text-right bg-[#fcf8f7] border border-[#dcc6c4] rounded-lg p-2.5 sm:min-w-[200px]">
                <div className="text-[10.5px] text-[#8a5a58]">
                  Report ID: <span className="font-mono font-bold text-[#5a0000]">BUC/HMD/GF-REP/{year}</span>
                </div>
                <div className="text-[10.5px] text-[#8a5a58] mt-0.5">
                  Generated: <span className="font-medium text-[#4a4a4a]">{generatedDateStr}</span>
                </div>
                <div className="text-[10.5px] text-[#8a5a58] mt-0.5">
                  Total Businesses: <span className="font-bold text-[#5a0000]">{records.length}</span>
                </div>
              </div>
            </div>

            {/* Executive Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              <div className="rounded-lg border border-[#dcc6c4] bg-[#fcf8f7] p-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a5a58] block">
                  Total Businesses
                </span>
                <span className="font-mono text-base font-extrabold text-[#5a0000] mt-1 block">
                  {records.length}
                </span>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Paid Businesses
                </span>
                <span className="font-mono text-base font-extrabold text-emerald-700 mt-1 block">
                  {paidRecords.length}
                </span>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  Unpaid Businesses
                </span>
                <span className="font-mono text-base font-extrabold text-amber-700 mt-1 block">
                  {unpaidRecords.length}
                </span>
              </div>
              <div className="rounded-lg border border-[#800000]/30 bg-[#fbf5f4] p-3 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a5a58] block">
                  Total Collected
                </span>
                <span className="font-mono text-xs font-bold text-[#5a0000] mt-1 block">
                  {formatLKR(totalCollected)}
                </span>
              </div>
              <div className="rounded-lg border border-[#800000]/30 bg-[#fbf5f4] p-3 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a5a58] block">
                  Total Outstanding
                </span>
                <span className="font-mono text-xs font-bold text-[#800000] mt-1 block">
                  {formatLKR(totalOutstanding)}
                </span>
              </div>
            </div>

            {/* ── PART 1: PAID BUSINESSES SCHEDULE ────────────────────────── */}
            <div className="mb-6">
              <div className="rounded-t-lg bg-[#5a0000] text-white px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tracking-wide">
                    PART 1: PAID BUSINESSES / ගෙවීම් සම්පූර්ණ කළ ව්‍යාපාර
                  </span>
                  <span className="rounded bg-white/20 px-2 py-0.5 text-[11px] font-bold">
                    {paidRecords.length} Businesses
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-white/90">
                  Subtotal: {formatLKR(totalCollected)}
                </span>
              </div>

              <div className="overflow-x-auto border-x border-b border-[#e5d2d0] rounded-b-lg">
                <table className="min-w-full text-left text-xs divide-y divide-[#e5d2d0]">
                  <thead className="bg-[#f7edec] text-[10px] font-bold uppercase text-[#5a0000]">
                    <tr>
                      <th className="px-3 py-2 text-center w-8">#</th>
                      <th className="px-3 py-2 whitespace-nowrap">Reg. Number</th>
                      <th className="px-3 py-2">Business Name & Category</th>
                      <th className="px-3 py-2">Owner & NIC</th>
                      <th className="px-3 py-2">Business Address</th>
                      <th className="px-3 py-2 whitespace-nowrap">Contact</th>
                      <th className="px-3 py-2 text-right whitespace-nowrap">Fee (LKR)</th>
                      <th className="px-3 py-2 whitespace-nowrap">Payment Info</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5d2d0] text-[#333333]">
                    {paidRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-6 text-center text-xs text-[#8a5a58]">
                          No businesses have paid for FY {year} yet.
                        </td>
                      </tr>
                    ) : (
                      paidRecords.map((r, i) => (
                        <tr key={r.businessId} className="hover:bg-[#faf7f7] transition-colors">
                          <td className="px-3 py-2 text-center font-mono text-[10.5px]">{i + 1}</td>
                          <td className="px-3 py-2 font-mono text-[11px] font-bold text-[#5a0000] whitespace-nowrap">
                            {r.registrationNumber}
                          </td>
                          <td className="px-3 py-2">
                            <span className="font-bold text-[#5a0000] block text-[12px]">
                              {r.businessName}
                            </span>
                            <span className="text-[10px] text-[#8a5a58] block">
                              {r.businessType}
                              {r.categorySinhalaName && ` • ${r.categorySinhalaName}`}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span className="font-medium text-[#222222] block">{r.ownerName}</span>
                            {r.ownerIdNumber && (
                              <span className="font-mono text-[10px] text-[#5a0000] block">
                                NIC: {r.ownerIdNumber}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-[11px] max-w-[200px] leading-tight text-[#444444]">
                            {r.address || "—"}
                          </td>
                          <td className="px-3 py-2 font-mono text-[11px] whitespace-nowrap">
                            {r.contactNumber || "—"}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-[11.5px] text-[#5a0000] whitespace-nowrap">
                            {formatLKR(r.amount)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="text-[11px] font-medium block">
                              {formatDate(r.paymentDate)}
                            </span>
                            {r.receiptNumber && (
                              <span className="font-mono text-[9.5px] text-[#8a5a58] block">
                                Rec: {r.receiptNumber}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                    {/* Subtotal */}
                    <tr className="bg-[#f0e0df] font-bold text-[#5a0000]">
                      <td colSpan={6} className="px-3 py-2 text-right text-xs uppercase tracking-wide">
                        Paid Businesses Subtotal ({paidRecords.length} Businesses):
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs">
                        {formatLKR(totalCollected)}
                      </td>
                      <td className="px-3 py-2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── PART 2: UNPAID BUSINESSES SCHEDULE ──────────────────────── */}
            <div className="mb-6">
              <div className="rounded-t-lg bg-[#800000] text-white px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tracking-wide">
                    PART 2: UNPAID / OUTSTANDING BUSINESSES / ගෙවීම් නොකළ ව්‍යාපාර
                  </span>
                  <span className="rounded bg-white/20 px-2 py-0.5 text-[11px] font-bold">
                    {unpaidRecords.length} Businesses
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-white/90">
                  Outstanding: {formatLKR(totalOutstanding)}
                </span>
              </div>

              <div className="overflow-x-auto border-x border-b border-[#e5d2d0] rounded-b-lg">
                <table className="min-w-full text-left text-xs divide-y divide-[#e5d2d0]">
                  <thead className="bg-[#f7edec] text-[10px] font-bold uppercase text-[#800000]">
                    <tr>
                      <th className="px-3 py-2 text-center w-8">#</th>
                      <th className="px-3 py-2 whitespace-nowrap">Reg. Number</th>
                      <th className="px-3 py-2">Business Name & Category</th>
                      <th className="px-3 py-2">Owner & NIC</th>
                      <th className="px-3 py-2">Business Address</th>
                      <th className="px-3 py-2 whitespace-nowrap">Contact</th>
                      <th className="px-3 py-2 text-right whitespace-nowrap">Outstanding (LKR)</th>
                      <th className="px-3 py-2 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5d2d0] text-[#333333]">
                    {unpaidRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-6 text-center text-xs text-emerald-700">
                          ✓ All registered businesses have settled their garbage fees for FY {year}!
                        </td>
                      </tr>
                    ) : (
                      unpaidRecords.map((r, i) => (
                        <tr key={r.businessId} className="hover:bg-[#faf7f7] transition-colors">
                          <td className="px-3 py-2 text-center font-mono text-[10.5px]">{i + 1}</td>
                          <td className="px-3 py-2 font-mono text-[11px] font-bold text-[#5a0000] whitespace-nowrap">
                            {r.registrationNumber}
                          </td>
                          <td className="px-3 py-2">
                            <span className="font-bold text-[#5a0000] block text-[12px]">
                              {r.businessName}
                            </span>
                            <span className="text-[10px] text-[#8a5a58] block">
                              {r.businessType}
                              {r.categorySinhalaName && ` • ${r.categorySinhalaName}`}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span className="font-medium text-[#222222] block">{r.ownerName}</span>
                            {r.ownerIdNumber && (
                              <span className="font-mono text-[10px] text-[#5a0000] block">
                                NIC: {r.ownerIdNumber}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-[11px] max-w-[200px] leading-tight text-[#444444]">
                            {r.address || "—"}
                          </td>
                          <td className="px-3 py-2 font-mono text-[11px] whitespace-nowrap">
                            {r.contactNumber || "—"}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-[11.5px] text-[#800000] whitespace-nowrap">
                            {formatLKR(r.amount)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="rounded bg-amber-50 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              UNPAID
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                    {/* Subtotal */}
                    <tr className="bg-[#f0e0df] font-bold text-[#800000]">
                      <td colSpan={6} className="px-3 py-2 text-right text-xs uppercase tracking-wide">
                        Outstanding Arrears Subtotal ({unpaidRecords.length} Businesses):
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs">
                        {formatLKR(totalOutstanding)}
                      </td>
                      <td className="px-3 py-2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Official Signatures Block */}
            <div className="mt-8 pt-4 border-t border-[#dcc6c4] grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="border-t border-dashed border-[#8a5a58] pt-2 text-center text-xs text-[#555555]">
                <div className="h-10"></div>
                <strong className="text-[#5a0000] block">Revenue Collection Officer</strong>
                Health Division — Balangoda Urban Council
              </div>
              <div className="border-t border-dashed border-[#8a5a58] pt-2 text-center text-xs text-[#555555]">
                <div className="h-10"></div>
                <strong className="text-[#5a0000] block">Chief Public Health Inspector (PHI)</strong>
                Supervising Public Health Department
              </div>
              <div className="border-t border-dashed border-[#8a5a58] pt-2 text-center text-xs text-[#555555]">
                <div className="h-10"></div>
                <strong className="text-[#5a0000] block">Municipal Commissioner / Secretary</strong>
                Balangoda Urban Council (Official Seal)
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-3 border-t border-[#f0e6e5] text-[10px] text-[#8a5a58] flex flex-wrap justify-between items-center gap-2">
              <span>Urban Services Portal Balangoda (USPB) • Official Municipal Document</span>
              <span>Overall Fee Recovery Rate: <strong>{collectionRate}%</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
