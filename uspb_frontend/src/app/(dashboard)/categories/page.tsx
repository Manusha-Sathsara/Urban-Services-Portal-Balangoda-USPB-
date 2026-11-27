"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CategoryStats,
  CreateCategoryDto,
  UpdateCategoryDto,
  UpdateRateDto,
  WasteCategory,
} from "@/types";
import categoryService from "@/services/categoryService";
import { StatCard } from "@/components/shared/StatCard";
import CategoryTable from "@/components/categories/CategoryTable";
import CategoryFormModal from "@/components/categories/CategoryFormModal";
import CategoryDetailsModal from "@/components/categories/CategoryDetailsModal";
import RateChangeModal from "@/components/categories/RateChangeModal";
import RateHistoryModal from "@/components/categories/RateHistoryModal";
import CategoryStatusConfirmModal from "@/components/categories/CategoryStatusConfirmModal";
import {
  Recycle,
  CheckCircle2,
  PauseCircle,
  TrendingUp,
  Plus,
  AlertCircle,
  X,
  Sparkles,
} from "lucide-react";

export default function WasteCategoriesPage() {
  const [categories, setCategories] = useState<WasteCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Aggregated KPI Stats
  const [stats, setStats] = useState<CategoryStats>({
    total_categories: 0,
    active_categories: 0,
    inactive_categories: 0,
    average_rate: 0,
  });

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<WasteCategory | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<WasteCategory | null>(null);

  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [categoryForRate, setCategoryForRate] = useState<WasteCategory | null>(null);
  const [isRateSubmitting, setIsRateSubmitting] = useState(false);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [categoryForHistory, setCategoryForHistory] = useState<WasteCategory | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [categoryForStatus, setCategoryForStatus] = useState<WasteCategory | null>(null);
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false);

  // Auto-dismiss success notification
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await categoryService.getCategories({
        search: search.trim() || undefined,
        status: statusFilter,
        page: currentPage,
        limit: 10,
      });

      setCategories(result.categories || []);
      setTotalPages(result.total_pages || 1);
      setTotalCount(result.total_count || 0);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to connect to USPB Waste Category service.";
      setError(msg);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, currentPage]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch KPI statistics across all categories
  const fetchStats = useCallback(async () => {
    try {
      const data = await categoryService.getCategoryStats();
      setStats(data);
    } catch (err: unknown) {
      console.warn("Failed to fetch category statistics:", err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handlers for category operations
  const handleOpenCreateModal = () => {
    setCategoryToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (cat: WasteCategory) => {
    setCategoryToEdit(cat);
    setIsFormModalOpen(true);
  };

  const handleOpenDetails = (cat: WasteCategory) => {
    setSelectedCategory(cat);
    setIsDetailsModalOpen(true);
  };

  const handleOpenRateModal = (cat: WasteCategory) => {
    setCategoryForRate(cat);
    setIsRateModalOpen(true);
  };

  const handleOpenHistoryModal = (cat: WasteCategory) => {
    setCategoryForHistory(cat);
    setIsHistoryModalOpen(true);
  };

  const handleOpenStatusModal = (cat: WasteCategory) => {
    setCategoryForStatus(cat);
    setIsStatusModalOpen(true);
  };

  const handleSubmitCreate = async (dto: CreateCategoryDto) => {
    setIsFormSubmitting(true);
    try {
      const newCat = await categoryService.createCategory(dto);
      setIsFormModalOpen(false);
      setSuccessMessage(`Waste category "${newCat.name}" registered successfully.`);
      await Promise.all([fetchCategories(), fetchStats()]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create category.";
      alert(msg);
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleSubmitUpdate = async (id: number, dto: UpdateCategoryDto) => {
    setIsFormSubmitting(true);
    try {
      const updated = await categoryService.updateCategory(id, dto);
      setIsFormModalOpen(false);
      setSuccessMessage(`Category "${updated.name}" updated successfully.`);
      await Promise.all([fetchCategories(), fetchStats()]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update category.";
      alert(msg);
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleSubmitRate = async (id: number, dto: UpdateRateDto) => {
    setIsRateSubmitting(true);
    try {
      const updated = await categoryService.updateCategoryRate(id, dto);
      setIsRateModalOpen(false);
      setSuccessMessage(
        `Point rate for "${updated.name}" successfully revised to ${updated.current_points_per_unit.toFixed(1)} pts/${updated.measurement_unit}. Rate change audit logged.`
      );
      await Promise.all([fetchCategories(), fetchStats()]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update rate.";
      alert(msg);
    } finally {
      setIsRateSubmitting(false);
    }
  };

  const handleConfirmStatusToggle = async () => {
    if (!categoryForStatus) return;
    setIsStatusSubmitting(true);
    try {
      const targetStatus =
        categoryForStatus.status === "active" ? "inactive" : "active";
      const updated = await categoryService.updateCategoryStatus(
        categoryForStatus.id,
        targetStatus
      );
      setIsStatusModalOpen(false);
      setCategoryForStatus(null);
      setSuccessMessage(
        `Waste category "${updated.name}" has been ${
          targetStatus === "active" ? "activated" : "deactivated"
        }.`
      );
      await Promise.all([fetchCategories(), fetchStats()]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status.";
      alert(msg);
    } finally {
      setIsStatusSubmitting(false);
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-[#800000]/10 px-2.5 py-0.5 text-xs font-semibold text-[#800000] mb-2">
            <span>MUNICIPAL ADMINISTRATION</span>
            <span className="text-[#800000]/40">•</span>
            <span className="text-stone-600 font-normal">School Waste Rewards</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">
            Waste Category Management
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
            Configure approved recyclable waste streams, unit measurement standards, and baseline points incentive rates. All point rate changes preserve historical collection integrity.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#800000] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#680000] transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Register New Category</span>
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
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900 cursor-pointer p-1 self-end sm:self-auto"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Registered Categories"
          value={stats.total_categories}
          description="Recyclable streams cataloged in Balangoda system"
          icon={<Recycle className="h-5 w-5" />}
          variant="default"
        />
        <StatCard
          label="Active Categories"
          value={stats.active_categories}
          description="Available for school collection logging"
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          label="Inactive Categories"
          value={stats.inactive_categories}
          description="Temporarily hidden from participating schools"
          icon={<PauseCircle className="h-5 w-5" />}
          variant="warning"
        />
        <StatCard
          label="Average Points Rate"
          value={`${stats.average_rate.toFixed(1)} pts`}
          description="Mean municipal incentive rate across active streams"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="default"
        />
      </div>

      {/* Main Table View */}
      <CategoryTable
        categories={categories}
        isLoading={isLoading}
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => {
          setStatusFilter(val);
          setCurrentPage(1);
        }}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={(p) => setCurrentPage(p)}
        onViewDetails={handleOpenDetails}
        onEdit={handleOpenEditModal}
        onReviseRate={handleOpenRateModal}
        onViewHistory={handleOpenHistoryModal}
        onToggleStatus={handleOpenStatusModal}
        onRefresh={() => {
          fetchCategories();
          fetchStats();
        }}
        onResetFilters={handleResetFilters}
      />

      {/* Modals */}
      <CategoryFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmitCreate={handleSubmitCreate}
        onSubmitUpdate={handleSubmitUpdate}
        categoryToEdit={categoryToEdit}
        isSubmitting={isFormSubmitting}
      />

      <CategoryDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        category={selectedCategory}
        onEdit={handleOpenEditModal}
        onReviseRate={handleOpenRateModal}
        onViewHistory={handleOpenHistoryModal}
      />

      <RateChangeModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        category={categoryForRate}
        onSubmitRate={handleSubmitRate}
        isSubmitting={isRateSubmitting}
      />

      <RateHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        category={categoryForHistory}
      />

      <CategoryStatusConfirmModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setCategoryForStatus(null);
        }}
        category={categoryForStatus}
        onConfirm={handleConfirmStatusToggle}
        isLoading={isStatusSubmitting}
      />
    </div>
  );
}
