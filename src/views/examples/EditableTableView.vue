<script setup lang="ts">
import { computed, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppEditableTable, AppPagination, AppStatusTag, AppTableBatchEditor, AppTableToolbar } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import { AppFormField } from "aps-design-pro";
import { AppInput } from "aps-design-pro";
import { AppFilterBar } from "aps-design-pro";
import type { DataTableBatchEditField, DataTableBatchEditPayload, DataTableColumn, DataTableEditContext, DataTableEditorValue, SelectOption, StatusTone, TableRowKey } from "aps-design-pro";

type ProductStatus = "on-sale" | "draft" | "offline";

interface ProductRow {
  id: string;
  name: string;
  category: string;
  price: number;
  status: ProductStatus;
  updatedAt: string;
}

const statusOptions: SelectOption[] = [
  { label: "销售中", value: "on-sale" },
  { label: "草稿", value: "draft" },
  { label: "已下架", value: "offline" },
];
const categoryOptions: SelectOption[] = [
  { label: "前端开发", value: "前端开发" },
  { label: "后端开发", value: "后端开发" },
  { label: "数据工程", value: "数据工程" },
];
const allProducts = ref<ProductRow[]>([
  { id: "course-001", name: "Vue 组件设计实践", category: "前端开发", price: 299, status: "on-sale", updatedAt: "2026-08-02 09:12" },
  { id: "course-002", name: "TypeScript 类型建模", category: "前端开发", price: 249, status: "on-sale", updatedAt: "2026-08-02 08:44" },
  { id: "course-003", name: "Node.js 服务治理", category: "后端开发", price: 329, status: "draft", updatedAt: "2026-08-01 18:26" },
  { id: "course-004", name: "Java 并发编程进阶", category: "后端开发", price: 399, status: "on-sale", updatedAt: "2026-08-01 16:08" },
  { id: "course-005", name: "数据仓库建模方法", category: "数据工程", price: 359, status: "offline", updatedAt: "2026-07-31 21:45" },
  { id: "course-006", name: "SQL 性能优化指南", category: "数据工程", price: 199, status: "on-sale", updatedAt: "2026-07-31 20:17" },
  { id: "course-007", name: "前端可访问性设计", category: "前端开发", price: 219, status: "draft", updatedAt: "2026-07-30 14:36" },
  { id: "course-008", name: "API 设计与演进", category: "后端开发", price: 279, status: "on-sale", updatedAt: "2026-07-30 10:28" },
]);
const keyword = ref("");
const page = ref(1);
const pageSize = ref(6);
const lastAction = ref("双击可编辑的单元格开始修改");
const selectedProductKeys = ref<TableRowKey[]>([]);

const tableColumns: DataTableColumn<ProductRow>[] = [
  { key: "name", label: "课程名称", defaultWidth: 270, minWidth: 220, maxWidth: 420, editable: true, editor: { type: "text", placeholder: "输入课程名称" } },
  { key: "category", label: "分类", defaultWidth: 150, minWidth: 128, maxWidth: 220, editable: true, editor: { type: "select", options: categoryOptions } },
  { key: "price", label: "价格", defaultWidth: 130, minWidth: 110, maxWidth: 180, align: "right", editable: true, editor: { type: "number", min: 0, max: 9999, step: 1 } },
  { key: "status", label: "状态", defaultWidth: 140, minWidth: 120, maxWidth: 190, editable: true, editor: { type: "select", options: statusOptions } },
  { key: "updatedAt", label: "更新时间", defaultWidth: 180, minWidth: 164, maxWidth: 260 },
];
const batchEditFields: DataTableBatchEditField<ProductRow>[] = [
  { key: "category", label: "分类", editor: { type: "select", options: categoryOptions } },
  { key: "price", label: "价格", editor: { type: "number", min: 0, max: 9999, step: 1 } },
  { key: "status", label: "状态", editor: { type: "select", options: statusOptions } },
];

const filteredProducts = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLocaleLowerCase("zh-CN");
  if (!normalizedKeyword) return allProducts.value;
  return allProducts.value.filter((product) => `${product.name} ${product.category}`.toLocaleLowerCase("zh-CN").includes(normalizedKeyword));
});
const total = computed(() => filteredProducts.value.length);
const visibleProducts = computed(() => filteredProducts.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));

function queryProducts(): void {
  page.value = 1;
  selectedProductKeys.value = [];
  lastAction.value = keyword.value.trim() ? `已按“${keyword.value.trim()}”筛选课程` : "已刷新全部课程";
}

function resetProducts(): void {
  keyword.value = "";
  queryProducts();
}

function validateEdit(context: DataTableEditContext<ProductRow>, value: DataTableEditorValue): string | void {
  if (context.column.key === "name" && (!value || String(value).trim().length < 2)) return "课程名称至少需要 2 个字符。";
  if (context.column.key === "price" && (typeof value !== "number" || value < 0)) return "价格必须是大于等于 0 的数字。";
  if (context.column.key === "status" && typeof value !== "string") return "请选择课程状态。";
}

/** 案例以异步服务边界验证组件行为；真实业务中替换为接口模块方法即可。 */
function waitForSaveResponse(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 320));
}

function updateProduct(product: ProductRow, fieldKey: keyof ProductRow, value: DataTableEditorValue): ProductRow {
  const updatedAt = "2026-08-02 10:00";
  if (fieldKey === "name") return { ...product, name: String(value).trim(), updatedAt };
  if (fieldKey === "category") return { ...product, category: String(value), updatedAt };
  if (fieldKey === "price") return { ...product, price: Number(value), updatedAt };
  if (fieldKey === "status") return { ...product, status: String(value) as ProductStatus, updatedAt };
  return product;
}

/** 下架课程重新发布需要审核，用真实的业务规则验证异步失败时不会污染页面数据。 */
function assertPublicationRule(rowKeys: TableRowKey[], fieldKey: keyof ProductRow, value: DataTableEditorValue): void {
  const containsOfflineCourse = rowKeys.includes("course-005");
  if (containsOfflineCourse && fieldKey === "status" && value === "on-sale") {
    throw new Error("该课程下架后需先完成审核，暂不能直接发布。");
  }
}

async function requestEdit(context: DataTableEditContext<ProductRow>, value: DataTableEditorValue): Promise<void> {
  await waitForSaveResponse();
  assertPublicationRule([context.rowKey], context.column.key, value);
  allProducts.value = allProducts.value.map((product) => product.id === context.rowKey ? updateProduct(product, context.column.key, value) : product);
}

function handleEditSaved(context: DataTableEditContext<ProductRow>): void {
  lastAction.value = `已保存“${context.column.label}”修改`;
}

function handleEditError(context: DataTableEditContext<ProductRow>, _value: DataTableEditorValue, message: string): void {
  lastAction.value = `“${context.row.name}”未保存：${message}`;
}

async function requestBatchEdit(payload: DataTableBatchEditPayload<ProductRow>): Promise<void> {
  await waitForSaveResponse();
  assertPublicationRule(payload.rowKeys, payload.field.key, payload.value);
  const selectedKeySet = new Set(payload.rowKeys);
  allProducts.value = allProducts.value.map((product) => selectedKeySet.has(product.id) ? updateProduct(product, payload.field.key, payload.value) : product);
}

function handleBatchSaved(payload: DataTableBatchEditPayload<ProductRow>): void {
  selectedProductKeys.value = [];
  lastAction.value = `已批量更新 ${payload.rowKeys.length} 门课程的“${payload.field.label}”`;
}

function handleBatchError(_payload: DataTableBatchEditPayload<ProductRow> | null, message: string): void {
  lastAction.value = `批量修改未保存：${message}`;
}

function statusDisplay(status: ProductStatus): { label: string; tone: StatusTone } {
  const statusMap: Record<ProductStatus, { label: string; tone: StatusTone }> = {
    "on-sale": { label: "销售中", tone: "success" },
    draft: { label: "草稿", tone: "warning" },
    offline: { label: "已下架", tone: "neutral" },
  };
  return statusMap[status];
}
</script>

<template>
  <section class="editable-table-page page-content page-stack list-page-layout" aria-label="可编辑表格案例">
    <AppCard as="section" padding="large" content-overflow="visible" class="editable-filter" aria-label="课程筛选条件">
      <AppFilterBar @submit="queryProducts" @reset="resetProducts">
        <AppFormField label="关键词" for="editable-course-keyword" label-position="inline" label-width="44px" label-gap="6px"><AppInput id="editable-course-keyword" v-model="keyword" placeholder="搜索课程名称或分类" aria-label="搜索课程" /></AppFormField>
        <template #actions><AppButton type="submit" leading-icon="search">查询</AppButton></template>
      </AppFilterBar>
    </AppCard>

    <AppCard as="section" padding="none" fill-height class="editable-table-card" aria-label="课程可编辑表格">
      <AppTableToolbar :selected-count="selectedProductKeys.length"><span class="table-summary">{{ lastAction }}</span><template #actions><AppButton variant="secondary" @click="resetProducts">刷新数据</AppButton></template><template #bulk><AppTableBatchEditor :selected-keys="selectedProductKeys" :fields="batchEditFields" :request="requestBatchEdit" @success="handleBatchSaved" @error="handleBatchError" /><AppButton variant="text" size="small" @click="selectedProductKeys = []">取消选择</AppButton></template></AppTableToolbar>
      <AppEditableTable :rows="visibleProducts" :columns="tableColumns" row-key="id" selectable :selected-keys="selectedProductKeys" editable resizable bordered striped show-column-dividers aria-label="课程列表" action-label="操作" :validator="validateEdit" :request="requestEdit" @update:selected-keys="selectedProductKeys = $event" @edit-save="handleEditSaved" @edit-error="handleEditError"><template #display-price="{ value }"><strong class="price-cell">¥ {{ Number(value).toFixed(0) }}</strong></template><template #display-status="{ value }"><AppStatusTag :label="statusDisplay(value as ProductStatus).label" :tone="statusDisplay(value as ProductStatus).tone" /></template><template #actions="{ row }"><AppButton variant="text" size="small" @click="lastAction = `已查看 ${row.name}`">查看</AppButton></template></AppEditableTable>
      <AppPagination :page="page" :page-size="pageSize" :total="total" :page-size-options="[4, 6, 8]" @update:page="page = $event" @update:page-size="pageSize = $event" />
    </AppCard>
  </section>
</template>

<style scoped>
.editable-table-page { display: grid; min-height: 0; gap: var(--aps-page-stack-gap); }.editable-filter { min-width: 0; }.editable-table-card { min-height: 0; }.editable-table-card :deep(.card-content) { min-height: 0; }.table-summary { color: var(--aps-muted); font-size: var(--aps-text-sm); }.price-cell { color: var(--aps-ink); font-size: var(--aps-text-sm); font-variant-numeric: tabular-nums; }.editable-table-card :deep(.editable-cell) { cursor: text; }.editable-table-card :deep(.editable-cell:hover:not(.is-editing)) { color: var(--aps-blue); }
</style>
