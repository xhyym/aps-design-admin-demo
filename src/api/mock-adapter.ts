import type { AxiosAdapter, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import dashboardResponse from "@/mock/dashboard.json";
import { productCategories, productDetails, refunds, specificationTemplates } from "@/mock/ecommerce";
import loginResponse from "@/mock/login.json";
import menusResponse from "@/mock/menus.json";
import ordersResponse from "@/mock/orders.json";
import rolesResponse from "@/mock/roles.json";
import usersResponse from "@/mock/users.json";
import type { ApiResponse, PageResult } from "@/types/api";
import type { LoginResult } from "@/types/auth";
import type { DashboardData } from "@/types/dashboard";
import type { UploadedFile } from "@/types/files";
import type { ExportTask, UploadChunkSession } from "aps-design-pro";
import type { OrderExportQuery, OrderStatusAction, OrderStatusActionInput, OrderStatus, SalesOrder } from "@/types/orders";
import type { ProductBatchUpdateInput, ProductCategory, ProductCategorySaveInput, ProductCategoryTreeNode, ProductDetail, ProductImportResult, ProductListQuery, ProductMedia, ProductPageResult, ProductRecord, ProductSaveInput, ProductSku, ProductSpecification, ProductStatus, RefundListQuery, RefundPageResult, RefundRecord, RefundReviewInput, RefundSaveInput, RefundType, SpecificationTemplate, SpecificationTemplateAttribute, SpecificationTemplatePageResult, SpecificationTemplateSaveInput, SpecificationTemplateStatus } from "@/types/ecommerce";
import type { SystemMenu, SystemMenuInput, SystemRole, SystemRoleInput, SystemUser, SystemUserInput, UserStatus } from "@/types/system";

type AdapterData = LoginResult | DashboardData | PageResult<SystemUser> | PageResult<SystemRole> | PageResult<SystemMenu> | PageResult<SalesOrder> | ProductPageResult | RefundPageResult | SpecificationTemplatePageResult | SystemUser | SystemRole | SystemMenu | SalesOrder | SalesOrder[] | ProductDetail | ProductRecord[] | ProductImportResult | ProductCategory | ProductCategoryTreeNode | RefundRecord | SpecificationTemplate | ExportTask | ExportTask[] | UploadChunkSession | UploadedFile | null;
type AdapterResponse = ApiResponse<AdapterData>;
type CollectionKey = "users" | "roles" | "menus" | "products" | "productCategories" | "refunds" | "specificationTemplates" | "orders";
type UserStatusPayload = { ids: string[]; status: UserStatus };

const RESPONSE_DELAY = 180;
const ORDER_EXPORT_TASK_STORAGE_PREFIX = "aps:order-export-tasks:v1";
const ORDER_EXPORT_TASK_COMPLETE_DELAY = 1_800;
const CHUNK_UPLOAD_SESSION_STORAGE_PREFIX = "aps:chunk-upload-sessions:v1";
const CHUNK_UPLOAD_SESSION_TTL = 24 * 60 * 60 * 1_000;
const STORAGE_KEYS: Record<CollectionKey, string> = {
  users: "aps-data-users",
  roles: "aps-data-roles",
  menus: "aps-data-menus",
  products: "aps-data-products",
  productCategories: "aps-data-product-categories",
  refunds: "aps-data-refunds",
  specificationTemplates: "aps-data-specification-templates",
  orders: "aps-data-orders",
};
const PRODUCT_CATEGORY_VALUE_MAP: Record<string, string> = {
  "咖啡器具": "coffee-tools",
  "即饮咖啡": "ready-to-drink",
  "咖啡豆": "coffee-beans",
  "礼盒": "gift-boxes",
  "生活方式": "lifestyle",
  "待分类": "unclassified",
};
const MOCK_PRODUCT_TARGET_COUNT = 10_000;
const MOCK_PRODUCT_CATEGORY_OPTIONS: Array<{ name: string; code: string }> = [
  { name: "咖啡器具", code: "coffee-tools" },
  { name: "即饮咖啡", code: "ready-to-drink" },
  { name: "咖啡豆", code: "coffee-beans" },
  { name: "礼盒", code: "gift-boxes" },
  { name: "生活方式", code: "lifestyle" },
  { name: "待分类", code: "unclassified" },
];
const PRODUCT_CATEGORY_ROOT_CODE = "all-products";

interface OrderStatusActionDefinition {
  from: OrderStatus;
  to?: OrderStatus;
  title: string;
  description: string;
}

/** 静态演示也遵循真实订单状态机，避免页面可执行不符合业务规则的跳转。 */
const ORDER_STATUS_ACTIONS: Record<OrderStatusAction, OrderStatusActionDefinition> = {
  remind_payment: { from: "pending_payment", title: "已发送付款提醒", description: "已向客户发送付款提醒。" },
  cancel: { from: "pending_payment", to: "cancelled", title: "订单已关闭", description: "运营人员已关闭未支付订单。" },
  start_fulfillment: { from: "paid", to: "fulfilling", title: "开始履约", description: "订单已进入履约处理流程。" },
  mark_shipped: { from: "fulfilling", to: "shipped", title: "订单已交付", description: "订单已完成发货或权益交付。" },
  complete: { from: "shipped", to: "completed", title: "订单已完成", description: "订单已完成全部履约流程。" },
};

const database = {
  users: readCollection<SystemUser>(STORAGE_KEYS.users, (usersResponse as ApiResponse<PageResult<SystemUser>>).data.list),
  roles: readCollection<SystemRole>(STORAGE_KEYS.roles, (rolesResponse as ApiResponse<PageResult<SystemRole>>).data.list),
  menus: readCollection<SystemMenu>(STORAGE_KEYS.menus, (menusResponse as ApiResponse<PageResult<SystemMenu>>).data.list),
  productCategories: readCollection<ProductCategory>(STORAGE_KEYS.productCategories, productCategories),
  refunds: readCollection<RefundRecord>(STORAGE_KEYS.refunds, refunds),
  specificationTemplates: readCollection<SpecificationTemplate>(STORAGE_KEYS.specificationTemplates, specificationTemplates),
  orders: readCollection<SalesOrder>(STORAGE_KEYS.orders, (ordersResponse as ApiResponse<SalesOrder[]>).data),
  products: readCollection<ProductDetail>(STORAGE_KEYS.products, productDetails).map(normalizeStoredProductCategoryPath),
};
/** 大数据量商品不写入 sessionStorage，避免刷新页面时序列化 1 万条完整商品详情。 */
const generatedProducts = createGeneratedProducts(Math.max(0, MOCK_PRODUCT_TARGET_COUNT - database.products.length));

interface StoredOrderExportTask {
  task: ExportTask;
  query: OrderExportQuery;
  startedAt: number;
}

interface StoredOrderExportTaskValue {
  task?: Partial<ExportTask>;
  query?: OrderExportQuery;
  startedAt?: number;
}

interface ChunkUploadSessionPayload {
  fileKey: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  chunkSize: number;
  totalChunks: number;
}

interface ChunkUploadCompletePayload {
  fileKey: string;
  totalChunks: number;
}

interface StoredChunkUploadSession extends ChunkUploadSessionPayload {
  id: string;
  uploadedChunkIndexes: number[];
  completed: boolean;
  fileId?: string;
  updatedAt: number;
}

/** 将业务返回转换为 Axios 响应，页面与后续真实服务保持同一调用方式。 */
function createAxiosResponse<TData>(config: AxiosRequestConfig, data: ApiResponse<TData>): AxiosResponse<ApiResponse<TData>> {
  return {
    config: config as InternalAxiosRequestConfig,
    data,
    headers: {},
    status: 200,
    statusText: "OK",
  };
}

function createSuccessResponse<TData>(data: TData, message: string): ApiResponse<TData> {
  return { code: 0, message, data, timestamp: Date.now() };
}

function createErrorResponse(message: string, code = 400): AdapterResponse {
  return { code, message, data: null, timestamp: Date.now() };
}

function cloneData<TData>(data: TData): TData {
  return structuredClone(data);
}

/** 启动时从会话存储恢复集合，首次进入时使用内置初始数据。 */
function readCollection<TItem>(storageKey: string, fallback: TItem[]): TItem[] {
  const storedValue = sessionStorage.getItem(storageKey);
  if (!storedValue) {
    return cloneData(fallback);
  }

  try {
    const parsedValue = JSON.parse(storedValue) as TItem[];
    return Array.isArray(parsedValue) ? parsedValue : cloneData(fallback);
  } catch {
    sessionStorage.removeItem(storageKey);
    return cloneData(fallback);
  }
}

function persistCollection<TItem>(key: CollectionKey, collection: TItem[]): void {
  sessionStorage.setItem(STORAGE_KEYS[key], JSON.stringify(collection));
}

/** 会话中可能遗留旧版中文分类路径，启动时转换为 Cascader 可识别的稳定 value，避免编辑页显示为空。 */
function normalizeStoredProductCategoryPath(product: ProductDetail): ProductDetail {
  const storedPath = product.categoryPath.map((item) => item.trim()).filter(Boolean);
  /** 新版分类编码允许动态创建；只要路径已是稳定编码便原样保留，不能再按旧静态映射覆盖。 */
  if (storedPath[0] === "all-products" && storedPath.length > 1 && storedPath.slice(1).every((item) => /^[a-z][a-z0-9-]{1,47}$/.test(item))) {
    return { ...product, categoryPath: storedPath };
  }
  const expectedPath = ["all-products", PRODUCT_CATEGORY_VALUE_MAP[product.category] ?? "unclassified"];
  if (storedPath.join("/") === expectedPath.join("/")) return { ...product, categoryPath: storedPath };
  return { ...product, categoryPath: expectedPath };
}

/** 分类编码而非展示名称是商品与分类树之间的关联键，改名后商品归属仍可准确追溯。 */
function getProductCategoryByCode(code: string): ProductCategory | undefined {
  return database.productCategories.find((category) => category.code === code);
}

function getProductCategoryCode(product: ProductDetail): string {
  return product.categoryPath.at(-1) || PRODUCT_CATEGORY_VALUE_MAP[product.category] || "unclassified";
}

/** 统一合并会话内真实商品和运行期生成的演示商品，列表、详情与批量操作保持相同数据视图。 */
function getAllProducts(): ProductDetail[] {
  return [...database.products, ...generatedProducts];
}

/** 从当前节点向上回溯出完整路径；异常数据会回退为根分类，避免前端级联组件无法渲染。 */
function getProductCategoryPath(code: string): string[] {
  const path: string[] = [];
  const visitedCodes = new Set<string>();
  let currentCode = code;

  while (currentCode && currentCode !== PRODUCT_CATEGORY_ROOT_CODE && !visitedCodes.has(currentCode)) {
    const category = getProductCategoryByCode(currentCode);
    if (!category) return [PRODUCT_CATEGORY_ROOT_CODE];
    path.unshift(category.code);
    visitedCodes.add(currentCode);
    currentCode = category.parentCode;
  }

  return [PRODUCT_CATEGORY_ROOT_CODE, ...path];
}

function getProductCategoryName(code: string, fallback: string): string {
  return getProductCategoryByCode(code)?.name ?? fallback;
}

/** 详情接口也按最新分类名称返回，确保编辑器、商品列表和分类管理页展示一致。 */
function synchronizeProductCategory(product: ProductDetail): ProductDetail {
  const categoryCode = getProductCategoryCode(product);
  const category = getProductCategoryByCode(categoryCode);
  if (!category) return cloneData(product);
  return { ...cloneData(product), category: category.name, categoryPath: getProductCategoryPath(categoryCode) };
}

function isValidProductCategoryPath(categoryPath: string[]): boolean {
  const categoryCode = categoryPath.at(-1);
  return Boolean(categoryCode && categoryCode !== PRODUCT_CATEGORY_ROOT_CODE && getProductCategoryByCode(categoryCode));
}

/** 分类树只统计直接关联商品；父节点商品数不会与下级重复累加，便于判断删除风险。 */
function getDirectProductCount(categoryCode: string): number {
  return getAllProducts().filter((product) => getProductCategoryCode(product) === categoryCode).length;
}

function buildProductCategoryTree(): ProductCategoryTreeNode {
  const buildChildren = (parentCode: string): ProductCategoryTreeNode[] => database.productCategories
    .filter((category) => category.parentCode === parentCode)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, "zh-Hans-CN"))
    .map((category) => ({
      ...cloneData(category),
      productCount: getDirectProductCount(category.code),
      children: buildChildren(category.code),
    }));

  return {
    id: PRODUCT_CATEGORY_ROOT_CODE,
    name: "全部商品",
    code: PRODUCT_CATEGORY_ROOT_CODE,
    parentCode: "",
    status: "enabled",
    sortOrder: 0,
    createdAt: "系统内置",
    updatedAt: "系统内置",
    productCount: getAllProducts().length,
    children: buildChildren(PRODUCT_CATEGORY_ROOT_CODE),
  };
}

function isProductCategorySaveInput(value: unknown): value is ProductCategorySaveInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Partial<ProductCategorySaveInput>;
  return typeof input.name === "string"
    && input.name.trim().length >= 2
    && input.name.trim().length <= 30
    && typeof input.code === "string"
    && /^[a-z][a-z0-9-]{1,47}$/.test(input.code)
    && input.code !== PRODUCT_CATEGORY_ROOT_CODE
    && typeof input.parentCode === "string"
    && Boolean(input.parentCode)
    && (input.status === "enabled" || input.status === "disabled")
    && typeof input.sortOrder === "number"
    && Number.isFinite(input.sortOrder)
    && input.sortOrder >= 0;
}

function saveProductCategory(category: ProductCategory): void {
  const index = database.productCategories.findIndex((item) => item.id === category.id);
  if (index >= 0) database.productCategories.splice(index, 1, category);
  else database.productCategories.unshift(category);
  persistCollection("productCategories", database.productCategories);
}

function getRequestData<TData>(config: AxiosRequestConfig): TData {
  if (typeof config.data === "string") {
    return JSON.parse(config.data) as TData;
  }
  return config.data as TData;
}

function getUploadedFile(config: AxiosRequestConfig): File | null {
  if (!(config.data instanceof FormData)) return null;
  const file = config.data.get("file");
  return file instanceof File ? file : null;
}

/** 开发期用稳定的占位资源模拟对象存储返回地址，便于验证上传后内容可再次渲染。 */
function createMockUploadedFileUrl(fileId: string, fileName: string): string {
  const label = encodeURIComponent(fileName.slice(0, 36) || "uploaded-image");
  return `https://placehold.co/1200x900/f2f4f7/455468?text=${label}-${encodeURIComponent(fileId)}`;
}

function getPositiveNumber(value: string | number | undefined, fallback: number): number {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? Math.floor(parsedValue) : fallback;
}

/** 列表接口统一执行关键字、排序与分页，确保页面切换到真实接口后无需调整交互逻辑。 */
function createPageResponse<TItem extends object>(
  source: TItem[],
  config: AxiosRequestConfig,
  fields: Array<keyof TItem>,
  message: string,
  applyFilters?: (items: TItem[], requestConfig: AxiosRequestConfig) => TItem[],
): ApiResponse<PageResult<TItem>> {
  const keyword = String(config.params?.keyword ?? "").trim().toLowerCase();
  const sortBy = String(config.params?.sortBy ?? "");
  const sortOrder = config.params?.sortOrder === "asc" ? "asc" : "desc";
  const page = getPositiveNumber(config.params?.page as string | number | undefined, 1);
  const pageSize = getPositiveNumber(config.params?.pageSize as string | number | undefined, 8);
  let items = cloneData(source);

  if (keyword) {
    items = items.filter((item) => fields.some((field) => String(item[field] ?? "").toLowerCase().includes(keyword)));
  }

  if (applyFilters) items = applyFilters(items, config);

  const sortableField = fields.find((field) => String(field) === sortBy);
  if (sortableField) {
    items.sort((left, right) => {
      const leftValue = String(left[sortableField] ?? "");
      const rightValue = String(right[sortableField] ?? "");
      const comparedValue = leftValue.localeCompare(rightValue, "zh-Hans-CN", { numeric: true });
      return sortOrder === "asc" ? comparedValue : -comparedValue;
    });
  }

  const total = items.length;
  const startIndex = (page - 1) * pageSize;
  return createSuccessResponse({ list: items.slice(startIndex, startIndex + pageSize), total, page, pageSize }, message);
}

/** 角色与状态由接口筛选，页面只提交筛选条件，不在当前页数据上二次过滤。 */
function filterUsers(items: SystemUser[], config: AxiosRequestConfig): SystemUser[] {
  const role = String(config.params?.role ?? "");
  const status = String(config.params?.status ?? "");
  return items.filter((item) => (!role || item.role === role) && (!status || item.status === status));
}

/** 订单状态与来源是服务端筛选条件，避免业务页在已分页的数据上再次截断。 */
function filterOrders(items: SalesOrder[], config: AxiosRequestConfig): SalesOrder[] {
  return filterOrdersByQuery(items, config.params as OrderExportQuery);
}

/** 退款筛选由接口统一完成，避免页面在当前页结果上再次筛选导致总数失真。 */
function filterRefunds(items: RefundRecord[], config: AxiosRequestConfig): RefundRecord[] {
  const query = config.params as RefundListQuery | undefined;
  const status = query?.status ?? "";
  const refundType = query?.refundType ?? "";
  return items.filter((item) => (!status || item.status === status) && (!refundType || item.refundType === refundType));
}

function isRefundType(value: unknown): value is RefundType {
  return value === "refund_only" || value === "return_refund";
}

function isRefundSaveInput(value: unknown): value is RefundSaveInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Partial<RefundSaveInput>;
  return typeof input.orderNo === "string"
    && /^SO-\d{8}-\d{4}$/.test(input.orderNo.trim())
    && typeof input.memberName === "string"
    && input.memberName.trim().length >= 2
    && input.memberName.trim().length <= 20
    && typeof input.memberPhone === "string"
    && /^(?:1\d{10}|1\d{2}\*{4}\d{4})$/.test(input.memberPhone.trim())
    && typeof input.productName === "string"
    && input.productName.trim().length >= 2
    && input.productName.trim().length <= 80
    && isRefundType(input.refundType)
    && typeof input.reason === "string"
    && input.reason.trim().length >= 2
    && input.reason.trim().length <= 30
    && typeof input.reasonDetail === "string"
    && input.reasonDetail.trim().length <= 300
    && typeof input.amount === "number"
    && Number.isFinite(input.amount)
    && input.amount > 0
    && input.amount <= 1_000_000;
}

function isRefundReviewInput(value: unknown): value is RefundReviewInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Partial<RefundReviewInput>;
  return (input.action === "approve" || input.action === "reject" || input.action === "complete")
    && (input.remark === undefined || (typeof input.remark === "string" && input.remark.trim().length <= 200));
}

/** 每次保存都写入处理动态，详情中可追溯客服补录与审核结论。 */
function normalizeRefundInput(input: RefundSaveInput, id: string, current?: RefundRecord): RefundRecord {
  const isCreating = !current;
  const time = getCurrentTimeLabel();
  const refundTypeLabel = input.refundType === "refund_only" ? "仅退款" : "退货退款";
  const timelineItem = isCreating
    ? { time, title: "客服代客发起申请", description: `已创建${refundTypeLabel}申请，等待审核。` }
    : { time, title: "更新退款申请", description: "客服已补充或修正退款申请信息。" };

  return {
    id,
    refundNo: current?.refundNo ?? createRefundNo(),
    orderNo: input.orderNo.trim().toLocaleUpperCase("en-US"),
    memberName: input.memberName.trim(),
    memberPhone: input.memberPhone.trim(),
    productName: input.productName.trim(),
    refundType: input.refundType,
    reason: input.reason.trim(),
    reasonDetail: input.reasonDetail.trim(),
    amount: Number(input.amount.toFixed(2)),
    status: current?.status ?? "pending",
    requestedAt: current?.requestedAt ?? time,
    reviewerName: current?.reviewerName,
    reviewedAt: current?.reviewedAt,
    completedAt: current?.completedAt,
    auditRemark: current?.auditRemark,
    timeline: [timelineItem, ...(current?.timeline ?? [])],
  };
}

function createRefundNo(): string {
  const serial = String(Date.now()).slice(-4);
  return `RF-20260810-${serial}`;
}

function saveRefund(refund: RefundRecord): void {
  const index = database.refunds.findIndex((item) => item.id === refund.id);
  if (index >= 0) database.refunds.splice(index, 1, refund);
  else database.refunds.unshift(refund);
  persistCollection("refunds", database.refunds);
}

/** 退款状态只能按既定路径流转，避免静态页面演示出真实业务中不允许的回退。 */
function applyRefundReview(refund: RefundRecord, input: RefundReviewInput): { refund?: RefundRecord; error?: string } {
  const remark = input.remark?.trim() ?? "";
  const time = getCurrentTimeLabel();

  if (input.action === "complete") {
    if (refund.status !== "approved") return { error: "只有已同意的退款申请才能确认退款完成。" };
    return {
      refund: {
        ...cloneData(refund),
        status: "completed",
        completedAt: time,
        timeline: [{ time, title: "退款完成", description: remark ? `退款已原路退回。备注：${remark}` : "退款已原路退回客户账户。" }, ...refund.timeline],
      },
    };
  }

  if (refund.status !== "pending" && refund.status !== "reviewing") {
    return { error: "当前退款申请已完成审核，不能重复审核。" };
  }
  if (input.action === "reject" && remark.length < 2) {
    return { error: "驳回退款申请时，请填写至少 2 个字符的审核说明。" };
  }

  const isApproved = input.action === "approve";
  const title = isApproved ? "审核通过" : "审核驳回";
  const description = isApproved
    ? (remark ? `审核员当前审核员同意退款。备注：${remark}` : "审核员当前审核员同意退款，等待财务原路退回。")
    : `审核员当前审核员驳回退款申请。说明：${remark}`;
  return {
    refund: {
      ...cloneData(refund),
      status: isApproved ? "approved" : "rejected",
      reviewerName: "当前审核员",
      reviewedAt: time,
      auditRemark: remark || undefined,
      timeline: [{ time, title, description }, ...refund.timeline],
    },
  };
}

/** 列表记录由详情实时派生，避免编辑 SKU 后出现价格、库存与主 SKU 不一致。 */
function toProductRecord(product: ProductDetail): ProductRecord {
  const categoryCode = getProductCategoryCode(product);
  const visibleSkus = product.skus.filter((sku) => sku.status === "enabled");
  const availableSkus = visibleSkus.length ? visibleSkus : product.skus;
  const primarySku = availableSkus[0];
  const prices = availableSkus.map((sku) => sku.price);
  return {
    id: product.id,
    name: product.name,
    sku: primarySku?.sku ?? "未配置 SKU",
    category: getProductCategoryName(categoryCode, product.category),
    categoryCode,
    price: prices.length ? Math.min(...prices) : 0,
    stock: availableSkus.reduce((total, sku) => total + sku.stock, 0),
    sales: product.sales,
    status: product.status,
    updatedAt: product.updatedAt,
    coverTone: product.coverTone,
    coverUrl: product.media[0]?.url ?? "",
  };
}

function filterProducts(items: ProductRecord[], config: AxiosRequestConfig): ProductRecord[] {
  const query = config.params as ProductListQuery | undefined;
  const status = query?.status ?? "";
  const category = query?.category?.trim() ?? "";
  return items.filter((item) => (!status || item.status === status) && (!category || item.categoryCode === category));
}

function getProductListResponse(config: AxiosRequestConfig): ApiResponse<ProductPageResult> {
  const records = getAllProducts().map(toProductRecord);
  return createPageResponse(records, config, ["name", "sku", "category", "price", "stock", "sales", "updatedAt"], "获取商品列表成功", filterProducts);
}

/** 所有写入先标准化为稳定值，避免错误的上传地址或 SKU 数值污染会话数据。 */
function normalizeProductInput(input: ProductSaveInput, id: string, current?: ProductDetail): ProductDetail {
  const categoryCode = input.categoryPath.at(-1) ?? "";
  return {
    id,
    name: input.name.trim(),
    category: getProductCategoryName(categoryCode, input.category.trim()),
    categoryPath: getProductCategoryPath(categoryCode),
    brand: input.brand.trim(),
    highlights: input.highlights.map((item) => item.trim()).filter(Boolean).slice(0, 8),
    status: input.status,
    coverTone: input.coverTone,
    media: input.media.map((item, index) => ({ id: item.id || `${id}-media-${index + 1}`, url: item.url.trim(), alt: item.alt.trim() || `${input.name.trim()}商品图` })),
    description: input.description.trim(),
    specifications: input.specifications.map((item, index) => ({ id: item.id || `${id}-spec-${index + 1}`, name: item.name.trim(), values: item.values.map((value) => value.trim()).filter(Boolean) })),
    skus: input.skus.map((item, index) => normalizeProductSku(item, id, index)),
    sales: current?.sales ?? 0,
    updatedAt: getCurrentTimeLabel(),
  };
}

function normalizeProductSku(sku: ProductSku, productId: string, index: number): ProductSku {
  return {
    id: sku.id || `${productId}-sku-${index + 1}`,
    specValues: sku.specValues.map((value) => value.trim()).filter(Boolean),
    sku: sku.sku.trim(),
    barcode: sku.barcode.trim(),
    price: Math.max(0, Number.isFinite(sku.price) ? Number(sku.price.toFixed(2)) : 0),
    stock: Math.max(0, Math.floor(Number.isFinite(sku.stock) ? sku.stock : 0)),
    status: sku.status,
  };
}

function isProductStatus(value: unknown): value is ProductStatus {
  return value === "on_sale" || value === "draft" || value === "archived";
}

function isProductSaveInput(value: Partial<ProductSaveInput>): value is ProductSaveInput {
  return typeof value.name === "string"
    && value.name.trim().length >= 2
    && typeof value.category === "string"
    && value.category.trim().length > 0
    && Array.isArray(value.categoryPath)
    && typeof value.brand === "string"
    && Array.isArray(value.highlights)
    && isProductStatus(value.status)
    && ["blue", "orange", "purple", "green", "graphite"].includes(String(value.coverTone))
    && Array.isArray(value.media)
    && value.media.every(isProductMedia)
    && typeof value.description === "string"
    && Array.isArray(value.specifications)
    && value.specifications.every(isProductSpecification)
    && Array.isArray(value.skus)
    && value.skus.length > 0
    && value.skus.every(isProductSku);
}

/** SKU 编码是商品履约与库存同步的稳定键，单个商品内不允许重复。 */
function hasDuplicateSkuCodes(skus: ProductSku[]): boolean {
  const skuCodes = new Set<string>();
  return skus.some((sku) => {
    const code = sku.sku.trim().toLocaleUpperCase();
    if (skuCodes.has(code)) return true;
    skuCodes.add(code);
    return false;
  });
}

function isProductMedia(value: unknown): value is ProductMedia {
  if (!value || typeof value !== "object") return false;
  const media = value as Partial<ProductMedia>;
  return typeof media.id === "string" && typeof media.url === "string" && media.url.trim().length > 0 && typeof media.alt === "string";
}

function isProductSpecification(value: unknown): value is ProductSpecification {
  if (!value || typeof value !== "object") return false;
  const specification = value as Partial<ProductSpecification>;
  return typeof specification.id === "string" && typeof specification.name === "string" && Array.isArray(specification.values) && specification.values.every((item) => typeof item === "string");
}

function isSpecificationTemplateStatus(value: unknown): value is SpecificationTemplateStatus {
  return value === "enabled" || value === "draft" || value === "disabled";
}

function isSpecificationTemplateAttribute(value: unknown): value is SpecificationTemplateAttribute {
  if (!value || typeof value !== "object") return false;
  const attribute = value as Partial<SpecificationTemplateAttribute>;
  return typeof attribute.id === "string"
    && attribute.id.trim().length > 0
    && typeof attribute.name === "string"
    && attribute.name.trim().length >= 1
    && attribute.name.trim().length <= 30
    && Array.isArray(attribute.values)
    && attribute.values.length >= 1
    && attribute.values.length <= 30
    && attribute.values.every((item) => typeof item === "string" && item.trim().length >= 1 && item.trim().length <= 40);
}

function isSpecificationTemplateSaveInput(value: unknown): value is SpecificationTemplateSaveInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Partial<SpecificationTemplateSaveInput>;
  return typeof input.name === "string"
    && input.name.trim().length >= 2
    && input.name.trim().length <= 40
    && typeof input.code === "string"
    && /^[a-z][a-z0-9-]{1,47}$/.test(input.code.trim().toLocaleLowerCase("en-US"))
    && typeof input.description === "string"
    && input.description.trim().length <= 200
    && isSpecificationTemplateStatus(input.status)
    && Array.isArray(input.attributes)
    && input.attributes.length >= 1
    && input.attributes.length <= 10
    && input.attributes.every(isSpecificationTemplateAttribute);
}

function normalizeSpecificationTemplateInput(input: SpecificationTemplateSaveInput, id: string, current?: SpecificationTemplate): SpecificationTemplate {
  const attributes = input.attributes.map((attribute, index) => ({
    id: attribute.id.trim() || `${id}-attribute-${index + 1}`,
    name: attribute.name.trim(),
    values: attribute.values.map((value) => value.trim()).filter(Boolean),
  }));
  return {
    id,
    name: input.name.trim(),
    code: input.code.trim().toLocaleLowerCase("en-US"),
    description: input.description.trim(),
    attributes,
    productCount: current?.productCount ?? 0,
    status: input.status,
    createdAt: current?.createdAt ?? getCurrentTimeLabel(),
    updatedAt: getCurrentTimeLabel(),
  };
}

function hasDuplicateSpecificationTemplateValues(attributes: SpecificationTemplateAttribute[]): boolean {
  const names = new Set<string>();
  return attributes.some((attribute) => {
    const name = attribute.name.trim().toLocaleLowerCase("zh-CN");
    if (names.has(name)) return true;
    names.add(name);
    const values = new Set<string>();
    if (attribute.values.some((value) => {
      const normalizedValue = value.trim().toLocaleLowerCase("zh-CN");
      if (values.has(normalizedValue)) return true;
      values.add(normalizedValue);
      return false;
    })) return true;
    return false;
  });
}

function filterSpecificationTemplates(items: SpecificationTemplate[], config: AxiosRequestConfig): SpecificationTemplate[] {
  const status = String(config.params?.status ?? "");
  return items.filter((item) => !status || item.status === status);
}

function isProductSku(value: unknown): value is ProductSku {
  if (!value || typeof value !== "object") return false;
  const sku = value as Partial<ProductSku>;
  return typeof sku.id === "string"
    && Array.isArray(sku.specValues)
    && sku.specValues.every((item) => typeof item === "string")
    && typeof sku.sku === "string"
    && sku.sku.trim().length > 0
    && typeof sku.barcode === "string"
    && typeof sku.price === "number"
    && Number.isFinite(sku.price)
    && sku.price >= 0
    && typeof sku.stock === "number"
    && Number.isFinite(sku.stock)
    && sku.stock >= 0
    && (sku.status === "enabled" || sku.status === "disabled");
}

function isProductBatchUpdateInput(value: unknown): value is ProductBatchUpdateInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Partial<ProductBatchUpdateInput>;
  if (!Array.isArray(input.ids) || !input.ids.length || !input.ids.every((id) => typeof id === "string" && id.length > 0)) return false;
  if (input.field === "status") return isProductStatus(input.value);
  return input.field === "category"
    && typeof input.value === "string"
    && input.value.trim().length > 0
    && typeof input.categoryCode === "string"
    && input.categoryCode.trim().length > 0
    && Array.isArray(input.categoryPath)
    && input.categoryPath.every((item) => typeof item === "string");
}

/**
 * 在 mock 接口层循环生成大样本商品，列表请求仍按服务端分页契约返回当前页，
 * 避免把大量静态 JSON 放入源码或写入浏览器会话存储。
 */
function createGeneratedProducts(count: number): ProductDetail[] {
  const coverTones: ProductDetail["coverTone"][] = ["blue", "orange", "purple", "green", "graphite"];
  const products: ProductDetail[] = [];

  for (let index = 0; index < count; index += 1) {
    const serial = String(index + 1).padStart(5, "0");
    const category = MOCK_PRODUCT_CATEGORY_OPTIONS[index % MOCK_PRODUCT_CATEGORY_OPTIONS.length];
    const status: ProductStatus = index % 29 === 0 ? "archived" : index % 11 === 0 ? "draft" : "on_sale";
    const day = String((index % 28) + 1).padStart(2, "0");
    const hour = String(8 + (index % 12)).padStart(2, "0");
    const minute = String((index * 7) % 60).padStart(2, "0");
    const price = 39 + (index % 35) * 10 + (index % 4) * 0.5;
    const stock = (index * 17) % 260;
    const sku = `MOCK-${category.code.slice(0, 4).toLocaleUpperCase("en-US")}-${serial}`;

    products.push({
      id: `generated-product-${serial}`,
      name: `演示商品 ${serial} · ${category.name}`,
      category: category.name,
      categoryPath: [PRODUCT_CATEGORY_ROOT_CODE, category.code],
      brand: `批量演示品牌 ${String((index % 8) + 1).padStart(2, "0")}`,
      highlights: ["大数据量分页演示", "运行期模拟商品"],
      status,
      coverTone: coverTones[index % coverTones.length],
      media: [],
      description: `<p>用于商品列表大数据量分页、筛选、排序与虚拟滚动验证的第 ${serial} 条演示商品。</p>`,
      specifications: [{ id: `generated-spec-${serial}`, name: "规格", values: ["默认规格"] }],
      skus: [{ id: `generated-sku-${serial}`, specValues: ["默认规格"], sku, barcode: `69${serial.padStart(11, "0")}`, price, stock, status: status === "archived" ? "disabled" : "enabled" }],
      sales: (index * 43) % 18_000,
      updatedAt: `2026-08-${day} ${hour}:${minute}`,
    });
  }

  return products;
}

function saveProduct(product: ProductDetail): void {
  const storedIndex = database.products.findIndex((item) => item.id === product.id);
  if (storedIndex >= 0) {
    database.products.splice(storedIndex, 1, product);
    persistCollection("products", database.products);
    return;
  }

  const generatedIndex = generatedProducts.findIndex((item) => item.id === product.id);
  if (generatedIndex >= 0) {
    generatedProducts.splice(generatedIndex, 1, product);
    return;
  }

  database.products.unshift(product);
  persistCollection("products", database.products);
}

function saveSpecificationTemplate(template: SpecificationTemplate): void {
  const index = database.specificationTemplates.findIndex((item) => item.id === template.id);
  if (index >= 0) database.specificationTemplates.splice(index, 1, template);
  else database.specificationTemplates.unshift(template);
  persistCollection("specificationTemplates", database.specificationTemplates);
}

/** 生成商品允许在当前运行期被删除；用户实际创建的商品仍维持原有会话持久化行为。 */
function removeProductById(productId: string): boolean {
  if (removeCollectionItem("products", database.products, productId)) return true;
  const generatedIndex = generatedProducts.findIndex((item) => item.id === productId);
  if (generatedIndex < 0) return false;
  generatedProducts.splice(generatedIndex, 1);
  return true;
}

function createImportedProduct(fileName: string): ProductDetail {
  const id = createId("product");
  const safeName = fileName.replace(/\.[^.]+$/, "").trim() || "批量导入商品";
  return {
    id,
    name: `${safeName}·导入商品`,
    category: "待分类",
    categoryPath: ["all-products", "unclassified"],
    brand: "待补充",
    highlights: ["已通过导入创建", "待完善商品资料"],
    status: "draft",
    coverTone: "blue",
    media: [],
    description: "<p>此商品由批量导入创建，请补充商品图片、详情与 SKU 信息。</p>",
    specifications: [{ id: `${id}-spec-default`, name: "规格", values: ["默认规格"] }],
    skus: [{ id: `${id}-sku-default`, specValues: ["默认规格"], sku: `IMPORT-${Date.now().toString().slice(-6)}`, barcode: "", price: 0, stock: 0, status: "disabled" }],
    sales: 0,
    updatedAt: getCurrentTimeLabel(),
  };
}

/** 导出与列表复用同一组筛选字段，避免生成文件与当前查询结果不一致。 */
function filterOrdersByQuery(items: SalesOrder[], query: OrderExportQuery = {}): SalesOrder[] {
  const status = query.status ?? "";
  const channel = query.channel ?? "";
  const createdFrom = query.createdFrom ?? "";
  const createdTo = query.createdTo ?? "";
  return items.filter((item) => {
    const createdDate = item.createdAt.slice(0, 10);
    return (!status || item.status === status)
      && (!channel || item.channel === channel)
      && (!createdFrom || createdDate >= createdFrom)
      && (!createdTo || createdDate <= createdTo)
      && (query.minAmount === undefined || item.amount >= query.minAmount)
      && (query.maxAmount === undefined || item.amount <= query.maxAmount);
  });
}

function getOrderExportRows(query: OrderExportQuery): SalesOrder[] {
  const keyword = query.keyword?.trim().toLowerCase() ?? "";
  const sortableFields = ["orderNo", "customerName", "productSummary", "channel", "status", "createdAt", "amount"] as const;
  let result = filterOrdersByQuery(cloneData(database.orders), query);
  if (keyword) result = result.filter((item) => sortableFields.some((field) => String(item[field]).toLowerCase().includes(keyword)));
  if (query.sortBy) {
    const direction = query.sortOrder === "asc" ? 1 : -1;
    result.sort((left, right) => String(left[query.sortBy as "createdAt" | "amount"]).localeCompare(String(right[query.sortBy as "createdAt" | "amount"]), "zh-Hans-CN", { numeric: true }) * direction);
  }
  return result;
}

/** 开发期任务状态写入本地持久化，作用域遵循当前登录租户和成员，生产环境由服务端会话替代。 */
function createOrderExportTask(query: OrderExportQuery): ExportTask {
  const startedAt = Date.now();
  const task: ExportTask = {
    id: createId("order-export"),
    title: "订单列表导出",
    status: "queued",
    progress: 0,
    createdAt: formatExportTaskTime(startedAt),
    filename: `订单导出-${new Date(startedAt).toISOString().slice(0, 10)}.csv`,
    downloadable: false,
  };
  const records = readOrderExportTaskRecords();
  records.unshift({ task, query: normalizeOrderExportQuery(query), startedAt });
  persistOrderExportTaskRecords(records);
  return cloneData(task);
}

/** 首次进入导出任务页时提供少量完整状态样本，便于演示下载、进度推进与失败重试。 */
function createInitialOrderExportTaskRecords(): StoredOrderExportTask[] {
  const timestamp = Date.now();
  const completedStartedAt = timestamp - 8 * 60 * 1_000;
  const processingStartedAt = timestamp - 700;
  const failedStartedAt = timestamp - 18 * 60 * 1_000;
  return [
    {
      task: {
        id: "order-export-demo-completed",
        title: "订单明细导出（近 7 天）",
        status: "succeeded",
        progress: 100,
        createdAt: formatExportTaskTime(completedStartedAt),
        completedAt: formatExportTaskTime(completedStartedAt + 2_400),
        filename: "订单明细-近7天.csv",
        downloadable: true,
      },
      query: {},
      startedAt: completedStartedAt,
    },
    {
      task: {
        id: "order-export-demo-processing",
        title: "待发货订单导出",
        status: "processing",
        progress: 38,
        createdAt: formatExportTaskTime(processingStartedAt),
        filename: "待发货订单.csv",
        downloadable: false,
      },
      query: { status: "paid" },
      startedAt: processingStartedAt,
    },
    {
      task: {
        id: "order-export-demo-failed",
        title: "退款订单复核导出",
        status: "failed",
        progress: 0,
        createdAt: formatExportTaskTime(failedStartedAt),
        filename: "退款订单复核.csv",
        errorMessage: "生成文件时连接数据服务超时，可重试。",
        downloadable: false,
      },
      query: { status: "cancelled" },
      startedAt: failedStartedAt,
    },
  ];
}

function listOrderExportTasks(): ExportTask[] {
  return synchronizeOrderExportTaskRecords().map((record) => cloneData(record.task));
}

function retryOrderExportTask(id: string): ExportTask | null {
  const records = synchronizeOrderExportTaskRecords();
  const taskIndex = records.findIndex((record) => record.task.id === id);
  if (taskIndex < 0) return null;

  const startedAt = Date.now();
  const currentTask = records[taskIndex].task;
  records[taskIndex] = {
    ...records[taskIndex],
    startedAt,
    task: {
      ...currentTask,
      status: "queued",
      progress: 0,
      createdAt: formatExportTaskTime(startedAt),
      completedAt: undefined,
      errorMessage: undefined,
      downloadable: false,
      downloadUrl: undefined,
    },
  };
  persistOrderExportTaskRecords(records);
  return cloneData(records[taskIndex].task);
}

function removeOrderExportTask(id: string): boolean {
  const records = synchronizeOrderExportTaskRecords();
  const nextRecords = records.filter((record) => record.task.id !== id);
  if (nextRecords.length === records.length) return false;
  persistOrderExportTaskRecords(nextRecords);
  return true;
}

function getOrderExportDownload(id: string): SalesOrder[] | null {
  const record = synchronizeOrderExportTaskRecords().find((item) => item.task.id === id);
  if (!record || record.task.status !== "succeeded" || !record.task.downloadable) return null;
  return getOrderExportRows(record.query);
}

/** 查询时按实际经过时间推进异步状态，刷新页面后仍可恢复未完成任务。 */
function synchronizeOrderExportTaskRecords(): StoredOrderExportTask[] {
  const records = readOrderExportTaskRecords();
  const timestamp = Date.now();
  const nextRecords = records.map((record) => advanceOrderExportTask(record, timestamp));
  if (JSON.stringify(nextRecords) !== JSON.stringify(records)) persistOrderExportTaskRecords(nextRecords);
  return nextRecords;
}

function advanceOrderExportTask(record: StoredOrderExportTask, timestamp: number): StoredOrderExportTask {
  if (record.task.status !== "queued" && record.task.status !== "processing") return record;
  const elapsedTime = Math.max(0, timestamp - record.startedAt);
  if (elapsedTime >= ORDER_EXPORT_TASK_COMPLETE_DELAY) {
    return {
      ...record,
      task: {
        ...record.task,
        status: "succeeded",
        progress: 100,
        completedAt: formatExportTaskTime(timestamp),
        downloadable: true,
      },
    };
  }
  const progress = Math.min(96, Math.max(12, Math.round((elapsedTime / ORDER_EXPORT_TASK_COMPLETE_DELAY) * 100)));
  return { ...record, task: { ...record.task, status: "processing", progress } };
}

function readOrderExportTaskRecords(): StoredOrderExportTask[] {
  const storage = getBrowserLocalStorage();
  if (!storage) return [];
  try {
    const rawValue = storage.getItem(createOrderExportTaskStorageKey());
    if (!rawValue) {
      const initialRecords = createInitialOrderExportTaskRecords();
      persistOrderExportTaskRecords(initialRecords);
      return initialRecords;
    }
    const values = JSON.parse(rawValue) as StoredOrderExportTaskValue[];
    if (!Array.isArray(values)) return [];
    return values.filter(isStoredOrderExportTask).map((value) => ({ task: { ...value.task }, query: { ...value.query }, startedAt: value.startedAt }));
  } catch {
    return [];
  }
}

function persistOrderExportTaskRecords(records: StoredOrderExportTask[]): void {
  const storage = getBrowserLocalStorage();
  if (!storage) return;
  storage.setItem(createOrderExportTaskStorageKey(), JSON.stringify(records));
}

function createOrderExportTaskStorageKey(): string {
  const profileScope = getCurrentProfileScope();
  return [ORDER_EXPORT_TASK_STORAGE_PREFIX, profileScope.tenantId, profileScope.userId].map((part) => encodeURIComponent(part)).join(":");
}

function getCurrentProfileScope(): { tenantId: string; userId: string } {
  const rawProfile = sessionStorage.getItem("aps-user-profile");
  if (!rawProfile) return { tenantId: "workspace-default", userId: "anonymous" };
  try {
    const profile = JSON.parse(rawProfile) as { tenantId?: string; id?: string };
    return {
      tenantId: profile.tenantId?.trim() || "workspace-default",
      userId: profile.id?.trim() || "anonymous",
    };
  } catch {
    return { tenantId: "workspace-default", userId: "anonymous" };
  }
}

function getBrowserLocalStorage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

/** 分片会话按当前租户与成员隔离；刷新后需重新选择同一文件，服务端再返回已完成分片。 */
function createChunkUploadSession(payload: ChunkUploadSessionPayload): UploadChunkSession {
  const timestamp = Date.now();
  const records = readChunkUploadSessions().filter((record) => timestamp - record.updatedAt <= CHUNK_UPLOAD_SESSION_TTL);
  const resumableRecord = records.find((record) => !record.completed
    && record.fileKey === payload.fileKey
    && record.fileSize === payload.fileSize
    && record.totalChunks === payload.totalChunks
    && record.chunkSize === payload.chunkSize);
  if (resumableRecord) {
    resumableRecord.updatedAt = timestamp;
    persistChunkUploadSessions(records);
    return toChunkUploadSession(resumableRecord);
  }

  const record: StoredChunkUploadSession = {
    ...payload,
    id: createId("upload-session"),
    uploadedChunkIndexes: [],
    completed: false,
    updatedAt: timestamp,
  };
  records.unshift(record);
  persistChunkUploadSessions(records);
  return toChunkUploadSession(record);
}

/** 同一分片重复提交保持幂等，便于网络超时后的安全重试。 */
function saveChunkUploadPart(sessionId: string, fileKey: string, chunkIndex: number, totalChunks: number): UploadChunkSession | null {
  const records = readChunkUploadSessions();
  const record = records.find((item) => item.id === sessionId);
  if (!record || record.completed || record.fileKey !== fileKey || record.totalChunks !== totalChunks || chunkIndex < 0 || chunkIndex >= totalChunks) return null;
  if (!record.uploadedChunkIndexes.includes(chunkIndex)) record.uploadedChunkIndexes.push(chunkIndex);
  record.uploadedChunkIndexes.sort((left, right) => left - right);
  record.updatedAt = Date.now();
  persistChunkUploadSessions(records);
  return toChunkUploadSession(record);
}

function completeChunkUploadSession(sessionId: string, payload: ChunkUploadCompletePayload): UploadedFile | null | undefined {
  const records = readChunkUploadSessions();
  const record = records.find((item) => item.id === sessionId);
  if (!record || record.fileKey !== payload.fileKey || record.totalChunks !== payload.totalChunks) return null;
  if (record.uploadedChunkIndexes.length !== record.totalChunks) return undefined;
  record.completed = true;
  record.fileId ??= createId("file");
  record.updatedAt = Date.now();
  persistChunkUploadSessions(records);
  return { id: record.fileId };
}

function readChunkUploadSessions(): StoredChunkUploadSession[] {
  const storage = getBrowserLocalStorage();
  if (!storage) return [];
  try {
    const rawValue = storage.getItem(createChunkUploadSessionStorageKey());
    if (!rawValue) return [];
    const values = JSON.parse(rawValue) as StoredChunkUploadSession[];
    return Array.isArray(values) ? values.filter(isStoredChunkUploadSession) : [];
  } catch {
    return [];
  }
}

function persistChunkUploadSessions(records: StoredChunkUploadSession[]): void {
  const storage = getBrowserLocalStorage();
  if (!storage) return;
  storage.setItem(createChunkUploadSessionStorageKey(), JSON.stringify(records));
}

function createChunkUploadSessionStorageKey(): string {
  const profileScope = getCurrentProfileScope();
  return [CHUNK_UPLOAD_SESSION_STORAGE_PREFIX, profileScope.tenantId, profileScope.userId].map((part) => encodeURIComponent(part)).join(":");
}

function toChunkUploadSession(record: StoredChunkUploadSession): UploadChunkSession {
  return { id: record.id, uploadedChunkIndexes: [...record.uploadedChunkIndexes] };
}

function isChunkUploadSessionPayload<TValue extends Partial<ChunkUploadSessionPayload>>(value: TValue): value is TValue & ChunkUploadSessionPayload {
  return typeof value.fileKey === "string"
    && value.fileKey.length > 0
    && value.fileKey.length <= 512
    && typeof value.fileName === "string"
    && value.fileName.length > 0
    && value.fileName.length <= 255
    && typeof value.fileSize === "number"
    && Number.isFinite(value.fileSize)
    && value.fileSize >= 0
    && typeof value.fileType === "string"
    && typeof value.chunkSize === "number"
    && Number.isInteger(value.chunkSize)
    && value.chunkSize >= 256 * 1024
    && typeof value.totalChunks === "number"
    && Number.isInteger(value.totalChunks)
    && value.totalChunks >= 1
    && value.totalChunks <= 10_000;
}

function isStoredChunkUploadSession(value: Partial<StoredChunkUploadSession>): value is StoredChunkUploadSession {
  return typeof value.id === "string"
    && value.id.length > 0
    && isChunkUploadSessionPayload(value)
    && Array.isArray(value.uploadedChunkIndexes)
    && value.uploadedChunkIndexes.every((index) => Number.isInteger(index) && index >= 0 && index < value.totalChunks)
    && typeof value.completed === "boolean"
    && (value.fileId === undefined || typeof value.fileId === "string")
    && typeof value.updatedAt === "number"
    && Number.isFinite(value.updatedAt);
}

function getFormDataValue(config: AxiosRequestConfig, key: string): string | undefined {
  if (!(config.data instanceof FormData)) return undefined;
  const value = config.data.get(key);
  return typeof value === "string" ? value : undefined;
}

function hasUploadedChunk(config: AxiosRequestConfig): boolean {
  return config.data instanceof FormData && config.data.get("chunk") instanceof Blob;
}

function normalizeOrderExportQuery(query: OrderExportQuery): OrderExportQuery {
  return {
    ...(query.keyword?.trim() ? { keyword: query.keyword.trim() } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.channel?.trim() ? { channel: query.channel.trim() } : {}),
    ...(query.createdFrom ? { createdFrom: query.createdFrom } : {}),
    ...(query.createdTo ? { createdTo: query.createdTo } : {}),
    ...(query.minAmount !== undefined ? { minAmount: query.minAmount } : {}),
    ...(query.maxAmount !== undefined ? { maxAmount: query.maxAmount } : {}),
    ...(query.sortBy ? { sortBy: query.sortBy } : {}),
    ...(query.sortOrder ? { sortOrder: query.sortOrder } : {}),
  };
}

function formatExportTaskTime(timestamp: number): string {
  return new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(timestamp));
}

function isStoredOrderExportTask(value: StoredOrderExportTaskValue): value is { task: ExportTask; query: OrderExportQuery; startedAt: number } {
  const task = value.task;
  return Boolean(task)
    && typeof task?.id === "string"
    && task.id.length > 0
    && typeof task.title === "string"
    && task.title.length > 0
    && isExportTaskStatus(task.status)
    && typeof task.createdAt === "string"
    && task.createdAt.length > 0
    && isOrderExportQuery(value.query)
    && typeof value.startedAt === "number"
    && Number.isFinite(value.startedAt);
}

function isExportTaskStatus(value: ExportTask["status"] | undefined): value is ExportTask["status"] {
  return value === "queued" || value === "processing" || value === "succeeded" || value === "failed";
}

function isOrderExportQuery(value: OrderExportQuery | undefined): value is OrderExportQuery {
  if (!value) return false;
  return (value.keyword === undefined || typeof value.keyword === "string")
    && (value.status === undefined || value.status === "pending_payment" || value.status === "paid" || value.status === "fulfilling" || value.status === "shipped" || value.status === "completed" || value.status === "cancelled")
    && (value.channel === undefined || typeof value.channel === "string")
    && (value.createdFrom === undefined || /^\d{4}-\d{2}-\d{2}$/.test(value.createdFrom))
    && (value.createdTo === undefined || /^\d{4}-\d{2}-\d{2}$/.test(value.createdTo))
    && (value.minAmount === undefined || (typeof value.minAmount === "number" && Number.isFinite(value.minAmount) && value.minAmount >= 0))
    && (value.maxAmount === undefined || (typeof value.maxAmount === "number" && Number.isFinite(value.maxAmount) && value.maxAmount >= 0))
    && (value.sortBy === undefined || value.sortBy === "createdAt" || value.sortBy === "amount")
    && (value.sortOrder === undefined || value.sortOrder === "asc" || value.sortOrder === "desc");
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getCurrentTimeLabel(): string {
  return "刚刚";
}

function isOrderStatusActionInput(value: unknown): value is OrderStatusActionInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Partial<OrderStatusActionInput>;
  return (input.action === "remind_payment" || input.action === "cancel" || input.action === "start_fulfillment" || input.action === "mark_shipped" || input.action === "complete")
    && (input.note === undefined || (typeof input.note === "string" && input.note.trim().length <= 200));
}

function saveOrder(order: SalesOrder): void {
  const index = database.orders.findIndex((item) => item.id === order.id);
  if (index < 0) return;
  database.orders.splice(index, 1, order);
  persistCollection("orders", database.orders);
}

function applyOrderStatusAction(order: SalesOrder, input: OrderStatusActionInput): { order?: SalesOrder; error?: string } {
  const definition = ORDER_STATUS_ACTIONS[input.action];
  if (order.status !== definition.from) {
    return { error: `当前订单处于“${order.status}”状态，不能执行该操作。` };
  }
  const nextOrder = cloneData(order);
  if (definition.to) nextOrder.status = definition.to;
  if (input.action === "mark_shipped") nextOrder.trackingNo ??= `MOCK-${order.orderNo}`;
  nextOrder.timeline.unshift({
    time: getCurrentTimeLabel(),
    title: definition.title,
    description: input.note?.trim() ? `${definition.description}备注：${input.note.trim()}` : definition.description,
  });
  return { order: nextOrder };
}

function saveUser(user: SystemUser): void {
  const index = database.users.findIndex((item) => item.id === user.id);
  if (index >= 0) {
    database.users.splice(index, 1, user);
  } else {
    database.users.unshift(user);
  }
  persistCollection("users", database.users);
}

function saveRole(role: SystemRole): void {
  const index = database.roles.findIndex((item) => item.id === role.id);
  if (index >= 0) {
    database.roles.splice(index, 1, role);
  } else {
    database.roles.unshift(role);
  }
  persistCollection("roles", database.roles);
}

function saveMenu(menu: SystemMenu): void {
  const index = database.menus.findIndex((item) => item.id === menu.id);
  if (index >= 0) {
    database.menus.splice(index, 1, menu);
  } else {
    database.menus.push(menu);
  }
  database.menus.sort((left, right) => left.sortOrder - right.sortOrder);
  persistCollection("menus", database.menus);
}

function removeCollectionItem<TItem extends { id: string }>(key: CollectionKey, collection: TItem[], id: string): boolean {
  const index = collection.findIndex((item) => item.id === id);
  if (index < 0) {
    return false;
  }
  collection.splice(index, 1);
  persistCollection(key, collection);
  return true;
}

/** 本地接口适配器用于开发期数据联调，保留真实服务的响应语义和错误分支。 */
export const mockAdapter: AxiosAdapter = async (config) => {
  await new Promise((resolve) => window.setTimeout(resolve, RESPONSE_DELAY));

  const method = (config.method ?? "get").toLowerCase();
  const requestKey = `${method} ${config.url}`;
  let response: AdapterResponse;

  switch (requestKey) {
    case "post /auth/login":
      response = createSuccessResponse(cloneData((loginResponse as ApiResponse<LoginResult>).data), "登录成功");
      break;
    case "get /dashboard/workbench":
      response = createSuccessResponse(cloneData((dashboardResponse as ApiResponse<DashboardData>).data), "获取工作台数据成功");
      break;
    case "post /files/upload": {
      const file = getUploadedFile(config);
      if (!file) {
        response = createErrorResponse("未找到需要上传的文件。");
        break;
      }
      const fileId = createId("file");
      response = createSuccessResponse({ id: fileId, url: createMockUploadedFileUrl(fileId, file.name) }, "文件上传成功");
      break;
    }
    case "post /files/upload-sessions": {
      const payload = getRequestData<Partial<ChunkUploadSessionPayload>>(config);
      response = isChunkUploadSessionPayload(payload)
        ? createSuccessResponse(createChunkUploadSession(payload), "上传会话已准备就绪")
        : createErrorResponse("上传会话参数不完整或格式无效。");
      break;
    }
    case "get /system/users":
      response = createPageResponse(database.users, config, ["name", "account", "department", "role", "status"], "获取用户列表成功", filterUsers);
      break;
    case "post /system/users": {
      const payload = getRequestData<SystemUserInput>(config);
      if (database.users.some((item) => item.account === payload.account)) {
        response = createErrorResponse("账号已存在，请使用其他账号。", 409);
        break;
      }
      const user: SystemUser = { id: createId("user"), ...payload, lastActiveAt: "从未登录" };
      saveUser(user);
      response = createSuccessResponse(user, "新增用户成功");
      break;
    }
    case "put /system/users": {
      const payload = getRequestData<Partial<SystemUserInput> & Pick<SystemUser, "id">>(config);
      const currentUser = database.users.find((item) => item.id === payload.id);
      if (!currentUser) {
        response = createErrorResponse("未找到要更新的用户。", 404);
        break;
      }
      const user = { ...currentUser, ...payload, lastActiveAt: getCurrentTimeLabel() };
      saveUser(user);
      response = createSuccessResponse(user, "更新用户成功");
      break;
    }
    case "patch /system/users/status": {
      const payload = getRequestData<UserStatusPayload>(config);
      database.users.forEach((user, index) => {
        if (payload.ids.includes(user.id)) {
          database.users[index] = { ...user, status: payload.status, lastActiveAt: getCurrentTimeLabel() };
        }
      });
      persistCollection("users", database.users);
      response = createSuccessResponse(null, "更新用户状态成功");
      break;
    }
    case "delete /system/users": {
      const payload = getRequestData<Pick<SystemUser, "id">>(config);
      response = removeCollectionItem("users", database.users, payload.id) ? createSuccessResponse(null, "移除用户成功") : createErrorResponse("未找到要移除的用户。", 404);
      break;
    }
    case "get /system/roles":
      response = createPageResponse(database.roles, config, ["name", "code", "description"], "获取角色列表成功");
      break;
    case "post /system/roles": {
      const payload = getRequestData<SystemRoleInput>(config);
      if (database.roles.some((item) => item.code === payload.code)) {
        response = createErrorResponse("角色编码已存在，请使用其他编码。", 409);
        break;
      }
      const role: SystemRole = { id: createId("role"), ...payload, memberCount: 0, updatedAt: getCurrentTimeLabel() };
      saveRole(role);
      response = createSuccessResponse(role, "新增角色成功");
      break;
    }
    case "put /system/roles": {
      const payload = getRequestData<Partial<SystemRoleInput> & Pick<SystemRole, "id">>(config);
      const currentRole = database.roles.find((item) => item.id === payload.id);
      if (!currentRole) {
        response = createErrorResponse("未找到要更新的角色。", 404);
        break;
      }
      const role = { ...currentRole, ...payload, updatedAt: getCurrentTimeLabel() };
      saveRole(role);
      response = createSuccessResponse(role, "更新角色成功");
      break;
    }
    case "delete /system/roles": {
      const payload = getRequestData<Pick<SystemRole, "id">>(config);
      response = removeCollectionItem("roles", database.roles, payload.id) ? createSuccessResponse(null, "删除角色成功") : createErrorResponse("未找到要删除的角色。", 404);
      break;
    }
    case "get /system/menus":
      response = createPageResponse(database.menus, config, ["name", "path", "permission", "status"], "获取菜单列表成功");
      break;
    case "get /business/product-categories":
      response = createSuccessResponse(buildProductCategoryTree(), "获取商品分类树成功");
      break;
    case "post /business/product-categories": {
      const payload = getRequestData<unknown>(config);
      if (!isProductCategorySaveInput(payload)) {
        response = createErrorResponse("分类名称、编码、上级分类或排序值无效，请检查后重试。");
        break;
      }
      const parentIsRoot = payload.parentCode === PRODUCT_CATEGORY_ROOT_CODE;
      const parentCategory = getProductCategoryByCode(payload.parentCode);
      if (!parentIsRoot && !parentCategory) {
        response = createErrorResponse("未找到上级分类，请刷新分类树后重试。", 404);
        break;
      }
      if (parentCategory?.status === "disabled") {
        response = createErrorResponse("上级分类已停用，暂不能在其下新建分类。", 409);
        break;
      }
      const categoryCode = payload.code.trim().toLocaleLowerCase("en-US");
      const categoryName = payload.name.trim();
      if (database.productCategories.some((item) => item.code.toLocaleLowerCase("en-US") === categoryCode)) {
        response = createErrorResponse("分类编码已存在，请使用其他编码。", 409);
        break;
      }
      if (database.productCategories.some((item) => item.parentCode === payload.parentCode && item.name === categoryName)) {
        response = createErrorResponse("同一上级分类下已存在同名分类。", 409);
        break;
      }
      const category: ProductCategory = {
        id: createId("product-category"),
        name: categoryName,
        code: categoryCode,
        parentCode: payload.parentCode,
        status: payload.status,
        sortOrder: Math.floor(payload.sortOrder),
        createdAt: getCurrentTimeLabel(),
        updatedAt: getCurrentTimeLabel(),
      };
      saveProductCategory(category);
      response = createSuccessResponse(category, "新建商品分类成功");
      break;
    }
    case "get /business/refunds":
      response = createPageResponse(database.refunds, config, ["refundNo", "orderNo", "memberName", "productName", "reason", "requestedAt"], "获取退款申请列表成功", filterRefunds) as ApiResponse<RefundPageResult>;
      break;
    case "post /business/refunds": {
      const payload = getRequestData<unknown>(config);
      if (!isRefundSaveInput(payload)) {
        response = createErrorResponse("退款申请信息无效，请检查订单号、会员、商品、金额与退款说明。");
        break;
      }
      const refund = normalizeRefundInput(payload, createId("refund"));
      saveRefund(refund);
      response = createSuccessResponse(refund, "退款申请已创建");
      break;
    }
    case "get /business/specification-templates":
      response = createPageResponse(database.specificationTemplates, config, ["name", "code", "description"], "获取规格模板列表成功", filterSpecificationTemplates) as ApiResponse<SpecificationTemplatePageResult>;
      break;
    case "post /business/specification-templates": {
      const payload = getRequestData<unknown>(config);
      if (!isSpecificationTemplateSaveInput(payload)) {
        response = createErrorResponse("模板名称、编码或规格项配置无效，请检查后重试。");
        break;
      }
      if (hasDuplicateSpecificationTemplateValues(payload.attributes)) {
        response = createErrorResponse("规格项名称及规格值不能重复，请修正后再保存。", 409);
        break;
      }
      const code = payload.code.trim().toLocaleLowerCase("en-US");
      if (database.specificationTemplates.some((item) => item.code === code)) {
        response = createErrorResponse("模板编码已存在，请使用其他编码。", 409);
        break;
      }
      if (database.specificationTemplates.some((item) => item.name.trim() === payload.name.trim())) {
        response = createErrorResponse("规格模板名称已存在，请使用其他名称。", 409);
        break;
      }
      const template = normalizeSpecificationTemplateInput(payload, createId("spec-template"));
      saveSpecificationTemplate(template);
      response = createSuccessResponse(template, "新建规格模板成功");
      break;
    }
    case "get /business/products":
      response = getProductListResponse(config);
      break;
    case "post /business/products": {
      const payload = getRequestData<Partial<ProductSaveInput>>(config);
      if (!isProductSaveInput(payload)) {
        response = createErrorResponse("商品基础信息、素材或 SKU 数据不完整，请检查后重试。");
        break;
      }
      if (!isValidProductCategoryPath(payload.categoryPath)) {
        response = createErrorResponse("所选商品分类不存在，请刷新分类后重新选择。", 409);
        break;
      }
      if (hasDuplicateSkuCodes(payload.skus)) {
        response = createErrorResponse("SKU 编码不能重复，请修正后再保存。", 409);
        break;
      }
      const product = normalizeProductInput(payload, createId("product"));
      saveProduct(product);
      response = createSuccessResponse(product, "新建商品成功");
      break;
    }
    case "patch /business/products/batch": {
      const payload = getRequestData<unknown>(config);
      if (!isProductBatchUpdateInput(payload)) {
        response = createErrorResponse("批量更新参数无效，请重新选择商品与目标值。");
        break;
      }
      const selectedIds = new Set(payload.ids);
      const matchedProducts = getAllProducts().filter((item) => selectedIds.has(item.id));
      if (!matchedProducts.length) {
        response = createErrorResponse("未找到可更新的商品，请刷新列表后重试。", 404);
        break;
      }
      if (payload.field === "category" && !isValidProductCategoryPath(payload.categoryPath)) {
        response = createErrorResponse("目标商品分类不存在，请刷新分类后重试。", 409);
        break;
      }
      matchedProducts.forEach((product) => {
        if (payload.field === "status") product.status = payload.value;
        else {
          product.category = getProductCategoryName(payload.categoryCode, payload.value.trim());
          product.categoryPath = getProductCategoryPath(payload.categoryCode);
        }
        product.updatedAt = getCurrentTimeLabel();
      });
      /** 会话商品仍需落盘，生成商品只保留在当前 mock 运行期，避免持久化大样本数据。 */
      persistCollection("products", database.products);
      response = createSuccessResponse(matchedProducts.map(toProductRecord), "批量更新商品成功");
      break;
    }
    case "post /business/products/import": {
      const file = getUploadedFile(config);
      if (!file) {
        response = createErrorResponse("未找到需要导入的商品文件。");
        break;
      }
      const importedProduct = createImportedProduct(file.name);
      saveProduct(importedProduct);
      response = createSuccessResponse({ importedCount: 1, productIds: [importedProduct.id] }, "商品文件已导入，请补充商品资料后发布。");
      break;
    }
    case "get /business/products/export": {
      const query = config.params as ProductListQuery;
      const records = filterProducts(getAllProducts().map(toProductRecord), { ...config, params: query });
      response = createSuccessResponse(records, "导出商品数据成功");
      break;
    }
    case "get /business/orders":
      response = createPageResponse(database.orders, config, ["orderNo", "customerName", "productSummary", "channel", "status", "createdAt", "amount"], "获取订单列表成功", filterOrders);
      break;
    case "get /business/orders/export":
      response = createSuccessResponse(getOrderExportRows(config.params as OrderExportQuery), "导出订单数据成功");
      break;
    case "post /business/orders/export-tasks": {
      const query = getRequestData<OrderExportQuery>(config);
      response = createSuccessResponse(createOrderExportTask(query), "已创建订单导出任务");
      break;
    }
    case "get /business/orders/export-tasks":
      response = createSuccessResponse(listOrderExportTasks(), "获取订单导出任务成功");
      break;
    case "post /system/menus": {
      const payload = getRequestData<SystemMenuInput>(config);
      if (database.menus.some((item) => item.path === payload.path)) {
        response = createErrorResponse("访问路径已存在，请使用其他路径。", 409);
        break;
      }
      const menu: SystemMenu = { id: createId("menu"), ...payload, updatedAt: getCurrentTimeLabel() };
      saveMenu(menu);
      response = createSuccessResponse(menu, "新增菜单成功");
      break;
    }
    case "put /system/menus": {
      const payload = getRequestData<Partial<SystemMenuInput> & Pick<SystemMenu, "id">>(config);
      const currentMenu = database.menus.find((item) => item.id === payload.id);
      if (!currentMenu) {
        response = createErrorResponse("未找到要更新的菜单。", 404);
        break;
      }
      const menu = { ...currentMenu, ...payload, updatedAt: getCurrentTimeLabel() };
      saveMenu(menu);
      response = createSuccessResponse(menu, "更新菜单成功");
      break;
    }
    case "delete /system/menus": {
      const payload = getRequestData<Pick<SystemMenu, "id">>(config);
      response = removeCollectionItem("menus", database.menus, payload.id) ? createSuccessResponse(null, "删除菜单成功") : createErrorResponse("未找到要删除的菜单。", 404);
      break;
    }
    default: {
      const chunkUploadPartMatch = method === "post" ? config.url?.match(/^\/files\/upload-sessions\/([^/]+)\/chunks\/(\d+)$/) : null;
      const chunkUploadCompleteMatch = method === "post" ? config.url?.match(/^\/files\/upload-sessions\/([^/]+)\/complete$/) : null;
      const orderExportTaskDownloadMatch = method === "get" ? config.url?.match(/^\/business\/orders\/export-tasks\/([^/]+)\/download$/) : null;
      const orderExportTaskRetryMatch = method === "post" ? config.url?.match(/^\/business\/orders\/export-tasks\/([^/]+)\/retry$/) : null;
      const orderExportTaskRemoveMatch = method === "delete" ? config.url?.match(/^\/business\/orders\/export-tasks\/([^/]+)$/) : null;
      const orderStatusActionMatch = method === "patch" ? config.url?.match(/^\/business\/orders\/([^/]+)\/status$/) : null;
      const orderIdMatch = method === "get" ? config.url?.match(/^\/business\/orders\/([^/]+)$/) : null;
      const productCategoryIdMatch = (method === "put" || method === "delete") ? config.url?.match(/^\/business\/product-categories\/([^/]+)$/) : null;
      const refundReviewMatch = method === "patch" ? config.url?.match(/^\/business\/refunds\/([^/]+)\/review$/) : null;
      const refundIdMatch = (method === "put" || method === "delete") ? config.url?.match(/^\/business\/refunds\/([^/]+)$/) : null;
      const specificationTemplateIdMatch = (method === "put" || method === "delete") ? config.url?.match(/^\/business\/specification-templates\/([^/]+)$/) : null;
      const productIdMatch = (method === "get" || method === "put" || method === "delete") ? config.url?.match(/^\/business\/products\/([^/]+)$/) : null;
      if (chunkUploadPartMatch) {
        const fileKey = getFormDataValue(config, "fileKey");
        const totalChunks = Number(getFormDataValue(config, "totalChunks"));
        const chunkIndex = Number(getFormDataValue(config, "chunkIndex"));
        const session = fileKey && Number.isInteger(totalChunks) && Number.isInteger(chunkIndex) && hasUploadedChunk(config)
          ? saveChunkUploadPart(decodeURIComponent(chunkUploadPartMatch[1]), fileKey, chunkIndex, totalChunks)
          : null;
        response = session ? createSuccessResponse(null, "分片上传成功") : createErrorResponse("分片上传会话无效或已结束。", 409);
      } else if (chunkUploadCompleteMatch) {
        const payload = getRequestData<Partial<ChunkUploadCompletePayload>>(config);
        const completedFile = typeof payload.fileKey === "string" && payload.fileKey.length > 0 && Number.isInteger(payload.totalChunks)
          ? completeChunkUploadSession(decodeURIComponent(chunkUploadCompleteMatch[1]), payload as ChunkUploadCompletePayload)
          : null;
        response = completedFile === undefined
          ? createErrorResponse("仍有分片未上传完成。", 409)
          : completedFile
            ? createSuccessResponse(completedFile, "分片文件已合并完成")
            : createErrorResponse("上传会话不存在或不匹配。", 404);
      } else if (orderExportTaskDownloadMatch) {
        const rows = getOrderExportDownload(decodeURIComponent(orderExportTaskDownloadMatch[1]));
        response = rows ? createSuccessResponse(rows, "获取订单导出文件成功") : createErrorResponse("导出文件暂不可用，请稍后重试。", 409);
      } else if (orderExportTaskRetryMatch) {
        const task = retryOrderExportTask(decodeURIComponent(orderExportTaskRetryMatch[1]));
        response = task ? createSuccessResponse(task, "订单导出任务已重新提交") : createErrorResponse("未找到需要重试的导出任务。", 404);
      } else if (orderExportTaskRemoveMatch) {
        response = removeOrderExportTask(decodeURIComponent(orderExportTaskRemoveMatch[1]))
          ? createSuccessResponse(null, "订单导出任务已移除")
          : createErrorResponse("未找到需要移除的导出任务。", 404);
      } else if (orderStatusActionMatch) {
        const orderId = decodeURIComponent(orderStatusActionMatch[1]);
        const order = database.orders.find((item) => item.id === orderId);
        const payload = getRequestData<unknown>(config);
        if (!order) {
          response = createErrorResponse("未找到对应的订单。", 404);
        } else if (!isOrderStatusActionInput(payload)) {
          response = createErrorResponse("订单操作参数无效，请检查后重试。");
        } else {
          const result = applyOrderStatusAction(order, payload);
          if (!result.order) {
            response = createErrorResponse(result.error ?? "当前订单无法执行该操作。", 409);
          } else {
            saveOrder(result.order);
            response = createSuccessResponse(result.order, "订单状态已更新");
          }
        }
      } else if (orderIdMatch) {
        const order = database.orders.find((item) => item.id === decodeURIComponent(orderIdMatch[1]));
        response = order ? createSuccessResponse(cloneData(order), "获取订单详情成功") : createErrorResponse("未找到对应的订单。", 404);
      } else if (productCategoryIdMatch) {
        const categoryId = decodeURIComponent(productCategoryIdMatch[1]);
        const category = database.productCategories.find((item) => item.id === categoryId);
        if (!category) {
          response = createErrorResponse("未找到对应的商品分类。", 404);
        } else if (method === "delete") {
          const childCount = database.productCategories.filter((item) => item.parentCode === category.code).length;
          const productCount = getDirectProductCount(category.code);
          if (childCount) {
            response = createErrorResponse(`分类“${category.name}”下仍有 ${childCount} 个子分类，请先处理子分类后再删除。`, 409);
          } else if (productCount) {
            response = createErrorResponse(`分类“${category.name}”仍关联 ${productCount} 个商品，请先完成商品归类后再删除。`, 409);
          } else {
            response = removeCollectionItem("productCategories", database.productCategories, categoryId)
              ? createSuccessResponse(null, "删除商品分类成功")
              : createErrorResponse("商品分类已不存在，请刷新后重试。", 404);
          }
        } else {
          const payload = getRequestData<unknown>(config);
          if (!isProductCategorySaveInput(payload)) {
            response = createErrorResponse("分类名称、编码、上级分类或排序值无效，请检查后重试。");
          } else if (payload.code !== category.code || payload.parentCode !== category.parentCode) {
            response = createErrorResponse("已创建分类不支持修改编码或上级分类，避免影响已关联商品。", 409);
          } else if (payload.status === "disabled" && database.productCategories.some((item) => item.parentCode === category.code)) {
            response = createErrorResponse("当前分类仍包含下级分类，请先处理下级分类后再停用。", 409);
          } else if (database.productCategories.some((item) => item.id !== category.id && item.parentCode === category.parentCode && item.name === payload.name.trim())) {
            response = createErrorResponse("同一上级分类下已存在同名分类。", 409);
          } else {
            const nextCategory: ProductCategory = {
              ...category,
              name: payload.name.trim(),
              status: payload.status,
              sortOrder: Math.floor(payload.sortOrder),
              updatedAt: getCurrentTimeLabel(),
            };
            saveProductCategory(nextCategory);
            response = createSuccessResponse(nextCategory, "更新商品分类成功");
          }
        }
      } else if (refundReviewMatch) {
        const refundId = decodeURIComponent(refundReviewMatch[1]);
        const refund = database.refunds.find((item) => item.id === refundId);
        const payload = getRequestData<unknown>(config);
        if (!refund) {
          response = createErrorResponse("未找到对应的退款申请。", 404);
        } else if (!isRefundReviewInput(payload)) {
          response = createErrorResponse("审核动作或审核备注无效，请检查后重试。");
        } else {
          const result = applyRefundReview(refund, payload);
          if (!result.refund) {
            response = createErrorResponse(result.error ?? "当前退款申请无法执行该操作。", 409);
          } else {
            saveRefund(result.refund);
            response = createSuccessResponse(result.refund, "退款申请状态已更新");
          }
        }
      } else if (refundIdMatch) {
        const refundId = decodeURIComponent(refundIdMatch[1]);
        const refund = database.refunds.find((item) => item.id === refundId);
        if (!refund) {
          response = createErrorResponse("未找到对应的退款申请。", 404);
        } else if (method === "delete") {
          if (refund.status !== "pending" && refund.status !== "rejected") {
            response = createErrorResponse("仅待审核或已拒绝的退款申请可以删除，已通过的财务记录需要保留。", 409);
          } else {
            response = removeCollectionItem("refunds", database.refunds, refundId)
              ? createSuccessResponse(null, "退款申请已删除")
              : createErrorResponse("退款申请已不存在，请刷新后重试。", 404);
          }
        } else {
          const payload = getRequestData<unknown>(config);
          if (refund.status !== "pending" && refund.status !== "reviewing") {
            response = createErrorResponse("当前退款申请已完成审核，不能再修改申请信息。", 409);
          } else if (!isRefundSaveInput(payload)) {
            response = createErrorResponse("退款申请信息无效，请检查订单号、会员、商品、金额与退款说明。");
          } else {
            const nextRefund = normalizeRefundInput(payload, refund.id, refund);
            saveRefund(nextRefund);
            response = createSuccessResponse(nextRefund, "退款申请已更新");
          }
        }
      } else if (specificationTemplateIdMatch) {
        const templateId = decodeURIComponent(specificationTemplateIdMatch[1]);
        const template = database.specificationTemplates.find((item) => item.id === templateId);
        if (!template) {
          response = createErrorResponse("未找到对应的规格模板。", 404);
        } else if (method === "delete") {
          if (template.productCount > 0) {
            response = createErrorResponse(`规格模板“${template.name}”仍关联 ${template.productCount} 个商品，请先解除关联后再删除。`, 409);
          } else {
            response = removeCollectionItem("specificationTemplates", database.specificationTemplates, templateId)
              ? createSuccessResponse(null, "删除规格模板成功")
              : createErrorResponse("规格模板已不存在，请刷新后重试。", 404);
          }
        } else {
          const payload = getRequestData<unknown>(config);
          if (!isSpecificationTemplateSaveInput(payload)) {
            response = createErrorResponse("模板名称、编码或规格项配置无效，请检查后重试。");
          } else if (hasDuplicateSpecificationTemplateValues(payload.attributes)) {
            response = createErrorResponse("规格项名称及规格值不能重复，请修正后再保存。", 409);
          } else if (payload.code.trim().toLocaleLowerCase("en-US") !== template.code) {
            response = createErrorResponse("已创建模板不支持修改编码，避免影响商品关联。", 409);
          } else if (database.specificationTemplates.some((item) => item.id !== template.id && item.name.trim() === payload.name.trim())) {
            response = createErrorResponse("规格模板名称已存在，请使用其他名称。", 409);
          } else {
            const nextTemplate = normalizeSpecificationTemplateInput(payload, template.id, template);
            saveSpecificationTemplate(nextTemplate);
            response = createSuccessResponse(nextTemplate, "更新规格模板成功");
          }
        }
      } else if (productIdMatch) {
        const productId = decodeURIComponent(productIdMatch[1]);
        const product = getAllProducts().find((item) => item.id === productId);
        if (!product) {
          response = createErrorResponse("未找到对应的商品。", 404);
        } else if (method === "delete") {
          response = removeProductById(productId)
            ? createSuccessResponse(null, "删除商品成功")
            : createErrorResponse("商品已不存在，请刷新列表后重试。", 404);
        } else if (method === "get") {
          response = createSuccessResponse(synchronizeProductCategory(product), "获取商品详情成功");
        } else {
          const payload = getRequestData<Partial<ProductSaveInput>>(config);
          if (!isProductSaveInput(payload)) {
            response = createErrorResponse("商品基础信息、素材或 SKU 数据不完整，请检查后重试。");
          } else if (!isValidProductCategoryPath(payload.categoryPath)) {
            response = createErrorResponse("所选商品分类不存在，请刷新分类后重新选择。", 409);
          } else if (hasDuplicateSkuCodes(payload.skus)) {
            response = createErrorResponse("SKU 编码不能重复，请修正后再保存。", 409);
          } else {
            const nextProduct = normalizeProductInput(payload, product.id, product);
            saveProduct(nextProduct);
            response = createSuccessResponse(nextProduct, "更新商品成功");
          }
        }
      } else {
        response = createErrorResponse("请求的资源不存在。", 404);
      }
    }
  }

  return createAxiosResponse(config, response);
};
