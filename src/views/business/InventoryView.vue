<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getInventory } from "@/api/modules/ecommerce";
import { AppButton } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import { AppDataTable } from "aps-design-pro";
import { AppFilterBar } from "aps-design-pro";
import { AppFormField } from "aps-design-pro";
import { AppIconButton } from "aps-design-pro";
import { AppPagination } from "aps-design-pro";
import { AppSearchInput } from "aps-design-pro";
import { AppSelect } from "aps-design-pro";
import { AppStatusTag } from "aps-design-pro";
import { AppTableToolbar } from "aps-design-pro";
import { AppTableActions } from "aps-design-pro";
import { AppTableOperationBar } from "aps-design-pro";
import { AppProgress } from "aps-design-pro";
import type { InventoryListQuery, InventoryRecord, StockStatus } from "@/types/ecommerce";
import type { DataTableColumn, SelectOption, StatusTone } from "aps-design-pro";

const inventory = ref<InventoryRecord[]>([]);
const total = ref(0);
const isLoading = ref(false);
const errorMessage = ref("");
const keyword = ref("");
const status = ref<StockStatus | "">("");
const page = ref(1);
const pageSize = ref(10);
const statusOptions: SelectOption[] = [{ label: "全部状态", value: "" }, { label: "库存健康", value: "healthy" }, { label: "库存预警", value: "warning" }, { label: "库存告急", value: "critical" }];
const columns: DataTableColumn<InventoryRecord>[] = [
  { key: "productName", label: "商品 / SKU", defaultWidth: 286, minWidth: 228 },
  { key: "warehouse", label: "仓库", defaultWidth: 126, minWidth: 108 },
  { key: "available", label: "可用库存", defaultWidth: 118, minWidth: 100, align: "right" },
  { key: "locked", label: "锁定库存", defaultWidth: 118, minWidth: 100, align: "right" },
  { key: "safetyStock", label: "安全库存", defaultWidth: 118, minWidth: 100, align: "right" },
  { key: "status", label: "状态", defaultWidth: 112, minWidth: 96 },
  { key: "updatedAt", label: "最近同步", defaultWidth: 140, minWidth: 124 },
];
async function loadInventory(resetPage = false): Promise<void> {
  if (resetPage) page.value = 1;
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const query: InventoryListQuery = { keyword: keyword.value, status: status.value, page: page.value, pageSize: pageSize.value };
    const result = await getInventory(query);
    inventory.value = result.list;
    total.value = result.total;
  } catch (error) {
    inventory.value = [];
    total.value = 0;
    errorMessage.value = error instanceof Error ? error.message : "库存列表加载失败，请稍后重试。";
  } finally { isLoading.value = false; }
}
function resetFilters(): void { keyword.value = ""; status.value = ""; void loadInventory(true); }
function updatePage(nextPage: number): void { page.value = nextPage; void loadInventory(); }
function updatePageSize(nextPageSize: number): void { pageSize.value = nextPageSize; page.value = 1; void loadInventory(); }
function getStatusDisplay(value: StockStatus): { label: string; tone: StatusTone } { const statusMap: Record<StockStatus, { label: string; tone: StatusTone }> = { healthy: { label: "库存健康", tone: "success" }, warning: { label: "库存预警", tone: "warning" }, critical: { label: "库存告急", tone: "danger" } }; return statusMap[value]; }
function stockRatio(row: InventoryRecord): number { return Math.min(100, row.safetyStock ? Math.round((row.available / row.safetyStock) * 100) : 100); }
onMounted(() => { void loadInventory(); });
</script>

<template>
  <section class="page-content page-stack list-page-layout">
    <AppCard as="section" padding="large" content-overflow="visible" class="list-search-panel" aria-label="库存筛选条件"><AppFilterBar @submit="loadInventory(true)" @reset="resetFilters"><AppFormField label="关键词" for="inventory-keyword" label-position="inline" label-width="48px" label-gap="8px"><AppSearchInput id="inventory-keyword" v-model="keyword" placeholder="搜索商品名称、SKU 或仓库" @search="loadInventory(true)" /></AppFormField><template #advanced><AppFormField label="状态" for="inventory-status" label-position="inline" label-width="40px" label-gap="8px"><AppSelect id="inventory-status" v-model="status" :options="statusOptions" /></AppFormField></template><template #actions><AppButton type="submit" leading-icon="search" :loading="isLoading">查询</AppButton></template></AppFilterBar></AppCard>
    <AppCard as="section" padding="none" fill-height class="data-table-card" aria-label="库存明细列表"><AppTableToolbar><AppButton leading-icon="plus">创建补货单</AppButton><template #actions><AppTableOperationBar show-refresh :refresh-disabled="isLoading" refresh-label="同步库存" @refresh="loadInventory" /></template></AppTableToolbar><AppDataTable :rows="inventory" :columns="columns" row-key="id" :loading="isLoading" :error-message="errorMessage" virtual fill-height :virtual-row-height="66" action-label="操作" empty-title="没有匹配库存记录" empty-description="调整关键词或库存状态后再试一次。" aria-label="库存明细列表"><template #cell-productName="{ row }"><div class="stock-product"><strong>{{ row.productName }}</strong><small>{{ row.sku }}</small></div></template><template #cell-available="{ row }"><div class="stock-value"><strong :class="{ 'is-danger': row.status === 'critical', 'is-warning': row.status === 'warning' }">{{ row.available }}</strong><AppProgress :percentage="stockRatio(row)" :status="row.status === 'critical' ? 'error' : row.status === 'warning' ? 'warning' : 'normal'" :show-text="false" size="small" /></div></template><template #cell-status="{ row }"><AppStatusTag :tone="getStatusDisplay(row.status).tone" :label="getStatusDisplay(row.status).label" /></template><template #actions><AppTableActions><AppIconButton icon="eye" label="查看库存流水" size="small" /></AppTableActions></template></AppDataTable><AppPagination v-if="!isLoading && !errorMessage && inventory.length" :page="page" :page-size="pageSize" :total="total" :page-size-options="[10, 20, 30]" @update:page="updatePage" @update:page-size="updatePageSize" /></AppCard>
  </section>
</template>

<style scoped>
.stock-product strong, .stock-product small { display: block; }.stock-product strong { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: 680; }.stock-product small { margin-top: 3px; color: var(--aps-faint); font-size: var(--aps-text-xs); }.stock-value { display: grid; grid-template-columns: 36px minmax(64px, 1fr); align-items: center; gap: 10px; }.stock-value strong { color: var(--aps-ink); font-variant-numeric: tabular-nums; }.stock-value strong.is-warning { color: var(--aps-orange); }.stock-value strong.is-danger { color: var(--aps-red); }
</style>
