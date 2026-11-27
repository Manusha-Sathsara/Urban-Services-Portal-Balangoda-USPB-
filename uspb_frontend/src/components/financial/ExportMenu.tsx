"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileDown,
  ChevronDown,
  Printer,
  ShieldCheck,
} from "lucide-react";

export interface ExportMenuProps {
  onExportPdf: () => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
  disabled?: boolean;
}

export function ExportMenu({
  onExportPdf,
  onExportExcel,
  onExportCsv,
  disabled = false,
}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-800 shadow-2xs hover:bg-stone-50 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:ring-offset-1 disabled:opacity-50 transition-colors cursor-pointer"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Download className="h-3.5 w-3.5 text-[#800000]" />
        <span>Export Report</span>
        <ChevronDown className={`h-3 w-3 text-stone-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 z-30 mt-1.5 w-64 origin-top-right rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg ring-1 ring-black/5 focus:outline-none animate-in fade-in-50 zoom-in-95">
          <div className="px-2.5 py-1.5 border-b border-stone-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
              Municipal Export Options
            </span>
            <span className="text-[11px] text-stone-500 block">
              Exports currently filtered data scope
            </span>
          </div>

          <div className="py-1 space-y-0.5">
            {/* 1. PDF Export */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onExportPdf();
              }}
              className="w-full flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-stone-700 hover:bg-[#800000]/5 hover:text-[#800000] transition-colors cursor-pointer group"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-stone-100 text-stone-600 group-hover:bg-[#800000]/10 group-hover:text-[#800000] mt-0.5">
                <Printer className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold block text-stone-900 group-hover:text-[#800000] text-xs">
                  Export as PDF (.pdf)
                </span>
                <span className="text-[10px] text-stone-500 leading-tight block">
                  Official municipal letterhead with audit sign-off
                </span>
              </div>
            </button>

            {/* 2. Excel Export */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onExportExcel();
              }}
              className="w-full flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors cursor-pointer group"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100 mt-0.5">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold block text-stone-900 group-hover:text-emerald-950 text-xs">
                  Export as Excel (.xls)
                </span>
                <span className="text-[10px] text-stone-500 leading-tight block">
                  Multi-sheet workbook (Summary, Schools, Vouchers)
                </span>
              </div>
            </button>

            {/* 3. CSV Export */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onExportCsv();
              }}
              className="w-full flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-stone-700 hover:bg-sky-50 hover:text-sky-900 transition-colors cursor-pointer group"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-700 group-hover:bg-sky-100 mt-0.5">
                <FileDown className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold block text-stone-900 group-hover:text-sky-950 text-xs">
                  Export as CSV (.csv)
                </span>
                <span className="text-[10px] text-stone-500 leading-tight block">
                  Raw tabular records for data analysis & pipelines
                </span>
              </div>
            </button>
          </div>

          <div className="mt-1 border-t border-stone-100 px-2.5 py-1 text-[10px] text-stone-400 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            <span>Strictly filtered to active view</span>
          </div>
        </div>
      )}
    </div>
  );
}
