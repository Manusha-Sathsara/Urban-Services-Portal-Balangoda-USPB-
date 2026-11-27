import api from "@/lib/api";
import {
  ApiResponse,
  AwardListResult,
  BadgeDefinition,
  BadgeListResult,
  BadgeStats,
  BadgeThresholdHistory,
  CreateAwardDto,
  CreateBadgeDto,
  EligibilityListResult,
  StudentBadgeAward,
  StudentEligibility,
  UpdateAwardStatusDto,
  UpdateBadgeDto,
  UpdateThresholdDto,
} from "@/types";

export interface BadgeFilterParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "asc" | "desc";
}

export interface EligibilityFilterParams {
  schoolId?: number;
  badgeId?: number;
  eligibleOnly?: boolean;
  awardedStatus?: "all" | "awarded" | "not_awarded";
  search?: string;
  page?: number;
  limit?: number;
}

export interface AwardFilterParams {
  schoolId?: number;
  badgeId?: number;
  status?: "all" | "awarded" | "revoked";
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const badgeService = {
  /**
   * Fetch paginated list of badge definitions
   */
  async getBadges(params: BadgeFilterParams = {}): Promise<BadgeListResult> {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.status && params.status !== "all") query.append("status", params.status);
    if (params.page) query.append("page", params.page.toString());
    if (params.limit) query.append("limit", params.limit.toString());
    if (params.sortBy) query.append("sort_by", params.sortBy);
    if (params.order) query.append("order", params.order);

    const response = await api.get<ApiResponse<BadgeListResult>>(
      `/badges?${query.toString()}`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to retrieve badges");
    }

    return response.data.data;
  },

  /**
   * Fetch active badges only (for eligibility matrix and dropdowns)
   */
  async getActiveBadges(): Promise<BadgeDefinition[]> {
    const response = await api.get<ApiResponse<BadgeDefinition[]>>("/badges/active");
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to retrieve active badges");
    }
    return response.data.data;
  },

  /**
   * Fetch municipal badge programme indicators
   */
  async getBadgeStats(): Promise<BadgeStats> {
    const response = await api.get<ApiResponse<BadgeStats>>("/badges/stats");
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to retrieve badge statistics");
    }
    return response.data.data;
  },

  /**
   * Fetch single badge definition by ID
   */
  async getBadgeById(id: number): Promise<BadgeDefinition> {
    const response = await api.get<ApiResponse<BadgeDefinition>>(`/badges/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to retrieve badge details");
    }
    return response.data.data;
  },

  /**
   * Fetch historical threshold revisions for a badge definition
   */
  async getThresholdHistory(id: number): Promise<BadgeThresholdHistory[]> {
    const response = await api.get<ApiResponse<BadgeThresholdHistory[]>>(
      `/badges/${id}/threshold-history`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to retrieve threshold history");
    }
    return response.data.data;
  },

  /**
   * Register a new badge definition
   */
  async createBadge(dto: CreateBadgeDto): Promise<BadgeDefinition> {
    const response = await api.post<ApiResponse<BadgeDefinition>>("/badges", dto);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to create badge definition");
    }
    return response.data.data;
  },

  /**
   * Update badge metadata (name, description, icon)
   */
  async updateBadge(id: number, dto: UpdateBadgeDto): Promise<BadgeDefinition> {
    const response = await api.put<ApiResponse<BadgeDefinition>>(`/badges/${id}`, dto);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to update badge definition");
    }
    return response.data.data;
  },

  /**
   * Toggle badge operational status
   */
  async updateBadgeStatus(
    id: number,
    status: "active" | "inactive"
  ): Promise<BadgeDefinition> {
    const response = await api.patch<ApiResponse<BadgeDefinition>>(
      `/badges/${id}/status`,
      { status }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to update badge status");
    }
    return response.data.data;
  },

  /**
   * Revise milestone threshold with mandatory reason
   */
  async updateBadgeThreshold(
    id: number,
    dto: UpdateThresholdDto
  ): Promise<BadgeDefinition> {
    const response = await api.patch<ApiResponse<BadgeDefinition>>(
      `/badges/${id}/threshold`,
      dto
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to update milestone threshold");
    }
    return response.data.data;
  },

  /**
   * Fetch calculated student eligibility matrix
   */
  async getEligibility(params: EligibilityFilterParams = {}): Promise<EligibilityListResult> {
    const query = new URLSearchParams();
    if (params.schoolId) query.append("school_id", params.schoolId.toString());
    if (params.badgeId) query.append("badge_id", params.badgeId.toString());
    if (params.eligibleOnly !== undefined) query.append("eligible_only", params.eligibleOnly.toString());
    if (params.awardedStatus && params.awardedStatus !== "all") {
      query.append("awarded_status", params.awardedStatus);
    }
    if (params.search) query.append("search", params.search);
    if (params.page) query.append("page", params.page.toString());
    if (params.limit) query.append("limit", params.limit.toString());

    const response = await api.get<ApiResponse<EligibilityListResult>>(
      `/badges/eligibility?${query.toString()}`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to retrieve student eligibility");
    }

    return response.data.data;
  },

  /**
   * Record a new badge award for an eligible student
   */
  async createAward(dto: CreateAwardDto): Promise<StudentBadgeAward> {
    const response = await api.post<ApiResponse<StudentBadgeAward>>(
      "/badges/awards",
      dto
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to record badge award");
    }

    return response.data.data;
  },

  /**
   * Update the status of an existing badge award (e.g. awarded <-> revoked)
   */
  async updateAwardStatus(id: number, dto: UpdateAwardStatusDto): Promise<StudentBadgeAward> {
    const response = await api.patch<ApiResponse<StudentBadgeAward>>(
      `/badges/awards/${id}/status`,
      dto
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to update award status");
    }

    return response.data.data;
  },

  /**
   * Fetch recorded badge awards
   */
  async getAwards(params: AwardFilterParams = {}): Promise<AwardListResult> {
    const query = new URLSearchParams();
    if (params.schoolId) query.append("school_id", params.schoolId.toString());
    if (params.badgeId) query.append("badge_id", params.badgeId.toString());
    if (params.status && params.status !== "all") query.append("status", params.status);
    if (params.search) query.append("search", params.search);
    if (params.startDate) query.append("start_date", params.startDate);
    if (params.endDate) query.append("end_date", params.endDate);
    if (params.page) query.append("page", params.page.toString());
    if (params.limit) query.append("limit", params.limit.toString());

    const response = await api.get<ApiResponse<AwardListResult>>(
      `/badges/awards?${query.toString()}`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to retrieve awards");
    }

    return response.data.data;
  },

  /**
   * Fetch single award record by ID
   */
  async getAwardById(id: number): Promise<StudentBadgeAward> {
    const response = await api.get<ApiResponse<StudentBadgeAward>>(
      `/badges/awards/${id}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to retrieve award details");
    }
    return response.data.data;
  },

  /**
   * Export awards history as CSV download
   */
  async exportAwardsCsv(params: AwardFilterParams = {}): Promise<void> {
    const query = new URLSearchParams();
    if (params.schoolId) query.append("school_id", params.schoolId.toString());
    if (params.badgeId) query.append("badge_id", params.badgeId.toString());
    if (params.status && params.status !== "all") query.append("status", params.status);
    if (params.search) query.append("search", params.search);
    if (params.startDate) query.append("start_date", params.startDate);
    if (params.endDate) query.append("end_date", params.endDate);

    const response = await api.get(`/badges/awards/export/csv?${query.toString()}`, {
      responseType: "blob",
    });

    const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `uspb_badge_awards_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default badgeService;
