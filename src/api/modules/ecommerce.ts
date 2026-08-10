import { request } from "../client";
import { campaigns, inventories, members, operationsDashboard } from "@/mock/ecommerce";
import type {
  CampaignRecord,
  InventoryListQuery,
  InventoryPageResult,
  MemberListQuery,
  MemberPageResult,
  OperationsDashboardData,
  ProductBatchUpdateInput,
  ProductCategory,
  ProductCategorySaveInput,
  ProductCategoryTreeNode,
  ProductDetail,
  ProductImportResult,
  ProductListQuery,
  ProductPageResult,
  ProductRecord,
  ProductSaveInput,
  RefundListQuery,
  RefundPageResult,
  RefundRecord,
  RefundReviewInput,
  RefundSaveInput,
  SpecificationTemplate,
  SpecificationTemplateListQuery,
  SpecificationTemplatePageResult,
  SpecificationTemplateSaveInput,
} from "@/types/ecommerce";

const MOCK_RESPONSE_DELAY = 120;

/** 非商品模块保持原有轻量读取方式，商品主流程已迁入统一请求契约。 */
function resolveMockData<TData>(data: TData): Promise<TData> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(structuredClone(data)), MOCK_RESPONSE_DELAY);
  });
}

/** 商品列表只传递筛选、分页与排序条件，服务端返回轻量记录。 */
export function getProducts(query: ProductListQuery): Promise<ProductPageResult> {
  return request<ProductPageResult>({ url: "/business/products", method: "get", params: query });
}

export function getProduct(id: string): Promise<ProductDetail> {
  return request<ProductDetail>({ url: `/business/products/${encodeURIComponent(id)}`, method: "get" });
}

/** 分类树是商品筛选、商品编辑与分类维护的唯一数据源。 */
export function getProductCategoryTree(): Promise<ProductCategoryTreeNode> {
  return request<ProductCategoryTreeNode>({ url: "/business/product-categories", method: "get" });
}

export function createProductCategory(input: ProductCategorySaveInput): Promise<ProductCategory> {
  return request<ProductCategory>({ url: "/business/product-categories", method: "post", data: input });
}

export function updateProductCategory(id: string, input: ProductCategorySaveInput): Promise<ProductCategory> {
  return request<ProductCategory>({ url: `/business/product-categories/${encodeURIComponent(id)}`, method: "put", data: input });
}

/** 删除前由服务端校验子分类及直接关联商品，避免产生无法追溯的分类引用。 */
export function removeProductCategory(id: string): Promise<null> {
  return request<null>({ url: `/business/product-categories/${encodeURIComponent(id)}`, method: "delete" });
}

/** 规格模板接口保持独立资源契约，页面可直接替换为真实服务地址。 */
export function getSpecificationTemplates(query: SpecificationTemplateListQuery): Promise<SpecificationTemplatePageResult> {
  return request<SpecificationTemplatePageResult>({ url: "/business/specification-templates", method: "get", params: query });
}

export function createSpecificationTemplate(input: SpecificationTemplateSaveInput): Promise<SpecificationTemplate> {
  return request<SpecificationTemplate>({ url: "/business/specification-templates", method: "post", data: input });
}

export function updateSpecificationTemplate(id: string, input: SpecificationTemplateSaveInput): Promise<SpecificationTemplate> {
  return request<SpecificationTemplate>({ url: `/business/specification-templates/${encodeURIComponent(id)}`, method: "put", data: input });
}

export function removeSpecificationTemplate(id: string): Promise<null> {
  return request<null>({ url: `/business/specification-templates/${encodeURIComponent(id)}`, method: "delete" });
}

export function createProduct(input: ProductSaveInput): Promise<ProductDetail> {
  return request<ProductDetail>({ url: "/business/products", method: "post", data: input });
}

export function updateProduct(id: string, input: ProductSaveInput): Promise<ProductDetail> {
  return request<ProductDetail>({ url: `/business/products/${encodeURIComponent(id)}`, method: "put", data: input });
}

/** 删除商品使用资源地址表达目标，避免将商品标识混入请求体。 */
export function removeProduct(id: string): Promise<null> {
  return request<null>({ url: `/business/products/${encodeURIComponent(id)}`, method: "delete" });
}

export function batchUpdateProducts(input: ProductBatchUpdateInput): Promise<ProductRecord[]> {
  return request<ProductRecord[]>({ url: "/business/products/batch", method: "patch", data: input });
}

/** 上传文件保持独立接口，避免商品导入把文件对象混入常规 JSON 业务载荷。 */
export function importProducts(file: File, signal: AbortSignal): Promise<ProductImportResult> {
  const formData = new FormData();
  formData.append("file", file, file.name);
  return request<ProductImportResult>({ url: "/business/products/import", method: "post", data: formData, signal });
}

export function exportProducts(query: Omit<ProductListQuery, "page" | "pageSize">): Promise<ProductRecord[]> {
  return request<ProductRecord[]>({ url: "/business/products/export", method: "get", params: query });
}

export function getOperationsDashboard(): Promise<OperationsDashboardData> {
  return resolveMockData(operationsDashboard);
}

export function getRefunds(query: RefundListQuery): Promise<RefundPageResult> {
  return request<RefundPageResult>({ url: "/business/refunds", method: "get", params: query });
}

/** 退款申请由客服代客创建，审核状态始终由后续审核接口维护。 */
export function createRefund(input: RefundSaveInput): Promise<RefundRecord> {
  return request<RefundRecord>({ url: "/business/refunds", method: "post", data: input });
}

/** 仅允许修改尚未完成审核的申请信息，防止覆盖已落库的审核结论。 */
export function updateRefund(id: string, input: RefundSaveInput): Promise<RefundRecord> {
  return request<RefundRecord>({ url: `/business/refunds/${encodeURIComponent(id)}`, method: "put", data: input });
}

/** 审核动作以明确语义提交，不开放页面直接写入退款状态。 */
export function reviewRefund(id: string, input: RefundReviewInput): Promise<RefundRecord> {
  return request<RefundRecord>({ url: `/business/refunds/${encodeURIComponent(id)}/review`, method: "patch", data: input });
}

/** 仅待审核或已拒绝记录允许移除，已通过的财务记录必须保留。 */
export function removeRefund(id: string): Promise<null> {
  return request<null>({ url: `/business/refunds/${encodeURIComponent(id)}`, method: "delete" });
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

/** 其余列表的筛选、排序和分页保持既有行为，避免本轮改造波及未改造业务模块。 */
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
