"use client";

import { BadgeDefinition } from "@/types";
import BadgeStatusBadge from "./BadgeStatusBadge";
import BadgeIconHelper from "./BadgeIconHelper";
import {
  X,
  TrendingUp,
  History,
  Pencil,
  Calendar,
  FileText,
  Clock,
  Users,
  Target,
} from "lucide-react";

interface BadgeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  badge: BadgeDefinition | null;
  onEdit: (badge: BadgeDefinition) => void;
  onReviseThreshold: (badge: BadgeDefinition) => void;
  onViewHistory: (badge: BadgeDefinition) => void;
}

export function BadgeDetailsModal({
  isOpen,
  onClose,
  badge,
  onEdit,
  onReviseThreshold,
  onViewHistory,
}: BadgeDetailsModalProps) {
  if (!isOpen || !badge) return null;

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
      aria-labelledby="badge-details-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60 shadow-2xs">
              <BadgeIconHelper iconName={badge.icon_name} className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="badge-details-title" className="text-base font-bold text-stone-900">
                  {badge.name}
                </h2>
                <BadgeStatusBadge status={badge.status} />
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Badge Code #BDG-{String(badge.id).padStart(4, "0")}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5">
              <span className="flex items-center gap-1.5 text-xs text-stone-500 font-medium mb-1">
                <Target className="h-3.5 w-3.5 text-[#800000]" /> Required Threshold
              </span>
              <span className="text-base font-bold text-[#800000]">
                {badge.milestone_threshold.toFixed(0)}{" "}
                <span className="text-xs font-normal text-stone-600">points</span>
              </span>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5">
              <span className="flex items-center gap-1.5 text-xs text-stone-500 font-medium mb-1">
                <Users className="h-3.5 w-3.5 text-stone-400" /> Students Awarded
              </span>
              <span className="text-base font-bold text-stone-900">
                {badge.award_count || 0}{" "}
                <span className="text-xs font-normal text-stone-500">recipients</span>
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-xl border border-stone-200 bg-white p-3.5">
            <span className="flex items-center gap-1.5 text-xs text-stone-500 font-medium mb-1.5">
              <FileText className="h-3.5 w-3.5 text-stone-400" /> Significance & Criteria
            </span>
            <p className="text-xs text-stone-700 leading-relaxed">
              {badge.description || "No specific merit description recorded."}
            </p>
          </div>

          {/* Metadata */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3 text-xs text-stone-600 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-stone-400 flex items-center gap-1">
                Measurement Basis
              </span>
              <span className="font-medium text-stone-800">
                {badge.eligibility_metric === "available_points"
                  ? "Available Net Points"
                  : "Lifetime Earned Points"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Configured Date
              </span>
              <span className="font-medium text-stone-800">{formatDate(badge.created_at)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Last Record Update
              </span>
              <span className="font-medium text-stone-800">{formatDate(badge.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onViewHistory(badge);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
            >
              <History className="h-3.5 w-3.5" />
              Threshold History
            </button>

            <button
              onClick={() => {
                onClose();
                onReviseThreshold(badge);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Revise Threshold
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(badge);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-stone-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BadgeDetailsModal;
