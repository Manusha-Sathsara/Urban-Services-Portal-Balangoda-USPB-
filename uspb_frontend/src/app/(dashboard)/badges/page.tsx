"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BadgeDefinition,
  BadgeStats,
  CreateAwardDto,
  CreateBadgeDto,
  StudentBadgeAward,
  StudentEligibility,
  TakeBackAwardDto,
  UpdateAwardStatusDto,
  UpdateBadgeDto,
  UpdateThresholdDto,
} from "@/types";
import badgeService from "@/services/badgeService";
import schoolService from "@/services/schoolService";
import { StatCard } from "@/components/shared/StatCard";
import BadgeTable from "@/components/badges/BadgeTable";
import BadgeFormModal from "@/components/badges/BadgeFormModal";
import BadgeThresholdModal from "@/components/badges/BadgeThresholdModal";
import BadgeThresholdHistoryModal from "@/components/badges/BadgeThresholdHistoryModal";
import BadgeDetailsModal from "@/components/badges/BadgeDetailsModal";
import BadgeStatusConfirmModal from "@/components/badges/BadgeStatusConfirmModal";
import EligibilityTable from "@/components/badges/EligibilityTable";
import AwardModal from "@/components/badges/AwardModal";
import AwardTable from "@/components/badges/AwardTable";
import AwardDetailsModal from "@/components/badges/AwardDetailsModal";
import AwardStatusModal from "@/components/badges/AwardStatusModal";
import TakeBackModal, { TakeBackTarget } from "@/components/badges/TakeBackModal";
import {
  Award,
  CheckCircle2,
  PauseCircle,
  Trophy,
  Plus,
  AlertCircle,
  X,
  Sparkles,
  Layers,
  GraduationCap,
  History,
} from "lucide-react";

type ActiveTab = "catalog" | "eligibility" | "awards";

export default function BadgeManagementPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("catalog");

  // Global KPI Statistics
  const [stats, setStats] = useState<BadgeStats>({
    total_badges: 0,
    active_badges: 0,
    inactive_badges: 0,
    total_awards: 0,
  });

  // Schools and Badges for Dropdown Filters
  const [schools, setSchools] = useState<Array<{ id: number; name: string }>>([]);
  const [activeBadges, setActiveBadges] = useState<Array<{ id: number; name: string }>>([]);

  // Notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-dismiss notification
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // ==========================================
  // TAB 1: BADGE CATALOG STATE
  // ==========================================
  const [badges, setBadges] = useState<BadgeDefinition[]>([]);
  const [isBadgesLoading, setIsBadgesLoading] = useState(true);
  const [badgeSearch, setBadgeSearch] = useState("");
  const [badgeStatusFilter, setBadgeStatusFilter] = useState("all");
  const [badgeCurrentPage, setBadgeCurrentPage] = useState(1);
  const [badgeTotalPages, setBadgeTotalPages] = useState(1);
  const [badgeTotalCount, setBadgeTotalCount] = useState(0);

  // Badge Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [badgeToEdit, setBadgeToEdit] = useState<BadgeDefinition | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);

  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [badgeForThreshold, setBadgeForThreshold] = useState<BadgeDefinition | null>(null);
  const [isThresholdSubmitting, setIsThresholdSubmitting] = useState(false);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [badgeForHistory, setBadgeForHistory] = useState<BadgeDefinition | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [badgeForStatus, setBadgeForStatus] = useState<BadgeDefinition | null>(null);
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false);

  // ==========================================
  // TAB 2: ELIGIBILITY STATE
  // ==========================================
  const [eligibilityRecords, setEligibilityRecords] = useState<StudentEligibility[]>([]);
  const [isEligibilityLoading, setIsEligibilityLoading] = useState(false);
  const [elSchoolId, setElSchoolId] = useState<number | undefined>();
  const [elBadgeId, setElBadgeId] = useState<number | undefined>();
  const [elEligibleOnly, setElEligibleOnly] = useState<boolean | undefined>();
  const [elAwardedStatus, setElAwardedStatus] = useState<"all" | "awarded" | "not_awarded">("all");
  const [elSearch, setElSearch] = useState("");
  const [elCurrentPage, setElCurrentPage] = useState(1);
  const [elTotalPages, setElTotalPages] = useState(1);
  const [elTotalCount, setElTotalCount] = useState(0);

  // Award Bestowal Modal
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [candidateForAward, setCandidateForAward] = useState<StudentEligibility | null>(null);
  const [isAwardSubmitting, setIsAwardSubmitting] = useState(false);

  // ==========================================
  // TAB 3: AWARD HISTORY STATE
  // ==========================================
  const [awards, setAwards] = useState<StudentBadgeAward[]>([]);
  const [isAwardsLoading, setIsAwardsLoading] = useState(false);
  const [awSchoolId, setAwSchoolId] = useState<number | undefined>();
  const [awBadgeId, setAwBadgeId] = useState<number | undefined>();
  const [awStatusFilter, setAwStatusFilter] = useState<"all" | "awarded" | "revoked">("all");
  const [awStartDate, setAwStartDate] = useState("");
  const [awEndDate, setAwEndDate] = useState("");
  const [awSearch, setAwSearch] = useState("");
  const [awCurrentPage, setAwCurrentPage] = useState(1);
  const [awTotalPages, setAwTotalPages] = useState(1);
  const [awTotalCount, setAwTotalCount] = useState(0);

  const [isAwardDetailsOpen, setIsAwardDetailsOpen] = useState(false);
  const [selectedAward, setSelectedAward] = useState<StudentBadgeAward | null>(null);

  const [isAwardStatusModalOpen, setIsAwardStatusModalOpen] = useState(false);
  const [awardForStatus, setAwardForStatus] = useState<StudentBadgeAward | null>(null);
  const [isAwardStatusSubmitting, setIsAwardStatusSubmitting] = useState(false);

  // Take-Back / Undo Modal State
  const [isTakeBackModalOpen, setIsTakeBackModalOpen] = useState(false);
  const [targetForTakeBack, setTargetForTakeBack] = useState<TakeBackTarget | null>(null);
  const [isTakeBackSubmitting, setIsTakeBackSubmitting] = useState(false);

  // ==========================================
  // DATA FETCHING HOOKS
  // ==========================================

  // Fetch KPI Stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await badgeService.getBadgeStats();
      setStats(data);
    } catch (err) {
      console.warn("Failed to fetch badge statistics:", err);
    }
  }, []);

  // Fetch Filter Dropdowns (Schools & Active Badges)
  const fetchFilterOptions = useCallback(async () => {
    try {
      const [schoolsRes, badgesRes] = await Promise.all([
        schoolService.getSchools({ limit: 100 }),
        badgeService.getActiveBadges(),
      ]);
      setSchools(
        (schoolsRes.schools || []).map((s) => ({ id: s.id, name: s.school_name }))
      );
      setActiveBadges(
        (badgesRes || []).map((b) => ({ id: b.id, name: b.name }))
      );
    } catch (err) {
      console.warn("Failed to load filter options:", err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchFilterOptions();
  }, [fetchStats, fetchFilterOptions]);

  // Fetch Badges
  const fetchBadges = useCallback(async () => {
    setIsBadgesLoading(true);
    try {
      const result = await badgeService.getBadges({
        search: badgeSearch.trim() || undefined,
        status: badgeStatusFilter,
        page: badgeCurrentPage,
        limit: 10,
      });
      setBadges(result.badges || []);
      setBadgeTotalPages(result.total_pages || 1);
      setBadgeTotalCount(result.total_count || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load badges.";
      setError(msg);
      setBadges([]);
    } finally {
      setIsBadgesLoading(false);
    }
  }, [badgeSearch, badgeStatusFilter, badgeCurrentPage]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  // Fetch Eligibility
  const fetchEligibility = useCallback(async () => {
    setIsEligibilityLoading(true);
    try {
      const result = await badgeService.getEligibility({
        schoolId: elSchoolId,
        badgeId: elBadgeId,
        eligibleOnly: elEligibleOnly,
        awardedStatus: elAwardedStatus,
        search: elSearch.trim() || undefined,
        page: elCurrentPage,
        limit: 10,
      });
      setEligibilityRecords(result.records || []);
      setElTotalPages(result.total_pages || 1);
      setElTotalCount(result.total_count || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load eligibility.";
      setError(msg);
      setEligibilityRecords([]);
    } finally {
      setIsEligibilityLoading(false);
    }
  }, [elSchoolId, elBadgeId, elEligibleOnly, elAwardedStatus, elSearch, elCurrentPage]);

  useEffect(() => {
    if (activeTab === "eligibility") {
      fetchEligibility();
    }
  }, [activeTab, fetchEligibility]);

  // Fetch Awards
  const fetchAwards = useCallback(async () => {
    setIsAwardsLoading(true);
    try {
      const result = await badgeService.getAwards({
        schoolId: awSchoolId,
        badgeId: awBadgeId,
        status: awStatusFilter !== "all" ? awStatusFilter : undefined,
        startDate: awStartDate || undefined,
        endDate: awEndDate || undefined,
        search: awSearch.trim() || undefined,
        page: awCurrentPage,
        limit: 10,
      });
      setAwards(result.awards || []);
      setAwTotalPages(result.total_pages || 1);
      setAwTotalCount(result.total_count || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load award records.";
      setError(msg);
      setAwards([]);
    } finally {
      setIsAwardsLoading(false);
    }
  }, [awSchoolId, awBadgeId, awStatusFilter, awStartDate, awEndDate, awSearch, awCurrentPage]);

  useEffect(() => {
    if (activeTab === "awards") {
      fetchAwards();
    }
  }, [activeTab, fetchAwards]);

  // ==========================================
  // ACTION HANDLERS
  // ==========================================

  const handleOpenCreateBadge = () => {
    setBadgeToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditBadge = (badge: BadgeDefinition) => {
    setBadgeToEdit(badge);
    setIsFormModalOpen(true);
  };

  const handleOpenBadgeDetails = (badge: BadgeDefinition) => {
    setSelectedBadge(badge);
    setIsDetailsModalOpen(true);
  };

  const handleOpenReviseThreshold = (badge: BadgeDefinition) => {
    setBadgeForThreshold(badge);
    setIsThresholdModalOpen(true);
  };

  const handleOpenThresholdHistory = (badge: BadgeDefinition) => {
    setBadgeForHistory(badge);
    setIsHistoryModalOpen(true);
  };

  const handleOpenStatusConfirm = (badge: BadgeDefinition) => {
    setBadgeForStatus(badge);
    setIsStatusModalOpen(true);
  };

  const handleSubmitCreateBadge = async (dto: CreateBadgeDto) => {
    setIsFormSubmitting(true);
    try {
      const created = await badgeService.createBadge(dto);
      setIsFormModalOpen(false);
      setSuccessMessage(`Badge "${created.name}" configured successfully.`);
      await Promise.all([fetchBadges(), fetchStats(), fetchFilterOptions()]);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create badge.");
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleSubmitUpdateBadge = async (id: number, dto: UpdateBadgeDto) => {
    setIsFormSubmitting(true);
    try {
      const updated = await badgeService.updateBadge(id, dto);
      setIsFormModalOpen(false);
      setSuccessMessage(`Badge "${updated.name}" updated successfully.`);
      await Promise.all([fetchBadges(), fetchStats(), fetchFilterOptions()]);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update badge.");
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleSubmitThreshold = async (id: number, dto: UpdateThresholdDto) => {
    setIsThresholdSubmitting(true);
    try {
      const updated = await badgeService.updateBadgeThreshold(id, dto);
      setIsThresholdModalOpen(false);
      setSuccessMessage(
        `Milestone for "${updated.name}" revised to ${updated.milestone_threshold.toFixed(0)} pts. Audit log created.`
      );
      await Promise.all([fetchBadges(), fetchStats()]);
      if (activeTab === "eligibility") fetchEligibility();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update threshold.");
    } finally {
      setIsThresholdSubmitting(false);
    }
  };

  const handleConfirmStatusToggle = async () => {
    if (!badgeForStatus) return;
    setIsStatusSubmitting(true);
    try {
      const target = badgeForStatus.status === "active" ? "inactive" : "active";
      const updated = await badgeService.updateBadgeStatus(badgeForStatus.id, target);
      setIsStatusModalOpen(false);
      setBadgeForStatus(null);
      setSuccessMessage(`Badge "${updated.name}" has been ${target}d.`);
      await Promise.all([fetchBadges(), fetchStats(), fetchFilterOptions()]);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to toggle status.");
    } finally {
      setIsStatusSubmitting(false);
    }
  };

  // Eligibility / Bestowal
  const handleOpenBestowAward = (candidate: StudentEligibility) => {
    setCandidateForAward(candidate);
    setIsAwardModalOpen(true);
  };

  const handleSubmitAward = async (dto: CreateAwardDto) => {
    setIsAwardSubmitting(true);
    try {
      const award = await badgeService.createAward(dto);
      setIsAwardModalOpen(false);
      setCandidateForAward(null);
      setSuccessMessage(
        `Badge "${award.badge_name}" successfully bestowed upon ${award.student_name} (${award.award_reference}).`
      );
      await Promise.all([fetchEligibility(), fetchStats()]);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to bestow award.");
    } finally {
      setIsAwardSubmitting(false);
    }
  };

  const handleOpenAwardStatus = (award: StudentBadgeAward) => {
    setAwardForStatus(award);
    setIsAwardStatusModalOpen(true);
  };

  const handleSubmitAwardStatus = async (id: number, dto: UpdateAwardStatusDto) => {
    setIsAwardStatusSubmitting(true);
    try {
      const updated = await badgeService.updateAwardStatus(id, dto);
      setIsAwardStatusModalOpen(false);
      setAwardForStatus(null);
      setSuccessMessage(
        `Award ${updated.award_reference} status successfully changed to '${updated.status}'. Municipal audit log recorded.`
      );
      await Promise.all([fetchAwards(), fetchStats(), fetchEligibility()]);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update award status.");
    } finally {
      setIsAwardStatusSubmitting(false);
    }
  };

  // Take Back / Fault Undo Handlers
  const handleOpenTakeBackEligibility = (record: StudentEligibility) => {
    setTargetForTakeBack({
      award_id: record.award_id,
      student_id: record.student_id,
      badge_id: record.badge_id,
      student_name: record.student_name,
      student_identifier: record.student_identifier,
      school_name: record.school_name,
      badge_name: record.badge_name,
      badge_icon: record.badge_icon,
      award_reference: record.award_reference,
    });
    setIsTakeBackModalOpen(true);
  };

  const handleOpenTakeBackAward = (award: StudentBadgeAward) => {
    setTargetForTakeBack({
      award_id: award.id,
      student_id: award.student_id,
      badge_id: award.badge_id,
      student_name: award.student_name,
      student_identifier: award.student_identifier,
      school_name: award.school_name,
      badge_name: award.badge_name,
      badge_icon: award.badge_icon,
      award_reference: award.award_reference,
    });
    setIsTakeBackModalOpen(true);
  };

  const handleSubmitTakeBack = async (dto: TakeBackAwardDto) => {
    setIsTakeBackSubmitting(true);
    try {
      await badgeService.takeBackAward(dto);
      setIsTakeBackModalOpen(false);
      setTargetForTakeBack(null);
      setSuccessMessage(
        dto.hard_delete
          ? "Award record successfully removed from the database."
          : "Badge award successfully taken back and revoked. Candidate status restored."
      );
      await Promise.all([fetchEligibility(), fetchAwards(), fetchStats()]);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to take back award.");
    } finally {
      setIsTakeBackSubmitting(false);
    }
  };

  const handleExportAwardsCsv = async () => {
    try {
      await badgeService.exportAwardsCsv({
        schoolId: awSchoolId,
        badgeId: awBadgeId,
        status: awStatusFilter !== "all" ? awStatusFilter : undefined,
        startDate: awStartDate || undefined,
        endDate: awEndDate || undefined,
        search: awSearch.trim() || undefined,
      });
      setSuccessMessage("Award history CSV export downloaded successfully.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to export awards.");
    }
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
            Badge Configuration & Award Management
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
            Configure municipal eco-badge milestones, monitor student segregation eligibility,
            and bestow official honours upon participating schools in Balangoda Urban Council.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateBadge}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#800000] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#680000] transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Badge</span>
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
          label="Total Registered Badges"
          value={stats.total_badges}
          description="Configured recognition tiers in Balangoda system"
          icon={<Award className="h-5 w-5" />}
          variant="default"
        />
        <StatCard
          label="Active Badges"
          value={stats.active_badges}
          description="Available for immediate student qualification"
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          label="Inactive Badges"
          value={stats.inactive_badges}
          description="Temporarily paused from award bestowal"
          icon={<PauseCircle className="h-5 w-5" />}
          variant="warning"
        />
        <StatCard
          label="Total Recorded Badge Awards"
          value={stats.total_awards}
          description="Cumulative municipal honours conferred to date"
          icon={<Trophy className="h-5 w-5" />}
          variant="revenue"
        />
      </div>

      {/* Main Navigation Tabs */}
      <div className="border-b border-stone-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`flex items-center gap-2 border-b-2 py-3 px-1 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "catalog"
                ? "border-[#800000] text-[#800000]"
                : "border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-800"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Badge Catalog & Milestones</span>
          </button>

          <button
            onClick={() => setActiveTab("eligibility")}
            className={`flex items-center gap-2 border-b-2 py-3 px-1 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "eligibility"
                ? "border-[#800000] text-[#800000]"
                : "border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-800"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Student Eligibility Management</span>
          </button>

          <button
            onClick={() => setActiveTab("awards")}
            className={`flex items-center gap-2 border-b-2 py-3 px-1 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "awards"
                ? "border-[#800000] text-[#800000]"
                : "border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-800"
            }`}
          >
            <History className="h-4 w-4" />
            <span>Award History & Ledger</span>
          </button>
        </nav>
      </div>

      {/* Tab Panels */}
      {activeTab === "catalog" && (
        <BadgeTable
          badges={badges}
          isLoading={isBadgesLoading}
          search={badgeSearch}
          onSearchChange={(val) => {
            setBadgeSearch(val);
            setBadgeCurrentPage(1);
          }}
          statusFilter={badgeStatusFilter}
          onStatusFilterChange={(val) => {
            setBadgeStatusFilter(val);
            setBadgeCurrentPage(1);
          }}
          currentPage={badgeCurrentPage}
          totalPages={badgeTotalPages}
          totalCount={badgeTotalCount}
          onPageChange={(p) => setBadgeCurrentPage(p)}
          onViewDetails={handleOpenBadgeDetails}
          onEdit={handleOpenEditBadge}
          onReviseThreshold={handleOpenReviseThreshold}
          onViewHistory={handleOpenThresholdHistory}
          onToggleStatus={handleOpenStatusConfirm}
          onRefresh={() => {
            fetchBadges();
            fetchStats();
          }}
          onResetFilters={() => {
            setBadgeSearch("");
            setBadgeStatusFilter("all");
            setBadgeCurrentPage(1);
          }}
        />
      )}

      {activeTab === "eligibility" && (
        <EligibilityTable
          records={eligibilityRecords}
          isLoading={isEligibilityLoading}
          schools={schools}
          badges={activeBadges}
          selectedSchoolId={elSchoolId}
          onSchoolChange={(id) => {
            setElSchoolId(id);
            setElCurrentPage(1);
          }}
          selectedBadgeId={elBadgeId}
          onBadgeChange={(id) => {
            setElBadgeId(id);
            setElCurrentPage(1);
          }}
          eligibleOnly={elEligibleOnly}
          onEligibleOnlyChange={(val) => {
            setElEligibleOnly(val);
            setElCurrentPage(1);
          }}
          awardedStatus={elAwardedStatus}
          onAwardedStatusChange={(status) => {
            setElAwardedStatus(status);
            setElCurrentPage(1);
          }}
          search={elSearch}
          onSearchChange={(val) => {
            setElSearch(val);
            setElCurrentPage(1);
          }}
          currentPage={elCurrentPage}
          totalPages={elTotalPages}
          totalCount={elTotalCount}
          onPageChange={(p) => setElCurrentPage(p)}
          onBestowAward={handleOpenBestowAward}
          onTakeBack={handleOpenTakeBackEligibility}
          onRefresh={() => {
            fetchEligibility();
            fetchStats();
          }}
          onResetFilters={() => {
            setElSearch("");
            setElSchoolId(undefined);
            setElBadgeId(undefined);
            setElEligibleOnly(undefined);
            setElAwardedStatus("all");
            setElCurrentPage(1);
          }}
        />
      )}

      {activeTab === "awards" && (
        <AwardTable
          awards={awards}
          isLoading={isAwardsLoading}
          schools={schools}
          badges={activeBadges}
          selectedSchoolId={awSchoolId}
          onSchoolChange={(id) => {
            setAwSchoolId(id);
            setAwCurrentPage(1);
          }}
          selectedBadgeId={awBadgeId}
          onBadgeChange={(id) => {
            setAwBadgeId(id);
            setAwCurrentPage(1);
          }}
          selectedStatus={awStatusFilter}
          onStatusChange={(status) => {
            setAwStatusFilter(status);
            setAwCurrentPage(1);
          }}
          startDate={awStartDate}
          onStartDateChange={(val) => {
            setAwStartDate(val);
            setAwCurrentPage(1);
          }}
          endDate={awEndDate}
          onEndDateChange={(val) => {
            setAwEndDate(val);
            setAwCurrentPage(1);
          }}
          search={awSearch}
          onSearchChange={(val) => {
            setAwSearch(val);
            setAwCurrentPage(1);
          }}
          currentPage={awCurrentPage}
          totalPages={awTotalPages}
          totalCount={awTotalCount}
          onPageChange={(p) => setAwCurrentPage(p)}
          onViewDetails={(award) => {
            setSelectedAward(award);
            setIsAwardDetailsOpen(true);
          }}
          onChangeStatus={handleOpenAwardStatus}
          onTakeBack={handleOpenTakeBackAward}
          onExportCsv={handleExportAwardsCsv}
          onRefresh={() => {
            fetchAwards();
            fetchStats();
          }}
          onResetFilters={() => {
            setAwSearch("");
            setAwSchoolId(undefined);
            setAwBadgeId(undefined);
            setAwStatusFilter("all");
            setAwStartDate("");
            setAwEndDate("");
            setAwCurrentPage(1);
          }}
        />
      )}

      {/* Modals */}
      <BadgeFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmitCreate={handleSubmitCreateBadge}
        onSubmitUpdate={handleSubmitUpdateBadge}
        badgeToEdit={badgeToEdit}
        isSubmitting={isFormSubmitting}
      />

      <BadgeDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        badge={selectedBadge}
        onEdit={handleOpenEditBadge}
        onReviseThreshold={handleOpenReviseThreshold}
        onViewHistory={handleOpenThresholdHistory}
      />

      <BadgeThresholdModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        badge={badgeForThreshold}
        onSubmitThreshold={handleSubmitThreshold}
        isSubmitting={isThresholdSubmitting}
      />

      <BadgeThresholdHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        badge={badgeForHistory}
      />

      <BadgeStatusConfirmModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setBadgeForStatus(null);
        }}
        badge={badgeForStatus}
        onConfirm={handleConfirmStatusToggle}
        isLoading={isStatusSubmitting}
      />

      <AwardModal
        isOpen={isAwardModalOpen}
        onClose={() => {
          setIsAwardModalOpen(false);
          setCandidateForAward(null);
        }}
        candidate={candidateForAward}
        onSubmitAward={handleSubmitAward}
        isSubmitting={isAwardSubmitting}
      />

      <AwardDetailsModal
        isOpen={isAwardDetailsOpen}
        onClose={() => {
          setIsAwardDetailsOpen(false);
          setSelectedAward(null);
        }}
        award={selectedAward}
        onChangeStatus={handleOpenAwardStatus}
        onTakeBack={handleOpenTakeBackAward}
      />

      <AwardStatusModal
        isOpen={isAwardStatusModalOpen}
        onClose={() => {
          setIsAwardStatusModalOpen(false);
          setAwardForStatus(null);
        }}
        award={awardForStatus}
        onSubmit={handleSubmitAwardStatus}
        isSubmitting={isAwardStatusSubmitting}
      />

      <TakeBackModal
        isOpen={isTakeBackModalOpen}
        onClose={() => {
          setIsTakeBackModalOpen(false);
          setTargetForTakeBack(null);
        }}
        target={targetForTakeBack}
        onSubmit={handleSubmitTakeBack}
        isSubmitting={isTakeBackSubmitting}
      />
    </div>
  );
}
