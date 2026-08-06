import { campaigns, inventories, members, operationsDashboard, products, refunds } from "@/mock/ecommerce";
import type {
  CampaignRecord,
  InventoryListQuery,
  InventoryPageResult,
  MemberListQuery,
  MemberPageResult,
  OperationsDashboardData,
  ProductListQuery,
  ProductPageResult,
  ProductRecord,
  RefundListQuery,
  RefundPageResult,
} from "@/types/ecommerce";

const MOCK_RESPONSE_DELAY = 120;

/** 模拟网络延迟与深拷贝，确保页面不会直接修改演示数据源。 */
function resolveMockData<TData>(data: TData): Promise<TData> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(structuredClone(data)), MOCK_RESPONSE_DELAY);
  });
}

/** 统一实现业务列表的关键词、排序和分页，未来替换成真实接口时保留页面调用契约。 */
function createPageResult<TItem extends object>(
  source: TItem[],
  query: { keyword?: string; page?: number; pageSize?: number; sortBy?: string; sortOrder?: "asc" | "desc" },
  searchFields: Array<keyof TItem>,
): { list: TItem[]; total: number; page: number; pageSize: number } {
  const keyword = query.keyword?.trim().toLocaleLowerCase("zh-CN") ?? "";
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const pageSize = Math.max(1, Math.floor(query.pageSize ?? 10));
  let items = [...source];

  if (keyword) {
    items = items.filter((item) => searchFields.some((field) => String(item[field] ?? "").toLocaleLowerCase("zh-CN").includes(keyword)));
  }

  if (query.sortBy && searchFields.includes(query.sortBy as keyof TItem)) {
    const field = query.sortBy as keyof TItem;
    const direction = query.sortOrder === "asc" ? 1 : -1;
    items.sort((left, right) => String(left[field] ?? "").localeCompare(String(right[field] ?? ""), "zh-Hans-CN", { numeric: true }) * direction);
  }

  return { list: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize };
}

export function getOperationsDashboard(): Promise<OperationsDashboardData> {
  return resolveMockData(operationsDashboard);
}

export function getProducts(query: ProductListQuery): Promise<ProductPageResult> {
  const filteredProducts = products.filter((item) => !query.status || item.status === query.status);
  return resolveMockData(createPageResult(filteredProducts, query, ["name", "sku", "category", "updatedAt", "sales", "stock"])) as Promise<ProductPageResult>;
}

export function getRefunds(query: RefundListQuery): Promise<RefundPageResult> {
  const filteredRefunds = refunds.filter((item) => !query.status || item.status === query.status);
  return resolveMockData(createPageResult(filteredRefunds, query, ["refundNo", "orderNo", "memberName", "reason", "requestedAt"])) as Promise<RefundPageResult>;
}

export function getMembers(query: MemberListQuery): Promise<MemberPageResult> {
  const filteredMembers = members.filter((item) => !query.level || item.level === query.level);
  return resolveMockData(createPageResult(filteredMembers, query, ["name", "phone", "level", "lastOrderAt"])) as Promise<MemberPageResult>;
}

export function getInventory(query: InventoryListQuery): Promise<InventoryPageResult> {
  const filteredInventory = inventories.filter((item) => !query.status || item.status === query.status);
  return resolveMockData(createPageResult(filteredInventory, query, ["sku", "productName", "warehouse", "updatedAt", "available"])) as Promise<InventoryPageResult>;
}

export function getCampaigns(): Promise<CampaignRecord[]> {
  return resolveMockData(campaigns);
}

/** 商品上下架只在当前演示会话生效，真实项目应由具备商品权限的服务端接口处理。 */
export function updateProductStatus(productId: string, status: ProductRecord["status"]): Promise<ProductRecord> {
  const product = products.find((item) => item.id === productId);
  if (!product) return Promise.reject(new Error("未找到要更新的商品，请刷新列表后重试。"));
  product.status = status;
  product.updatedAt = "刚刚";
  return resolveMockData(product);
}
