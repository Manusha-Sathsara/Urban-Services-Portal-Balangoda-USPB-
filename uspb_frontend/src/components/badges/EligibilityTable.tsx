"use client";

import { StudentEligibility } from "@/types";
import BadgeIconHelper from "./BadgeIconHelper";
import {
  Search,
  RotateCcw,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  GraduationCap,
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

interface EligibilityTableProps {
  records: StudentEligibility[];
  isLoading: boolean;
  schools: SchoolOption[];
  badges: BadgeOption[];
  selectedSchoolId?: number;
  onSchoolChange: (id?: number) => void;
  selectedBadgeId?: number;
  onBadgeChange: (id?: number) => void;
  eligibleOnly?: boolean;
  onEligibleOnlyChange: (val?: boolean) => void;
  awardedStatus: string;
  onAwardedStatusChange: (status: "all" | "awarded" | "not_awarded") => void;
  search: string;
  onSearchChange: (val: string) => void;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (p: number) => void;
  onBestowAward: (record: StudentEligibility) => void;
  onTakeBack?: (record: StudentEligibility) => void;
  onRefresh: () => void;
  onResetFilters?: () => void;
  isTeacher?: boolean;
}

export function EligibilityTable({
  records,
  isLoading,
  schools,
  badges,
  selectedSchoolId,
  onSchoolChange,
  selectedBadgeId,
  onBadgeChange,
  eligibleOnly,
  onEligibleOnlyChange,
  awardedStatus,
  onAwardedStatusChange,
  search,
  onSearchChange,
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  onBestowAward,
  onTakeBack,
  onRefresh,
  onResetFilters,
  isTeacher = false,
}: EligibilityTableProps) {
  const hasActiveFilters =
    search.trim().length > 0 ||
    selectedSchoolId !== undefined ||
    selectedBadgeId !== undefined ||
    eligibleOnly !== undefined ||
    awardedStatus !== "all";

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
              placeholder="Search by student name or identifier..."
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
              onClick={onRefresh}
              title="Refresh eligibility calculations"
              className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white p-2 text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors cursor-pointer"
            >
              <RotateCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {/* School filter (hidden or disabled if teacher is restricted to their school) */}
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
              <option value="">All Configured Badges</option>
              {badges.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Eligibility status */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1">
              Threshold Qualification
            </label>
            <select
              value={eligibleOnly === true ? "eligible" : eligibleOnly === false ? "ineligible" : "all"}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "eligible") onEligibleOnlyChange(true);
                else if (val === "ineligible") onEligibleOnlyChange(false);
                else onEligibleOnlyChange(undefined);
              }}
              className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-800 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors"
            >
              <option value="all">All Qualifications</option>
              <option value="eligible">Eligible Only (Points Met)</option>
              <option value="ineligible">In Progress Only (Points Pending)</option>
            </select>
          </div>

          {/* Award bestowal status */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1">
              Award Bestowal Status
            </label>
            <select
              value={awardedStatus}
              onChange={(e) => onAwardedStatusChange(e.target.value as "all" | "awarded" | "not_awarded")}
              className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-800 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors"
            >
              <option value="all">All Bestowal States</option>
              <option value="not_awarded">Pending Bestowal (Unawarded)</option>
              <option value="awarded">Already Bestowed</option>
            </select>
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
                Student: &ldquo;{search.trim()}&rdquo;
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
            {eligibleOnly === true && (
              <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 font-medium">
                Eligible Only
              </span>
            )}
            {awardedStatus !== "all" && (
              <span className="rounded bg-stone-200 px-2 py-0.5 text-stone-800 font-medium capitalize">
                {awardedStatus.replace("_", " ")}
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
                Student & School
              </th>
              <th scope="col" className="px-4 py-3">
                Target Badge
              </th>
              <th scope="col" className="px-4 py-3">
                Qualifying Points
              </th>
              <th scope="col" className="px-4 py-3">
                Eligibility Status
              </th>
              <th scope="col" className="px-4 py-3">
                Award Status
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100 bg-white">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-4 py-3.5">
                    <div className="h-4 w-36 rounded bg-stone-200 mb-1" />
                    <div className="h-3 w-48 rounded bg-stone-100" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-4 w-28 rounded bg-stone-200" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-4 w-20 rounded bg-stone-200 mb-1" />
                    <div className="h-2 w-24 rounded bg-stone-100" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-5 w-16 rounded-full bg-stone-100" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-5 w-20 rounded-full bg-stone-100" />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="h-7 w-24 rounded bg-stone-100 ml-auto" />
                  </td>
                </tr>
              ))
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 mb-3">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-stone-900 mb-1">
                    No matching student eligibility records
                  </h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
                    {hasActiveFilters
                      ? "No candidates match your current filter parameters."
                      : "No student records found in the municipal school registry."}
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
              records.map((rec) => {
                const progressPct = Math.min(
                  100,
                  Math.round((rec.qualifying_points / rec.milestone_threshold) * 100)
                );

                return (
                  <tr key={`${rec.student_id}-${rec.badge_id}`} className="hover:bg-stone-50/70 transition-colors">
                    {/* Student Info */}
                    <td className="px-4 py-3.5">
                      <div>
                        <div className="font-semibold text-stone-900">
                          {rec.student_name}
                        </div>
                        <div className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono">{rec.student_identifier}</span>
                          <span>•</span>
                          <span>{rec.school_name}</span>
                          {rec.grade && (
                            <>
                              <span>•</span>
                              <span className="rounded bg-stone-100 px-1 py-0.2 text-[10px] text-stone-600 font-medium">
                                {rec.grade}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Badge Info */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-800 border border-amber-200/50">
                          <BadgeIconHelper iconName={rec.badge_icon} className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="font-medium text-stone-900 text-xs">
                            {rec.badge_name}
                          </div>
                          <div className="text-[11px] text-stone-400">
                            Threshold: {rec.milestone_threshold.toFixed(0)} pts
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Qualifying Points & Progress */}
                    <td className="px-4 py-3.5">
                      <div>
                        <div className="flex items-baseline gap-1 text-xs">
                          <span className="font-bold text-stone-900">
                            {rec.qualifying_points.toFixed(0)}
                          </span>
                          <span className="text-stone-400">
                            / {rec.milestone_threshold.toFixed(0)} pts
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-24 rounded-full bg-stone-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              rec.is_eligible ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Eligibility Status */}
                    <td className="px-4 py-3.5">
                      {rec.is_eligible ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/80">
                          <CheckCircle2 className="h-3 w-3" /> Eligible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600 border border-stone-200">
                          <Clock className="h-3 w-3" /> In Progress
                        </span>
                      )}
                    </td>

                    {/* Award Status */}
                    <td className="px-4 py-3.5">
                      {rec.is_awarded ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
                            <Award className="h-3 w-3" /> Bestowed
                          </span>
                          {rec.award_reference && (
                            <span className="block text-[10px] font-mono text-stone-400">
                              {rec.award_reference}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-stone-50 px-2 py-0.5 text-xs font-medium text-stone-500 border border-stone-200">
                          Not Awarded
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 text-right">
                      {rec.is_awarded ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onTakeBack?.(rec)}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 hover:border-amber-400 transition-colors shadow-2xs cursor-pointer"
                            title="Take back or revoke this badge award to correct faults"
                          >
                            <RotateCcw className="h-3 w-3 text-amber-700" />
                            Take Back
                          </button>
                        </div>
                      ) : rec.is_eligible ? (
                        <button
                          onClick={() => onBestowAward(rec)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#800000] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#660000] transition-colors shadow-2xs cursor-pointer"
                        >
                          <Sparkles className="h-3 w-3" />
                          Bestow Badge
                        </button>
                      ) : (
                        <span className="text-xs text-stone-400 italic">
                          Points pending
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-200 bg-stone-50/60 px-4 py-3 text-xs text-stone-600">
        <div>
          Showing{" "}
          <span className="font-semibold text-stone-900">
            {records.length > 0 ? (currentPage - 1) * 10 + 1 : 0}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-stone-900">
            {Math.min(currentPage * 10, totalCount)}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-stone-900">{totalCount}</span>{" "}
          candidate evaluations
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

export default EligibilityTable;
