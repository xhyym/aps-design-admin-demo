<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { downloadOrderExportTask, getOrderExportTasks, removeOrderExportTask, retryOrderExportTask } from "@/api/modules/orders";
import { useFeedbackStore } from "@/stores/feedback";
import { AppCard, AppDataTable, AppIconButton, AppProgress, AppStatusTag, AppTableActions, AppTableOperationBar, AppTableToolbar } from "aps-design-pro";
import type { DataTableColumn, DropdownItem, ExportTask, StatusTone } from "aps-design-pro";
import type { SalesOrder } from "@/types/orders";

const feedbackStore = useFeedbackStore();
const exportTasks = ref<ExportTask[]>([]);
const isLoading = ref(false);
const errorMessage = ref("");
let pollingTimer: number | undefined;
let requestVersion = 0;

const EXPORT_TASK_COLUMNS: DataTableColumn<ExportTask>[] = [
  { key: "title", label: "任务名称", defaultWidth: 220, minWidth: 180 },
  { key: "filename", label: "文件名", defaultWidth: 290, minWidth: 220 },
  { key: "createdAt", label: "创建时间", defaultWidth: 150, minWidth: 130 },
  { key: "status", label: "状态与进度", defaultWidth: 210, minWidth: 180 },
  { key: "completedAt", label: "完成时间", defaultWidth: 150, minWidth: 130 },
];

function getTaskStatus(task: ExportTask): { label: string; tone: StatusTone } {
  const statusMap: Record<ExportTask["status"], { label: string; tone: StatusTone }> = {
    queued: { label: "排队中", tone: "warning" },
    processing: { label: "处理中", tone: "info" },
    succeeded: { label: "已完成", tone: "success" },
    failed: { label: "导出失败", tone: "danger" },
  };
  return statusMap[task.status];
}

function getTaskProgress(task: ExportTask): number {
  if (task.status === "succeeded") return 100;
  if (task.status === "queued") return 0;
  return Math.min(99, Math.max(0, task.progress ?? 0));
}

function canDownload(task: ExportTask): boolean {
  return task.status === "succeeded" && Boolean(task.downloadable || task.downloadUrl);
}

function getTaskMoreActions(task: ExportTask): DropdownItem[] {
  return [
    ...(task.status === "failed" ? [{ key: "retry", label: "重试导出任务", icon: "refresh" as const }] : []),
    { key: "remove", label: "移除导出任务", icon: "trash", danger: true },
  ];
}

function handleTaskAction(task: ExportTask, key: string): void {
  if (key === "retry") {
    void retryTask(task);
    return;
  }
  if (key === "remove") void removeTask(task);
}

function schedulePolling(): void {
  window.clearTimeout(pollingTimer);
  pollingTimer = undefined;
  if (!exportTasks.value.some((task) => task.status === "queued" || task.status === "processing")) return;
  pollingTimer = window.setTimeout(() => {
    pollingTimer = undefined;
    void loadTasks();
  }, 700);
}

async function loadTasks(): Promise<void> {
  const currentVersion = ++requestVersion;
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const tasks = await getOrderExportTasks();
    if (currentVersion !== requestVersion) return;
    exportTasks.value = tasks;
    schedulePolling();
  } catch (error) {
    if (currentVersion !== requestVersion) return;
    errorMessage.value = error instanceof Error ? error.message : "读取订单导出任务失败，请稍后重试。";
  } finally {
    if (currentVersion === requestVersion) isLoading.value = false;
  }
}

function replaceTask(task: ExportTask): void {
  exportTasks.value = exportTasks.value.map((item) => item.id === task.id ? task : item);
}

function escapeCsvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

async function downloadTask(task: ExportTask): Promise<void> {
  try {
    const rows: SalesOrder[] = await downloadOrderExportTask(task.id);
    const header = ["订单号", "客户", "商品", "来源", "实付金额", "状态", "下单时间"];
    const lines = rows.map((order) => [order.orderNo, order.customerName, order.productSummary, order.channel, order.amount, order.status, order.createdAt].map(escapeCsvCell).join(","));
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

async function retryTask(task: ExportTask): Promise<void> {
  try {
    replaceTask(await retryOrderExportTask(task.id));
    schedulePolling();
    feedbackStore.show("订单导出任务已重新提交。", "success");
  } catch (error) {
    feedbackStore.show(error instanceof Error ? error.message : "重新提交订单导出任务失败，请稍后重试。", "error");
  }
}

async function removeTask(task: ExportTask): Promise<void> {
  try {
    await removeOrderExportTask(task.id);
    exportTasks.value = exportTasks.value.filter((item) => item.id !== task.id);
    schedulePolling();
    feedbackStore.show("订单导出任务已移除。", "success");
  } catch (error) {
    feedbackStore.show(error instanceof Error ? error.message : "移除订单导出任务失败，请稍后重试。", "error");
  }
}

onMounted(() => { void loadTasks(); });
onBeforeUnmount(() => {
  requestVersion += 1;
  window.clearTimeout(pollingTimer);
  pollingTimer = undefined;
});
</script>

<template>
  <section class="page-content page-stack export-task-page">
    <AppCard as="section" padding="none" fill-height class="data-table-card" aria-label="订单导出任务列表">
      <AppTableToolbar><span class="task-count">共 {{ exportTasks.length }} 个任务</span><template #actions><AppTableOperationBar show-refresh :refresh-disabled="isLoading" @refresh="loadTasks" /></template></AppTableToolbar>
      <AppDataTable :rows="exportTasks" :columns="EXPORT_TASK_COLUMNS" row-key="id" :loading="isLoading" :error-message="errorMessage" fill-height action-label="操作" empty-title="暂无导出任务" empty-description="在交易订单列表中创建导出任务后，会在这里显示进度。" empty-icon="grid" aria-label="订单导出任务表格">
        <template #cell-title="{ row }"><div class="task-title-cell"><strong>{{ row.title }}</strong><span>{{ row.id }}</span></div></template>
        <template #cell-filename="{ row }"><span class="task-filename">{{ row.filename ?? "等待生成文件名" }}</span></template>
        <template #cell-status="{ row }"><div class="task-status-cell"><AppStatusTag :tone="getTaskStatus(row).tone" :label="getTaskStatus(row).label" /><AppProgress v-if="row.status === 'queued' || row.status === 'processing'" :percentage="getTaskProgress(row)" :show-text="false" size="small" aria-label="导出任务进度" /><span v-if="row.status === 'queued' || row.status === 'processing'" class="task-progress-text">{{ getTaskProgress(row) }}%</span><span v-if="row.status === 'failed' && row.errorMessage" class="task-error">{{ row.errorMessage }}</span></div></template>
        <template #cell-completedAt="{ row }"><span class="task-time">{{ row.completedAt ?? "--" }}</span></template>
        <template #actions="{ row }"><AppTableActions :more-items="getTaskMoreActions(row)" @select="handleTaskAction(row, $event)"><AppIconButton v-if="canDownload(row)" icon="download" label="下载导出文件" size="small" @click="downloadTask(row)" /></AppTableActions></template>
      </AppDataTable>
    </AppCard>
  </section>
</template>

<style scoped>
.export-task-page { min-width: 0; }.task-count { color: var(--aps-muted); font-size: var(--aps-text-sm); }.task-title-cell { display: grid; gap: 3px; min-width: 0; }.task-title-cell strong { overflow: hidden; color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: var(--aps-font-weight-strong); text-overflow: ellipsis; white-space: nowrap; }.task-title-cell span, .task-filename, .task-time { overflow: hidden; color: var(--aps-faint); font-size: var(--aps-text-xs); text-overflow: ellipsis; white-space: nowrap; }.task-filename { color: var(--aps-muted); font-size: var(--aps-text-sm); }.task-status-cell { display: grid; grid-template-columns: auto minmax(90px, 1fr) auto; align-items: center; gap: 8px; min-width: 170px; }.task-status-cell :deep(.app-progress) { min-width: 70px; }.task-progress-text { color: var(--aps-faint); font-size: var(--aps-text-xs); font-variant-numeric: tabular-nums; }.task-error { grid-column: 1 / -1; overflow: hidden; color: var(--aps-red); font-size: var(--aps-text-xs); text-overflow: ellipsis; white-space: nowrap; }.task-time { color: var(--aps-muted); font-size: var(--aps-text-sm); }
</style>
