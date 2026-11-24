import api from "@/lib/api";
import {
  ApiResponse,
  CreateSchoolDto,
  School,
  SchoolListResult,
  SchoolStats,
  UpdateSchoolDto,
} from "@/types";

export interface SchoolFilterParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const schoolService = {
  /**
   * Fetch paginated list of schools with optional search and status filtering
   */
  async getSchools(params: SchoolFilterParams = {}): Promise<SchoolListResult> {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.status && params.status !== "all") query.append("status", params.status);
    if (params.page) query.append("page", params.page.toString());
    if (params.limit) query.append("limit", params.limit.toString());

    const response = await api.get<ApiResponse<SchoolListResult>>(
      `/schools?${query.toString()}`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to retrieve schools");
    }

    return response.data.data;
  },

  /**
   * Fetch global municipal program statistics across all schools
   */
  async getSchoolStats(): Promise<SchoolStats> {
    const response = await api.get<ApiResponse<SchoolStats>>("/schools/stats");
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to retrieve school statistics");
    }
    return response.data.data;
  },

  /**
   * Fetch a single school by ID
   */
  async getSchoolById(id: number): Promise<School> {
    const response = await api.get<ApiResponse<School>>(`/schools/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to retrieve school details");
    }
    return response.data.data;
  },

  /**
   * Register a new school
   */
  async createSchool(dto: CreateSchoolDto): Promise<School> {
    const response = await api.post<ApiResponse<School>>("/schools", dto);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to register school");
    }
    return response.data.data;
  },

  /**
   * Update an existing school's details
   */
  async updateSchool(id: number, dto: UpdateSchoolDto): Promise<School> {
    const response = await api.put<ApiResponse<School>>(`/schools/${id}`, dto);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to update school details");
    }
    return response.data.data;
  },

  /**
   * Activate or deactivate a school
   */
  async updateSchoolStatus(
    id: number,
    status: "active" | "inactive"
  ): Promise<School> {
    const response = await api.patch<ApiResponse<School>>(`/schools/${id}/status`, {
      status,
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to update school status");
    }
    return response.data.data;
  },

  /**
   * Delete a school (only permitted if no historical records exist)
   */
  async deleteSchool(id: number): Promise<void> {
    const response = await api.delete<ApiResponse<null>>(`/schools/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || "Failed to delete school record");
    }
  },
};

export default schoolService;
