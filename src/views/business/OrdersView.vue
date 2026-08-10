<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { createOrderExportTask, downloadOrderExportTask, getOrderExportTasks, getOrders, removeOrderExportTask, retryOrderExportTask, updateOrderStatus } from "@/api/modules/orders";
import { AppButton } from "aps-design-pro";
import { AppIconButton } from "aps-design-pro";
import { AppDataTable } from "aps-design-pro";
import { AppExportTaskPanel } from "aps-design-pro";
import { AppPagination } from "aps-design-pro";
import { AppStatusTag } from "aps-design-pro";
import { AppTableOperationBar } from "aps-design-pro";
import { AppTableActions } from "aps-design-pro";
import { AppTableSettingsPanel } from "aps-design-pro";
import { AppTableToolbar } from "aps-design-pro";
import { AppTableViewSelector } from "aps-design-pro";
import { useTableDataSource } from "@/composables/useTableDataSource";
import { useTablePreferences } from "aps-design-pro";
import { useTableViews } from "aps-design-pro";
import { AppFilterBar } from "aps-design-pro";
import { AppFormField } from "aps-design-pro";
import { AppSearchInput } from "aps-design-pro";
import { AppSelect } from "aps-design-pro";
import { AppDateRangePicker } from "aps-design-pro";
import { AppNumberInput } from "aps-design-pro";
import { AppDropdown } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import { useAuthStore } from "@/stores/auth";
import { useFeedbackStore } from "@/stores/feedback";
import type { DataTableColumn, DateRangeValue, DropdownItem, ExportTask, SelectOption, StatusTone, TableViewScope } from "aps-design-pro";
import type { OrderExportQuery, OrderListQuery, OrderStatus, OrderStatusAction, SalesOrder } from "@/types/orders";

interface OrderStatusDisplay {
  label: string;
  tone: StatusTone;
}

const statusOptions: SelectOption[] = [
  { label: "全部状态", value: "" },
  { label: "待支付", value: "pending_payment" },
  { label: "已支付", value: "paid" },
  { label: "开通中", value: "fulfilling" },
  { label: "已交付", value: "shipped" },
  { label: "已完成", value: "completed" },
  { label: "已关闭", value: "cancelled" },
];
const channelOptions: SelectOption[] = [
  { label: "全部来源", value: "" },
  { label: "官网", value: "官网" },
  { label: "内容社群", value: "内容社群" },
  { label: "渠道合作", value: "渠道合作" },
];
const ORDER_TABLE_COLUMNS: DataTableColumn<SalesOrder>[] = [
  { key: "orderNo", label: "订单号", defaultWidth: 196, minWidth: 178, maxWidth: 300 },
  { key: "customerName", label: "客户", defaultWidth: 146, minWidth: 118, maxWidth: 260 },
  { key: "productSummary", label: "商品", defaultWidth: 260, minWidth: 200, maxWidth: 480 },
  { key: "channel", label: "来源", defaultWidth: 116, minWidth: 100, maxWidth: 180 },
  { key: "amount", label: "实付金额", defaultWidth: 124, minWidth: 108, maxWidth: 220, align: "right", sortable: true },
  { key: "status", label: "状态", defaultWidth: 120, minWidth: 104, maxWidth: 180 },
  { key: "createdAt", label: "下单时间", defaultWidth: 166, minWidth: 148, maxWidth: 260, sortable: true },
];
const DEFAULT_ORDER_QUERY: OrderListQuery = {
  keyword: "",
  status: undefined,
  channel: "",
  createdFrom: "",
  createdTo: "",
  minAmount: undefined,
  maxAmount: undefined,
  page: 1,
  pageSize: 20,
  sortBy: "createdAt",
  sortOrder: "desc",
};
const feedbackStore = useFeedbackStore();
const authStore = useAuthStore();
const isAdvancedFilterOpen = ref(false);
const isExporting = ref(false);
const isTableFullscreen = ref(false);
const orderDateRange = ref<DateRangeValue>({ start: "", end: "" });
const minAmountInput = ref(0);
const maxAmountInput = ref(0);
const hasMinAmount = ref(false);
const hasMaxAmount = ref(false);
const updatingOrderId = ref<string | null>(null);
const openOrderActionId = ref<string | null>(null);
const exportTasks = ref<ExportTask[]>([]);
let exportTaskPollingTimer: number | undefined;
let exportTaskRequestVersion = 0;
const orderDataSource = useTableDataSource<SalesOrder, OrderListQuery>({ initialQuery: DEFAULT_ORDER_QUERY, request: getOrders });
const { rows: orders, total, isLoading, errorMessage } = orderDataSource;
const keyword = computed({
  get: () => orderDataSource.query.value.keyword ?? "",
  set: (value: string) => { orderDataSource.query.value = { ...orderDataSource.query.value, keyword: value }; },
});
const status = computed<"" | OrderStatus>({
  get: () => orderDataSource.query.value.status ?? "",
  set: (value) => { orderDataSource.query.value = { ...orderDataSource.query.value, status: value || undefined }; },
});
const channel = computed({
  get: () => orderDataSource.query.value.channel ?? "",
  set: (value: string) => { orderDataSource.query.value = { ...orderDataSource.query.value, channel: value }; },
});
const page = computed(() => orderDataSource.query.value.page ?? DEFAULT_ORDER_QUERY.page ?? 1);
const pageSize = computed(() => orderDataSource.query.value.pageSize ?? DEFAULT_ORDER_QUERY.pageSize ?? 20);
const tableSort = computed(() => ({
  key: orderDataSource.query.value.sortBy ?? "createdAt",
  order: orderDataSource.query.value.sortOrder ?? "desc",
}));
const orderTableBaseScope = computed<TableViewScope | null>(() => {
  const profile = authStore.profile;
  if (!profile) return null;
  return { tenantId: profile.tenantId, userId: profile.id, route: "/business/orders", tableId: "sales-order-list" };
});
const orderTableViewState = useTableViews({ scope: orderTableBaseScope });
const {
  views: orderTableViews,
  activeViewId: activeOrderTableViewId,
  isLoading: isLoadingOrderTableViews,
  isSaving: isSavingOrderTableViews,
  saveError: orderTableViewError,
} = orderTableViewState;
const {
  preference: orderTablePreference,
  defaultPreference: defaultOrderTablePreference,
  resolvedColumns: orderTableColumns,
  columnWidths: orderColumnWidths,
  tableSize: orderTableSize,
  isSaving: isSavingOrderTablePreference,
  saveError: orderTablePreferenceError,
  updatePreference: updateOrderTablePreference,
  updateColumnWidths: updateOrderColumnWidths,
} = useTablePreferences({ columns: ORDER_TABLE_COLUMNS, scope: orderTableViewState.activeViewScope });

async function loadOrders(resetPage = false): Promise<void> {
  await orderDataSource.reload({ resetPage });
}

function buildOrderFilterQuery(): Pick<OrderListQuery, "keyword" | "status" | "channel" | "createdFrom" | "createdTo" | "minAmount" | "maxAmount"> {
  return {
    keyword: keyword.value,
    status: status.value || undefined,
    channel: channel.value,
    createdFrom: orderDateRange.value.start,
    createdTo: orderDateRange.value.end,
    minAmount: hasMinAmount.value ? minAmountInput.value : undefined,
    maxAmount: hasMaxAmount.value ? maxAmountInput.value : undefined,
  };
}

function submitFilters(): void {
  if (hasMinAmount.value && hasMaxAmount.value && minAmountInput.value > maxAmountInput.value) {
    feedbackStore.show("金额下限不能大于上限。", "error");
    return;
  }
  void orderDataSource.updateQuery(buildOrderFilterQuery(), { resetPage: true });
}

function resetFilters(): void {
  orderDateRange.value = { start: "", end: "" };
  minAmountInput.value = 0;
  maxAmountInput.value = 0;
  hasMinAmount.value = false;
  hasMaxAmount.value = false;
  void orderDataSource.updateQuery({ keyword: "", status: undefined, channel: "", createdFrom: "", createdTo: "", minAmount: undefined, maxAmount: undefined }, { resetPage: true });
}

function handleSortChange(nextSort: { key: string; order: "asc" | "desc" }): void {
  if (nextSort.key !== "createdAt" && nextSort.key !== "amount") return;
  void orderDataSource.setSort(nextSort.key, nextSort.order);
}

function updateOrderPage(nextPage: number): void {
  void orderDataSource.setPage(nextPage);
}

function updateOrderPageSize(nextPageSize: number): void {
  void orderDataSource.setPageSize(nextPageSize);
}

/** 打印入口保持在页面层，实际打印范围可随业务场景独立定制。 */
function printOrders(): void {
  window.print();
}

async function createOrderTableView(name: string): Promise<void> {
  const view = await orderTableViewState.createView(name);
  if (view) feedbackStore.show(`已新建表格视图“${view.name}”。`, "success");
}

async function renameOrderTableView(viewId: string, name: string): Promise<void> {
  const isRenamed = await orderTableViewState.renameView(viewId, name);
  if (isRenamed) feedbackStore.show("表格视图名称已更新。", "success");
}

async function removeOrderTableView(viewId: string): Promise<void> {
  const isRemoved = await orderTableViewState.removeView(viewId);
  if (isRemoved) feedbackStore.show("表格视图已删除。", "success");
}

function getStatusDisplay(value: OrderStatus): OrderStatusDisplay {
  const statusMap: Record<OrderStatus, OrderStatusDisplay> = {
    pending_payment: { label: "待支付", tone: "warning" },
    paid: { label: "已支付", tone: "info" },
    fulfilling: { label: "开通中", tone: "info" },
    shipped: { label: "已交付", tone: "success" },
    completed: { label: "已完成", tone: "success" },
    cancelled: { label: "已关闭", tone: "neutral" },
  };
  return statusMap[value];
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", minimumFractionDigits: 2 }).format(amount);
}

function escapeCsvCell(value: string | number): string {
  const normalizedValue = String(value).replace(/"/g, '""');
  return `"${normalizedValue}"`;
}

/** 只要仍有排队或处理中的任务，就继续轮询服务端状态；页面卸载后立即停止。 */
function scheduleExportTaskPolling(): void {
  window.clearTimeout(exportTaskPollingTimer);
  exportTaskPollingTimer = undefined;
  if (!exportTasks.value.some((task) => task.status === "queued" || task.status === "processing")) return;
  exportTaskPollingTimer = window.setTimeout(() => {
    exportTaskPollingTimer = undefined;
    void loadOrderExportTasks(true);
  }, 700);
}

function replaceExportTask(task: ExportTask): void {
  const exists = exportTasks.value.some((item) => item.id === task.id);
  exportTasks.value = exists
    ? exportTasks.value.map((item) => item.id === task.id ? task : item)
    : [task, ...exportTasks.value];
}

/** 轮询仅在状态由未完成转为完成时给出反馈，首次恢复历史记录不会重复提示。 */
async function loadOrderExportTasks(notifyOnCompletion = false): Promise<void> {
  const currentRequestVersion = ++exportTaskRequestVersion;
  const previousTaskStates = new Map(exportTasks.value.map((task) => [task.id, task.status]));
  try {
    const tasks = await getOrderExportTasks();
    if (currentRequestVersion !== exportTaskRequestVersion) return;
    exportTasks.value = tasks;
    if (notifyOnCompletion) {
      tasks.filter((task) => task.status === "succeeded" && (previousTaskStates.get(task.id) === "queued" || previousTaskStates.get(task.id) === "processing"))
        .forEach(() => feedbackStore.show("订单导出任务已完成。", "success"));
    }
    scheduleExportTaskPolling();
  } catch (error) {
    if (currentRequestVersion !== exportTaskRequestVersion) return;
    const message = error instanceof Error ? error.message : "读取订单导出任务失败，请稍后重试。";
    feedbackStore.show(message, "error");
  }
}

/** 页面只提交当前筛选条件，任务创建与进度推进均由服务层处理。 */
async function startOrderExport(): Promise<void> {
  if (isExporting.value) return;
  isExporting.value = true;
  try {
    const query = orderDataSource.query.value;
    const filterQuery = buildOrderFilterQuery();
    const exportQuery: OrderExportQuery = { ...filterQuery, sortBy: query.sortBy, sortOrder: query.sortOrder };
    const task = await createOrderExportTask(exportQuery);
    replaceExportTask(task);
    scheduleExportTaskPolling();
    feedbackStore.show("订单导出任务已创建。", "success");
  } catch (error) {
    const message = error instanceof Error ? error.message : "订单导出失败，请稍后重试。";
    feedbackStore.show(message, "error");
  } finally {
    isExporting.value = false;
  }
}

const orderStatusActionLabels: Partial<Record<OrderStatusAction, string>> = {
  remind_payment: "催付",
  cancel: "关闭订单",
  start_fulfillment: "开始履约",
  mark_shipped: "确认交付",
  complete: "完成订单",
};

function getOrderActionItems(row: SalesOrder): DropdownItem[] {
  const actionMap: Partial<Record<OrderStatus, OrderStatusAction[]>> = {
    pending_payment: ["remind_payment", "cancel"],
    paid: ["start_fulfillment"],
    fulfilling: ["mark_shipped"],
    shipped: ["complete"],
  };
  return (actionMap[row.status] ?? []).map((action) => ({
    key: action,
    label: orderStatusActionLabels[action] ?? action,
    icon: action === "cancel" ? "close" : action === "complete" ? "check" : "arrow-right",
    danger: action === "cancel",
    divided: action === "cancel",
  }));
}

async function handleOrderStatusAction(row: SalesOrder, action: string): Promise<void> {
  if (!(action in orderStatusActionLabels) || updatingOrderId.value) return;
  const statusAction = action as OrderStatusAction;
  openOrderActionId.value = null;
  updatingOrderId.value = row.id;
  try {
    const updatedOrder = await updateOrderStatus(row.id, { action: statusAction });
    const rowIndex = orders.value.findIndex((item) => item.id === row.id);
    if (rowIndex >= 0) orders.value.splice(rowIndex, 1, updatedOrder);
    feedbackStore.show(`订单${orderStatusActionLabels[statusAction]}成功。`, "success");
    await loadOrders();
  } catch (error) {
    feedbackStore.show(error instanceof Error ? error.message : `订单${orderStatusActionLabels[statusAction]}失败，请稍后重试。`, "error");
  } finally {
    updatingOrderId.value = null;
  }
}

async function retryOrderExport(task: ExportTask): Promise<void> {
  try {
    const nextTask = await retryOrderExportTask(task.id);
    replaceExportTask(nextTask);
    scheduleExportTaskPolling();
    feedbackStore.show("订单导出任务已重新提交。", "success");
  } catch (error) {
    feedbackStore.show(error instanceof Error ? error.message : "重新提交订单导出任务失败，请稍后重试。", "error");
  }
}

async function downloadExportTask(task: ExportTask): Promise<void> {
  try {
    const rows = await downloadOrderExportTask(task.id);
    const header = ["订单号", "客户", "商品", "来源", "实付金额", "状态", "下单时间"];
    const lines = rows.map((order) => [order.orderNo, order.customerName, order.productSummary, order.channel, order.amount, getStatusDisplay(order.status).label, order.createdAt].map(escapeCsvCell).join(","));
    const blob = new Blob([`\ufeff${header.map(escapeCsvCell).join(",")}\n${lines.join("\n")}`], { type: "text/csv;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = task.filename ?? "订单导出.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1_000);
    feedbackStore.show("导出文件已开始下载。", "success");
  } catch (error) {
    feedbackStore.show(error instanceof Error ? error.message : "获取订单导出文件失败，请稍后重试。", "error");
  }
}

async function removeExportTask(task: ExportTask): Promise<void> {
  const currentRequestVersion = ++exportTaskRequestVersion;
  try {
    await removeOrderExportTask(task.id);
    if (currentRequestVersion !== exportTaskRequestVersion) return;
    exportTasks.value = exportTasks.value.filter((item) => item.id !== task.id);
    scheduleExportTaskPolling();
  } catch (error) {
    if (currentRequestVersion !== exportTaskRequestVersion) return;
    feedbackStore.show(error instanceof Error ? error.message : "移除订单导出任务失败，请稍后重试。", "error");
  }
}

onMounted(() => {
  void loadOrders();
  void loadOrderExportTasks();
});
onBeforeUnmount(() => {
  exportTaskRequestVersion += 1;
  window.clearTimeout(exportTaskPollingTimer);
  exportTaskPollingTimer = undefined;
});
</script>

<template>
  <section class="page-content page-stack list-page-layout">
    <AppCard as="section" padding="large" content-overflow="visible" class="list-search-panel" aria-label="交易订单筛选条件">
      <AppFilterBar :expanded="isAdvancedFilterOpen" collapsible @submit="submitFilters" @reset="resetFilters" @update:expanded="isAdvancedFilterOpen = $event">
        <AppFormField label="关键词" for="order-keyword" label-position="inline" label-width="44px" label-gap="6px"><AppSearchInput id="order-keyword" v-model="keyword" placeholder="搜索订单号、会员或商品" aria-label="搜索交易订单" @search="submitFilters" /></AppFormField>
        <template #advanced>
          <AppFormField label="状态" for="order-status" label-position="inline" label-width="32px" label-gap="6px"><AppSelect id="order-status" v-model="status" :options="statusOptions" aria-label="按订单状态筛选" /></AppFormField>
          <AppFormField label="来源" for="order-channel" label-position="inline" label-width="32px" label-gap="6px"><AppSelect id="order-channel" v-model="channel" :options="channelOptions" aria-label="按订单来源筛选" /></AppFormField>
          <AppFormField label="下单日期" label-position="inline" label-width="56px" label-gap="6px"><AppDateRangePicker v-model="orderDateRange" compact clearable aria-label="按下单日期范围筛选" /></AppFormField>
          <AppFormField label="金额" label-position="inline" label-width="32px" label-gap="6px"><div class="amount-filter"><AppNumberInput v-model="minAmountInput" :min="0" :step="0.01" :precision="2" :controls="false" :value-on-clear="0" placeholder="最低" aria-label="订单金额下限" @change="hasMinAmount = true" @clear="hasMinAmount = false" /><span>至</span><AppNumberInput v-model="maxAmountInput" :min="0" :step="0.01" :precision="2" :controls="false" :value-on-clear="0" placeholder="最高" aria-label="订单金额上限" @change="hasMaxAmount = true" @clear="hasMaxAmount = false" /></div></AppFormField>
        </template>
        <template #actions><AppButton type="submit" :disabled="isLoading" leading-icon="search">查询</AppButton></template>
      </AppFilterBar>
    </AppCard>
    <AppCard as="section" padding="none" fill-height class="data-table-card" aria-label="订单列表">
      <AppTableToolbar><template #actions><AppTableOperationBar :fullscreen="isTableFullscreen" show-print show-fullscreen show-refresh :print-disabled="isLoading" :refresh-disabled="isLoading" @print="printOrders" @update:fullscreen="isTableFullscreen = $event" @refresh="loadOrders"><template #view><AppTableViewSelector :model-value="activeOrderTableViewId" :views="orderTableViews" :loading="isLoadingOrderTableViews" :saving="isSavingOrderTableViews" :error="orderTableViewError" @update:model-value="orderTableViewState.selectView" @create="createOrderTableView" @rename="renameOrderTableView" @remove="removeOrderTableView" /></template><template #settings><AppTableSettingsPanel :model-value="orderTablePreference" :default-value="defaultOrderTablePreference" :columns="ORDER_TABLE_COLUMNS" :saving="isSavingOrderTablePreference" :save-error="orderTablePreferenceError" @update:model-value="updateOrderTablePreference" /></template><template #export><AppExportTaskPanel :tasks="exportTasks" :creating="isExporting" :disabled="isLoading || total === 0" @create="startOrderExport" @download="downloadExportTask" @retry="retryOrderExport" @remove="removeExportTask" /></template></AppTableOperationBar></template></AppTableToolbar>
      <AppDataTable :rows="orders" :columns="orderTableColumns" row-key="id" :loading="isLoading" :error-message="errorMessage" :sort="tableSort" :column-widths="orderColumnWidths" :striped="orderTablePreference.striped" :show-column-dividers="orderTablePreference.showColumnDividers" :size="orderTableSize" :fullscreen="isTableFullscreen" resizable action-label="操作" empty-title="没有找到匹配订单" empty-description="调整搜索条件后再试一次。" empty-icon="grid" virtual fill-height :virtual-row-height="orderTablePreference.density === 'compact' ? 64 : 72" @update:fullscreen="isTableFullscreen = $event" @update:column-widths="updateOrderColumnWidths" @sort-change="handleSortChange" @retry="loadOrders"><template #cell-orderNo="{ row }"><RouterLink class="order-number" :to="`/trade/orders/${row.id}`">{{ row.orderNo }}</RouterLink></template><template #cell-customerName="{ row }"><div class="customer-cell"><strong>{{ row.customerName }}</strong><span>{{ row.customerPhone }}</span></div></template><template #cell-productSummary="{ row }"><span class="product-cell">{{ row.productSummary }}</span></template><template #cell-amount="{ row }"><strong class="amount-cell">{{ formatAmount(row.amount) }}</strong></template><template #cell-status="{ row }"><AppStatusTag :tone="getStatusDisplay(row.status).tone" :label="getStatusDisplay(row.status).label" /></template><template #actions="{ row }"><AppTableActions><RouterLink v-slot="{ navigate }" custom :to="`/trade/orders/${row.id}`"><AppIconButton icon="eye" label="查看订单详情" size="small" @click="navigate" /></RouterLink><AppDropdown v-if="getOrderActionItems(row).length" :model-value="openOrderActionId === row.id" :items="getOrderActionItems(row)" menu-label="订单操作" @update:model-value="openOrderActionId = $event ? row.id : null" @select="handleOrderStatusAction(row, $event)"><template #trigger="{ toggle }"><AppIconButton icon="dots" label="订单操作" size="small" :disabled="updatingOrderId === row.id" @click="toggle" /></template></AppDropdown></AppTableActions></template></AppDataTable>
      <AppPagination v-if="!isLoading && !errorMessage && orders.length" :page="page" :page-size="pageSize" :total="total" :page-size-options="[10, 20, 30, 50]" @update:page="updateOrderPage" @update:page-size="updateOrderPageSize" />
    </AppCard>
  </section>
</template>

<style scoped>
.order-summary { color: var(--aps-muted); font-size: var(--aps-text-sm); }.order-number { color: var(--aps-blue); font-size: var(--aps-text-sm); font-weight: 660; }.order-number:hover { color: var(--aps-blue-hover); text-decoration: underline; text-underline-offset: 3px; }.customer-cell { display: grid; gap: 2px; }.customer-cell strong { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: 660; }.customer-cell span { color: var(--aps-faint); font-size: var(--aps-text-xs); }.product-cell { color: var(--aps-ink); font-size: var(--aps-text-sm); }.amount-cell { color: var(--aps-ink); font-size: var(--aps-text-sm); font-variant-numeric: tabular-nums; }.amount-filter { display: flex; min-width: 246px; align-items: center; gap: 7px; }.amount-filter > span { color: var(--aps-faint); font-size: var(--aps-text-xs); }.amount-filter :deep(.app-number-input) { min-width: 0; flex: 1; }
</style>
