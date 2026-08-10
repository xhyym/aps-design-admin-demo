import { request } from "../client";
import type { ExportTask } from "aps-design-pro";
import type { OrderExportQuery, OrderListQuery, OrderPageResult, OrderStatusActionInput, SalesOrder } from "@/types/orders";

/** 订单查询参数保持为稳定基础类型，后端替换时页面无需改变状态结构。 */
export function getOrders(query: OrderListQuery): Promise<OrderPageResult> {
  return request<OrderPageResult>({ url: "/business/orders", method: "get", params: query });
}

export function getOrder(id: string): Promise<SalesOrder> {
  return request<SalesOrder>({ url: `/business/orders/${encodeURIComponent(id)}`, method: "get" });
}

/** 静态 demo 通过同一状态操作契约模拟催付、履约和订单关闭，真实服务可直接替换实现。 */
export function updateOrderStatus(id: string, input: OrderStatusActionInput): Promise<SalesOrder> {
  return request<SalesOrder>({ url: `/business/orders/${encodeURIComponent(id)}/status`, method: "patch", data: input });
}

export function exportOrders(query: Omit<OrderListQuery, "page" | "pageSize">): Promise<SalesOrder[]> {
  return request<SalesOrder[]>({ url: "/business/orders/export", method: "get", params: query });
}

/** 导出任务由服务端创建并异步推进，页面不再自行伪造进度或完成状态。 */
export function createOrderExportTask(query: OrderExportQuery): Promise<ExportTask> {
  return request<ExportTask>({ url: "/business/orders/export-tasks", method: "post", data: query });
}

export function getOrderExportTasks(): Promise<ExportTask[]> {
  return request<ExportTask[]>({ url: "/business/orders/export-tasks", method: "get" });
}

export function retryOrderExportTask(id: string): Promise<ExportTask> {
  return request<ExportTask>({ url: `/business/orders/export-tasks/${encodeURIComponent(id)}/retry`, method: "post" });
}

export function removeOrderExportTask(id: string): Promise<void> {
  return request<void>({ url: `/business/orders/export-tasks/${encodeURIComponent(id)}`, method: "delete" });
}

/** 真实后端可在此处直接返回受鉴权文件流；当前页面统一将数据转换为 CSV 下载。 */
export function downloadOrderExportTask(id: string): Promise<SalesOrder[]> {
  return request<SalesOrder[]>({ url: `/business/orders/export-tasks/${encodeURIComponent(id)}/download`, method: "get" });
}
