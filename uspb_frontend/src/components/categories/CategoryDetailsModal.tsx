"use client";

import { WasteCategory } from "@/types";
import CategoryStatusBadge from "./CategoryStatusBadge";
import {
  X,
  Recycle,
  Scale,
  TrendingUp,
  History,
  Pencil,
  Calendar,
  FileText,
  Clock,
} from "lucide-react";

interface CategoryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: WasteCategory | null;
  onEdit: (category: WasteCategory) => void;
  onReviseRate: (category: WasteCategory) => void;
  onViewHistory: (category: WasteCategory) => void;
}

export function CategoryDetailsModal({
  isOpen,
  onClose,
  category,
  onEdit,
  onReviseRate,
  onViewHistory,
}: CategoryDetailsModalProps) {
  if (!isOpen || !category) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
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
      aria-labelledby="category-details-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#800000]">
              <Recycle className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="category-details-title"
                  className="text-base font-bold text-stone-900"
                >
                  {category.name}
                </h2>
                <CategoryStatusBadge status={category.status} />
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Category Code #CAT-{String(category.id).padStart(4, "0")}
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

        {/* Content Details */}
        <div className="mt-4 space-y-4">
          {/* Rate & Unit Highlight */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5">
              <span className="flex items-center gap-1.5 text-xs text-stone-500 font-medium mb-1">
                <Scale className="h-3.5 w-3.5 text-stone-400" /> Measurement Unit
              </span>
              <span className="text-sm font-bold text-stone-900 capitalize">
                {category.measurement_unit}
              </span>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5">
              <span className="flex items-center gap-1.5 text-xs text-stone-500 font-medium mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-[#800000]" /> Current Points Rate
              </span>
              <span className="text-base font-bold text-[#800000]">
                {category.current_points_per_unit.toFixed(1)}{" "}
                <span className="text-xs font-normal text-stone-600">
                  pts / {category.measurement_unit}
                </span>
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-xl border border-stone-200 bg-white p-3.5">
            <span className="flex items-center gap-1.5 text-xs text-stone-500 font-medium mb-1.5">
              <FileText className="h-3.5 w-3.5 text-stone-400" /> Sorting & Collection Guidance
            </span>
            <p className="text-xs text-stone-700 leading-relaxed">
              {category.description || "No specific collection guidelines recorded."}
            </p>
          </div>

          {/* Metadata Timestamps */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3 text-xs text-stone-600 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-stone-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Registered Date
              </span>
              <span className="font-medium text-stone-800">{formatDate(category.created_at)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Last Record Update
              </span>
              <span className="font-medium text-stone-800">{formatDate(category.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onViewHistory(category);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-50 transition-colors"
            >
              <History className="h-3.5 w-3.5" />
              Rate History
            </button>

            <button
              onClick={() => {
                onClose();
                onReviseRate(category);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-50 transition-colors"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Revise Rate
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(category);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-stone-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategoryDetailsModal;
