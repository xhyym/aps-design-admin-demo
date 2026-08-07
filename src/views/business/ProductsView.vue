<script setup lang="ts">
import { onMounted, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppIcon } from "aps-design-pro";
import { AppIconButton } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import { AppDataTable } from "aps-design-pro";
import { AppFormField } from "aps-design-pro";
import { AppFilterBar } from "aps-design-pro";
import { AppPagination } from "aps-design-pro";
import { AppSearchInput } from "aps-design-pro";
import { AppSelect } from "aps-design-pro";
import { AppStatusTag } from "aps-design-pro";
import { AppTableToolbar } from "aps-design-pro";
import { AppTableActions } from "aps-design-pro";
import { AppTableOperationBar } from "aps-design-pro";
import { getProducts, updateProductStatus } from "@/api/modules/ecommerce";
import { useFeedbackStore } from "@/stores/feedback";
import type { ProductListQuery, ProductRecord, ProductStatus } from "@/types/ecommerce";
import type { DataTableColumn, SelectOption, StatusTone } from "aps-design-pro";

const feedbackStore = useFeedbackStore();
const products = ref<ProductRecord[]>([]);
const total = ref(0);
const isLoading = ref(false);
const errorMessage = ref("");
const keyword = ref("");
const status = ref<ProductStatus | "">("");
const page = ref(1);
const pageSize = ref(10);
const productStatusOptions: SelectOption[] = [
  { label: "全部状态", value: "" },
  { label: "在售", value: "on_sale" },
  { label: "草稿", value: "draft" },
  { label: "已归档", value: "archived" },
];
const columns: DataTableColumn<ProductRecord>[] = [
  { key: "name", label: "商品", defaultWidth: 300, minWidth: 230 },
  { key: "sku", label: "SKU", defaultWidth: 170, minWidth: 148 },
  { key: "category", label: "分类", defaultWidth: 130, minWidth: 110 },
  { key: "price", label: "售价", defaultWidth: 110, minWidth: 96, align: "right", sortable: true },
  { key: "stock", label: "库存", defaultWidth: 110, minWidth: 96, align: "right", sortable: true },
  { key: "sales", label: "累计销量", defaultWidth: 120, minWidth: 100, align: "right", sortable: true },
  { key: "status", label: "状态", defaultWidth: 110, minWidth: 96 },
  { key: "updatedAt", label: "最近更新", defaultWidth: 142, minWidth: 126 },
];

async function loadProducts(resetPage = false): Promise<void> {
  if (resetPage) page.value = 1;
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const result = await getProducts({ keyword: keyword.value, status: status.value, page: page.value, pageSize: pageSize.value, sortBy: "updatedAt", sortOrder: "desc" });
    products.value = result.list;
    total.value = result.total;
  } catch (error) {
    products.value = [];
    total.value = 0;
    errorMessage.value = error instanceof Error ? error.message : "商品列表加载失败，请稍后重试。";
  } finally {
    isLoading.value = false;
  }
}

function resetFilters(): void { keyword.value = ""; status.value = ""; void loadProducts(true); }
function formatAmount(amount: number): string { return `¥ ${amount.toFixed(2)}`; }
function getStatusDisplay(value: ProductStatus): { label: string; tone: StatusTone } {
  const statusMap: Record<ProductStatus, { label: string; tone: StatusTone }> = { on_sale: { label: "在售", tone: "success" }, draft: { label: "草稿", tone: "warning" }, archived: { label: "已归档", tone: "neutral" } };
  return statusMap[value];
}
async function toggleProduct(product: ProductRecord): Promise<void> {
  const nextStatus: ProductStatus = product.status === "on_sale" ? "archived" : "on_sale";
  try {
    await updateProductStatus(product.id, nextStatus);
    feedbackStore.show(nextStatus === "on_sale" ? "商品已上架。" : "商品已下架并归档。", "success");
    await loadProducts();
  } catch (error) {
    feedbackStore.show(error instanceof Error ? error.message : "更新商品状态失败，请稍后重试。", "error");
  }
}
function updatePage(nextPage: number): void { page.value = nextPage; void loadProducts(); }
function updatePageSize(nextPageSize: number): void { pageSize.value = nextPageSize; page.value = 1; void loadProducts(); }

onMounted(() => { void loadProducts(); });
</script>

<template>
  <section class="page-content page-stack list-page-layout">
    <AppCard as="section" padding="large" content-overflow="visible" class="list-search-panel" aria-label="商品筛选条件">
      <AppFilterBar @submit="loadProducts(true)" @reset="resetFilters">
        <AppFormField label="关键词" for="product-keyword" label-position="inline" label-width="48px" label-gap="8px"><AppSearchInput id="product-keyword" v-model="keyword" placeholder="搜索商品名称、SKU" @search="loadProducts(true)" /></AppFormField>
        <template #advanced><AppFormField label="状态" for="product-status" label-position="inline" label-width="40px" label-gap="8px"><AppSelect id="product-status" v-model="status" :options="productStatusOptions" /></AppFormField></template>
        <template #actions><AppButton type="submit" leading-icon="search" :loading="isLoading">查询</AppButton></template>
      </AppFilterBar>
    </AppCard>
    <AppCard as="section" padding="none" fill-height class="data-table-card" aria-label="商品列表">
      <AppTableToolbar>
        <AppButton leading-icon="plus">新建商品</AppButton>
        <template #actions><AppTableOperationBar show-refresh :refresh-disabled="isLoading" @refresh="loadProducts()"><template #before><AppIconButton icon="download" label="导出商品" /></template></AppTableOperationBar></template>
      </AppTableToolbar>
      <AppDataTable :rows="products" :columns="columns" row-key="id" :loading="isLoading" :error-message="errorMessage" virtual fill-height :virtual-row-height="68" action-label="操作" empty-title="没有匹配商品" empty-description="调整关键词或状态后再试一次。" aria-label="商品列表"><template #cell-name="{ row }"><div class="product-cell"><span class="product-cover" :class="`is-${row.coverTone}`"><AppIcon name="grid" :size="17" /></span><div><strong>{{ row.name }}</strong><small>{{ row.category }}</small></div></div></template><template #cell-price="{ row }"><strong class="numeric">{{ formatAmount(row.price) }}</strong></template><template #cell-stock="{ row }"><strong class="numeric" :class="{ 'is-warning': row.stock < 30 }">{{ row.stock }}</strong></template><template #cell-status="{ row }"><AppStatusTag :tone="getStatusDisplay(row.status).tone" :label="getStatusDisplay(row.status).label" /></template><template #actions="{ row }"><AppTableActions><AppIconButton :icon="row.status === 'on_sale' ? 'close' : 'check'" :label="row.status === 'on_sale' ? '下架商品' : '上架商品'" size="small" :variant="row.status === 'on_sale' ? 'danger' : 'ghost'" @click="toggleProduct(row)" /></AppTableActions></template></AppDataTable>
      <AppPagination v-if="!isLoading && !errorMessage && products.length" :page="page" :page-size="pageSize" :total="total" :page-size-options="[10, 20, 30]" @update:page="updatePage" @update:page-size="updatePageSize" />
    </AppCard>
  </section>
</template>

<style scoped>
.product-cell { display: flex; min-width: 0; align-items: center; gap: 10px; }.product-cover { display: grid; width: 34px; height: 34px; flex: 0 0 auto; place-items: center; border-radius: 9px; color: #fff; }.product-cover.is-blue { background: #426b9e; }.product-cover.is-orange { background: #c2743c; }.product-cover.is-purple { background: #846ba4; }.product-cover.is-green { background: #438b77; }.product-cover.is-graphite { background: #4a5663; }.product-cell div { min-width: 0; }.product-cell strong, .product-cell small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.product-cell strong { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: 680; }.product-cell small { margin-top: 3px; color: var(--aps-faint); font-size: var(--aps-text-xs); }.numeric { color: var(--aps-ink); font-variant-numeric: tabular-nums; }.numeric.is-warning { color: var(--aps-orange); }
</style>
