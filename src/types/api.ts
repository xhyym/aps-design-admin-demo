/** 后端统一响应结构，所有业务接口均保持一致。 */
export interface ApiResponse<TData> {
  code: number;
  message: string;
  data: TData;
  timestamp: number;
}

/** 列表接口统一使用分页载荷，避免页面直接依赖特定后端字段。 */
export interface PageResult<TItem> {
  list: TItem[];
  total: number;
  page: number;
  pageSize: number;
}

export type SortOrder = "asc" | "desc";
