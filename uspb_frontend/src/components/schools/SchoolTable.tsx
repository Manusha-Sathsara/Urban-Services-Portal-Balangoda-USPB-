"use client";

import { School } from "@/types";
import SchoolStatusBadge from "./SchoolStatusBadge";
import {
  Search,
  RotateCcw,
  Eye,
  Pencil,
  Pause,
  Play,
  School as SchoolIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SchoolTableProps {
  schools: School[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onViewDetails: (school: School) => void;
  onEdit: (school: School) => void;
  onToggleStatus: (school: School) => void;
  onRefresh: () => void;
}

export function SchoolTable({
  schools,
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
  onToggleStatus,
  onRefresh,
}: SchoolTableProps) {
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
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by school name, code or address..."
            className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-3 text-xs text-stone-800 placeholder-stone-400 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition"
            aria-label="Search schools"
          />
        </div>

        {/* Filter & Refresh Controls */}
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-800 focus:border-[#800000] focus:outline-none transition cursor-pointer"
              aria-label="Filter by operational status"
            >
              <option value="all">All Schools</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh schools list"
            className="rounded-lg border border-stone-200 bg-white p-1.5 text-stone-600 hover:text-[#800000] hover:bg-stone-100 transition cursor-pointer"
            aria-label="Refresh table"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-stone-700">
          <thead className="border-b border-stone-200 bg-stone-50/80 font-semibold uppercase tracking-wider text-stone-500">
            <tr>
              <th scope="col" className="px-4 py-3">
                School Code
              </th>
              <th scope="col" className="px-4 py-3">
                Institution Name
              </th>
              <th scope="col" className="px-4 py-3 hidden md:table-cell">
                Postal Address
              </th>
              <th scope="col" className="px-4 py-3 hidden sm:table-cell">
                Contact
              </th>
              <th scope="col" className="px-4 py-3">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading ? (
              // Loading Skeleton Rows
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4">
                    <div className="h-4 w-20 rounded bg-stone-100" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-48 rounded bg-stone-100" />
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <div className="h-4 w-32 rounded bg-stone-100" />
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <div className="h-4 w-24 rounded bg-stone-100" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-16 rounded bg-stone-100" />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="ml-auto h-6 w-20 rounded bg-stone-100" />
                  </td>
                </tr>
              ))
            ) : schools.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-stone-100 text-stone-500">
                    <SchoolIcon className="h-5 w-5" />
                  </div>
                  <h4 className="mt-3 font-sans text-sm font-semibold text-stone-800">
                    No Schools Found
                  </h4>
                  <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
                    {search || statusFilter !== "all"
                      ? "Try adjusting your search criteria or filter options."
                      : "No schools have been registered yet. Click 'Register New School' above to add the first institution."}
                  </p>
                </td>
              </tr>
            ) : (
              // Real Data Rows
              schools.map((school) => {
                const isActive = school.status === "active";
                return (
                  <tr
                    key={school.id}
                    className="hover:bg-stone-50/70 transition-colors"
                  >
                    {/* Code */}
                    <td className="px-4 py-3.5 font-mono font-semibold text-[#800000]">
                      <span className="rounded bg-[#f0e0df]/60 px-2 py-0.5 text-[11px]">
                        {school.school_code}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3.5 font-semibold text-stone-900">
                      <button
                        type="button"
                        onClick={() => onViewDetails(school)}
                        className="text-left hover:text-[#800000] hover:underline focus:outline-none transition-colors"
                      >
                        {school.school_name}
                      </button>
                    </td>

                    {/* Address */}
                    <td className="px-4 py-3.5 text-stone-500 hidden md:table-cell max-w-xs truncate">
                      {school.address || "—"}
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3.5 text-stone-500 font-mono hidden sm:table-cell">
                      {school.contact_number || "—"}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <SchoolStatusBadge status={school.status} />
                    </td>

                    {/* Actions - Clean borderless buttons with subtle hover effects */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        {/* View Details */}
                        <button
                          type="button"
                          onClick={() => onViewDetails(school)}
                          title="View school profile"
                          className="rounded-md p-1.5 text-stone-500 hover:text-[#800000] hover:bg-[#f0e0df]/60 transition-colors cursor-pointer"
                          aria-label={`View ${school.school_name}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => onEdit(school)}
                          title="Edit school details"
                          className="rounded-md p-1.5 text-stone-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                          aria-label={`Edit ${school.school_name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        {/* Toggle Status (Activate / Deactivate) */}
                        <button
                          type="button"
                          onClick={() => onToggleStatus(school)}
                          title={isActive ? "Deactivate school" : "Activate school"}
                          className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                            isActive
                              ? "text-stone-500 hover:text-amber-700 hover:bg-amber-50"
                              : "text-stone-500 hover:text-emerald-700 hover:bg-emerald-50"
                          }`}
                          aria-label={
                            isActive
                              ? `Deactivate ${school.school_name}`
                              : `Activate ${school.school_name}`
                          }
                        >
                          {isActive ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col gap-2 border-t border-stone-200 bg-stone-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between text-xs text-stone-500">
        <div>
          Showing{" "}
          <span className="font-semibold text-stone-800">
            {schools.length > 0 ? (currentPage - 1) * 10 + 1 : 0}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-stone-800">
            {Math.min(currentPage * 10, totalCount)}
          </span>{" "}
          of <span className="font-semibold text-stone-800">{totalCount}</span>{" "}
          institutions
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => onPageChange(currentPage - 1)}
              className="inline-flex items-center gap-1 rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              const isCurrent = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    isCurrent
                      ? "bg-[#800000] text-white"
                      : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => onPageChange(currentPage + 1)}
              className="inline-flex items-center gap-1 rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40 transition cursor-pointer"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SchoolTable;
