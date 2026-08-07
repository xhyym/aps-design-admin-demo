<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppIconButton } from "aps-design-pro";
import { AppColumnSettings, AppDataListCard, AppDataTable, AppDropdown, AppExcelExport, AppExcelImport, AppExportTaskPanel, AppTableActions, AppTableHeader } from "aps-design-pro";
import { AppSearchInput } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import type { DropdownItem } from "aps-design-pro";
import type { ColumnVisibilityOption, ControlSize, DataTableColumn, ExportTask, UploadFileItem, UploadRequestOptions, UploadRequestResult } from "aps-design-pro";

interface CourseAsset {
  id: string;
  title: string;
  category: string;
  owner: string;
  version: string;
  publishedAt: string;
}

const COURSE_COLUMNS: DataTableColumn<CourseAsset>[] = [
  { key: "title", label: "资源名称", defaultWidth: 260, minWidth: 188, maxWidth: 420 },
  { key: "category", label: "资源分类", defaultWidth: 136, minWidth: 112, maxWidth: 220 },
  { key: "owner", label: "维护人", defaultWidth: 126, minWidth: 104, maxWidth: 200 },
  { key: "version", label: "当前版本", defaultWidth: 112, minWidth: 96, maxWidth: 168 },
  { key: "publishedAt", label: "最近发布", defaultWidth: 164, minWidth: 144, maxWidth: 248 },
];
const COURSE_ASSETS: CourseAsset[] = [
  { id: "asset-001", title: "Vue 组件工程化实战", category: "前端开发", owner: "陈映月", version: "v3.6", publishedAt: "2026-08-02 09:30" },
  { id: "asset-002", title: "Java 服务端性能调优", category: "后端架构", owner: "周予安", version: "v2.4", publishedAt: "2026-08-01 16:12" },
  { id: "asset-003", title: "数据分析指标体系", category: "数据产品", owner: "林知远", version: "v1.8", publishedAt: "2026-07-31 11:06" },
  { id: "asset-004", title: "云原生交付规范", category: "运维交付", owner: "张晓晨", version: "v4.1", publishedAt: "2026-07-30 18:40" },
  { id: "asset-005", title: "产品需求到交付协作", category: "产品管理", owner: "王语桐", version: "v2.0", publishedAt: "2026-07-30 14:18" },
];
const tableMoreActions: DropdownItem[] = [
  { key: "duplicate", label: "复制资源链接", icon: "edit" },
  { key: "export", label: "导出单条信息", icon: "download" },
  { key: "archive", label: "归档资源", icon: "trash", danger: true, divided: true },
];
const initialColumnVisibility = Object.fromEntries(COURSE_COLUMNS.map((column) => [column.key, true]));
const searchKeyword = ref("");
const isSearchVisible = ref(true);
const isRefreshing = ref(false);
const tableSize = ref<ControlSize>("default");
const isTableFullscreen = ref(false);
const isRowMoreOpen = ref<string | null>(null);
const isStandaloneMoreOpen = ref(false);
const columnVisibility = ref<Record<string, boolean>>(initialColumnVisibility);
const importFiles = ref<UploadFileItem[]>([]);
const exportTasks = ref<ExportTask[]>([
  { id: "resource-export-ready", title: "课程资源清单", status: "succeeded", progress: 100, createdAt: "今天 09:18", completedAt: "今天 09:19", filename: "课程资源清单-2026-08-03.csv", downloadable: true },
  { id: "resource-export-failed", title: "课程资源清单", status: "failed", progress: 0, createdAt: "昨天 17:36", errorMessage: "生成文件时未能连接到数据服务。", filename: "课程资源清单-2026-08-02.csv" },
]);
const isCreatingExportTask = ref(false);
const exportStatus = ref("导出只负责触发业务服务，实际文件生成和权限判断仍由服务端处理。");
const importStatus = ref("支持 .xlsx、.xls 和 .csv；选择文件后会进入统一上传队列。");
const actionStatus = ref("尚未执行资源操作。");
let refreshTimer: number | undefined;
let exportTimer: number | undefined;
let createExportTaskTimer: number | undefined;
let exportTaskSequence = 0;
const exportTaskTimers = new Map<string, number[]>();

const columnOptions = computed<ColumnVisibilityOption[]>(() => COURSE_COLUMNS.map((column) => ({ key: column.key, label: column.label })));
const visibleColumns = computed(() => COURSE_COLUMNS.filter((column) => columnVisibility.value[column.key]));
const filteredAssets = computed(() => {
  const keyword = searchKeyword.value.trim().toLocaleLowerCase("zh-CN");
  if (!keyword) return COURSE_ASSETS;
  return COURSE_ASSETS.filter((asset) => `${asset.title} ${asset.category} ${asset.owner} ${asset.version}`.toLocaleLowerCase("zh-CN").includes(keyword));
});

/** 资源刷新保留请求中状态，防止用户连续点击造成重复请求。 */
function refreshAssets(): void {
  if (isRefreshing.value) return;
  isRefreshing.value = true;
  actionStatus.value = "正在重新读取资源列表。";
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => {
    isRefreshing.value = false;
    actionStatus.value = "资源列表已刷新，当前筛选条件保持不变。";
    refreshTimer = undefined;
  }, 560);
}

/** 页面接收导出意图并保留异步状态；组件不生成文件或绕过业务权限。 */
function exportAssets(): void {
  if (exportTimer !== undefined) return;
  exportStatus.value = "正在提交课程资源导出任务。";
  window.clearTimeout(exportTimer);
  exportTimer = window.setTimeout(() => {
    exportStatus.value = "导出任务已创建，文件生成后可从任务中心下载。";
    exportTimer = undefined;
  }, 620);
}

/** 任务创建与完成状态分两段推进，使页面可以验收任务中心的实时处理语义。 */
function scheduleExportTaskProcessing(taskId: string): void {
  const processingTimer = window.setTimeout(() => {
    exportTasks.value = exportTasks.value.map((task) => task.id === taskId ? { ...task, status: "processing", progress: 56 } : task);
  }, 260);
  const completionTimer = window.setTimeout(() => {
    exportTasks.value = exportTasks.value.map((task) => task.id === taskId
      ? { ...task, status: "succeeded", progress: 100, completedAt: "刚刚", downloadable: true }
      : task);
    exportTaskTimers.delete(taskId);
    exportStatus.value = "导出文件已生成，可从任务中心下载。";
  }, 960);
  exportTaskTimers.set(taskId, [processingTimer, completionTimer]);
}

/** 示例使用内存任务模拟异步导出，组件本身始终只通过事件把请求意图交给业务层。 */
function createExportTask(): void {
  if (isCreatingExportTask.value) return;
  isCreatingExportTask.value = true;
  window.clearTimeout(createExportTaskTimer);
  createExportTaskTimer = window.setTimeout(() => {
    const taskId = `resource-export-${Date.now()}-${exportTaskSequence += 1}`;
    exportTasks.value = [{
      id: taskId,
      title: "课程资源清单",
      status: "queued",
      progress: 0,
      createdAt: "刚刚",
      filename: `课程资源清单-${new Date().toISOString().slice(0, 10)}.csv`,
    }, ...exportTasks.value];
    isCreatingExportTask.value = false;
    createExportTaskTimer = undefined;
    exportStatus.value = "导出任务已提交，正在后台生成文件。";
    scheduleExportTaskProcessing(taskId);
  }, 180);
}

function retryExportTask(task: ExportTask): void {
  const previousTimers = exportTaskTimers.get(task.id);
  previousTimers?.forEach((timer) => window.clearTimeout(timer));
  exportTasks.value = exportTasks.value.map((item) => item.id === task.id
    ? { ...item, status: "queued", progress: 0, errorMessage: undefined, completedAt: undefined, downloadable: false, createdAt: "刚刚" }
    : item);
  exportStatus.value = `正在重新生成“${task.title}”。`;
  scheduleExportTaskProcessing(task.id);
}

function removeExportTask(task: ExportTask): void {
  exportTaskTimers.get(task.id)?.forEach((timer) => window.clearTimeout(timer));
  exportTaskTimers.delete(task.id);
  exportTasks.value = exportTasks.value.filter((item) => item.id !== task.id);
  exportStatus.value = `已移除“${task.title}”的导出记录。`;
}

/** 下载内容由业务数据构造为临时文件，演示组件事件不会依赖外部文件地址。 */
function downloadExportTask(task: ExportTask): void {
  const csvRows = [
    ["资源名称", "资源分类", "维护人", "当前版本", "最近发布"],
    ...filteredAssets.value.map((asset) => [asset.title, asset.category, asset.owner, asset.version, asset.publishedAt]),
  ];
  const csvContent = `\ufeff${csvRows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n")}`;
  const fileUrl = URL.createObjectURL(new Blob([csvContent], { type: "text/csv;charset=utf-8" }));
  const downloadLink = document.createElement("a");
  downloadLink.href = fileUrl;
  downloadLink.download = task.filename ?? "课程资源清单.csv";
  downloadLink.click();
  window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1_000);
  exportStatus.value = `已开始下载“${downloadLink.download}”。`;
}

/** 导入请求由业务层注入；示例完整处理进度推进和取消信号。 */
function importSpreadsheet({ file, onProgress, signal }: UploadRequestOptions): Promise<UploadRequestResult> {
  importStatus.value = `正在校验“${file.name}”的字段与模板版本。`;
  return new Promise((resolve, reject) => {
    let progress = 0;
    const clearRequest = (): void => {
      window.clearInterval(progressTimer);
      signal.removeEventListener("abort", handleAbort);
    };
    const handleAbort = (): void => {
      clearRequest();
      importStatus.value = "导入已取消，原始文件未写入资源列表。";
      reject(new DOMException("资源导入已取消。", "AbortError"));
    };
    const progressTimer = window.setInterval(() => {
      progress = Math.min(100, progress + 20);
      onProgress(progress);
      if (progress < 100) return;
      clearRequest();
      importStatus.value = `“${file.name}”已通过模板校验，等待业务服务写入资源。`;
      resolve({ url: undefined });
    }, 110);
    if (signal.aborted) handleAbort();
    else signal.addEventListener("abort", handleAbort, { once: true });
  });
}

function handleImportChange(file: UploadFileItem): void {
  if (file.status === "success") importStatus.value = `“${file.name}”导入完成，已生成服务端处理结果。`;
  if (file.status === "error") importStatus.value = file.error ?? "导入失败，请检查文件格式后重试。";
}

function handleRowAction(key: string, asset: CourseAsset): void {
  const action = tableMoreActions.find((item) => item.key === key);
  actionStatus.value = action ? `已对“${asset.title}”执行：${action.label}。` : "未识别的资源操作。";
}

function inspectAsset(asset: CourseAsset): void {
  actionStatus.value = `已打开“${asset.title}”的资源详情。`;
}

function handleStandaloneAction(key: string): void {
  actionStatus.value = key === "duplicate" ? "已复制课程资源链接。" : `已执行更多操作：${key}。`;
}

onBeforeUnmount(() => {
  window.clearTimeout(refreshTimer);
  window.clearTimeout(exportTimer);
  window.clearTimeout(createExportTaskTimer);
  createExportTaskTimer = undefined;
  exportTaskTimers.forEach((timers) => timers.forEach((timer) => window.clearTimeout(timer)));
  exportTaskTimers.clear();
});
</script>

<template>
  <section class="table-extensions-page page-content page-stack" aria-label="表格扩展组件示例">
    <header class="table-extensions-heading">
      <div>
        <h1>表格扩展</h1>
        <p>将列表头部、显示列、行内操作、导入导出和摘要信息组合为同一套后台工作流；数据请求和文件处理始终由业务层承接。</p>
      </div>
    </header>

    <AppCard as="article" padding="none" content-overflow="visible" class="resource-table-card">
      <AppTableHeader
        :model-value="columnVisibility"
        title="课程资源"
        description="支持独立显示列、密度调整、刷新与全屏；列表能力不会与具体接口耦合。"
        :loading="isRefreshing"
        :search-visible="isSearchVisible"
        :table-size="tableSize"
        :column-options="[]"
        @update:model-value="columnVisibility = $event"
        @update:search-visible="isSearchVisible = $event"
        @update:table-size="tableSize = $event"
        @refresh="refreshAssets"
        @fullscreen="isTableFullscreen = true"
      >
        <template #actions>
          <AppColumnSettings v-model="columnVisibility" :options="columnOptions" :min-visible="2" />
          <AppExcelExport filename="课程资源清单.xlsx" :loading="exportStatus.startsWith('正在')" @export="exportAssets" />
        </template>
      </AppTableHeader>

      <form v-if="isSearchVisible" class="resource-search-row" @submit.prevent="actionStatus = `已按“${searchKeyword.trim() || '全部资源'}”查询。`">
        <AppSearchInput v-model="searchKeyword" placeholder="搜索资源名称、分类、维护人或版本" aria-label="搜索课程资源" @clear="actionStatus = '已清空资源搜索条件。'" />
        <AppButton type="submit" leading-icon="search">查询</AppButton>
      </form>

      <AppDataTable
        :rows="filteredAssets"
        :columns="visibleColumns"
        row-key="id"
        :size="tableSize"
        :fullscreen="isTableFullscreen"
        :show-column-dividers="true"
        resizable
        action-label="操作"
        empty-title="没有匹配的课程资源"
        empty-description="尝试调整关键词或恢复显示列。"
        aria-label="课程资源表格"
        @update:fullscreen="isTableFullscreen = $event"
      >
        <template #cell-title="{ row }"><strong class="asset-title">{{ row.title }}</strong></template>
        <template #actions="{ row }">
          <div class="table-row-actions">
            <AppIconButton icon="eye" label="查看课程资源" size="small" @click="inspectAsset(row)" />
            <AppDropdown :model-value="isRowMoreOpen === row.id" :items="tableMoreActions" menu-label="更多资源操作" @update:model-value="isRowMoreOpen = $event ? row.id : null" @select="handleRowAction($event, row)">
              <template #trigger="{ toggle }"><AppIconButton icon="dots" label="更多资源操作" size="small" @click="toggle" /></template>
            </AppDropdown>
          </div>
        </template>
      </AppDataTable>
      <output class="resource-action-status" aria-live="polite">{{ actionStatus }}</output>
    </AppCard>

    <div class="table-extension-grid">
      <AppDataListCard title="资源同步摘要" description="轻量数据概览适合放在列表、详情和流程侧栏中。" :items="[
        { key: 'total', label: '可售资源', value: 128, detail: '当前工作区已发布版本' },
        { key: 'draft', label: '待补充资料', value: 6, detail: '需要维护人继续完善' },
        { key: 'sync', label: '上次同步', value: '09:42', detail: '数据服务状态正常' },
      ]">
        <template #actions><AppIconButton icon="eye" label="查看资源同步记录" size="small" @click="actionStatus = '已打开资源同步记录。'" /></template>
      </AppDataListCard>

      <AppCard as="article" padding="large" class="import-card">
        <header class="extension-card-heading"><div><h2>表格文件导入</h2><p>上传队列只负责文件、进度和取消；模板解析与写入仍由注入的业务请求执行。</p></div><span>AppExcelImport</span></header>
        <AppExcelImport v-model="importFiles" :multiple="false" :request="importSpreadsheet" @change="handleImportChange" />
        <p class="extension-result" role="status">{{ importStatus }}</p>
      </AppCard>

      <AppCard as="article" padding="large" content-overflow="visible" class="actions-card">
        <header class="extension-card-heading"><div><h2>紧凑操作组合</h2><p>行内操作与更多菜单共享同一键盘路径，低频或危险操作不会挤占表格主操作区。</p></div><span>AppButtonTable</span></header>
        <AppTableActions>
          <AppIconButton icon="check" label="保存资源草稿" size="small" variant="secondary" @click="actionStatus = '已保存资源草稿。'" />
          <AppDropdown v-model="isStandaloneMoreOpen" :items="tableMoreActions" menu-label="资源操作" @select="handleStandaloneAction">
            <template #trigger="{ toggle }"><AppIconButton icon="dots" label="资源操作" size="small" @click="toggle" /></template>
          </AppDropdown>
        </AppTableActions>
        <p class="extension-result" role="status">{{ exportStatus }}</p>
      </AppCard>

      <AppCard as="article" padding="large" content-overflow="visible" class="export-card">
        <header class="extension-card-heading"><div><h2>异步导出任务</h2><p>任务入口将创建、处理中、下载、失败重试和删除收敛在同一个浮层中，页面只维护业务状态与事件。</p></div><span>AppExportTaskPanel</span></header>
        <AppExportTaskPanel :tasks="exportTasks" :creating="isCreatingExportTask" create-text="创建资源导出" label="课程资源导出任务" @create="createExportTask" @download="downloadExportTask" @retry="retryExportTask" @remove="removeExportTask" />
        <p class="extension-result" role="status">{{ exportStatus }}</p>
      </AppCard>
    </div>
  </section>
</template>

<style scoped>
.table-extensions-page { display: grid; min-height: 0; align-content: start; gap: var(--aps-page-stack-gap); }
.table-extensions-heading h1, .table-extensions-heading p, .extension-card-heading h2, .extension-card-heading p, .extension-result { margin: 0; }
.table-extensions-heading h1 { color: var(--aps-ink); font-size: var(--aps-text-2xl); font-weight: 740; letter-spacing: -.035em; }
.table-extensions-heading p { max-width: 760px; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }
.resource-table-card { min-height: 0; }
.resource-search-row { display: flex; align-items: center; gap: 10px; padding: 14px var(--aps-card-padding); border-bottom: 1px solid var(--aps-line-soft); background: var(--aps-surface-soft); }
.resource-search-row :deep(.app-search-input) { width: min(100%, 360px); }
.resource-action-status { display: block; min-height: 42px; padding: 11px var(--aps-card-padding); border-top: 1px solid var(--aps-line-soft); color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.5; }
.asset-title { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: 680; }
.table-row-actions { display: inline-flex; align-items: center; justify-content: flex-end; gap: 4px; }
.resource-table-card :deep(.column-settings-trigger), .resource-table-card :deep(button[aria-label^="导出 "]) { width: var(--aps-control-height); min-width: var(--aps-control-height); padding: 0; font-size: 0; }
.table-extension-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--aps-page-stack-gap); }
.import-card, .actions-card, .export-card { display: grid; min-width: 0; align-content: start; gap: 18px; }
.extension-card-heading { display: flex; min-width: 0; align-items: start; justify-content: space-between; gap: 14px; }
.extension-card-heading > div { min-width: 0; }
.extension-card-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: 720; }
.extension-card-heading p { margin-top: 6px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }
.extension-card-heading > span { flex: 0 0 auto; padding: 4px 8px; border-radius: 6px; background: var(--aps-surface-soft); color: var(--aps-faint); font-size: var(--aps-text-xs); font-weight: 650; white-space: nowrap; }
.extension-result { min-height: 44px; padding: 10px 12px; border: 1px solid var(--aps-line-soft); border-radius: 10px; background: var(--aps-surface-soft); color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.55; }
@media (max-width: 1120px) { .table-extension-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 720px) { .resource-search-row { align-items: stretch; flex-direction: column; }.resource-search-row :deep(.app-search-input), .resource-search-row :deep(.app-button-control) { width: 100%; }.table-extension-grid { grid-template-columns: 1fr; }.extension-card-heading > span { display: none; } }
</style>
