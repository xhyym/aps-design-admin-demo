<script setup lang="ts">
import { computed, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppDataTable } from "aps-design-pro";
import { AppStatusTag } from "aps-design-pro";
import { AppTableOperationBar } from "aps-design-pro";
import { AppTableSettingsPanel } from "aps-design-pro";
import { AppTableToolbar } from "aps-design-pro";
import { AppTableViewSelector } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import { useTablePreferences } from "aps-design-pro";
import { useTableViews } from "aps-design-pro";
import { useAuthStore } from "@/stores/auth";
import type { DataTableCellContext, DataTableColumn, DataTableHeaderGroup, DataTableRowContext, DataTableSpanContext, DataTableSummaryContext, StatusTone, TableRowKey, TableViewScope } from "aps-design-pro";

type DeliveryStatus = "on_track" | "attention" | "delayed";

interface DeliveryRecord {
  id: string;
  project: string;
  owner: string;
  planDays: number;
  actualDays: number;
  completion: number;
  status: DeliveryStatus;
  note: string;
}

interface ResourceNode {
  id: string;
  name: string;
  category: string;
  owner: string;
  capacity: number;
  status: DeliveryStatus;
  children?: ResourceNode[];
}

interface QualityGateRecord {
  id: string;
  stage: string;
  checkItem: string;
  owner: string;
  result: string;
  level: "normal" | "risk";
}

interface StatusDisplay {
  label: string;
  tone: StatusTone;
}

const DELIVERY_COLUMNS: DataTableColumn<DeliveryRecord>[] = [
  { key: "project", label: "交付项目", defaultWidth: 220, minWidth: 176, maxWidth: 360 },
  { key: "owner", label: "负责人", defaultWidth: 128, minWidth: 108, maxWidth: 200 },
  { key: "planDays", label: "计划工期", defaultWidth: 122, minWidth: 104, maxWidth: 180, align: "right", sortable: true },
  { key: "actualDays", label: "实际工期", defaultWidth: 122, minWidth: 104, maxWidth: 180, align: "right", sortable: true },
  { key: "completion", label: "完成度", defaultWidth: 116, minWidth: 100, maxWidth: 160, align: "right" },
  { key: "status", label: "进度状态", defaultWidth: 126, minWidth: 108, maxWidth: 180 },
  { key: "note", label: "复盘说明", defaultWidth: 300, minWidth: 220, maxWidth: 480, overflow: "wrap" },
];
const DELIVERY_HEADER_GROUPS: DataTableHeaderGroup[] = [
  { key: "responsibility", label: "交付责任", columnKeys: ["project", "owner"] },
  { key: "schedule", label: "工期对比", columnKeys: ["planDays", "actualDays"] },
  { key: "progress", label: "进度判断", columnKeys: ["completion", "status"] },
];
const RESOURCE_COLUMNS: DataTableColumn<ResourceNode>[] = [
  { key: "name", label: "资源名称", defaultWidth: 260, minWidth: 190, maxWidth: 420 },
  { key: "category", label: "类型", defaultWidth: 132, minWidth: 108, maxWidth: 180 },
  { key: "owner", label: "负责人", defaultWidth: 140, minWidth: 108, maxWidth: 200 },
  { key: "capacity", label: "月度容量", defaultWidth: 132, minWidth: 112, maxWidth: 180, align: "right" },
  { key: "status", label: "状态", defaultWidth: 120, minWidth: 104, maxWidth: 160 },
];
const QUALITY_GATE_COLUMNS: DataTableColumn<QualityGateRecord>[] = [
  { key: "stage", label: "质控阶段", defaultWidth: 136, minWidth: 116, maxWidth: 180 },
  { key: "checkItem", label: "检查项", defaultWidth: 214, minWidth: 168, maxWidth: 320 },
  { key: "owner", label: "责任团队", defaultWidth: 148, minWidth: 118, maxWidth: 240 },
  { key: "result", label: "处理结果", defaultWidth: 306, minWidth: 220, maxWidth: 460, overflow: "wrap" },
];
const DELIVERY_ROWS: DeliveryRecord[] = [
  { id: "delivery-001", project: "账号与权限中心", owner: "林知远", planDays: 18, actualDays: 17, completion: 100, status: "on_track", note: "权限粒度、菜单联动与操作留痕已经完成验收。" },
  { id: "delivery-002", project: "订单履约工作台", owner: "陈瑶", planDays: 24, actualDays: 22, completion: 92, status: "on_track", note: "需要补充异常订单的批量处理与服务端导出任务。" },
  { id: "delivery-003", project: "内容资产迁移", owner: "周予安", planDays: 16, actualDays: 16, completion: 76, status: "attention", note: "历史附件数量较大，正在等待存储迁移窗口确认。" },
  { id: "delivery-004", project: "经营分析报表", owner: "张晓晨", planDays: 20, actualDays: 25, completion: 68, status: "delayed", note: "指标口径仍在收敛，需要与财务数据源完成最后一次核对。" },
];
const RESOURCE_ROWS: ResourceNode[] = [
  { id: "resource-platform", name: "平台研发中心", category: "组织", owner: "林知远", capacity: 96, status: "on_track", children: [{ id: "resource-web", name: "Web 应用组", category: "团队", owner: "陈瑶", capacity: 42, status: "on_track", children: [{ id: "resource-web-admin", name: "管理后台迭代", category: "项目", owner: "陈瑶", capacity: 20, status: "on_track" }, { id: "resource-web-store", name: "交易前台重构", category: "项目", owner: "周予安", capacity: 22, status: "attention" }] }, { id: "resource-data", name: "数据服务组", category: "团队", owner: "张晓晨", capacity: 30, status: "attention", children: [{ id: "resource-data-report", name: "经营报表治理", category: "项目", owner: "张晓晨", capacity: 18, status: "delayed" }] }] },
  { id: "resource-product", name: "产品与设计中心", category: "组织", owner: "王语桐", capacity: 48, status: "on_track", children: [{ id: "resource-experience", name: "体验设计组", category: "团队", owner: "王语桐", capacity: 24, status: "on_track" }, { id: "resource-research", name: "用户研究组", category: "团队", owner: "赵珂", capacity: 16, status: "on_track" }] },
];
const QUALITY_GATE_ROWS: QualityGateRecord[] = [
  { id: "quality-001", stage: "数据准备", checkItem: "数据源可用性", owner: "数据治理组", result: "已完成来源校验，关键字段完整率达到 99.8%。", level: "normal" },
  { id: "quality-002", stage: "数据准备", checkItem: "规则版本确认", owner: "质控产品组", result: "已锁定本轮规则集并完成灰度范围确认。", level: "normal" },
  { id: "quality-003", stage: "自动校验", checkItem: "结构化规则扫描", owner: "质控引擎组", result: "已处理 1,248 份记录，发现 7 条需人工复核。", level: "normal" },
  { id: "quality-004", stage: "自动校验", checkItem: "语义一致性分析", owner: "智能审核组", result: "2 条高优先级异常待确认，已自动创建处置任务。", level: "risk" },
  { id: "quality-005", stage: "人工复核", checkItem: "异常记录抽检", owner: "质控运营组", result: "复核完成 5 条，剩余 2 条正在等待临床确认。", level: "risk" },
  { id: "quality-006", stage: "发布决策", checkItem: "上线准入结论", owner: "发布委员会", result: "当前版本允许受控发布，高优先级异常将持续跟踪直至关闭。", level: "normal" },
];

const authStore = useAuthStore();
const deliverySort = ref<{ key: "planDays" | "actualDays"; order: "asc" | "desc" }>({ key: "planDays", order: "asc" });
const treeExpandedKeys = ref<TableRowKey[]>(["resource-platform", "resource-web", "resource-data", "resource-product"]);
const deliveryScope = computed<TableViewScope | null>(() => {
  const profile = authStore.profile;
  if (!profile) return null;
  return { tenantId: profile.tenantId, userId: profile.id, route: "/examples/table-patterns", tableId: "delivery-summary-table" };
});
const deliveryViewState = useTableViews({ scope: deliveryScope });
const {
  views: deliveryViews,
  activeViewId: activeDeliveryViewId,
  isLoading: isLoadingDeliveryViews,
  isSaving: isSavingDeliveryViews,
  saveError: deliveryViewError,
} = deliveryViewState;
const {
  preference: deliveryPreference,
  defaultPreference: defaultDeliveryPreference,
  resolvedColumns: deliveryColumns,
  columnWidths: deliveryColumnWidths,
  tableSize: deliveryTableSize,
  isSaving: isSavingDeliveryPreference,
  saveError: deliveryPreferenceError,
  updatePreference: updateDeliveryPreference,
  updateColumnWidths: updateDeliveryColumnWidths,
} = useTablePreferences({ columns: DELIVERY_COLUMNS, scope: deliveryViewState.activeViewScope, defaults: { striped: true, showColumnDividers: true } });
const visibleDeliveryRows = computed(() => [...DELIVERY_ROWS].sort((left, right) => {
  const comparison = left[deliverySort.value.key] - right[deliverySort.value.key];
  return deliverySort.value.order === "asc" ? comparison : -comparison;
}));

function getStatusDisplay(status: DeliveryStatus): StatusDisplay {
  const displayMap: Record<DeliveryStatus, StatusDisplay> = {
    on_track: { label: "正常", tone: "success" },
    attention: { label: "关注", tone: "warning" },
    delayed: { label: "延期", tone: "danger" },
  };
  return displayMap[status];
}

function getDeliverySummary({ rows, column }: DataTableSummaryContext<DeliveryRecord>): string {
  if (column.key === "planDays") return `${rows.reduce((total, row) => total + row.planDays, 0)} 天`;
  if (column.key === "actualDays") return `${rows.reduce((total, row) => total + row.actualDays, 0)} 天`;
  if (column.key === "completion") return `${Math.round(rows.reduce((total, row) => total + row.completion, 0) / rows.length)}%`;
  if (column.key === "status") return `${rows.filter((row) => row.status === "on_track").length} 项正常`;
  return "";
}

/** 业务页面根据风险等级标记行状态，表格组件只负责传递稳定的 CSS 类名。 */
function getQualityRowClassName({ row }: DataTableRowContext<QualityGateRecord>): string {
  return row.level === "risk" ? "is-risk-row" : "";
}

/** 高优先级结果与最终发布结论需要更明确的视觉提示，避免用户遗漏关键状态。 */
function getQualityCellClassName({ row, column }: DataTableCellContext<QualityGateRecord>): string {
  if (row.level === "risk" && column.key === "result") return "is-risk-cell";
  if (row.id === "quality-006" && column.key === "owner") return "is-release-cell";
  return "";
}

/** 同一阶段的连续检查项纵向合并，发布结论横向合并为一个完整的审批信息块。 */
function getQualityCellSpan({ row, column, rowIndex }: DataTableSpanContext<QualityGateRecord>): { rowspan?: number; colspan?: number } {
  if (column.key === "stage") {
    if (rowIndex === 0 || rowIndex === 2) return { rowspan: 2 };
    if (rowIndex === 1 || rowIndex === 3) return { rowspan: 0, colspan: 0 };
  }
  if (row.id === "quality-006" && column.key === "owner") return { colspan: 2 };
  if (row.id === "quality-006" && column.key === "result") return { colspan: 0 };
  return {};
}

function handleDeliverySort(nextSort: { key: string; order: "asc" | "desc" }): void {
  if (nextSort.key !== "planDays" && nextSort.key !== "actualDays") return;
  deliverySort.value = { key: nextSort.key, order: nextSort.order };
}

async function createDeliveryView(name: string): Promise<void> {
  await deliveryViewState.createView(name);
}

async function renameDeliveryView(viewId: string, name: string): Promise<void> {
  await deliveryViewState.renameView(viewId, name);
}

async function removeDeliveryView(viewId: string): Promise<void> {
  await deliveryViewState.removeView(viewId);
}
</script>

<template>
  <section class="table-patterns-page page-content page-stack" aria-label="表格能力案例">
    <AppCard as="section" padding="large" class="table-pattern-intro">
      <div><h1>表格能力案例</h1><p>用于验收复杂业务数据中最容易失真的结构：分组表头、汇总行、列偏好、树形层级与长文本行高。</p></div>
    </AppCard>

    <AppCard as="section" padding="none" content-overflow="visible" class="table-pattern-card" aria-label="分组汇总表格">
      <AppTableToolbar><span class="table-pattern-caption">项目交付概览</span><template #actions><AppTableOperationBar><template #view><AppTableViewSelector :model-value="activeDeliveryViewId" :views="deliveryViews" :loading="isLoadingDeliveryViews" :saving="isSavingDeliveryViews" :error="deliveryViewError" @update:model-value="deliveryViewState.selectView" @create="createDeliveryView" @rename="renameDeliveryView" @remove="removeDeliveryView" /></template><template #settings><AppTableSettingsPanel :model-value="deliveryPreference" :default-value="defaultDeliveryPreference" :columns="DELIVERY_COLUMNS" :saving="isSavingDeliveryPreference" :save-error="deliveryPreferenceError" @update:model-value="updateDeliveryPreference" /></template></AppTableOperationBar></template></AppTableToolbar>
      <AppDataTable :rows="visibleDeliveryRows" :columns="deliveryColumns" row-key="id" :header-groups="DELIVERY_HEADER_GROUPS" :sort="deliverySort" :column-widths="deliveryColumnWidths" :striped="deliveryPreference.striped" :show-column-dividers="deliveryPreference.showColumnDividers" :size="deliveryTableSize" :show-index="true" :show-summary="true" summary-label="项目合计" :summary-method="getDeliverySummary" resizable aria-label="项目交付概览" @sort-change="handleDeliverySort" @update:column-widths="updateDeliveryColumnWidths"><template #cell-completion="{ row }"><strong class="completion-value">{{ row.completion }}%</strong></template><template #cell-status="{ row }"><AppStatusTag :tone="getStatusDisplay(row.status).tone" :label="getStatusDisplay(row.status).label" /></template></AppDataTable>
    </AppCard>

    <AppCard as="section" padding="none" class="table-pattern-card" aria-label="树形层级表格">
      <AppTableToolbar><span class="table-pattern-caption">资源层级</span><template #actions><AppButton variant="secondary" size="small" @click="treeExpandedKeys = ['resource-platform', 'resource-web', 'resource-data', 'resource-product']">展开全部</AppButton><AppButton variant="ghost" size="small" @click="treeExpandedKeys = []">收起全部</AppButton></template></AppTableToolbar>
      <AppDataTable :rows="RESOURCE_ROWS" :columns="RESOURCE_COLUMNS" row-key="id" tree-children-key="children" :tree-expanded-keys="treeExpandedKeys" :tree-indent="20" show-index striped show-column-dividers aria-label="资源层级表" @update:tree-expanded-keys="treeExpandedKeys = $event"><template #cell-status="{ row }"><AppStatusTag :tone="getStatusDisplay(row.status).tone" :label="getStatusDisplay(row.status).label" /></template><template #cell-capacity="{ row }"><strong class="capacity-value">{{ row.capacity }} 人日</strong></template></AppDataTable>
    </AppCard>

    <AppCard as="section" padding="none" class="table-pattern-card" aria-label="合并单元格与状态样式表格">
      <AppTableToolbar><span class="table-pattern-caption">合并单元格与状态样式</span></AppTableToolbar>
      <AppDataTable :rows="QUALITY_GATE_ROWS" :columns="QUALITY_GATE_COLUMNS" row-key="id" show-column-dividers bordered :row-class-name="getQualityRowClassName" :cell-class-name="getQualityCellClassName" :span-method="getQualityCellSpan" aria-label="质控流程检查表"><template #cell-owner="{ row }"><template v-if="row.id === 'quality-006'"><span class="release-conclusion">{{ row.owner }} · {{ row.result }}</span></template><template v-else>{{ row.owner }}</template></template></AppDataTable>
    </AppCard>
  </section>
</template>

<style scoped>
.table-patterns-page { display: grid; align-content: start; gap: var(--aps-page-stack-gap); }.table-pattern-intro h1, .table-pattern-intro p { margin: 0; }.table-pattern-intro h1 { color: var(--aps-ink); font-size: var(--aps-text-xl); font-weight: 740; letter-spacing: -.025em; }.table-pattern-intro p { margin-top: 7px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }.table-pattern-card { overflow: hidden; border-color: var(--aps-line); }.table-pattern-caption { color: var(--aps-muted); font-size: var(--aps-text-sm); font-weight: 650; }.completion-value, .capacity-value { color: var(--aps-ink); font-variant-numeric: tabular-nums; }.release-conclusion { color: var(--aps-ink); font-weight: 650; }.table-patterns-page :deep(.is-risk-row) { background: rgba(201, 78, 72, .035); }.table-patterns-page :deep(.is-risk-row:hover) { background: rgba(201, 78, 72, .07); }.table-patterns-page :deep(td.is-risk-cell) { color: #a0342e; font-weight: 650; }.table-patterns-page :deep(td.is-release-cell) { background: var(--aps-surface-soft); }
</style>
