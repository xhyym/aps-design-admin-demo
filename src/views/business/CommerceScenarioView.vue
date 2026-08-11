<script setup lang="ts">
import { computed, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppDataTable } from "aps-design-pro";
import { AppPagination } from "aps-design-pro";
import { AppStatusTag } from "aps-design-pro";
import { AppTableToolbar } from "aps-design-pro";
import { AppFilterBar } from "aps-design-pro";
import { AppFormField } from "aps-design-pro";
import { AppSearchInput } from "aps-design-pro";
import { AppSelect } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import { AppIconButton } from "aps-design-pro";
import { AppTableActions } from "aps-design-pro";
import { AppTableOperationBar } from "aps-design-pro";
import type { DataTableColumn, SelectOption, StatusTone } from "aps-design-pro";

export type CommerceScenarioKey =
  | "dashboard-tasks"
  | "order-exports"
  | "after-sales-tickets";

interface CommerceScenarioRow {
  id: string;
  primary: string;
  secondary: string;
  category: string;
  value: string;
  status: string;
  updatedAt: string;
}

interface CommerceScenarioConfig {
  primaryLabel: string;
  secondaryLabel: string;
  categoryLabel: string;
  valueLabel: string;
  statusLabel: string;
  actionLabel: string;
  searchPlaceholder: string;
  emptyTitle: string;
  rows: CommerceScenarioRow[];
}

const props = defineProps<{ scenario: CommerceScenarioKey }>();
const keyword = ref("");
const status = ref("");
const page = ref(1);
const pageSize = ref(10);
const isLoading = ref(false);

function createRows(prefix: string, entries: Array<[string, string, string, string, string, string]>): CommerceScenarioRow[] {
  return entries.map(([primary, secondary, category, value, rowStatus, updatedAt], index) => ({ id: `${prefix}-${index + 1}`, primary, secondary, category, value, status: rowStatus, updatedAt }));
}

const scenarios: Record<CommerceScenarioKey, CommerceScenarioConfig> = {
  "dashboard-tasks": {
    primaryLabel: "待办事项", secondaryLabel: "负责人", categoryLabel: "任务类型", valueLabel: "截止时间", statusLabel: "处理状态", actionLabel: "处理任务", searchPlaceholder: "搜索任务、负责人或订单号", emptyTitle: "没有待处理任务", rows: createRows("task", [
      ["确认高风险退款", "陈婉", "售后审核", "今天 14:00", "待处理", "10 分钟前"], ["补充商品规格信息", "林知远", "商品维护", "今天 16:30", "进行中", "35 分钟前"], ["审核新渠道结算", "周宁", "财务对账", "今天 18:00", "待处理", "1 小时前"], ["核对待发货订单", "苏禾", "订单履约", "明天 09:00", "已排期", "昨天 17:20"],
    ]),
  },
  "order-exports": {
    primaryLabel: "导出任务", secondaryLabel: "创建人", categoryLabel: "数据范围", valueLabel: "文件大小", statusLabel: "任务状态", actionLabel: "下载文件", searchPlaceholder: "搜索任务编号或创建人", emptyTitle: "没有匹配导出任务", rows: createRows("export", [
      ["订单明细 2026-08-03", "林知远", "近 30 天订单", "18.4 MB", "已完成", "今天 10:12"], ["渠道结算汇总", "苏禾", "7 月渠道订单", "6.8 MB", "处理中", "今天 09:56"], ["待发货订单清单", "周宁", "待发货订单", "2.1 MB", "已完成", "昨天 17:30"], ["异常订单清单", "陈婉", "风险订单", "840 KB", "失败", "昨天 14:06"],
    ]),
  },
  "after-sales-tickets": {
    primaryLabel: "售后工单", secondaryLabel: "客户", categoryLabel: "问题类型", valueLabel: "响应时限", statusLabel: "工单状态", actionLabel: "查看工单", searchPlaceholder: "搜索工单号、客户或订单号", emptyTitle: "没有匹配售后工单", rows: createRows("ticket", [
      ["AS-20260803-018", "赵雨桐", "商品质量", "剩余 38 分钟", "待响应", "今天 10:28"], ["AS-20260803-014", "何远", "物流异常", "已超时 12 分钟", "处理中", "今天 09:46"], ["AS-20260802-097", "韩雪", "退货退款", "已完成", "已关闭", "昨天 18:22"], ["AS-20260802-083", "郭宁", "发票补开", "剩余 3 小时", "待处理", "昨天 16:10"],
    ]),
  },
};

const scenario = computed(() => scenarios[props.scenario]);
const statusOptions = computed<SelectOption[]>(() => [{ label: "全部状态", value: "" }, ...Array.from(new Set(scenario.value.rows.map((row) => row.status))).map((label) => ({ label, value: label }))]);
const filteredRows = computed(() => scenario.value.rows.filter((row) => {
  const query = keyword.value.trim().toLocaleLowerCase();
  const matchesKeyword = !query || [row.primary, row.secondary, row.category].some((value) => value.toLocaleLowerCase().includes(query));
  return matchesKeyword && (!status.value || row.status === status.value);
}));
const visibleRows = computed(() => filteredRows.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));
const columns = computed<DataTableColumn<CommerceScenarioRow>[]>(() => [
  { key: "primary", label: scenario.value.primaryLabel, defaultWidth: 220, minWidth: 170 },
  { key: "secondary", label: scenario.value.secondaryLabel, defaultWidth: 180, minWidth: 140 },
  { key: "category", label: scenario.value.categoryLabel, defaultWidth: 150, minWidth: 120 },
  { key: "value", label: scenario.value.valueLabel, defaultWidth: 150, minWidth: 120 },
  { key: "status", label: scenario.value.statusLabel, defaultWidth: 126, minWidth: 108 },
  { key: "updatedAt", label: "最近更新", defaultWidth: 148, minWidth: 128 },
]);

function getStatusTone(value: string): StatusTone {
  if (["已完成", "已发布", "使用中", "运行中", "稳定"].includes(value)) return "success";
  if (["失败", "已超时", "下降 4.8%"].includes(value)) return "danger";
  if (["处理中", "投放中", "补货中", "上升 18.2%", "上升 11.6%"].includes(value)) return "warning";
  return "neutral";
}

function resetFilters(): void {
  keyword.value = "";
  status.value = "";
  page.value = 1;
}

function submitFilters(): void {
  page.value = 1;
}

function updatePage(nextPage: number): void { page.value = nextPage; }
function updatePageSize(nextPageSize: number): void { pageSize.value = nextPageSize; page.value = 1; }
function handleAction(row: CommerceScenarioRow): void { console.info(`[商城演示] 已打开${scenario.value.actionLabel}：${row.primary}`); }
</script>

<template>
  <section class="page-content page-stack list-page-layout">
    <AppCard as="section" padding="large" content-overflow="visible" class="list-search-panel" :aria-label="`${scenario.primaryLabel}筛选条件`">
      <AppFilterBar @submit="submitFilters" @reset="resetFilters">
        <AppFormField label="关键词" label-position="inline" label-width="48px" label-gap="8px"><AppSearchInput v-model="keyword" :placeholder="scenario.searchPlaceholder" @search="submitFilters" /></AppFormField>
        <AppFormField label="状态" label-position="inline" label-width="40px" label-gap="8px"><AppSelect v-model="status" :options="statusOptions" clearable /></AppFormField>
        <template #actions><AppButton type="submit" leading-icon="search" :loading="isLoading">查询</AppButton></template>
      </AppFilterBar>
    </AppCard>
    <AppCard as="section" padding="none" fill-height class="data-table-card" :aria-label="`${scenario.primaryLabel}列表`">
      <AppTableToolbar>
        <AppButton leading-icon="plus">{{ scenario.actionLabel }}</AppButton>
        <template #actions><AppTableOperationBar show-refresh @refresh="submitFilters"><template #before><AppIconButton icon="download" label="导出当前结果" /></template></AppTableOperationBar></template>
      </AppTableToolbar>
      <AppDataTable :rows="visibleRows" :columns="columns" row-key="id" fill-height :loading="isLoading" action-label="操作" :empty-title="scenario.emptyTitle" empty-description="调整关键词或状态后再试一次。" aria-label="商城业务数据表格">
        <template #cell-primary="{ row }"><div class="scenario-primary"><strong>{{ row.primary }}</strong><small>{{ row.secondary }}</small></div></template>
        <template #cell-secondary="{ row }"><span class="scenario-secondary">{{ row.secondary }}</span></template>
        <template #cell-status="{ row }"><AppStatusTag :label="row.status" :tone="getStatusTone(row.status)" /></template>
        <template #actions="{ row }"><AppTableActions><AppIconButton icon="edit" :label="scenario.actionLabel" size="small" @click="handleAction(row)" /></AppTableActions></template>
      </AppDataTable>
      <AppPagination v-if="filteredRows.length" :page="page" :page-size="pageSize" :total="filteredRows.length" :page-size-options="[10, 20, 30, 50]" @update:page="updatePage" @update:page-size="updatePageSize" />
    </AppCard>
  </section>
</template>

<style scoped>
.scenario-primary { min-width: 0; }.scenario-primary strong, .scenario-primary small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.scenario-primary strong { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: 680; }.scenario-primary small { margin-top: 3px; color: var(--aps-faint); font-size: var(--aps-text-xs); }.scenario-secondary { color: var(--aps-muted); font-family: var(--aps-font); font-size: var(--aps-text-sm); }
</style>
