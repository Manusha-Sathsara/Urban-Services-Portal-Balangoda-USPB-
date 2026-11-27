"use client";

import { useEffect, useState } from "react";
import { CategoryRateHistory, WasteCategory } from "@/types";
import categoryService from "@/services/categoryService";
import { X, History, RotateCcw, ShieldCheck, Clock, User, FileText } from "lucide-react";

interface RateHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: WasteCategory | null;
}

export function RateHistoryModal({
  isOpen,
  onClose,
  category,
}: RateHistoryModalProps) {
  const [history, setHistory] = useState<CategoryRateHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && category) {
      setIsLoading(true);
      setError(null);
      categoryService
        .getRateHistory(category.id)
        .then((records) => {
          setHistory(records);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to load rate history");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, category]);

  if (!isOpen || !category) return null;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Present";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rate-history-modal-title"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="rate-history-modal-title"
                className="text-base font-bold text-stone-900"
              >
                Rate Revision Audit History
              </h2>
              <p className="text-xs text-stone-500">
                {category.name} ({category.measurement_unit})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Audit explanation banner */}
        <div className="mt-4 rounded-lg bg-stone-50 border border-stone-200/80 px-3.5 py-2.5 text-xs text-stone-600 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>
            Chronological audit log of all point adjustments. Every historical
            waste collection retains the point rate that was active when recorded.
          </span>
        </div>

        {/* History List */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center">
              <RotateCcw className="h-6 w-6 animate-spin text-[#800000] mx-auto mb-2" />
              <p className="text-xs text-stone-500">Retrieving rate history audit records...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center text-xs text-red-600 bg-red-50 rounded-xl p-4">
              {error}
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-500">
              No historical rate entries recorded yet.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-0.5 before:bg-stone-200">
              {history.map((record, idx) => {
                const isCurrent = !record.effective_to;
                return (
                  <div key={record.id || idx} className="relative group">
                    {/* Timeline bullet */}
                    <div
                      className={`absolute -left-6 top-2 h-3 w-3 rounded-full border-2 bg-white ${
                        isCurrent
                          ? "border-emerald-600 ring-2 ring-emerald-100"
                          : "border-stone-400"
                      }`}
                    />

                    {/* Rate Record Card */}
                    <div
                      className={`rounded-xl border p-4 transition-all ${
                        isCurrent
                          ? "border-emerald-200 bg-emerald-50/40 shadow-xs"
                          : "border-stone-200 bg-white hover:border-stone-300"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-stone-900">
                            {record.points_per_unit.toFixed(1)}{" "}
                            <span className="text-xs font-normal text-stone-600">
                              pts / {category.measurement_unit}
                            </span>
                          </span>
                          {isCurrent ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                              Current Active Rate
                            </span>
                          ) : (
                            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
                              Archived Rate
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-stone-500">
                          <Clock className="h-3 w-3 text-stone-400" />
                          <span>
                            {formatDate(record.effective_from)} — {formatDate(record.effective_to)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600">
                        <div className="flex items-start gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-stone-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-[11px] text-stone-400 block">Revision Reason</span>
                            <span className="font-medium text-stone-800">
                              {record.reason || "Baseline standard rate"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-1.5">
                          <User className="h-3.5 w-3.5 text-stone-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-[11px] text-stone-400 block">Authorized Officer</span>
                            <span className="font-medium text-stone-800">
                              {record.changed_by || "System Administrator"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-end border-t border-stone-100 pt-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default RateHistoryModal;
