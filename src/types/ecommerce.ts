import type { PageResult, SortOrder } from "./api";

export type ProductStatus = "on_sale" | "draft" | "archived";
export type ProductSkuStatus = "enabled" | "disabled";
export type ProductCategoryStatus = "enabled" | "disabled";
export type SpecificationTemplateStatus = "enabled" | "draft" | "disabled";
export type ProductCoverTone = "blue" | "orange" | "purple" | "green" | "graphite";
export type RefundStatus = "pending" | "reviewing" | "approved" | "rejected" | "completed";
export type RefundType = "refund_only" | "return_refund";
export type RefundReviewAction = "approve" | "reject" | "complete";
export type MemberLevel = "黑金会员" | "铂金会员" | "黄金会员" | "普通会员";
export type CampaignStatus = "scheduled" | "running" | "ended";
export type StockStatus = "healthy" | "warning" | "critical";

export interface ProductRecord {
  id: string;
  name: string;
  sku: string;
  category: string;
  /** 分类编码是分类树筛选与批量归类使用的稳定键，展示层始终使用 category。 */
  categoryCode: string;
  price: number;
  stock: number;
  sales: number;
  status: ProductStatus;
  updatedAt: string;
  coverTone: ProductCoverTone;
  coverUrl: string;
}

/** 商品列表仅保留检索与展示字段，复杂编辑内容由详情接口单独返回。 */
export interface ProductMedia {
  id: string;
  url: string;
  alt: string;
}

export interface ProductSpecification {
  id: string;
  name: string;
  values: string[];
}

/** 规格模板中的规格项，结构与商品详情规格保持一致，便于套用到商品编辑器。 */
export interface SpecificationTemplateAttribute {
  id: string;
  name: string;
  values: string[];
}

/** 规格模板列表记录同时承载弹窗编辑所需的完整规格项。 */
export interface SpecificationTemplate {
  id: string;
  name: string;
  code: string;
  description: string;
  attributes: SpecificationTemplateAttribute[];
  productCount: number;
  status: SpecificationTemplateStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SpecificationTemplateSaveInput {
  name: string;
  code: string;
  description: string;
  attributes: SpecificationTemplateAttribute[];
  status: SpecificationTemplateStatus;
}

export interface ProductSku {
  id: string;
  specValues: string[];
  sku: string;
  barcode: string;
  price: number;
  stock: number;
  status: ProductSkuStatus;
}

/** 商品详情承载素材、富文本和 SKU，不与高频列表接口混用。 */
export interface ProductDetail {
  id: string;
  name: string;
  category: string;
  categoryPath: string[];
  brand: string;
  highlights: string[];
  status: ProductStatus;
  coverTone: ProductCoverTone;
  media: ProductMedia[];
  description: string;
  specifications: ProductSpecification[];
  skus: ProductSku[];
  sales: number;
  updatedAt: string;
}

/** 新建和编辑共享稳定输入结构，服务端负责派生列表中的价格、库存和主 SKU。 */
export interface ProductSaveInput {
  name: string;
  category: string;
  categoryPath: string[];
  brand: string;
  highlights: string[];
  status: ProductStatus;
  coverTone: ProductCoverTone;
  media: ProductMedia[];
  description: string;
  specifications: ProductSpecification[];
  skus: ProductSku[];
}

/** 商品分类使用稳定编码建立树关系，商品仅保存编码路径以避免改名后引用失效。 */
export interface ProductCategory {
  id: string;
  name: string;
  code: string;
  parentCode: string;
  status: ProductCategoryStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** 分类树节点同时返回直接关联商品数量，供管理页和商品筛选页共用。 */
export interface ProductCategoryTreeNode extends ProductCategory {
  productCount: number;
  children: ProductCategoryTreeNode[];
}

/** 创建和编辑复用相同入参；编辑时编码与上级分类由服务端保护为不可变。 */
export interface ProductCategorySaveInput {
  name: string;
  code: string;
  parentCode: string;
  status: ProductCategoryStatus;
  sortOrder: number;
}

export type ProductBatchUpdateInput =
  | { ids: string[]; field: "status"; value: ProductStatus }
  | { ids: string[]; field: "category"; value: string; categoryCode: string; categoryPath: string[] };

export interface ProductImportResult {
  importedCount: number;
  productIds: string[];
}

/** 退款审核过程中的状态变化需要可追溯，详情弹窗与列表共享同一份记录。 */
export interface RefundTimelineItem {
  time: string;
  title: string;
  description: string;
}

export interface RefundRecord {
  id: string;
  refundNo: string;
  orderNo: string;
  memberName: string;
  memberPhone: string;
  productName: string;
  refundType: RefundType;
  reason: string;
  reasonDetail: string;
  amount: number;
  status: RefundStatus;
  requestedAt: string;
  reviewerName?: string;
  reviewedAt?: string;
  completedAt?: string;
  auditRemark?: string;
  timeline: RefundTimelineItem[];
}

/** 客服代客创建与待审核申请编辑共用的可修改字段，审核状态由服务端状态机维护。 */
export interface RefundSaveInput {
  orderNo: string;
  memberName: string;
  memberPhone: string;
  productName: string;
  refundType: RefundType;
  reason: string;
  reasonDetail: string;
  amount: number;
}

/** 审核和退款完成均使用明确动作，避免页面直接写入任意状态值。 */
export interface RefundReviewInput {
  action: RefundReviewAction;
  remark?: string;
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
  /** 传递分类编码而非展示名称，支持分类改名且保持筛选条件稳定。 */
  category?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "updatedAt" | "price" | "sales" | "stock";
  sortOrder?: SortOrder;
}

export interface RefundListQuery {
  keyword?: string;
  status?: RefundStatus | "";
  refundType?: RefundType | "";
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

export interface SpecificationTemplateListQuery {
  keyword?: string;
  status?: SpecificationTemplateStatus | "";
  page?: number;
  pageSize?: number;
}

export type ProductPageResult = PageResult<ProductRecord>;
export type RefundPageResult = PageResult<RefundRecord>;
export type MemberPageResult = PageResult<MemberRecord>;
export type InventoryPageResult = PageResult<InventoryRecord>;
export type SpecificationTemplatePageResult = PageResult<SpecificationTemplate>;
