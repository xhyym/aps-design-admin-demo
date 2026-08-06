import type { PageResult, SortOrder } from "./api";

export type ProductStatus = "on_sale" | "draft" | "archived";
export type RefundStatus = "pending" | "reviewing" | "approved" | "rejected" | "completed";
export type MemberLevel = "黑金会员" | "铂金会员" | "黄金会员" | "普通会员";
export type CampaignStatus = "scheduled" | "running" | "ended";
export type StockStatus = "healthy" | "warning" | "critical";

export interface ProductRecord {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  sales: number;
  status: ProductStatus;
  updatedAt: string;
  coverTone: "blue" | "orange" | "purple" | "green" | "graphite";
}

export interface RefundRecord {
  id: string;
  refundNo: string;
  orderNo: string;
  memberName: string;
  reason: string;
  amount: number;
  status: RefundStatus;
  requestedAt: string;
}

export interface MemberRecord {
  id: string;
  name: string;
  phone: string;
  level: MemberLevel;
  tags: string[];
  totalSpent: number;
  orderCount: number;
  lastOrderAt: string;
  status: "normal" | "silent" | "risk";
}

export interface CampaignRecord {
  id: string;
  name: string;
  type: "优惠券" | "满减" | "限时折扣" | "会员专享";
  status: CampaignStatus;
  period: string;
  target: string;
  progress: number;
  revenue: number;
}

export interface InventoryRecord {
  id: string;
  sku: string;
  productName: string;
  warehouse: string;
  available: number;
  locked: number;
  safetyStock: number;
  status: StockStatus;
  updatedAt: string;
}

export interface OperationsMetric {
  label: string;
  value: string;
  detail: string;
  trend: string;
  tone: "info" | "success" | "warning" | "danger";
  icon: "chart" | "grid" | "users" | "warning";
}

export interface OperationsTodo {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  path: string;
  tone: "warning" | "info" | "danger";
}

export interface OperationsDashboardData {
  updatedAt: string;
  metrics: OperationsMetric[];
  todos: OperationsTodo[];
  salesCategories: string[];
  salesSeries: Array<{ name: string; data: number[] }>;
  channelSeries: Array<{ name: string; data: number[] }>;
  channelCategories: string[];
  recentOrders: Array<{ id: string; orderNo: string; memberName: string; amount: number; status: string; createdAt: string }>;
}

export interface ProductListQuery {
  keyword?: string;
  status?: ProductStatus | "";
  page?: number;
  pageSize?: number;
  sortBy?: "updatedAt" | "sales" | "stock";
  sortOrder?: SortOrder;
}

export interface RefundListQuery {
  keyword?: string;
  status?: RefundStatus | "";
  page?: number;
  pageSize?: number;
}

export interface MemberListQuery {
  keyword?: string;
  level?: MemberLevel | "";
  page?: number;
  pageSize?: number;
}

export interface InventoryListQuery {
  keyword?: string;
  status?: StockStatus | "";
  page?: number;
  pageSize?: number;
}

export type ProductPageResult = PageResult<ProductRecord>;
export type RefundPageResult = PageResult<RefundRecord>;
export type MemberPageResult = PageResult<MemberRecord>;
export type InventoryPageResult = PageResult<InventoryRecord>;
