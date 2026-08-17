<script setup lang="ts">
import { computed, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppDataTable } from "aps-design-pro";
import { AppStatusTag } from "aps-design-pro";
import { AppTableColumnFilters } from "aps-design-pro";
import { AppTableOperationBar } from "aps-design-pro";
import { AppTableActions } from "aps-design-pro";
import { AppTableSettingsPanel } from "aps-design-pro";
import { AppTableToolbar } from "aps-design-pro";
import { AppTableViewSelector } from "aps-design-pro";
import { AppFilterBar } from "aps-design-pro";
import { AppFormField } from "aps-design-pro";
import { AppIconButton } from "aps-design-pro";
import { AppSearchInput } from "aps-design-pro";
import { AppSelect } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import { useTablePreferences } from "aps-design-pro";
import { useTableViews } from "aps-design-pro";
import { useAuthStore } from "@/stores/auth";
import { useFeedbackStore } from "@/stores/feedback";
import type { DataTableColumn, DataTableSort, SelectOption, StatusTone, TableColumnFilter, TableColumnFilterValues, TableRowKey, TableViewScope } from "aps-design-pro";

type AuditResult = "success" | "warning" | "failure";

interface AuditEvent {
  id: string;
  eventName: string;
  module: string;
  operator: string;
  ipAddress: string;
  result: AuditResult;
  duration: number;
  createdAt: string;
}

interface ResultDisplay {
  label: string;
  tone: StatusTone;
}

const AUDIT_EVENT_COUNT = 2400;
const MODULES = ["用户与权限", "订单中心", "内容资产", "数据服务", "工作流"] as const;
const OPERATORS = ["林知远", "陈瑶", "周予安", "张晓晨", "王语桐", "赵珂"] as const;
const RESULT_OPTIONS: SelectOption[] = [
  { label: "全部结果", value: "" },
  { label: "执行成功", value: "success" },
  { label: "需要复核", value: "warning" },
  { label: "执行失败", value: "failure" },
];
const TABLE_COLUMN_FILTERS: TableColumnFilter[] = [
  { key: "module", label: "所属模块", options: MODULES.map((module) => ({ label: module, value: module })) },
  { key: "operator", label: "操作人员", options: OPERATORS.map((operator) => ({ label: operator, value: operator })) },
  { key: "result", label: "执行结果", options: RESULT_OPTIONS.filter((option) => option.value).map((option) => ({ ...option })) },
];
const AUDIT_TABLE_COLUMNS: DataTableColumn<AuditEvent>[] = [
  { key: "eventName", label: "操作事件", defaultWidth: 250, minWidth: 210, maxWidth: 420, fixed: "left" },
  { key: "module", label: "所属模块", defaultWidth: 148, minWidth: 128, maxWidth: 240 },
  { key: "operator", label: "操作人员", defaultWidth: 136, minWidth: 118, maxWidth: 220 },
  { key: "ipAddress", label: "访问地址", defaultWidth: 158, minWidth: 138, maxWidth: 260 },
  { key: "result", label: "执行结果", defaultWidth: 128, minWidth: 112, maxWidth: 200 },
  { key: "duration", label: "处理耗时", defaultWidth: 128, minWidth: 112, maxWidth: 220, align: "right", sortable: true },
  { key: "createdAt", label: "发生时间", defaultWidth: 180, minWidth: 164, maxWidth: 280, sortable: true, fixed: "right" },
];
const AUDIT_EVENTS = createAuditEvents(AUDIT_EVENT_COUNT);

const authStore = useAuthStore();
const feedbackStore = useFeedbackStore();
const keyword = ref("");
const resultFilter = ref<"" | AuditResult>("");
const selectedKeys = ref<TableRowKey[]>([]);
const selectedEventId = ref("");
const columnFilterValues = ref<TableColumnFilterValues>({});
const isTableFullscreen = ref(false);
const tableSort = ref<DataTableSort>({ key: "createdAt", order: "desc" });
const preferenceScope = computed<TableViewScope | null>(() => {
  const profile = authStore.profile;
  if (!profile) return null;
  return { tenantId: profile.tenantId, userId: profile.id, route: "/examples/advanced-table", tableId: "audit-event-list" };
});
const auditTableViewState = useTableViews({ scope: preferenceScope });
const {
  views: auditTableViews,
  activeViewId: activeAuditTableViewId,
  isLoading: isLoadingAuditTableViews,
  isSaving: isSavingAuditTableViews,
  saveError: auditTableViewError,
} = auditTableViewState;
const {
  preference: auditTablePreference,
  defaultPreference: defaultAuditTablePreference,
  resolvedColumns: auditTableColumns,
  columnWidths: auditColumnWidths,
  tableSize: auditTableSize,
  isSaving: isSavingAuditTablePreference,
  saveError: auditTablePreferenceError,
  updatePreference: updateAuditTablePreference,
  updateColumnWidths: updateAuditColumnWidths,
} = useTablePreferences({ columns: AUDIT_TABLE_COLUMNS, scope: auditTableViewState.activeViewScope });

const visibleEvents = computed<AuditEvent[]>(() => {
  const normalizedKeyword = keyword.value.trim().toLocaleLowerCase("zh-CN");
  const nextEvents = AUDIT_EVENTS.filter((event) => {
    const matchesResult = !resultFilter.value || event.result === resultFilter.value;
    const searchableText = `${event.eventName} ${event.module} ${event.operator} ${event.ipAddress}`.toLocaleLowerCase("zh-CN");
    const matchesModule = !columnFilterValues.value.module?.length || columnFilterValues.value.module.includes(event.module);
    const matchesOperator = !columnFilterValues.value.operator?.length || columnFilterValues.value.operator.includes(event.operator);
    const matchesTableResult = !columnFilterValues.value.result?.length || columnFilterValues.value.result.includes(event.result);
    return matchesResult && matchesModule && matchesOperator && matchesTableResult && (!normalizedKeyword || searchableText.includes(normalizedKeyword));
  });

  return [...nextEvents].sort((leftEvent, rightEvent) => {
    const leftValue = leftEvent[tableSort.value.key as "duration" | "createdAt"];
    const rightValue = rightEvent[tableSort.value.key as "duration" | "createdAt"];
    const comparison = typeof leftValue === "number" && typeof rightValue === "number"
      ? leftValue - rightValue
      : String(leftValue).localeCompare(String(rightValue), "zh-CN");
    return tableSort.value.order === "asc" ? comparison : -comparison;
  });
});

/** 本页使用固定序列数据，确保滚动、排序和回归验收的结果可重复。 */
function createAuditEvents(count: number): AuditEvent[] {
  return Array.from({ length: count }, (_, index) => {
    const sequence = count - index;
    const resultCycle: AuditResult[] = ["success", "success", "success", "warning", "failure"];
    const eventResult = resultCycle[index % resultCycle.length];
    const occurredAt = new Date(Date.UTC(2026, 7, 1, 18, 0, 0) - index * 47_000);
    return {
      id: `audit-${String(sequence).padStart(5, "0")}`,
      eventName: getEventName(index),
      module: MODULES[index % MODULES.length],
      operator: OPERATORS[index % OPERATORS.length],
      ipAddress: `10.${12 + index % 16}.${32 + index % 80}.${16 + index % 200}`,
      result: eventResult,
      duration: 38 + (index * 37) % 1680,
      createdAt: formatDateTime(occurredAt),
    };
  });
}

function getEventName(index: number): string {
  const eventNames = ["更新访问策略", "批量调整订单状态", "发布内容版本", "重建数据索引", "执行自动化任务"];
  return eventNames[index % eventNames.length];
}

function formatDateTime(value: Date): string {
  const formatPart = (part: number): string => String(part).padStart(2, "0");
  return `${value.getUTCFullYear()}-${formatPart(value.getUTCMonth() + 1)}-${formatPart(value.getUTCDate())} ${formatPart(value.getUTCHours())}:${formatPart(value.getUTCMinutes())}:${formatPart(value.getUTCSeconds())}`;
}

function getResultDisplay(result: AuditResult): ResultDisplay {
  const resultDisplayMap: Record<AuditResult, ResultDisplay> = {
    success: { label: "执行成功", tone: "success" },
    warning: { label: "需要复核", tone: "warning" },
    failure: { label: "执行失败", tone: "danger" },
  };
  return resultDisplayMap[result];
}

function resetFilters(): void {
  keyword.value = "";
  resultFilter.value = "";
}

function handleSortChange(nextSort: DataTableSort): void {
  if (nextSort.key !== "duration" && nextSort.key !== "createdAt") return;
  tableSort.value = nextSort;
}

function clearSelectedEvents(): void {
  selectedKeys.value = [];
}

function resetColumnFilters(): void {
  columnFilterValues.value = {};
}

function selectEvent(event: AuditEvent): void {
  selectedEventId.value = event.id;
}

async function createAuditTableView(name: string): Promise<void> {
  const view = await auditTableViewState.createView(name);
  if (view) feedbackStore.show(`已新建表格视图“${view.name}”。`, "success");
}

async function renameAuditTableView(viewId: string, name: string): Promise<void> {
  const isRenamed = await auditTableViewState.renameView(viewId, name);
  if (isRenamed) feedbackStore.show("表格视图名称已更新。", "success");
}

async function removeAuditTableView(viewId: string): Promise<void> {
  const isRemoved = await auditTableViewState.removeView(viewId);
  if (isRemoved) feedbackStore.show("表格视图已删除。", "success");
}
</script>

<template>
  <section class="advanced-table-page page-content page-stack list-page-layout">
    <AppCard as="section" padding="large" content-overflow="visible" class="advanced-table-filter" aria-label="高级表格筛选条件">
      <AppFilterBar collapsible @reset="resetFilters">
        <AppFormField label="关键词" for="audit-keyword" label-position="inline" label-width="44px" label-gap="6px"><AppSearchInput id="audit-keyword" v-model="keyword" placeholder="搜索事件、模块、人员或地址" aria-label="搜索审计记录" /></AppFormField>
        <template #advanced><AppFormField label="结果" for="audit-result" label-position="inline" label-width="32px" label-gap="6px"><AppSelect id="audit-result" v-model="resultFilter" :options="RESULT_OPTIONS" aria-label="按执行结果筛选" /></AppFormField></template>
        <template #actions><AppButton type="submit" leading-icon="search">查询</AppButton></template>
      </AppFilterBar>
    </AppCard>

    <AppCard as="section" padding="none" fill-height class="data-table-card advanced-table-card" aria-label="高级表格">
      <AppTableToolbar :selected-count="selectedKeys.length"><span class="record-summary">当前 {{ visibleEvents.length.toLocaleString("zh-CN") }} 条记录 <em v-if="Object.keys(columnFilterValues).length">已应用列筛选</em><em v-if="selectedEventId">已定位 {{ selectedEventId }}</em></span><template #actions><AppTableOperationBar :fullscreen="isTableFullscreen" show-fullscreen @update:fullscreen="isTableFullscreen = $event"><template #filters><AppTableColumnFilters v-model="columnFilterValues" :fields="TABLE_COLUMN_FILTERS" @reset="resetColumnFilters" /></template><template #view><AppTableViewSelector :model-value="activeAuditTableViewId" :views="auditTableViews" :loading="isLoadingAuditTableViews" :saving="isSavingAuditTableViews" :error="auditTableViewError" @update:model-value="auditTableViewState.selectView" @create="createAuditTableView" @rename="renameAuditTableView" @remove="removeAuditTableView" /></template><template #settings><AppTableSettingsPanel :model-value="auditTablePreference" :default-value="defaultAuditTablePreference" :columns="AUDIT_TABLE_COLUMNS" :saving="isSavingAuditTablePreference" :save-error="auditTablePreferenceError" @update:model-value="updateAuditTablePreference" /></template></AppTableOperationBar></template><template #bulk><AppIconButton icon="close" label="取消选择" size="small" @click="clearSelectedEvents" /><AppIconButton icon="filter" label="清除列筛选" size="small" @click="resetColumnFilters" /></template></AppTableToolbar>
      <AppDataTable :rows="visibleEvents" :columns="auditTableColumns" row-key="id" selectable resizable virtual fill-height highlight-current-row show-overflow-tooltip :current-row-key="selectedEventId || null" :virtual-row-height="auditTablePreference.density === 'compact' ? 64 : 72" :virtual-overscan="10" :selected-keys="selectedKeys" :sort="tableSort" :column-widths="auditColumnWidths" :striped="auditTablePreference.striped" :show-column-dividers="auditTablePreference.showColumnDividers" :size="auditTableSize" :fullscreen="isTableFullscreen" aria-label="高数据量审计表" action-label="操作" empty-title="没有匹配的审计记录" empty-description="调整筛选条件后再试一次。" empty-icon="grid" @update:selected-keys="selectedKeys = $event" @update:current-row-key="selectedEventId = String($event ?? '')" @update:column-widths="updateAuditColumnWidths" @update:fullscreen="isTableFullscreen = $event" @sort-change="handleSortChange" @row-click="selectedEventId = $event.row.id"><template #cell-eventName="{ row }"><div class="event-cell"><strong>{{ row.eventName }}</strong><span>{{ row.id }}</span></div></template><template #cell-operator="{ row }"><strong class="operator-cell">{{ row.operator }}</strong></template><template #cell-result="{ row }"><AppStatusTag :tone="getResultDisplay(row.result).tone" :label="getResultDisplay(row.result).label" /></template><template #cell-duration="{ row }"><span class="duration-cell">{{ row.duration }} ms</span></template><template #actions="{ row }"><AppTableActions><AppIconButton icon="pin" label="定位审计记录" size="small" @click="selectEvent(row)" /></AppTableActions></template></AppDataTable>
    </AppCard>
  </section>
</template>

<style scoped>
.advanced-table-page { display: grid; min-height: 0; gap: var(--aps-page-stack-gap); }.advanced-table-filter { display: grid; }.advanced-table-card { min-height: 0; }.advanced-table-card :deep(.card-content) { min-height: 0; }.record-summary { color: var(--aps-muted); font-size: var(--aps-text-sm); }.record-summary em { margin-left: 8px; color: var(--aps-blue); font-style: normal; }.event-cell { display: grid; gap: 2px; }.event-cell strong, .operator-cell { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: var(--aps-font-weight-strong); }.event-cell span { color: var(--aps-faint); font-size: var(--aps-text-xs); }.duration-cell { color: var(--aps-ink); font-variant-numeric: tabular-nums; }
</style>
