import api from "@/lib/api";
import {
  ApiResponse,
  CategoryListResult,
  CategoryRateHistory,
  CategoryStats,
  CreateCategoryDto,
  UpdateCategoryDto,
  UpdateRateDto,
  WasteCategory,
} from "@/types";

export interface CategoryFilterParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "asc" | "desc";
}

export const categoryService = {
  /**
   * Fetch paginated list of waste categories with search, status filtering, and sorting
   */
  async getCategories(params: CategoryFilterParams = {}): Promise<CategoryListResult> {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.status && params.status !== "all") query.append("status", params.status);
    if (params.page) query.append("page", params.page.toString());
    if (params.limit) query.append("limit", params.limit.toString());
    if (params.sortBy) query.append("sort_by", params.sortBy);
    if (params.order) query.append("order", params.order);

    const response = await api.get<ApiResponse<CategoryListResult>>(
      `/categories?${query.toString()}`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to retrieve waste categories");
    }

    return response.data.data;
  },

  /**
   * Fetch active categories only (used for collections and teacher dropdowns)
   */
  async getActiveCategories(): Promise<WasteCategory[]> {
    const response = await api.get<ApiResponse<WasteCategory[]>>("/categories/active");
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to retrieve active categories");
    }
    return response.data.data;
  },

  /**
   * Fetch aggregated municipal waste category metrics
   */
  async getCategoryStats(): Promise<CategoryStats> {
    const response = await api.get<ApiResponse<CategoryStats>>("/categories/stats");
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to retrieve category statistics");
    }
    return response.data.data;
  },

  /**
   * Fetch single category details by ID
   */
  async getCategoryById(id: number): Promise<WasteCategory> {
    const response = await api.get<ApiResponse<WasteCategory>>(`/categories/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to retrieve category details");
    }
    return response.data.data;
  },

  /**
   * Fetch rate change history timeline for a category
   */
  async getRateHistory(id: number): Promise<CategoryRateHistory[]> {
    const response = await api.get<ApiResponse<CategoryRateHistory[]>>(
      `/categories/${id}/rate-history`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to retrieve rate history");
    }
    return response.data.data;
  },

  /**
   * Create a new waste category with initial baseline rate
   */
  async createCategory(dto: CreateCategoryDto): Promise<WasteCategory> {
    const response = await api.post<ApiResponse<WasteCategory>>("/categories", dto);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to create waste category");
    }
    return response.data.data;
  },

  /**
   * Update category metadata (name, description, measurement unit if eligible)
   */
  async updateCategory(id: number, dto: UpdateCategoryDto): Promise<WasteCategory> {
    const response = await api.put<ApiResponse<WasteCategory>>(`/categories/${id}`, dto);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to update waste category");
    }
    return response.data.data;
  },

  /**
   * Toggle category activation status (active / inactive)
   */
  async updateCategoryStatus(
    id: number,
    status: "active" | "inactive"
  ): Promise<WasteCategory> {
    const response = await api.patch<ApiResponse<WasteCategory>>(
      `/categories/${id}/status`,
      { status }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to update category status");
    }
    return response.data.data;
  },

  /**
   * Revise point rate with audit reason
   */
  async updateCategoryRate(id: number, dto: UpdateRateDto): Promise<WasteCategory> {
    const response = await api.patch<ApiResponse<WasteCategory>>(
      `/categories/${id}/rate`,
      dto
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to update category point rate");
    }
    return response.data.data;
  },

  /**
   * Delete category (admin only, blocked if collections exist)
   */
  async deleteCategory(id: number): Promise<void> {
    const response = await api.delete<ApiResponse<null>>(`/categories/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || "Failed to delete waste category");
    }
  },
};

export default categoryService;
