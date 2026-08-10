<script setup lang="ts">
import { computed, onActivated, onMounted, ref, watch } from "vue";
import {
  AppButton,
  AppCard,
  AppConfirmDialog,
  AppDataTable,
  AppDialog,
  AppExcelExport,
  AppExcelImport,
  AppFilterBar,
  AppFormField,
  AppIconButton,
  AppImage,
  AppPagination,
  AppPopover,
  AppSearchInput,
  AppSelect,
  AppStatusTag,
  AppSplitter,
  AppTableActions,
  AppTableBatchEditor,
  AppTableOperationBar,
  AppTableSettingsPanel,
  AppTableToolbar,
  AppTableViewSelector,
  AppTree,
  useTablePreferences,
  useTableViews,
} from "aps-design-pro";
import { batchUpdateProducts, exportProducts, getProductCategoryTree, getProducts, importProducts, removeProduct } from "@/api/modules/ecommerce";
import { useTableDataSource } from "@/composables/useTableDataSource";
import { useAuthStore } from "@/stores/auth";
import { useFeedbackStore } from "@/stores/feedback";
import ProductEditorView from "@/views/business/ProductEditorView.vue";
import type {
  DataTableBatchEditPayload,
  DataTableBatchEditField,
  DataTableColumn,
  SelectOption,
  StatusTone,
  TableRowKey,
  TableViewScope,
  TreeOption,
  UploadFileItem,
  UploadRequestOptions,
  UploadRequestResult,
} from "aps-design-pro";
import type { ProductCategoryTreeNode, ProductListQuery, ProductRecord, ProductStatus } from "@/types/ecommerce";

interface ProductStatusDisplay {
  label: string;
  tone: StatusTone;
}

interface ProductEditorController {
  cancel: () => void;
  goToPreviousStep: () => void;
  goToNextStep: () => void;
  saveDraft: () => Promise<void>;
  publishProduct: () => Promise<void>;
}

interface ProductEditorState {
  activeStep: number;
  isLoading: boolean;
  isSaving: boolean;
}

interface ProductCategoryPanelPreference {
  size: number;
  collapsed: boolean;
}

const PRODUCT_TABLE_COLUMNS: DataTableColumn<ProductRecord>[] = [
  { key: "name", label: "商品", defaultWidth: 292, minWidth: 230, maxWidth: 440 },
  { key: "sku", label: "主 SKU", defaultWidth: 170, minWidth: 148, maxWidth: 260 },
  { key: "category", label: "分类", defaultWidth: 132, minWidth: 110, maxWidth: 200 },
  { key: "price", label: "起售价", defaultWidth: 120, minWidth: 104, maxWidth: 180, align: "right", sortable: true },
  { key: "stock", label: "可售库存", defaultWidth: 116, minWidth: 102, maxWidth: 180, align: "right", sortable: true },
  { key: "sales", label: "累计销量", defaultWidth: 120, minWidth: 104, maxWidth: 190, align: "right", sortable: true },
  { key: "status", label: "状态", defaultWidth: 112, minWidth: 98, maxWidth: 170 },
  { key: "updatedAt", label: "最近更新", defaultWidth: 146, minWidth: 128, maxWidth: 240, sortable: true },
];

const productStatusOptions: SelectOption[] = [
  { label: "全部状态", value: "" },
  { label: "在售", value: "on_sale" },
  { label: "草稿", value: "draft" },
  { label: "已归档", value: "archived" },
];
const DEFAULT_PRODUCT_QUERY: ProductListQuery = {
  keyword: "",
  status: "",
  category: "",
  page: 1,
  pageSize: 20,
  sortBy: "updatedAt",
  sortOrder: "desc",
};
const PRODUCT_CATEGORY_PANEL_DEFAULT_SIZE = 23;
const PRODUCT_CATEGORY_PANEL_MIN_SIZE = 18;
const PRODUCT_CATEGORY_PANEL_MAX_SIZE = 36;
const PRODUCT_CATEGORY_PANEL_PREFERENCE_KEY = "aps-product-category-panel-preference";

const authStore = useAuthStore();
const feedbackStore = useFeedbackStore();
const categoryPanelPreference = readProductCategoryPanelPreference();
const productCategoryTree = ref<ProductCategoryTreeNode | null>(null);
const keyword = ref("");
const status = ref<ProductStatus | "">("");
const categoryTreeExpandedKeys = ref(["all-products"]);
const categoryTreeSelectedKeys = ref(["all-products"]);
const isCategoryTreeCollapsed = ref(categoryPanelPreference.collapsed);
const categoryTreePanelSize = ref(categoryPanelPreference.size);
const selectedProductKeys = ref<TableRowKey[]>([]);
const productTableInstanceKey = ref(0);
const importingFiles = ref<UploadFileItem[]>([]);
const isExporting = ref(false);
const isTableFullscreen = ref(false);
const isProductFilePanelOpen = ref(false);
const isProductEditorOpen = ref(false);
const deleteTarget = ref<ProductRecord | null>(null);
const isDeleting = ref(false);
const productEditorMode = ref<"create" | "edit">("create");
const productEditorId = ref<string | undefined>(undefined);
const productEditorRef = ref<ProductEditorController | null>(null);
const productEditorState = ref<ProductEditorState>({ activeStep: 0, isLoading: false, isSaving: false });
const productDataSource = useTableDataSource<ProductRecord, ProductListQuery>({ initialQuery: DEFAULT_PRODUCT_QUERY, request: getProducts });
const { rows: products, total, isLoading, errorMessage } = productDataSource;
const page = computed(() => productDataSource.query.value.page ?? 1);
const pageSize = computed(() => productDataSource.query.value.pageSize ?? 20);
const tableSort = computed(() => ({ key: productDataSource.query.value.sortBy ?? "updatedAt", order: productDataSource.query.value.sortOrder ?? "desc" }));
const productTableBaseScope = computed<TableViewScope | null>(() => {
  const profile = authStore.profile;
  if (!profile) return null;
  return { tenantId: profile.tenantId, userId: profile.id, route: "/products/catalog", tableId: "commerce-product-list" };
});
const productTableViewState = useTableViews({ scope: productTableBaseScope, defaultViewName: "全部商品" });
const {
  views: productTableViews,
  activeViewId: activeProductTableViewId,
  isLoading: isLoadingProductTableViews,
  isSaving: isSavingProductTableViews,
  saveError: productTableViewError,
} = productTableViewState;
const {
  preference: productTablePreference,
  defaultPreference: defaultProductTablePreference,
  resolvedColumns: productTableColumns,
  columnWidths: productColumnWidths,
  tableSize: productTableSize,
  isSaving: isSavingProductTablePreference,
  saveError: productTablePreferenceError,
  updatePreference: updateProductTablePreference,
  updateColumnWidths: updateProductColumnWidths,
} = useTablePreferences({ columns: PRODUCT_TABLE_COLUMNS, scope: productTableViewState.activeViewScope });

/** 分页接口每页通常返回相同数量的商品，虚拟表格不会仅凭 rows.length 变化重置 scrollTop；请求开始时重建实例，确保新结果从首行计算可视区。 */
watch(isLoading, (loading) => {
  if (loading) productTableInstanceKey.value += 1;
}, { flush: "sync" });

/** 商品页只消费分类服务返回的树，分类改名或新增下级无需再修改页面常量。 */
const productCategoryTreeNodes = computed<TreeOption[]>(() => productCategoryTree.value ? [toTreeOption(productCategoryTree.value)] : []);
const batchCategoryOptions = computed<SelectOption[]>(() => collectSelectableCategoryNodes(productCategoryTree.value).map((category) => ({ label: category.name, value: category.code })));
const batchEditFields = computed<DataTableBatchEditField<ProductRecord>[]>(() => [
  { key: "status", label: "商品状态", editor: { type: "select" as const, options: productStatusOptions.filter((item) => item.value) } },
  { key: "category", label: "商品分类", editor: { type: "select" as const, options: batchCategoryOptions.value } },
]);

function clampCategoryTreePanelSize(size: number): number {
  return Math.min(PRODUCT_CATEGORY_PANEL_MAX_SIZE, Math.max(PRODUCT_CATEGORY_PANEL_MIN_SIZE, size));
}

/** 分类树宽度属于个人工作区偏好；浏览器存储不可用时回退默认布局，不影响商品管理主流程。 */
function readProductCategoryPanelPreference(): ProductCategoryPanelPreference {
  try {
    const storedValue = window.localStorage.getItem(PRODUCT_CATEGORY_PANEL_PREFERENCE_KEY);
    if (!storedValue) return { size: PRODUCT_CATEGORY_PANEL_DEFAULT_SIZE, collapsed: false };
    const parsedValue = JSON.parse(storedValue) as Partial<ProductCategoryPanelPreference>;
    const size = typeof parsedValue.size === "number" && Number.isFinite(parsedValue.size)
      ? clampCategoryTreePanelSize(parsedValue.size)
      : PRODUCT_CATEGORY_PANEL_DEFAULT_SIZE;
    return { size, collapsed: parsedValue.collapsed === true };
  } catch (error) {
    console.warn("商品列表分类筛选面板偏好读取失败，将使用默认布局。", error);
    return { size: PRODUCT_CATEGORY_PANEL_DEFAULT_SIZE, collapsed: false };
  }
}

function persistProductCategoryPanelPreference(): void {
  try {
    window.localStorage.setItem(PRODUCT_CATEGORY_PANEL_PREFERENCE_KEY, JSON.stringify({
      size: categoryTreePanelSize.value,
      collapsed: isCategoryTreeCollapsed.value,
    } satisfies ProductCategoryPanelPreference));
  } catch (error) {
    console.warn("商品列表分类筛选面板偏好保存失败，当前会话内的布局调整仍然有效。", error);
  }
}

function handleCategoryTreePanelChanged(nextSize: number): void {
  const size = clampCategoryTreePanelSize(nextSize);
  categoryTreePanelSize.value = size;
  persistProductCategoryPanelPreference();
}

/** 折叠状态由 AppSplitter 统一维护，页面只保存个人偏好，避免在筛选区重复放置展开入口。 */
function handleCategoryTreePanelCollapseChanged(collapsed: boolean): void {
  isCategoryTreeCollapsed.value = collapsed;
  persistProductCategoryPanelPreference();
}

function toTreeOption(category: ProductCategoryTreeNode): TreeOption {
  return {
    label: category.status === "disabled" ? `${category.name}（已停用）` : category.name,
    value: category.code,
    children: category.children.map(toTreeOption),
    leaf: category.children.length === 0,
  };
}

function findProductCategory(code: string, category: ProductCategoryTreeNode | null = productCategoryTree.value): ProductCategoryTreeNode | null {
  if (!category) return null;
  if (category.code === code) return category;
  for (const child of category.children) {
    const matchedCategory = findProductCategory(code, child);
    if (matchedCategory) return matchedCategory;
  }
  return null;
}

/** 批量归类仅可选择已启用的叶子分类，避免把商品分配到停用或仅用于聚合的节点。 */
function collectSelectableCategoryNodes(category: ProductCategoryTreeNode | null): ProductCategoryTreeNode[] {
  if (!category) return [];
  if (!category.children.length) return category.code !== "all-products" && category.status === "enabled" ? [category] : [];
  return category.children.flatMap((child) => collectSelectableCategoryNodes(child));
}

async function loadProductCategories(): Promise<void> {
  try {
    const nextCategoryTree = await getProductCategoryTree();
    productCategoryTree.value = nextCategoryTree;
    const selectedCode = categoryTreeSelectedKeys.value[0];
    if (selectedCode && !findProductCategory(selectedCode, nextCategoryTree)) categoryTreeSelectedKeys.value = ["all-products"];
  } catch (error) {
    feedbackStore.show(error instanceof Error ? error.message : "商品分类加载失败，请稍后重试。", "error");
  }
}

function getSelectedCategory(): string {
  const selectedValue = categoryTreeSelectedKeys.value[0];
  if (!selectedValue || selectedValue === "all-products") return "";
  return selectedValue;
}

/** 左侧分类树选择后立即刷新列表，重复点击当前分类则回到全部商品。 */
async function handleCategoryTreeSelect(node: TreeOption, selected: boolean): Promise<void> {
  categoryTreeSelectedKeys.value = [selected ? node.value : "all-products"];
  selectedProductKeys.value = [];
  await productDataSource.updateQuery({ category: getSelectedCategory() }, { resetPage: true });
}

async function queryProducts(): Promise<void> {
  selectedProductKeys.value = [];
  await productDataSource.updateQuery({
    keyword: keyword.value.trim(),
    status: status.value,
    category: getSelectedCategory(),
  }, { resetPage: true });
}

function resetFilters(): void {
  keyword.value = "";
  status.value = "";
  categoryTreeSelectedKeys.value = ["all-products"];
  selectedProductKeys.value = [];
  void productDataSource.replaceQuery({ ...DEFAULT_PRODUCT_QUERY });
}

function getStatusDisplay(value: ProductStatus): ProductStatusDisplay {
  const statusMap: Record<ProductStatus, ProductStatusDisplay> = {
    on_sale: { label: "在售", tone: "success" },
    draft: { label: "草稿", tone: "warning" },
    archived: { label: "已归档", tone: "neutral" },
  };
  return statusMap[value];
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", minimumFractionDigits: 2 }).format(amount);
}

function handleSortChange(nextSort: { key: string; order: "asc" | "desc" }): void {
  if (!(["updatedAt", "price", "stock", "sales"] as const).includes(nextSort.key as "updatedAt" | "price" | "stock" | "sales")) return;
  void productDataSource.setSort(nextSort.key as NonNullable<ProductListQuery["sortBy"]>, nextSort.order);
}

function updateProductPage(nextPage: number): void {
  void productDataSource.setPage(nextPage);
}

function updateProductPageSize(nextPageSize: number): void {
  void productDataSource.setPageSize(nextPageSize);
}

function openProductEditor(mode: "create" | "edit", productId?: string): void {
  productEditorMode.value = mode;
  productEditorId.value = productId;
  productEditorState.value = { activeStep: 0, isLoading: mode === "edit", isSaving: false };
  isProductEditorOpen.value = true;
}

function closeProductEditor(): void {
  isProductEditorOpen.value = false;
  productEditorId.value = undefined;
  productEditorRef.value = null;
}

/** 删除后在最后一页没有数据时回退一页，避免列表停留在空页。 */
async function confirmRemoveProduct(): Promise<void> {
  const target = deleteTarget.value;
  if (!target || isDeleting.value) return;
  isDeleting.value = true;
  try {
    await removeProduct(target.id);
    deleteTarget.value = null;
    selectedProductKeys.value = selectedProductKeys.value.filter((key) => key !== target.id);
    if (products.value.length === 1 && page.value > 1) await productDataSource.setPage(page.value - 1);
    else await productDataSource.reload();
    feedbackStore.show(`商品“${target.name}”已删除。`, "success");
  } catch (error) {
    feedbackStore.show(error instanceof Error ? error.message : "删除商品失败，请稍后重试。", "error");
  } finally {
    isDeleting.value = false;
  }
}

function handleProductEditorState(nextState: ProductEditorState): void {
  productEditorState.value = nextState;
}

function cancelProductEditorFromDialog(): void {
  productEditorRef.value?.cancel();
}

function goToPreviousProductStep(): void {
  productEditorRef.value?.goToPreviousStep();
}

function goToNextProductStep(): void {
  productEditorRef.value?.goToNextStep();
}

async function saveProductDraftFromDialog(): Promise<void> {
  await productEditorRef.value?.saveDraft();
}

async function publishProductFromDialog(): Promise<void> {
  await productEditorRef.value?.publishProduct();
}

function handleProductEditorSaved(event: { isPublishing: boolean }): void {
  void productDataSource.reload();
  if (event.isPublishing) closeProductEditor();
}

function getCategoryPathByCode(categoryCode: string): string[] {
  const category = findProductCategory(categoryCode);
  if (!category) return ["all-products"];
  const path: string[] = [];
  let currentCategory: ProductCategoryTreeNode | null = category;
  while (currentCategory && currentCategory.code !== "all-products") {
    path.unshift(currentCategory.code);
    currentCategory = findProductCategory(currentCategory.parentCode);
  }
  return ["all-products", ...path];
}

async function requestBatchEdit(payload: DataTableBatchEditPayload<ProductRecord>): Promise<void> {
  const ids = payload.rowKeys.filter((key): key is string => typeof key === "string");
  if (!ids.length) throw new Error("请先选择需要批量更新的商品。");
  if (payload.field.key === "status" && typeof payload.value === "string" && ["on_sale", "draft", "archived"].includes(payload.value)) {
    await batchUpdateProducts({ ids, field: "status", value: payload.value as ProductStatus });
  } else if (payload.field.key === "category" && typeof payload.value === "string" && payload.value.trim()) {
    const category = findProductCategory(payload.value);
    if (!category || category.status === "disabled" || category.children.length) throw new Error("请选择一个已启用的末级商品分类。");
    await batchUpdateProducts({ ids, field: "category", value: category.name, categoryCode: category.code, categoryPath: getCategoryPathByCode(category.code) });
  } else {
    throw new Error("当前批量修改值无效，请重新选择。");
  }
  await productDataSource.reload();
}

function handleBatchUpdated(payload: DataTableBatchEditPayload<ProductRecord>): void {
  selectedProductKeys.value = [];
  feedbackStore.show(`已更新 ${payload.rowKeys.length} 个商品的${payload.field.label}。`, "success");
}

function handleBatchUpdateError(_payload: DataTableBatchEditPayload<ProductRecord> | null, message: string): void {
  feedbackStore.show(message, "error");
}

async function importProductSpreadsheet({ file, signal, onProgress }: UploadRequestOptions): Promise<UploadRequestResult> {
  onProgress(16);
  const result = await importProducts(file, signal);
  onProgress(100);
  await productDataSource.reload({ resetPage: true });
  feedbackStore.show(`已导入 ${result.importedCount} 个商品，请补充商品信息后发布。`, "success");
  return { url: `product-import://${result.productIds.join(",")}` };
}

function escapeCsvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

async function downloadProducts(): Promise<void> {
  if (isExporting.value) return;
  isExporting.value = true;
  try {
    const query = productDataSource.query.value;
    const rows = await exportProducts({ keyword: query.keyword?.trim() || undefined, status: query.status || undefined, category: query.category || undefined, sortBy: query.sortBy, sortOrder: query.sortOrder });
    const header = ["商品名称", "主 SKU", "分类", "起售价", "可售库存", "累计销量", "状态", "最近更新"];
    const lines = rows.map((row) => [row.name, row.sku, row.category, row.price, row.stock, row.sales, getStatusDisplay(row.status).label, row.updatedAt].map(escapeCsvCell).join(","));
    const blob = new Blob([`\ufeff${header.map(escapeCsvCell).join(",")}\n${lines.join("\n")}`], { type: "text/csv;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "商品列表.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1_000);
    feedbackStore.show("商品数据已开始导出。", "success");
  } catch (error) {
    feedbackStore.show(error instanceof Error ? error.message : "导出商品数据失败，请稍后重试。", "error");
  } finally {
    isExporting.value = false;
  }
}

async function createProductTableView(name: string): Promise<void> {
  const view = await productTableViewState.createView(name);
  if (view) feedbackStore.show(`已新建表格视图“${view.name}”。`, "success");
}

async function renameProductTableView(viewId: string, name: string): Promise<void> {
  if (await productTableViewState.renameView(viewId, name)) feedbackStore.show("表格视图名称已更新。", "success");
}

async function removeProductTableView(viewId: string): Promise<void> {
  if (await productTableViewState.removeView(viewId)) feedbackStore.show("表格视图已删除。", "success");
}

onMounted(() => {
  void Promise.all([loadProductCategories(), productDataSource.reload()]);
});

/** 商品页被 keep-alive 缓存后重新激活时，重新获取分类树以同步分类管理页的改动。 */
onActivated(() => {
  void loadProductCategories();
});
</script>

<template>
  <section class="page-content page-stack list-page-layout product-list-page" aria-label="商品与 SKU 管理">
    <div class="product-workspace">
      <AppSplitter v-model="categoryTreePanelSize" v-model:collapsed="isCategoryTreeCollapsed" direction="horizontal" :min="PRODUCT_CATEGORY_PANEL_MIN_SIZE" :max="PRODUCT_CATEGORY_PANEL_MAX_SIZE" collapsible aria-label="商品分类与商品列表分栏" first-panel-label="商品分类筛选" second-panel-label="商品列表" class="product-workspace-splitter" @change="handleCategoryTreePanelChanged" @collapse-change="handleCategoryTreePanelCollapseChanged">
        <template #first>
          <AppCard as="section" padding="large" fill-height class="product-category-tree-card" aria-label="商品分类筛选">
            <header><div><h2>商品分类</h2><p>选择分类后立即筛选商品列表。</p></div></header>
            <AppTree v-model:expanded-keys="categoryTreeExpandedKeys" v-model:selected-keys="categoryTreeSelectedKeys" :nodes="productCategoryTreeNodes" filterable show-line aria-label="商品分类树" @select="handleCategoryTreeSelect" />
          </AppCard>
        </template>
        <template #second><div class="product-workspace-main">
        <AppCard as="section" padding="large" content-overflow="visible" class="list-search-panel" aria-label="商品筛选条件">
          <AppFilterBar @submit="queryProducts" @reset="resetFilters">
            <AppFormField label="关键词" for="product-keyword" label-position="inline" label-width="48px" label-gap="8px"><AppSearchInput id="product-keyword" v-model="keyword" placeholder="搜索商品名称、SKU 或品牌" @search="queryProducts" /></AppFormField>
            <template #advanced><AppFormField label="状态" for="product-status" label-position="inline" label-width="40px" label-gap="8px"><AppSelect id="product-status" v-model="status" :options="productStatusOptions" aria-label="按商品状态筛选" /></AppFormField></template>
            <template #actions><AppButton type="submit" leading-icon="search" :loading="isLoading">查询</AppButton></template>
          </AppFilterBar>
        </AppCard>

        <AppCard as="section" padding="none" fill-height class="data-table-card" aria-label="商品列表">
      <AppTableToolbar :selected-count="selectedProductKeys.length">
        <AppButton leading-icon="plus" @click="openProductEditor('create')">新建商品</AppButton>
        <template #bulk>
          <AppTableBatchEditor :selected-keys="selectedProductKeys" :fields="batchEditFields" :request="requestBatchEdit" @success="handleBatchUpdated" @error="handleBatchUpdateError" />
          <AppIconButton icon="close" label="取消选择商品" size="small" @click="selectedProductKeys = []" />
        </template>
        <template #actions>
          <AppTableOperationBar :fullscreen="isTableFullscreen" show-fullscreen show-refresh :refresh-disabled="isLoading" @update:fullscreen="isTableFullscreen = $event" @refresh="productDataSource.reload()">
            <template #view><AppTableViewSelector :model-value="activeProductTableViewId" :views="productTableViews" :loading="isLoadingProductTableViews" :saving="isSavingProductTableViews" :error="productTableViewError" @update:model-value="productTableViewState.selectView" @create="createProductTableView" @rename="renameProductTableView" @remove="removeProductTableView" /></template>
            <template #settings><AppTableSettingsPanel :model-value="productTablePreference" :default-value="defaultProductTablePreference" :columns="PRODUCT_TABLE_COLUMNS" :saving="isSavingProductTablePreference" :save-error="productTablePreferenceError" @update:model-value="updateProductTablePreference" /></template>
            <template #export>
              <AppPopover v-model="isProductFilePanelOpen" label="商品数据操作"><template #trigger="{ toggle }"><AppIconButton icon="download" label="导入或导出商品数据" @click="toggle" /></template><div class="table-file-panel"><strong>商品数据</strong><span>支持 .xlsx、.xls 与 .csv 文件。</span><AppExcelImport v-model="importingFiles" :multiple="false" :request="importProductSpreadsheet" /><AppExcelExport filename="商品列表.xlsx" :loading="isExporting" @export="downloadProducts" /></div></AppPopover>
            </template>
          </AppTableOperationBar>
        </template>
      </AppTableToolbar>
      <AppDataTable :key="productTableInstanceKey" :rows="products" :columns="productTableColumns" row-key="id" :loading="isLoading" :error-message="errorMessage" :sort="tableSort" :column-widths="productColumnWidths" :striped="productTablePreference.striped" :show-column-dividers="productTablePreference.showColumnDividers" :size="productTableSize" :fullscreen="isTableFullscreen" selectable :selected-keys="selectedProductKeys" show-index resizable virtual fill-height :virtual-row-height="productTablePreference.density === 'compact' ? 64 : 72" action-label="操作" empty-title="没有匹配商品" empty-description="调整筛选条件，或创建一个新的商品。" empty-icon="grid" @update:selected-keys="selectedProductKeys = $event" @update:column-widths="updateProductColumnWidths" @update:fullscreen="isTableFullscreen = $event" @sort-change="handleSortChange" @retry="productDataSource.reload()">
        <template #cell-name="{ row }"><button type="button" class="product-cell" @click="openProductEditor('edit', row.id)"><span v-if="row.coverUrl" class="product-cover"><AppImage :src="row.coverUrl" :alt="`${row.name}缩略图`" aspect-ratio="1 / 1" radius="small" /></span><span v-else class="product-cover product-cover-fallback" :class="`is-${row.coverTone}`">{{ row.name.slice(0, 1) }}</span><span><strong>{{ row.name }}</strong><small>{{ row.category }}</small></span></button></template>
        <template #cell-price="{ row }"><strong class="numeric">{{ formatAmount(row.price) }}</strong></template>
        <template #cell-stock="{ row }"><strong class="numeric" :class="{ 'is-warning': row.stock < 30 }">{{ row.stock }}</strong></template>
        <template #cell-sales="{ row }"><span class="numeric">{{ row.sales.toLocaleString('zh-CN') }}</span></template>
        <template #cell-status="{ row }"><AppStatusTag :tone="getStatusDisplay(row.status).tone" :label="getStatusDisplay(row.status).label" /></template>
        <template #actions="{ row }"><AppTableActions><AppIconButton icon="edit" label="编辑商品与 SKU" size="small" @click="openProductEditor('edit', row.id)" /><AppIconButton icon="trash" label="删除商品" size="small" variant="danger" @click="deleteTarget = row" /></AppTableActions></template>
      </AppDataTable>
          <AppPagination v-if="!isLoading && !errorMessage && products.length" :page="page" :page-size="pageSize" :total="total" :page-size-options="[10, 20, 30, 50]" @update:page="updateProductPage" @update:page-size="updateProductPageSize" />
        </AppCard>
        </div></template>
      </AppSplitter>
    </div>

    <AppDialog v-model="isProductEditorOpen" :title="productEditorMode === 'create' ? '新建商品' : '编辑商品'" width="wide" :close-on-overlay="false" @close="closeProductEditor">
      <ProductEditorView v-if="isProductEditorOpen" ref="productEditorRef" :key="`${productEditorMode}-${productEditorId ?? 'new'}`" :mode="productEditorMode" :product-id="productEditorId" embedded @close="closeProductEditor" @saved="handleProductEditorSaved" @state-change="handleProductEditorState" />
      <template #footer>
        <div class="product-editor-dialog-footer">
          <div class="product-editor-dialog-footer-side"><AppButton variant="ghost" :disabled="productEditorState.isSaving" @click="cancelProductEditorFromDialog">取消</AppButton><AppButton v-if="productEditorState.activeStep > 0" variant="secondary" leading-icon="arrow-left" :disabled="productEditorState.isSaving" @click="goToPreviousProductStep">上一步</AppButton></div>
          <div class="product-editor-dialog-footer-side"><AppButton variant="secondary" :loading="productEditorState.isSaving && productEditorState.activeStep !== 3" :disabled="productEditorState.isSaving || productEditorState.isLoading" @click="saveProductDraftFromDialog">保存草稿</AppButton><AppButton v-if="productEditorState.activeStep < 3" :disabled="productEditorState.isSaving || productEditorState.isLoading" trailing-icon="chevron-right" @click="goToNextProductStep">下一步</AppButton><AppButton v-else :loading="productEditorState.isSaving" :disabled="productEditorState.isLoading" leading-icon="check" @click="publishProductFromDialog">校验并发布</AppButton></div>
        </div>
      </template>
    </AppDialog>
    <AppConfirmDialog :model-value="Boolean(deleteTarget)" title="确认删除商品？" :description="`删除“${deleteTarget?.name ?? ''}”后，其全部 SKU、库存配置和商品素材引用将一并移除。`" confirm-text="确认删除" danger :is-submitting="isDeleting" @update:model-value="deleteTarget = null" @confirm="confirmRemoveProduct" />
  </section>
</template>

<style scoped>
.product-list-page { min-height: 0; grid-template-rows: minmax(0, 1fr); }
.product-workspace { min-width: 0; min-height: 0; height: 100%; }
.product-workspace-splitter { min-height: 0; height: 100%; overflow: visible; border: 0; border-radius: 0; background: transparent; }
.product-workspace-splitter :deep(.splitter-panel) { min-height: 0; padding: 0; overflow: visible; }
.product-workspace-splitter :deep(.splitter-panel + .splitter-panel) { background: transparent; }
.product-workspace-splitter :deep(.splitter-panel:last-child) { margin-left: var(--aps-page-stack-gap); transition: margin-left 260ms cubic-bezier(.22, 1, .36, 1); }
/* 分类面板收起后，展开控制块直接贴近商品工作区，避免保留展开状态的栏间留白。 */
.product-workspace-splitter.is-first-collapsed :deep(.splitter-panel:last-child) { margin-left: 0; }
.product-workspace-main { display: grid; min-width: 0; min-height: 0; height: 100%; grid-template-rows: auto minmax(0, 1fr); gap: var(--aps-page-stack-gap); }
.product-category-tree-card { min-height: 0; }
.product-category-tree-card :deep(.card-content) { display: grid !important; min-height: 0; grid-template-rows: auto minmax(0, 1fr); gap: 16px; }
.product-category-tree-card header { display: flex; min-width: 0; align-items: flex-start; justify-content: space-between; gap: 8px; }.product-category-tree-card header > div:first-child { min-width: 0; flex: 1 1 auto; }
.product-category-tree-card h2, .product-category-tree-card p { margin: 0; }
.product-category-tree-card h2 { overflow: hidden; color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: 720; text-overflow: ellipsis; white-space: nowrap; }
.product-category-tree-card p { margin-top: 5px; overflow: hidden; color: var(--aps-muted); font-size: var(--aps-text-xs); line-height: 1.5; text-overflow: ellipsis; white-space: nowrap; }
.product-category-tree-card :deep(.app-tree) { display: grid; min-height: 0; height: 100%; grid-template-rows: auto minmax(0, 1fr); border: 0; border-radius: 0; }
.product-category-tree-card :deep(.tree-search) { margin: 0 0 8px; }
.product-category-tree-card :deep(.tree-node-list) { min-height: 0; max-height: none; align-content: start; padding: 0; }
.product-cell { display: flex; width: 100%; min-width: 0; align-items: center; gap: 10px; padding: 0; border: 0; background: transparent; color: inherit; font: inherit; text-align: left; text-decoration: none; }
.product-cell:hover strong { color: var(--aps-blue); }
.product-cell > span:last-child { min-width: 0; }
.product-cell strong, .product-cell small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.product-cell strong { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: 680; transition: color 160ms ease; }
.product-cell small { margin-top: 3px; color: var(--aps-faint); font-size: var(--aps-text-xs); }
.product-cover { display: block; width: 38px; height: 38px; min-width: 38px; flex: 0 0 38px; overflow: hidden; border-radius: var(--aps-radius-control); }
.product-cover :deep(.app-image) { width: 100%; height: 100%; border-radius: inherit; }
.product-cover-fallback { display: grid; place-items: center; color: #fff; font-size: var(--aps-text-sm); font-weight: 720; }
.product-cover-fallback.is-blue { background: #426b9e; }
.product-cover-fallback.is-orange { background: #c2743c; }
.product-cover-fallback.is-purple { background: #846ba4; }
.product-cover-fallback.is-green { background: #438b77; }
.product-cover-fallback.is-graphite { background: #4a5663; }
.numeric { color: var(--aps-ink); font-size: var(--aps-text-sm); font-variant-numeric: tabular-nums; }
.numeric.is-warning { color: var(--aps-orange); font-weight: 700; }
.table-file-panel { display: grid; width: min(320px, calc(100vw - 32px)); gap: 10px; padding: 12px; }
.table-file-panel strong { color: var(--aps-ink); font-size: var(--aps-text-sm); }
.table-file-panel > span { color: var(--aps-faint); font-size: var(--aps-text-xs); line-height: 1.5; }
.table-file-panel :deep(.app-upload) { margin-top: 2px; }
.table-file-panel :deep(.app-button-control) { justify-content: center; }
.product-editor-dialog-footer { display: flex; width: 100%; min-width: 0; align-items: center; justify-content: space-between; gap: 16px; }
.product-editor-dialog-footer-side { display: flex; min-width: 0; align-items: center; gap: 8px; }
.product-editor-dialog-footer :deep(.app-button-control) { white-space: nowrap; }
@media (max-width: 960px) {
  .product-list-page { height: auto; overflow: visible; }
  .product-workspace { height: auto; }
  .product-workspace-splitter { display: block !important; height: auto; }
  .product-workspace-splitter :deep(.splitter-panel) { overflow: visible; }.product-workspace-splitter :deep(.splitter-panel:first-child) { margin: 0 0 var(--aps-page-stack-gap); }.product-workspace-splitter :deep(.splitter-panel:last-child) { margin-left: 0; }.product-workspace-splitter :deep(.splitter-separator) { display: none; }
  .product-workspace-splitter :deep(.app-splitter.is-first-collapsed .splitter-panel-first) { display: none; }.product-workspace-splitter :deep(.app-splitter.is-first-collapsed .splitter-separator) { display: grid; min-height: 34px; }.product-workspace-splitter :deep(.app-splitter.is-first-collapsed .splitter-panel:last-child) { display: block; }
  .product-workspace-main { height: auto; grid-template-rows: auto auto; }
  .product-category-tree-card { min-height: 360px; }
  .product-category-tree-card :deep(.tree-node-list) { max-height: 280px; }
}
@media (max-width: 680px) {
  .product-editor-dialog-footer { align-items: stretch; flex-direction: column; }
  .product-editor-dialog-footer-side { justify-content: stretch; }
  .product-editor-dialog-footer-side :deep(.app-button-control) { flex: 1 1 auto; }
}
</style>
