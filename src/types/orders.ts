import type { PageResult, SortOrder } from "./api";

export type OrderStatus = "pending_payment" | "paid" | "fulfilling" | "shipped" | "completed" | "cancelled";

export interface OrderItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderTimelineItem {
  time: string;
  title: string;
  description: string;
}

export interface SalesOrder {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  channel: string;
  productSummary: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
  paidAt?: string;
  recipient: string;
  shippingAddress: string;
  trackingNo?: string;
  items: OrderItem[];
  timeline: OrderTimelineItem[];
}

export interface OrderListQuery {
  keyword?: string;
  status?: OrderStatus;
  channel?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "amount";
  sortOrder?: SortOrder;
}

/** 导出复用列表筛选和排序，但不携带当前页码与页容量。 */
export type OrderExportQuery = Omit<OrderListQuery, "page" | "pageSize">;

export type OrderPageResult = PageResult<SalesOrder>;
