"use client";

import { StudentBadgeAward } from "@/types";
import BadgeIconHelper from "./BadgeIconHelper";
import {
  Search,
  RotateCcw,
  Eye,
  Download,
  Award,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
} from "lucide-react";

interface SchoolOption {
  id: number;
  name: string;
}

interface BadgeOption {
  id: number;
  name: string;
}

interface AwardTableProps {
  awards: StudentBadgeAward[];
  isLoading: boolean;
  schools: SchoolOption[];
  badges: BadgeOption[];
  selectedSchoolId?: number;
  onSchoolChange: (id?: number) => void;
  selectedBadgeId?: number;
  onBadgeChange: (id?: number) => void;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (p: number) => void;
  onViewDetails: (award: StudentBadgeAward) => void;
  onExportCsv: () => void;
  onRefresh: () => void;
  onResetFilters?: () => void;
  isTeacher?: boolean;
}

export function AwardTable({
  awards,
  isLoading,
  schools,
  badges,
  selectedSchoolId,
  onSchoolChange,
  selectedBadgeId,
  onBadgeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  search,
  onSearchChange,
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  onViewDetails,
  onExportCsv,
  onRefresh,
  onResetFilters,
  isTeacher = false,
}: AwardTableProps) {
  const hasActiveFilters =
    search.trim().length > 0 ||
    selectedSchoolId !== undefined ||
    selectedBadgeId !== undefined ||
    startDate.length > 0 ||
    endDate.length > 0;

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-xs overflow-hidden">
      {/* Table Toolbar & Multi-Filter Bar */}
      <div className="flex flex-col gap-3 border-b border-stone-200 bg-stone-50/60 p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
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
              placeholder="Search by student, ID, or award reference..."
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

          <div className="flex items-center gap-2">
            <button
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>

            <button
              onClick={onRefresh}
              title="Refresh award history"
              className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white p-2 text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors cursor-pointer"
            >
              <RotateCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {/* School filter */}
          {!isTeacher && (
            <div>
              <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                Filter by School
              </label>
              <select
                value={selectedSchoolId || ""}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  onSchoolChange(val);
                }}
                className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-800 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors"
              >
                <option value="">All Balangoda Schools</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Badge filter */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1">
              Filter by Badge
            </label>
            <select
              value={selectedBadgeId || ""}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                onBadgeChange(val);
              }}
              className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-800 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors"
            >
              <option value="">All Badges</option>
              {badges.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-800 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-800 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Active Filter Pill Bar */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between bg-stone-50/80 px-4 py-2 border-b border-stone-200 text-xs text-stone-600">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-stone-400" />
            <span>Active filters:</span>
            {search.trim() && (
              <span className="rounded bg-stone-200 px-2 py-0.5 text-stone-800 font-medium">
                Keyword: &ldquo;{search.trim()}&rdquo;
              </span>
            )}
            {selectedSchoolId && (
              <span className="rounded bg-stone-200 px-2 py-0.5 text-stone-800 font-medium">
                School ID: {selectedSchoolId}
              </span>
            )}
            {selectedBadgeId && (
              <span className="rounded bg-stone-200 px-2 py-0.5 text-stone-800 font-medium">
                Badge ID: {selectedBadgeId}
              </span>
            )}
            {startDate && (
              <span className="rounded bg-stone-200 px-2 py-0.5 text-stone-800 font-medium">
                From: {startDate}
              </span>
            )}
            {endDate && (
              <span className="rounded bg-stone-200 px-2 py-0.5 text-stone-800 font-medium">
                To: {endDate}
              </span>
            )}
          </div>
          {onResetFilters && (
            <button
              onClick={onResetFilters}
              className="text-[#800000] hover:underline font-medium cursor-pointer"
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
              <th scope="col" className="px-4 py-3">
                Award Reference
              </th>
              <th scope="col" className="px-4 py-3">
                Student & School
              </th>
              <th scope="col" className="px-4 py-3">
                Badge Conferred
              </th>
              <th scope="col" className="px-4 py-3">
                Points at Award
              </th>
              <th scope="col" className="px-4 py-3">
                Award Date
              </th>
              <th scope="col" className="px-4 py-3">
                Conferred By
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Details
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100 bg-white">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-4 py-3.5">
                    <div className="h-4 w-24 rounded bg-stone-200" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-4 w-36 rounded bg-stone-200 mb-1" />
                    <div className="h-3 w-48 rounded bg-stone-100" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-4 w-28 rounded bg-stone-200" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-4 w-20 rounded bg-stone-100" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-4 w-20 rounded bg-stone-100" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-4 w-24 rounded bg-stone-100" />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="h-6 w-8 rounded bg-stone-100 ml-auto" />
                  </td>
                </tr>
              ))
            ) : awards.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 mb-3">
                    <Award className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-stone-900 mb-1">
                    No award records found
                  </h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
                    {hasActiveFilters
                      ? "No recorded badge awards match your current search and filter criteria."
                      : "No badge awards have been recorded yet."}
                  </p>
                  {hasActiveFilters && onResetFilters && (
                    <button
                      onClick={onResetFilters}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
                    >
                      Clear active filters
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              awards.map((award) => (
                <tr key={award.id} className="hover:bg-stone-50/70 transition-colors">
                  {/* Award Reference */}
                  <td className="px-4 py-3.5 font-mono text-xs font-bold text-stone-900">
                    {award.award_reference}
                  </td>

                  {/* Student & School */}
                  <td className="px-4 py-3.5">
                    <div>
                      <div className="font-semibold text-stone-900 text-xs">
                        {award.student_name}
                      </div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono">{award.student_identifier}</span>
                        <span>•</span>
                        <span>{award.school_name}</span>
                      </div>
                    </div>
                  </td>

                  {/* Badge */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-800 border border-amber-200/50">
                        <BadgeIconHelper iconName={award.badge_icon} className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-bold text-stone-900">
                        {award.badge_name}
                      </span>
                    </div>
                  </td>

                  {/* Points at Award */}
                  <td className="px-4 py-3.5 text-xs">
                    <span className="font-bold text-stone-900">
                      {award.qualifying_points.toFixed(0)} pts
                    </span>
                    <span className="text-[11px] text-stone-400 block">
                      Threshold: {award.threshold_at_award.toFixed(0)} pts
                    </span>
                  </td>

                  {/* Award Date */}
                  <td className="px-4 py-3.5 text-xs text-stone-700">
                    {award.award_date}
                  </td>

                  {/* Awarded By */}
                  <td className="px-4 py-3.5 text-xs text-stone-600 truncate max-w-xs">
                    {award.awarded_by}
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => onViewDetails(award)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Inspect award record"
                      aria-label={`View award details for ${award.award_reference}`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
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
            {awards.length > 0 ? (currentPage - 1) * 10 + 1 : 0}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-stone-900">
            {Math.min(currentPage * 10, totalCount)}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-stone-900">{totalCount}</span>{" "}
          award records
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default AwardTable;
