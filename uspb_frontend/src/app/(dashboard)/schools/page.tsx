"use client";

import { useCallback, useEffect, useState } from "react";
import { CreateSchoolDto, School, SchoolStats, UpdateSchoolDto } from "@/types";
import schoolService from "@/services/schoolService";
import { StatCard } from "@/components/shared/StatCard";
import SchoolTable from "@/components/schools/SchoolTable";
import SchoolFormModal from "@/components/schools/SchoolFormModal";
import SchoolDetailsModal from "@/components/schools/SchoolDetailsModal";
import StatusConfirmModal from "@/components/schools/StatusConfirmModal";
import {
  School as SchoolIcon,
  CheckCircle2,
  PauseCircle,
  ShieldCheck,
  Plus,
  AlertCircle,
  X,
} from "lucide-react";

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & Pagination State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Global Municipal Program Statistics (independent of filters)
  const [stats, setStats] = useState<SchoolStats>({
    total_registered: 0,
    active_schools: 0,
    inactive_schools: 0,
    program_coverage: 0,
  });

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [schoolToEdit, setSchoolToEdit] = useState<School | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [schoolToToggleStatus, setSchoolToToggleStatus] = useState<School | null>(
    null
  );
  const [isStatusLoading, setIsStatusLoading] = useState(false);

  // Auto-dismiss success notification
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch schools from API
  const fetchSchools = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await schoolService.getSchools({
        search: search.trim() || undefined,
        status: statusFilter,
        page: currentPage,
        limit: 10,
      });

      setSchools(result.schools || []);
      setTotalPages(result.total_pages || 1);
      setTotalCount(result.total_count || 0);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to connect to USPB School Management service.";
      setError(msg);
      setSchools([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, currentPage]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  // Fetch global municipal statistics (independent of active table filters)
  const fetchStats = useCallback(async () => {
    try {
      const data = await schoolService.getSchoolStats();
      setStats(data);
    } catch (err: unknown) {
      console.error("Failed to load school statistics:", err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Reset filters and search
  const handleResetFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
    setCurrentPage(1);
  }, []);

  // Handle Form Submit (Add or Edit)
  const handleFormSubmit = async (data: CreateSchoolDto | UpdateSchoolDto) => {
    setIsSubmitting(true);
    try {
      if (schoolToEdit) {
        await schoolService.updateSchool(schoolToEdit.id, data as UpdateSchoolDto);
        setSuccessMessage(
          `School "${data.school_name}" details updated successfully.`
        );
      } else {
        await schoolService.createSchool(data as CreateSchoolDto);
        setSuccessMessage(
          `School "${data.school_name}" registered successfully.`
        );
      }
      setIsFormModalOpen(false);
      setSchoolToEdit(null);
      await Promise.all([fetchSchools(), fetchStats()]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Status Toggle (Activate / Deactivate)
  const handleConfirmToggleStatus = async () => {
    if (!schoolToToggleStatus) return;
    setIsStatusLoading(true);
    try {
      const newStatus =
        schoolToToggleStatus.status === "active" ? "inactive" : "active";
      await schoolService.updateSchoolStatus(schoolToToggleStatus.id, newStatus);
      setSuccessMessage(
        `School "${schoolToToggleStatus.school_name}" is now ${newStatus}.`
      );
      setIsStatusModalOpen(false);
      setSchoolToToggleStatus(null);
      await Promise.all([fetchSchools(), fetchStats()]);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update school status.";
      setError(msg);
    } finally {
      setIsStatusLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#f0e0df] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#5a0000]">
              Municipal Administration
            </span>
            <span className="text-xs text-stone-500">School Waste Rewards</span>
          </div>
          <h2 className="mt-1 font-sans text-2xl md:text-3xl font-bold tracking-tight text-stone-900">
            School Management
          </h2>
          <p className="mt-1 text-xs md:text-sm text-stone-500">
            Register, supervise, and manage participating educational institutions in Balangoda Urban Council.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSchoolToEdit(null);
            setIsFormModalOpen(true);
          }}
          className="btn-hover-fx inline-flex items-center justify-center gap-2 rounded-lg bg-[#800000] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#680000] transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Register New School</span>
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
            aria-label="Dismiss message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800 animate-in fade-in sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>
              {error.includes("401")
                ? "Council session authorization required. Please reconnect your coordinator session."
                : error}
            </span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {error.includes("401") ? (
              <button
                type="button"
                onClick={async () => {
                  setError(null);
                  try {
                    const res = await schoolService.getSchools();
                    if (res) {
                      await Promise.all([fetchSchools(), fetchStats()]);
                    }
                  } catch {
                    window.location.href = "/login";
                  }
                }}
                className="rounded-md bg-[#800000] px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-[#680000] transition cursor-pointer"
              >
                Reconnect Session
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-900 cursor-pointer p-1"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Summary KPI Cards - Uniform borders, shadows and styling */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Registered Schools"
          value={stats.total_registered}
          description="Institutions recorded in Balangoda municipal registry"
          icon={<SchoolIcon className="h-5 w-5" />}
          variant="default"
        />
        <StatCard
          label="Active Schools"
          value={stats.active_schools}
          description="Eligible for ongoing waste collection logging"
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          label="Inactive Schools"
          value={stats.inactive_schools}
          description="Temporarily paused from waste points accrual"
          icon={<PauseCircle className="h-5 w-5" />}
          variant="warning"
        />
        <StatCard
          label="Program Coverage"
          value={`${stats.program_coverage}%`}
          description="Balangoda active participation coverage rate"
          icon={<ShieldCheck className="h-5 w-5" />}
          variant="info"
        />
      </div>

      {/* School Listing Table */}
      <SchoolTable
        schools={schools}
        isLoading={isLoading}
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(st) => {
          setStatusFilter(st);
          setCurrentPage(1);
        }}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={(p) => setCurrentPage(p)}
        onResetFilters={handleResetFilters}
        onViewDetails={(school) => {
          setSelectedSchool(school);
          setIsDetailsModalOpen(true);
        }}
        onEdit={(school) => {
          setSchoolToEdit(school);
          setIsFormModalOpen(true);
        }}
        onToggleStatus={(school) => {
          setIsDetailsModalOpen(false);
          setSelectedSchool(null);
          setSchoolToToggleStatus(school);
          setIsStatusModalOpen(true);
        }}
        onRefresh={fetchSchools}
      />

      {/* Add / Edit School Modal */}
      <SchoolFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSchoolToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        schoolToEdit={schoolToEdit}
        isSubmitting={isSubmitting}
      />

      {/* View School Details Modal */}
      <SchoolDetailsModal
        school={selectedSchool}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedSchool(null);
        }}
        onEdit={(school) => {
          setSchoolToEdit(school);
          setIsFormModalOpen(true);
        }}
        onToggleStatus={(school) => {
          setIsDetailsModalOpen(false);
          setSelectedSchool(null);
          setSchoolToToggleStatus(school);
          setIsStatusModalOpen(true);
        }}
      />

      {/* Activate / Deactivate Confirmation Modal */}
      <StatusConfirmModal
        school={schoolToToggleStatus}
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSchoolToToggleStatus(null);
        }}
        onConfirm={handleConfirmToggleStatus}
        isLoading={isStatusLoading}
      />
    </div>
  );
}
