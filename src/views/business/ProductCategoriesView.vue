<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
  AppButton,
  AppCard,
  AppConfirmDialog,
  AppDataTable,
  AppDialog,
  AppFilterBar,
  AppFormField,
  AppIconButton,
  AppInput,
  AppNumberInput,
  AppPagination,
  AppSearchInput,
  AppSelect,
  AppStatusTag,
  AppTableActions,
  AppTableOperationBar,
  AppTableToolbar,
} from "aps-design-pro";
import { createProductCategory, getProductCategoryTree, removeProductCategory, updateProductCategory } from "@/api/modules/ecommerce";
import { useFeedbackStore } from "@/stores/feedback";
import type { DataTableColumn, SelectOption, StatusTone } from "aps-design-pro";
import type { ProductCategorySaveInput, ProductCategoryStatus, ProductCategoryTreeNode } from "@/types/ecommerce";

interface ProductCategoryDraft extends ProductCategorySaveInput {
  id?: string;
}

interface ProductCategoryStatusDisplay {
  label: string;
  tone: StatusTone;
}

const PRODUCT_CATEGORY_ROOT_CODE = "all-products";
const PRODUCT_CATEGORY_CODE_PATTERN = /^[a-z][a-z0-9-]{1,47}$/;
const CATEGORY_TABLE_COLUMNS: DataTableColumn<ProductCategoryTreeNode>[] = [
  { key: "name", label: "分类名称", defaultWidth: 220, minWidth: 180 },
  { key: "code", label: "分类编码", defaultWidth: 180, minWidth: 146 },
  { key: "productCount", label: "商品数量", defaultWidth: 128, minWidth: 108, align: "right" },
  { key: "sortOrder", label: "展示排序", defaultWidth: 128, minWidth: 108, align: "right" },
  { key: "status", label: "发布状态", defaultWidth: 126, minWidth: 108 },
  { key: "updatedAt", label: "最近更新", defaultWidth: 148, minWidth: 128 },
];
const categoryStatusOptions: SelectOption[] = [
  { label: "全部状态", value: "" },
  { label: "已发布", value: "enabled" },
  { label: "已停用", value: "disabled" },
];
const categoryFormStatusOptions: SelectOption[] = categoryStatusOptions.filter((item) => item.value);

const feedbackStore = useFeedbackStore();
const keyword = ref("");
const status = ref<"" | ProductCategoryStatus>("");
const page = ref(1);
const pageSize = ref(10);
const categoryTree = ref<ProductCategoryTreeNode | null>(null);
const isLoading = ref(false);
const errorMessage = ref("");
const isCategoryDialogOpen = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const formError = ref("");
const deleteTarget = ref<ProductCategoryTreeNode | null>(null);
const categoryDraft = reactive<ProductCategoryDraft>(createEmptyCategoryDraft());

const categoryRows = computed<ProductCategoryTreeNode[]>(() => flattenCategoryTree(categoryTree.value));
const filteredCategories = computed<ProductCategoryTreeNode[]>(() => {
  const normalizedKeyword = keyword.value.trim().toLocaleLowerCase("zh-CN");
  return categoryRows.value.filter((category) => {
    const matchesKeyword = !normalizedKeyword
      || category.name.toLocaleLowerCase("zh-CN").includes(normalizedKeyword)
      || category.code.toLocaleLowerCase("en-US").includes(normalizedKeyword);
    return matchesKeyword && (!status.value || category.status === status.value);
  });
});
const visibleCategories = computed<ProductCategoryTreeNode[]>(() => {
  const start = (page.value - 1) * pageSize.value;
  return filteredCategories.value.slice(start, start + pageSize.value);
});
const parentCategoryOptions = computed<SelectOption[]>(() => [
  { label: "顶级分类", value: PRODUCT_CATEGORY_ROOT_CODE },
  ...categoryRows.value.map((category) => ({
    label: `${category.name}（${category.code}）`,
    value: category.code,
    disabled: category.status === "disabled",
  })),
]);
const categoryDialogTitle = computed(() => categoryDraft.id ? "编辑分类" : "新建分类");
const deleteDescription = computed(() => {
  const target = deleteTarget.value;
  if (!target) return "删除后不可恢复。";
  if (target.children.length) return `该分类下仍有 ${target.children.length} 个子分类，请先处理子分类后再删除。`;
  if (target.productCount) return `该分类仍关联 ${target.productCount} 个商品，请先完成商品归类后再删除。`;
  return `删除“${target.name}”后不可恢复。`;
});

function createEmptyCategoryDraft(): ProductCategoryDraft {
  return { id: undefined, name: "", code: "", parentCode: PRODUCT_CATEGORY_ROOT_CODE, status: "enabled", sortOrder: 10 };
}

/** 分类服务返回根节点，列表仅展示可维护的业务分类，并按树的排序顺序平铺。 */
function flattenCategoryTree(tree: ProductCategoryTreeNode | null): ProductCategoryTreeNode[] {
  if (!tree) return [];
  return tree.children.flatMap((category) => [category, ...flattenCategoryTree(category)]);
}

function getStatusDisplay(categoryStatus: ProductCategoryStatus): ProductCategoryStatusDisplay {
  return categoryStatus === "enabled" ? { label: "已发布", tone: "success" } : { label: "已停用", tone: "neutral" };
}

/** 数据刷新后校正页码，避免删除当前页最后一条数据时停留在空页。 */
function reconcilePage(): void {
  const lastPage = Math.max(1, Math.ceil(filteredCategories.value.length / pageSize.value));
  if (page.value > lastPage) page.value = lastPage;
}

async function loadCategories(): Promise<void> {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    categoryTree.value = await getProductCategoryTree();
    reconcilePage();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "无法加载商品分类，请稍后重试。";
  } finally {
    isLoading.value = false;
  }
}

function submitFilters(): void {
  page.value = 1;
}

function resetFilters(): void {
  keyword.value = "";
  status.value = "";
  page.value = 1;
}

function updatePage(nextPage: number): void {
  page.value = nextPage;
}

function updatePageSize(nextPageSize: number): void {
  pageSize.value = nextPageSize;
  page.value = 1;
}

function openCreateDialog(): void {
  Object.assign(categoryDraft, createEmptyCategoryDraft());
  formError.value = "";
  isCategoryDialogOpen.value = true;
}

function openEditDialog(category: ProductCategoryTreeNode): void {
  Object.assign(categoryDraft, {
    id: category.id,
    name: category.name,
    code: category.code,
    parentCode: category.parentCode,
    status: category.status,
    sortOrder: category.sortOrder,
  });
  formError.value = "";
  isCategoryDialogOpen.value = true;
}

function handleDialogVisible(visible: boolean): void {
  if (visible) {
    isCategoryDialogOpen.value = true;
    return;
  }
  if (isSaving.value) return;
  isCategoryDialogOpen.value = false;
  formError.value = "";
}

/** 编辑不允许调整稳定编码和父级，前端和服务端同时限制以避免分类引用失效。 */
async function saveCategory(): Promise<void> {
  const name = categoryDraft.name.trim();
  const code = categoryDraft.code.trim().toLocaleLowerCase("en-US");
  const sortOrder = Number(categoryDraft.sortOrder);
  if (name.length < 2 || name.length > 30) {
    formError.value = "分类名称需为 2 至 30 个字符。";
    return;
  }
  if (!PRODUCT_CATEGORY_CODE_PATTERN.test(code) || code === PRODUCT_CATEGORY_ROOT_CODE) {
    formError.value = "分类编码需以小写英文字母开头，仅可包含小写字母、数字和连字符。";
    return;
  }
  if (!categoryDraft.parentCode) {
    formError.value = "请选择上级分类。";
    return;
  }
  if (!Number.isFinite(sortOrder) || sortOrder < 0) {
    formError.value = "展示排序需为大于或等于 0 的整数。";
    return;
  }

  const isEditing = Boolean(categoryDraft.id);
  const payload: ProductCategorySaveInput = {
    name,
    code,
    parentCode: categoryDraft.parentCode,
    status: categoryDraft.status,
    sortOrder: Math.floor(sortOrder),
  };
  isSaving.value = true;
  formError.value = "";
  try {
    if (categoryDraft.id) await updateProductCategory(categoryDraft.id, payload);
    else await createProductCategory(payload);
    isCategoryDialogOpen.value = false;
    await loadCategories();
    feedbackStore.show(isEditing ? "商品分类已更新。" : "商品分类已创建。", "success");
  } catch (error) {
    formError.value = error instanceof Error ? error.message : "保存商品分类失败，请稍后重试。";
  } finally {
    isSaving.value = false;
  }
}

async function confirmRemoveCategory(): Promise<void> {
  const target = deleteTarget.value;
  if (!target || isDeleting.value) return;
  isDeleting.value = true;
  try {
    await removeProductCategory(target.id);
    deleteTarget.value = null;
    await loadCategories();
    feedbackStore.show(`商品分类“${target.name}”已删除。`, "success");
  } catch (error) {
    feedbackStore.show(error instanceof Error ? error.message : "删除商品分类失败，请稍后重试。", "error");
  } finally {
    isDeleting.value = false;
  }
}

function escapeCsvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

/** 导出直接复用当前筛选后的完整结果，不受当前分页影响。 */
function downloadCurrentCategories(): void {
  const header = ["分类名称", "分类编码", "商品数量", "展示排序", "发布状态", "最近更新"];
  const lines = filteredCategories.value.map((category) => [
    category.name,
    category.code,
    category.productCount,
    category.sortOrder,
    getStatusDisplay(category.status).label,
    category.updatedAt,
  ].map(escapeCsvCell).join(","));
  const blob = new Blob([`\ufeff${header.map(escapeCsvCell).join(",")}\n${lines.join("\n")}`], { type: "text/csv;charset=utf-8" });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "商品分类.csv";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1_000);
  feedbackStore.show("商品分类数据已开始导出。", "success");
}

onMounted(() => {
  void loadCategories();
});
</script>

<template>
  <section class="page-content page-stack list-page-layout" aria-label="商品分类管理">
    <AppCard as="section" padding="large" content-overflow="visible" class="list-search-panel" aria-label="商品分类筛选条件">
      <AppFilterBar @submit="submitFilters" @reset="resetFilters">
        <AppFormField label="关键词" for="product-category-keyword" label-position="inline" label-width="48px" label-gap="8px">
          <AppSearchInput id="product-category-keyword" v-model="keyword" placeholder="搜索分类名称或编码" aria-label="搜索商品分类" @search="submitFilters" />
        </AppFormField>
        <AppFormField label="状态" for="product-category-status" label-position="inline" label-width="40px" label-gap="8px">
          <AppSelect id="product-category-status" v-model="status" :options="categoryStatusOptions" clearable aria-label="按发布状态筛选商品分类" />
        </AppFormField>
        <template #actions><AppButton type="submit" leading-icon="search" :loading="isLoading">查询</AppButton></template>
      </AppFilterBar>
    </AppCard>

    <AppCard as="section" padding="none" fill-height class="data-table-card" aria-label="商品分类列表">
      <AppTableToolbar>
        <AppButton leading-icon="plus" @click="openCreateDialog">新建分类</AppButton>
        <template #actions>
          <AppTableOperationBar show-refresh :refresh-disabled="isLoading" refresh-label="刷新商品分类列表" @refresh="loadCategories">
            <template #before><AppIconButton icon="download" label="导出当前分类结果" @click="downloadCurrentCategories" /></template>
          </AppTableOperationBar>
        </template>
      </AppTableToolbar>
      <AppDataTable :rows="visibleCategories" :columns="CATEGORY_TABLE_COLUMNS" row-key="id" fill-height :loading="isLoading" :error-message="errorMessage" action-label="操作" empty-title="没有匹配分类" empty-description="调整关键词或状态后再试一次。" empty-icon="menu" aria-label="商品分类数据表格" @retry="loadCategories">
        <template #cell-name="{ row }"><div class="category-primary"><strong>{{ row.name }}</strong><small>{{ row.code }}</small></div></template>
        <template #cell-code="{ row }"><span class="category-code">{{ row.code }}</span></template>
        <template #cell-productCount="{ row }"><span class="numeric">{{ row.productCount.toLocaleString("zh-CN") }} 件</span></template>
        <template #cell-sortOrder="{ row }"><span class="numeric">{{ String(row.sortOrder).padStart(2, "0") }}</span></template>
        <template #cell-status="{ row }"><AppStatusTag :label="getStatusDisplay(row.status).label" :tone="getStatusDisplay(row.status).tone" /></template>
        <template #actions="{ row }"><AppTableActions><AppIconButton icon="edit" label="编辑分类" size="small" @click="openEditDialog(row)" /><AppIconButton icon="trash" label="删除分类" size="small" variant="danger" @click="deleteTarget = row" /></AppTableActions></template>
      </AppDataTable>
      <AppPagination v-if="!isLoading && !errorMessage && filteredCategories.length" :page="page" :page-size="pageSize" :total="filteredCategories.length" :page-size-options="[10, 20, 30, 50]" @update:page="updatePage" @update:page-size="updatePageSize" />
    </AppCard>

    <AppDialog :model-value="isCategoryDialogOpen" :title="categoryDialogTitle" :description="categoryDraft.id ? '分类编码和上级分类创建后不可修改。' : '请填写分类基础信息，并选择可用的上级分类。'" :close-on-overlay="false" @update:model-value="handleDialogVisible">
      <form id="product-category-form" class="category-form" @submit.prevent="saveCategory">
        <AppFormField label="分类名称" for="product-category-name" required>
          <AppInput id="product-category-name" v-model="categoryDraft.name" :max-length="30" show-word-limit placeholder="例如：咖啡器具" autocomplete="off" />
        </AppFormField>
        <AppFormField label="分类编码" for="product-category-code" description="仅使用小写字母、数字和连字符；创建后不可修改。" required>
          <AppInput id="product-category-code" v-model="categoryDraft.code" :readonly="Boolean(categoryDraft.id)" :max-length="48" show-word-limit placeholder="例如：coffee-tools" autocomplete="off" />
        </AppFormField>
        <AppFormField label="上级分类" for="product-category-parent" description="创建后不可修改，避免影响已关联商品。" required>
          <AppSelect id="product-category-parent" v-model="categoryDraft.parentCode" :options="parentCategoryOptions" :disabled="Boolean(categoryDraft.id)" filterable aria-label="选择商品分类的上级分类" />
        </AppFormField>
        <div class="category-form-grid">
          <AppFormField label="展示排序" for="product-category-sort-order"><AppNumberInput id="product-category-sort-order" v-model="categoryDraft.sortOrder" :min="0" :step="1" step-strictly aria-label="设置商品分类展示排序" /></AppFormField>
          <AppFormField label="发布状态" for="product-category-form-status"><AppSelect id="product-category-form-status" v-model="categoryDraft.status" :options="categoryFormStatusOptions" aria-label="设置商品分类发布状态" /></AppFormField>
        </div>
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      </form>
      <template #footer><AppButton variant="secondary" :disabled="isSaving" @click="handleDialogVisible(false)">取消</AppButton><AppButton type="submit" form="product-category-form" :loading="isSaving">{{ isSaving ? "正在保存…" : "保存分类" }}</AppButton></template>
    </AppDialog>

    <AppConfirmDialog :model-value="Boolean(deleteTarget)" title="确认删除分类？" :description="deleteDescription" confirm-text="确认删除" danger :is-submitting="isDeleting" @update:model-value="deleteTarget = null" @confirm="confirmRemoveCategory" />
  </section>
</template>

<style scoped>
.category-primary { min-width: 0; }.category-primary strong, .category-primary small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.category-primary strong { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: var(--aps-font-weight-strong); }.category-primary small { margin-top: 3px; color: var(--aps-faint); font-size: var(--aps-text-xs); }.category-code { color: var(--aps-muted); font-family: var(--aps-font); font-size: var(--aps-text-sm); }.numeric { color: var(--aps-ink); font-variant-numeric: tabular-nums; }.category-form { display: grid; gap: var(--aps-form-gap); }.category-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }.form-error { margin: -3px 0 0; color: var(--aps-red); font-size: var(--aps-text-sm); }@media (max-width: 680px) { .category-form-grid { grid-template-columns: 1fr; } }
</style>
