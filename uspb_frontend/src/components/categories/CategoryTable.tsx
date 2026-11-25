"use client";

import { useMemo, useState } from "react";
import { WasteCategory } from "@/types";
import CategoryStatusBadge from "./CategoryStatusBadge";
import {
  Search,
  RotateCcw,
  Eye,
  Pencil,
  Pause,
  Play,
  Recycle,
  History,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";

type SortField = "name" | "measurement_unit" | "current_points_per_unit" | "status" | null;
type SortOrder = "asc" | "desc";

interface CategoryTableProps {
  categories: WasteCategory[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onViewDetails: (category: WasteCategory) => void;
  onEdit: (category: WasteCategory) => void;
  onReviseRate: (category: WasteCategory) => void;
  onViewHistory: (category: WasteCategory) => void;
  onToggleStatus: (category: WasteCategory) => void;
  onRefresh: () => void;
  onResetFilters?: () => void;
}

export function CategoryTable({
  categories,
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
  onReviseRate,
  onViewHistory,
  onToggleStatus,
  onRefresh,
  onResetFilters,
}: CategoryTableProps) {
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

  const sortedCategories = useMemo(() => {
    if (!sortField) return categories;
    return [...categories].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      if (sortField === "current_points_per_unit") {
        aVal = a.current_points_per_unit;
        bVal = b.current_points_per_unit;
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }

      aVal = a[sortField] || "";
      bVal = b[sortField] || "";
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [categories, sortField, sortOrder]);

  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "all";

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="flex flex-col gap-3 border-b border-stone-200 bg-stone-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input with Clear Button */}
        <div className="relative flex-1 max-w-md">
          <span
            className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400 pointer-events-none"
            aria-hidden="true"
          >
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by category name or description..."
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
              All Categories
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
            title="Refresh waste categories"
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
                  <span>Waste Category</span>
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
                onClick={() => handleSort("measurement_unit")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Unit</span>
                  {sortField === "measurement_unit" ? (
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
                onClick={() => handleSort("current_points_per_unit")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Points Rate</span>
                  {sortField === "current_points_per_unit" ? (
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

              <th scope="col" className="px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100 bg-white">
            {isLoading ? (
              // Loading Skeleton Rows
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-4 py-3.5">
                    <div className="h-4 w-40 rounded bg-stone-200 mb-1.5" />
                    <div className="h-3 w-64 rounded bg-stone-100" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-5 w-12 rounded bg-stone-100" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-5 w-20 rounded bg-stone-200" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-5 w-16 rounded-full bg-stone-100" />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="h-7 w-28 rounded bg-stone-100 ml-auto" />
                  </td>
                </tr>
              ))
            ) : sortedCategories.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 mb-3">
                    <Recycle className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-stone-900 mb-1">
                    No waste categories found
                  </h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
                    {hasActiveFilters
                      ? "No categories match your current search and status filter criteria."
                      : "No waste categories have been configured in Balangoda Urban Council yet."}
                  </p>
                  {hasActiveFilters && onResetFilters && (
                    <button
                      onClick={onResetFilters}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors shadow-2xs"
                    >
                      Clear active filters
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              // Render Data Rows
              sortedCategories.map((cat) => (
                <tr
                  key={cat.id}
                  className="hover:bg-stone-50/70 transition-colors group"
                >
                  {/* Category Name & Description */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#800000]">
                        <Recycle className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-stone-900 group-hover:text-[#800000] transition-colors">
                          {cat.name}
                        </div>
                        {cat.description && (
                          <div className="text-xs text-stone-500 line-clamp-1 mt-0.5 max-w-md">
                            {cat.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Measurement Unit */}
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center rounded-md bg-stone-100 px-2.5 py-1 text-xs font-mono font-medium text-stone-700">
                      per {cat.measurement_unit}
                    </span>
                  </td>

                  {/* Points Rate */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-stone-900">
                        {cat.current_points_per_unit.toFixed(1)}
                        <span className="text-xs font-normal text-stone-500">
                          pts / {cat.measurement_unit}
                        </span>
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <CategoryStatusBadge status={cat.status} />
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1 justify-end">
                      {/* View Details */}
                      <button
                        onClick={() => onViewDetails(cat)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                        title="View details"
                        aria-label={`View details for ${cat.name}`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Edit Non-Rate Info */}
                      <button
                        onClick={() => onEdit(cat)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit category"
                        aria-label={`Edit ${cat.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      {/* Revise Rate (Critical Action) */}
                      <button
                        onClick={() => onReviseRate(cat)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                        title="Revise points rate"
                        aria-label={`Revise points rate for ${cat.name}`}
                      >
                        <TrendingUp className="h-4 w-4" />
                      </button>

                      {/* Rate History */}
                      <button
                        onClick={() => onViewHistory(cat)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                        title="View rate change history"
                        aria-label={`View rate history for ${cat.name}`}
                      >
                        <History className="h-4 w-4" />
                      </button>

                      {/* Activate / Deactivate */}
                      <button
                        onClick={() => onToggleStatus(cat)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          cat.status === "active"
                            ? "text-stone-500 hover:text-amber-600 hover:bg-amber-50"
                            : "text-stone-500 hover:text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title={
                          cat.status === "active"
                            ? "Deactivate category"
                            : "Activate category"
                        }
                        aria-label={
                          cat.status === "active"
                            ? `Deactivate ${cat.name}`
                            : `Activate ${cat.name}`
                        }
                      >
                        {cat.status === "active" ? (
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
            {categories.length > 0 ? (currentPage - 1) * 10 + 1 : 0}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-stone-900">
            {Math.min(currentPage * 10, totalCount)}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-stone-900">{totalCount}</span>{" "}
          categories
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

export default CategoryTable;
