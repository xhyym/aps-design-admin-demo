<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getRefunds } from "@/api/modules/ecommerce";
import { AppButton } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import { AppDataTable } from "aps-design-pro";
import { AppFilterBar } from "aps-design-pro";
import { AppFormField } from "aps-design-pro";
import { AppPagination } from "aps-design-pro";
import { AppSearchInput } from "aps-design-pro";
import { AppSelect } from "aps-design-pro";
import { AppStatusTag } from "aps-design-pro";
import { AppTableToolbar } from "aps-design-pro";
import type { RefundListQuery, RefundRecord, RefundStatus } from "@/types/ecommerce";
import type { DataTableColumn, SelectOption, StatusTone } from "aps-design-pro";

const refunds = ref<RefundRecord[]>([]);
const total = ref(0);
const isLoading = ref(false);
const errorMessage = ref("");
const keyword = ref("");
const status = ref<RefundStatus | "">("");
const page = ref(1);
const pageSize = ref(10);
const statusOptions: SelectOption[] = [
  { label: "全部状态", value: "" },
  { label: "待处理", value: "pending" },
  { label: "审核中", value: "reviewing" },
  { label: "已同意", value: "approved" },
  { label: "已完成", value: "completed" },
  { label: "已拒绝", value: "rejected" },
];
const columns: DataTableColumn<RefundRecord>[] = [
  { key: "refundNo", label: "售后单号", defaultWidth: 176, minWidth: 156 },
  { key: "orderNo", label: "关联订单", defaultWidth: 176, minWidth: 156 },
  { key: "memberName", label: "会员", defaultWidth: 114, minWidth: 96 },
  { key: "reason", label: "售后原因", defaultWidth: 180, minWidth: 140 },
  { key: "amount", label: "退款金额", defaultWidth: 120, minWidth: 108, align: "right" },
  { key: "status", label: "状态", defaultWidth: 110, minWidth: 96 },
  { key: "requestedAt", label: "申请时间", defaultWidth: 142, minWidth: 124 },
];
async function loadRefunds(resetPage = false): Promise<void> {
  if (resetPage) page.value = 1;
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const query: RefundListQuery = { keyword: keyword.value, status: status.value, page: page.value, pageSize: pageSize.value };
    const result = await getRefunds(query);
    refunds.value = result.list;
    total.value = result.total;
  } catch (error) {
    refunds.value = [];
    total.value = 0;
    errorMessage.value = error instanceof Error ? error.message : "售后列表加载失败，请稍后重试。";
  } finally { isLoading.value = false; }
}
function resetFilters(): void { keyword.value = ""; status.value = ""; void loadRefunds(true); }
function updatePage(nextPage: number): void { page.value = nextPage; void loadRefunds(); }
function updatePageSize(nextPageSize: number): void { pageSize.value = nextPageSize; page.value = 1; void loadRefunds(); }
function formatAmount(amount: number): string { return `¥ ${amount.toFixed(2)}`; }
function getStatusDisplay(value: RefundStatus): { label: string; tone: StatusTone } {
  const statusMap: Record<RefundStatus, { label: string; tone: StatusTone }> = { pending: { label: "待处理", tone: "warning" }, reviewing: { label: "审核中", tone: "info" }, approved: { label: "待退款", tone: "info" }, completed: { label: "已完成", tone: "success" }, rejected: { label: "已拒绝", tone: "neutral" } };
  return statusMap[value];
}
onMounted(() => { void loadRefunds(); });
</script>

<template>
  <section class="page-content page-stack list-page-layout">
    <AppCard as="section" padding="large" content-overflow="visible" class="list-search-panel" aria-label="售后筛选条件"><AppFilterBar @submit="loadRefunds(true)" @reset="resetFilters"><AppFormField label="关键词" for="refund-keyword" label-position="inline" label-width="48px" label-gap="8px"><AppSearchInput id="refund-keyword" v-model="keyword" placeholder="搜索售后单、订单号或会员" @search="loadRefunds(true)" /></AppFormField><template #advanced><AppFormField label="状态" for="refund-status" label-position="inline" label-width="40px" label-gap="8px"><AppSelect id="refund-status" v-model="status" :options="statusOptions" /></AppFormField></template><template #actions><AppButton type="submit" leading-icon="search" :loading="isLoading">查询</AppButton></template></AppFilterBar></AppCard>
    <AppCard as="section" padding="none" fill-height class="data-table-card" aria-label="售后申请列表"><AppTableToolbar><template #actions><AppButton variant="secondary" size="small" leading-icon="refresh" :loading="isLoading" @click="loadRefunds">刷新</AppButton></template></AppTableToolbar><AppDataTable :rows="refunds" :columns="columns" row-key="id" :loading="isLoading" :error-message="errorMessage" virtual fill-height :virtual-row-height="62" empty-title="没有匹配的售后申请" empty-description="调整查询条件后再试一次。" aria-label="售后申请列表"><template #cell-refundNo="{ row }"><button type="button" class="table-link">{{ row.refundNo }}</button></template><template #cell-orderNo="{ row }"><span class="order-no">{{ row.orderNo }}</span></template><template #cell-amount="{ row }"><strong class="numeric">{{ formatAmount(row.amount) }}</strong></template><template #cell-status="{ row }"><AppStatusTag :tone="getStatusDisplay(row.status).tone" :label="getStatusDisplay(row.status).label" /></template><template #actions="{ row }"><button type="button" class="table-link">{{ row.status === "pending" ? "去审核" : "查看" }}</button></template></AppDataTable><AppPagination v-if="!isLoading && !errorMessage && refunds.length" :page="page" :page-size="pageSize" :total="total" :page-size-options="[10, 20, 30]" @update:page="updatePage" @update:page-size="updatePageSize" /></AppCard>
  </section>
</template>

<style scoped>
.table-link { padding: 0; border: 0; background: transparent; color: var(--aps-blue); font: inherit; font-size: var(--aps-text-sm); font-weight: 660; cursor: pointer; }.table-link:hover { text-decoration: underline; text-underline-offset: 3px; }.order-no, .numeric { color: var(--aps-ink); font-variant-numeric: tabular-nums; }.numeric { font-weight: 680; }
</style>
