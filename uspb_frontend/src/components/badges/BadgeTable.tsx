"use client";

import { useMemo, useState } from "react";
import { BadgeDefinition } from "@/types";
import BadgeStatusBadge from "./BadgeStatusBadge";
import BadgeIconHelper from "./BadgeIconHelper";
import {
  Search,
  RotateCcw,
  Eye,
  Pencil,
  Pause,
  Play,
  Award,
  History,
  TrendingUp,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";

type SortField = "name" | "milestone_threshold" | "status" | "award_count" | null;
type SortOrder = "asc" | "desc";

interface BadgeTableProps {
  badges: BadgeDefinition[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onViewDetails: (badge: BadgeDefinition) => void;
  onEdit: (badge: BadgeDefinition) => void;
  onReviseThreshold: (badge: BadgeDefinition) => void;
  onViewHistory: (badge: BadgeDefinition) => void;
  onToggleStatus: (badge: BadgeDefinition) => void;
  onRefresh: () => void;
  onResetFilters?: () => void;
}

export function BadgeTable({
  badges,
  isLoading,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  onViewDetails,
  onEdit,
  onReviseThreshold,
  onViewHistory,
  onToggleStatus,
  onRefresh,
  onResetFilters,
}: BadgeTableProps) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else {
        setSortField(null);
        setSortOrder("asc");
      }
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedBadges = useMemo(() => {
    if (!sortField) return badges;
    return [...badges].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      if (sortField === "milestone_threshold") {
        aVal = a.milestone_threshold;
        bVal = b.milestone_threshold;
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }

      if (sortField === "award_count") {
        aVal = a.award_count || 0;
        bVal = b.award_count || 0;
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }

      aVal = a[sortField] || "";
      bVal = b[sortField] || "";
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [badges, sortField, sortOrder]);

  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "all";

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="flex flex-col gap-3 border-b border-stone-200 bg-stone-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span
            className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400 pointer-events-none"
            aria-hidden="true"
          >
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by badge name or description..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-9 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-stone-400 hover:text-stone-600 transition-colors"
              title="Clear search"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs & Refresh */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-stone-200 bg-stone-100 p-0.5 text-xs font-medium">
            <button
              onClick={() => onStatusFilterChange("all")}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                statusFilter === "all"
                  ? "bg-white text-stone-900 shadow-xs font-semibold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              All Badges
            </button>
            <button
              onClick={() => onStatusFilterChange("active")}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                statusFilter === "active"
                  ? "bg-white text-emerald-800 shadow-xs font-semibold"
                  : "text-stone-600 hover:text-emerald-700"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => onStatusFilterChange("inactive")}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                statusFilter === "inactive"
                  ? "bg-white text-amber-800 shadow-xs font-semibold"
                  : "text-stone-600 hover:text-amber-700"
              }`}
            >
              Inactive
            </button>
          </div>

          <button
            onClick={onRefresh}
            title="Refresh badges"
            className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white p-2 text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
          >
            <RotateCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Active Filter Bar */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between bg-stone-50/80 px-4 py-2 border-b border-stone-200 text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <span>Filtering by:</span>
            {search.trim() && (
              <span className="inline-flex items-center gap-1 rounded bg-stone-200 px-2 py-0.5 text-stone-800 font-medium">
                Keyword: &ldquo;{search.trim()}&rdquo;
              </span>
            )}
            {statusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded bg-stone-200 px-2 py-0.5 text-stone-800 font-medium capitalize">
                Status: {statusFilter}
              </span>
            )}
          </div>
          {onResetFilters && (
            <button
              onClick={onResetFilters}
              className="text-[#800000] hover:underline font-medium"
            >
              Reset filters
            </button>
          )}
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-stone-600">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs font-medium uppercase tracking-wider text-stone-600">
            <tr>
              <th
                scope="col"
                className="cursor-pointer select-none px-4 py-3 hover:text-stone-900 transition-colors"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Badge Name & Icon</span>
                  {sortField === "name" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="h-3.5 w-3.5 text-[#800000]" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5 text-[#800000]" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-stone-400" />
                  )}
                </div>
              </th>

              <th
                scope="col"
                className="cursor-pointer select-none px-4 py-3 hover:text-stone-900 transition-colors"
                onClick={() => handleSort("milestone_threshold")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Required Milestone</span>
                  {sortField === "milestone_threshold" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="h-3.5 w-3.5 text-[#800000]" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5 text-[#800000]" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-stone-400" />
                  )}
                </div>
              </th>

              <th scope="col" className="px-4 py-3">
                Measurement Basis
              </th>

              <th
                scope="col"
                className="cursor-pointer select-none px-4 py-3 hover:text-stone-900 transition-colors"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  {sortField === "status" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="h-3.5 w-3.5 text-[#800000]" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5 text-[#800000]" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-stone-400" />
                  )}
                </div>
              </th>

              <th
                scope="col"
                className="cursor-pointer select-none px-4 py-3 hover:text-stone-900 transition-colors"
                onClick={() => handleSort("award_count")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Students Awarded</span>
                  {sortField === "award_count" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="h-3.5 w-3.5 text-[#800000]" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5 text-[#800000]" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-stone-400" />
                  )}
                </div>
              </th>

              <th scope="col" className="px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100 bg-white">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-stone-200" />
                      <div>
                        <div className="h-4 w-32 rounded bg-stone-200 mb-1" />
                        <div className="h-3 w-48 rounded bg-stone-100" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-4 w-20 rounded bg-stone-200" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-4 w-28 rounded bg-stone-100" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-5 w-16 rounded-full bg-stone-100" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-4 w-12 rounded bg-stone-100" />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="h-7 w-28 rounded bg-stone-100 ml-auto" />
                  </td>
                </tr>
              ))
            ) : sortedBadges.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 mb-3">
                    <Award className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-stone-900 mb-1">
                    No badges found
                  </h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
                    {hasActiveFilters
                      ? "No badges match your current search and status filter criteria."
                      : "No badge milestones configured yet. Click 'Create New Badge' to define one."}
                  </p>
                  {hasActiveFilters && onResetFilters && (
                    <button
                      onClick={onResetFilters}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs"
                    >
                      Clear active filters
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              sortedBadges.map((badge) => (
                <tr
                  key={badge.id}
                  className="hover:bg-stone-50/70 transition-colors group"
                >
                  {/* Badge Name & Icon */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60 shadow-2xs">
                        <BadgeIconHelper iconName={badge.icon_name} className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-stone-900 group-hover:text-[#800000] transition-colors">
                          {badge.name}
                        </div>
                        {badge.description && (
                          <div className="text-xs text-stone-500 line-clamp-1 mt-0.5 max-w-md">
                            {badge.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Required Milestone */}
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-bold text-stone-900">
                      {badge.milestone_threshold.toFixed(0)}{" "}
                      <span className="text-xs font-normal text-stone-500">pts</span>
                    </span>
                  </td>

                  {/* Measurement Basis */}
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center rounded-md bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
                      {badge.eligibility_metric === "available_points"
                        ? "Available Points"
                        : "Lifetime Earned Points"}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <BadgeStatusBadge status={badge.status} />
                  </td>

                  {/* Award Count */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-stone-700">
                      <Users className="h-3.5 w-3.5 text-stone-400" />
                      <span>{badge.award_count || 0} students</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1 justify-end">
                      {/* View Details */}
                      <button
                        onClick={() => onViewDetails(badge)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                        title="View badge details"
                        aria-label={`View details for ${badge.name}`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Edit Metadata */}
                      <button
                        onClick={() => onEdit(badge)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit badge information"
                        aria-label={`Edit ${badge.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      {/* Revise Threshold */}
                      <button
                        onClick={() => onReviseThreshold(badge)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                        title="Revise milestone threshold"
                        aria-label={`Revise milestone for ${badge.name}`}
                      >
                        <TrendingUp className="h-4 w-4" />
                      </button>

                      {/* Threshold History */}
                      <button
                        onClick={() => onViewHistory(badge)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                        title="View threshold revision history"
                        aria-label={`View threshold history for ${badge.name}`}
                      >
                        <History className="h-4 w-4" />
                      </button>

                      {/* Activate / Deactivate */}
                      <button
                        onClick={() => onToggleStatus(badge)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          badge.status === "active"
                            ? "text-stone-500 hover:text-amber-600 hover:bg-amber-50"
                            : "text-stone-500 hover:text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title={
                          badge.status === "active"
                            ? "Deactivate badge"
                            : "Activate badge"
                        }
                        aria-label={
                          badge.status === "active"
                            ? `Deactivate ${badge.name}`
                            : `Activate ${badge.name}`
                        }
                      >
                        {badge.status === "active" ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-200 bg-stone-50/60 px-4 py-3 text-xs text-stone-600">
        <div>
          Showing{" "}
          <span className="font-semibold text-stone-900">
            {badges.length > 0 ? (currentPage - 1) * 10 + 1 : 0}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-stone-900">
            {Math.min(currentPage * 10, totalCount)}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-stone-900">{totalCount}</span>{" "}
          badges
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>

          <span className="px-2 font-medium text-stone-700">
            Page {currentPage} of {Math.max(1, totalPages)}
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default BadgeTable;
