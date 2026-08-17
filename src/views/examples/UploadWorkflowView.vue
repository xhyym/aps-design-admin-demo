<script setup lang="ts">
import { computed, ref } from "vue";
import { chunkUploadService } from "@/api/modules/files";
import { AppButton } from "aps-design-pro";
import { AppImageViewer } from "aps-design-pro";
import { AppUpload } from "aps-design-pro";
import { AppTag } from "aps-design-pro";
import { AppAlert } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import type { ImageViewerItem } from "aps-design-pro";
import type { UploadFileItem, UploadRequest } from "aps-design-pro";

const uploadRef = ref<InstanceType<typeof AppUpload> | null>(null);
const files = ref<UploadFileItem[]>([]);
const resumableUploadRef = ref<InstanceType<typeof AppUpload> | null>(null);
const resumableFiles = ref<UploadFileItem[]>([]);
const pictureUploadRef = ref<InstanceType<typeof AppUpload> | null>(null);
const pictureFiles = ref<UploadFileItem[]>([]);
const isPictureViewerOpen = ref(false);
const pictureViewerIndex = ref(0);
const statusMessage = ref("添加演示文件后，可验证手动提交、失败重试和取消恢复。");
const resumableStatusMessage = ref("添加文件后开始上传，暂停后可直接继续；刷新页面后重新选择同一文件也会恢复已完成分片。");
const failedAttempts = new Map<string, number>();
const resumableFileLastModified = 1_785_523_200_000;

const fileSummary = computed(() => ({
  ready: files.value.filter((file) => file.status === "ready").length,
  uploading: files.value.filter((file) => file.status === "uploading").length,
  recoverable: files.value.filter((file) => file.status === "error" || file.status === "aborted").length,
  completed: files.value.filter((file) => file.status === "success").length,
}));
const resumableSummary = computed(() => {
  const file = resumableFiles.value[0];
  if (!file) return { uploadedChunks: 0, totalChunks: 0, progress: 0, status: "未开始" };
  return {
    uploadedChunks: file.chunk?.uploadedChunks ?? 0,
    totalChunks: file.chunk?.totalChunks ?? 0,
    progress: file.progress,
    status: file.status === "success" ? "已完成" : file.status === "uploading" ? "传输中" : file.status === "aborted" ? "已暂停" : file.status === "error" ? "需重试" : "等待上传",
  };
});
const pictureViewerItems = computed<ImageViewerItem[]>(() => pictureFiles.value
  .filter((file): file is UploadFileItem & { url: string } => Boolean(file.url && file.type.startsWith("image/")))
  .map((file) => ({ src: file.url, alt: file.name, title: file.name })));

/** 示例请求完整响应取消信号，首次失败文件会失败一次，重试后返回稳定地址。 */
const uploadRequest: UploadRequest = ({ file, signal, onProgress }) => new Promise((resolve, reject) => {
  const attempt = (failedAttempts.get(file.name) ?? 0) + 1;
  failedAttempts.set(file.name, attempt);
  let progress = 8;
  onProgress(progress);
  const timer = window.setInterval(() => {
    progress = Math.min(92, progress + 14);
    onProgress(progress);
    if (progress < 64) return;
    window.clearInterval(timer);
    if (file.name.startsWith("需要重试") && attempt === 1) {
      reject(new Error("服务暂时不可用，请使用重试继续。"));
      return;
    }
    window.setTimeout(() => {
      onProgress(100);
      resolve({ url: `https://files.example.com/${encodeURIComponent(file.name)}` });
    }, file.name.startsWith("可取消") ? 2200 : 180);
  }, 150);
  signal.addEventListener("abort", () => {
    window.clearInterval(timer);
    reject(new Error("上传已取消。"));
  }, { once: true });
});

function addExampleFile(shouldFail: boolean): void {
  const fileName = shouldFail ? "需要重试-材料.txt" : "项目材料.txt";
  const file = new File([`演示文件：${fileName}`], fileName, { type: "text/plain" });
  void uploadRef.value?.add([file]);
  statusMessage.value = `已添加“${fileName}”，等待手动提交。`;
}

function addCancellableFile(): void {
  const fileName = "可取消-材料.txt";
  const file = new File([`演示文件：${fileName}`], fileName, { type: "text/plain" });
  void uploadRef.value?.add([file]);
  statusMessage.value = `已添加“${fileName}”，上传后可点击取消。`;
}

/** 图片示例通过公开 SVG 数据构造，不依赖外部资源即可验收图卡、预览和移除行为。 */
function addExampleCover(): void {
  const coverIndex = pictureFiles.value.length + 1;
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="480" viewBox="0 0 720 480"><rect width="720" height="480" fill="#e9f2fb"/><circle cx="584" cy="96" r="116" fill="#b7d6f5"/><path d="M0 360C160 280 262 464 430 350s206-78 290-12v142H0Z" fill="#1677d2"/><text x="52" y="92" fill="#1d1d1f" font-family="system-ui" font-size="38" font-weight="700">课程封面 ${coverIndex}</text><text x="52" y="138" fill="#4f5b66" font-family="system-ui" font-size="20">APS Design Pro</text></svg>`;
  const file = new File([source], `课程封面-${coverIndex}.svg`, { type: "image/svg+xml" });
  void pictureUploadRef.value?.add([file]);
}

function previewPicture(file: UploadFileItem): void {
  const index = pictureViewerItems.value.findIndex((item) => item.src === file.url);
  if (index < 0) return;
  pictureViewerIndex.value = index;
  isPictureViewerOpen.value = true;
}

function createResumableFileKey(file: File): string {
  return `upload-workflow:${file.name}:${file.size}:${file.lastModified}`;
}

function addResumableFile(): void {
  const file = new File([new Uint8Array(9 * 1024 * 1024 + 360 * 1024)], "课程资料包.bin", {
    type: "application/octet-stream",
    lastModified: resumableFileLastModified,
  });
  void resumableUploadRef.value?.add([file]);
  resumableStatusMessage.value = "已添加 9.4 MB 资料包，可开始分片上传。";
}

async function submitResumableUpload(): Promise<void> {
  await resumableUploadRef.value?.submit();
}

async function submitQueue(): Promise<void> {
  await uploadRef.value?.submit();
  statusMessage.value = "队列处理完成，请查看成功或可恢复的文件状态。";
}

function handleSuccess(file: UploadFileItem): void {
  statusMessage.value = `“${file.name}”已上传完成。`;
}

function handleError(file: UploadFileItem, message: string): void {
  statusMessage.value = `“${file.name}”上传失败：${message}`;
}

function handleCancel(file: UploadFileItem): void {
  statusMessage.value = `“${file.name}”已取消，可继续上传。`;
}

function handleResumableSuccess(file: UploadFileItem): void {
  resumableStatusMessage.value = `“${file.name}”已完成合并，共 ${file.chunk?.totalChunks ?? 0} 个分片。`;
}

function handleResumableCancel(file: UploadFileItem): void {
  resumableStatusMessage.value = `“${file.name}”已暂停，已完成 ${file.chunk?.uploadedChunks ?? 0}/${file.chunk?.totalChunks ?? 0} 个分片。点击“继续上传”将只传输缺失部分。`;
}

function handleResumableResume(file: UploadFileItem): void {
  resumableStatusMessage.value = `已恢复上传会话，服务端确认 ${file.chunk?.uploadedChunks ?? 0}/${file.chunk?.totalChunks ?? 0} 个分片已完成。`;
}

function handleResumableError(file: UploadFileItem, message: string): void {
  resumableStatusMessage.value = `“${file.name}”上传未完成：${message}`;
}

function resetExamples(): void {
  files.value = [];
  resumableFiles.value = [];
  pictureFiles.value = [];
  isPictureViewerOpen.value = false;
  failedAttempts.clear();
  statusMessage.value = "已清空演示队列。";
  resumableStatusMessage.value = "已清空分片演示。重新添加同一文件后，服务端仍会识别未过期的上传会话。";
}
</script>

<template>
  <section class="upload-workflow-page page-content page-stack" aria-label="上传任务组件示例">
    <header class="upload-workflow-intro"><div><h1>上传任务与失败恢复</h1><p>上传组件只处理队列、进度、取消与重试；文件服务由页面注入。原始文件只在当前浏览器会话内保留，刷新页面后应由业务重新选择文件。</p></div><AppButton variant="secondary" leading-icon="refresh" @click="resetExamples">清空示例</AppButton></header>
    <AppAlert tone="info" title="当前队列状态" :description="statusMessage" />

    <section class="upload-workflow-grid">
      <AppCard as="article" padding="large" class="upload-card">
        <header class="card-heading"><div><h2>手动队列</h2><p>先添加文件，再统一提交。失败项与取消项均保留原始文件，可直接继续上传。</p></div><span>手动提交</span></header>
        <div class="queue-actions"><AppButton variant="secondary" size="small" @click="addExampleFile(false)">添加正常文件</AppButton><AppButton variant="secondary" size="small" @click="addExampleFile(true)">添加失败文件</AppButton><AppButton variant="secondary" size="small" @click="addCancellableFile">添加可取消文件</AppButton><AppButton size="small" :disabled="fileSummary.ready === 0 && fileSummary.recoverable === 0" @click="submitQueue">开始上传</AppButton></div>
        <AppUpload ref="uploadRef" v-model="files" accept=".txt" :auto-upload="false" :multiple="true" :limit="6" :request="uploadRequest" upload-text="选择资料文件" @success="handleSuccess" @error="handleError" @cancel="handleCancel" />
      </AppCard>

      <AppCard as="section" padding="large" class="summary-card">
        <header class="card-heading"><div><h2>队列概览</h2><p>可恢复项包括失败和主动取消的文件。</p></div><span>状态统计</span></header>
        <dl class="summary-list"><div><dt>等待上传</dt><dd>{{ fileSummary.ready }}</dd></div><div><dt>上传中</dt><dd>{{ fileSummary.uploading }}</dd></div><div><dt>可恢复</dt><dd>{{ fileSummary.recoverable }}</dd></div><div><dt>已完成</dt><dd>{{ fileSummary.completed }}</dd></div></dl>
        <div class="workflow-note"><strong>恢复边界</strong><p>组件会保留失败原因和原始文件引用，适合当前会话内重试；断点续传、分片与跨会话恢复应由后端上传协议提供。</p><AppTag label="请求由业务层注入" tone="blue" size="small" /></div>
      </AppCard>
    </section>

    <AppCard as="section" padding="large" class="resumable-card">
      <header class="card-heading"><div><h2>分片传输与断点续传</h2><p>文件被切成固定大小的分片，服务端会话返回已完成索引。暂停、网络中断或重新进入页面后，只会继续缺失的分片。</p></div><AppTag label="服务端会话" tone="blue" size="small" /></header>
      <AppAlert tone="info" title="分片状态" :description="resumableStatusMessage" />
      <div class="resumable-layout">
        <div class="resumable-main">
          <div class="queue-actions"><AppButton variant="secondary" size="small" :disabled="resumableFiles.length > 0" @click="addResumableFile">添加分片文件</AppButton><AppButton size="small" :disabled="resumableFiles[0]?.status !== 'ready' && resumableFiles[0]?.status !== 'error' && resumableFiles[0]?.status !== 'aborted'" @click="submitResumableUpload">开始上传</AppButton></div>
          <AppUpload ref="resumableUploadRef" v-model="resumableFiles" accept=".bin" :auto-upload="false" :multiple="false" :limit="1" :max-size="10 * 1024 * 1024" :chunk-service="chunkUploadService" :chunk-size="512 * 1024" :chunk-concurrency="1" :file-key="createResumableFileKey" upload-text="选择资料包" @success="handleResumableSuccess" @cancel="handleResumableCancel" @resume="handleResumableResume" @error="handleResumableError" />
        </div>
        <dl class="resumable-summary"><div><dt>已完成分片</dt><dd>{{ resumableSummary.uploadedChunks }}/{{ resumableSummary.totalChunks || "—" }}</dd></div><div><dt>当前进度</dt><dd>{{ resumableSummary.progress }}%</dd></div><div><dt>传输状态</dt><dd>{{ resumableSummary.status }}</dd></div></dl>
      </div>
    </AppCard>

    <AppCard as="section" padding="large" class="picture-upload-card">
      <header class="card-heading"><div><h2>图片图卡与预览</h2><p>图片类型可在文本、图片行和图卡间切换；点击缩略图只触发 preview 事件，预览器由业务页面统一接管。</p></div><AppButton variant="secondary" size="small" @click="addExampleCover">添加示例封面</AppButton></header>
      <AppUpload ref="pictureUploadRef" v-model="pictureFiles" accept="image/*" :auto-upload="false" list-type="picture-card" upload-text="选择课程封面" @preview="previewPicture" />
    </AppCard>
    <AppImageViewer v-model="isPictureViewerOpen" v-model:active-index="pictureViewerIndex" :items="pictureViewerItems" aria-label="上传图片预览" />
  </section>
</template>

<style scoped>
.upload-workflow-page { display: grid; align-content: start; gap: var(--aps-page-stack-gap); }.upload-workflow-intro { display: flex; align-items: end; justify-content: space-between; gap: 24px; }.upload-workflow-intro h1, .upload-workflow-intro p { margin: 0; }.upload-workflow-intro h1 { color: var(--aps-ink); font-size: var(--aps-text-2xl); font-weight: var(--aps-font-weight-heading); letter-spacing: -.035em; }.upload-workflow-intro p { max-width: 760px; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }.upload-workflow-grid { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(250px, .65fr); gap: var(--aps-page-stack-gap); align-items: start; }.upload-card, .summary-card, .resumable-card, .picture-upload-card { display: grid; align-content: start; gap: 22px; }.card-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }.card-heading h2, .card-heading p { margin: 0; }.card-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: var(--aps-font-weight-heading); }.card-heading p { margin-top: 7px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.card-heading > span { flex: 0 0 auto; padding: 4px 8px; border-radius: 6px; background: var(--aps-surface-soft); color: var(--aps-faint); font-size: var(--aps-text-xs); font-weight: var(--aps-font-weight-primary); }.queue-actions { display: flex; flex-wrap: wrap; gap: 10px; }.summary-list, .resumable-summary { display: grid; margin: 0; border-top: 1px solid var(--aps-line-soft); }.summary-list > div, .resumable-summary > div { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--aps-line-soft); }.summary-list dt, .resumable-summary dt { color: var(--aps-muted); font-size: var(--aps-text-sm); }.summary-list dd, .resumable-summary dd { margin: 0; color: var(--aps-ink); font-size: var(--aps-text-lg); font-variant-numeric: tabular-nums; font-weight: var(--aps-font-weight-heading); }.workflow-note { display: grid; gap: 7px; padding: 14px; border: 1px solid var(--aps-line-soft); border-radius: 11px; background: var(--aps-surface-soft); }.workflow-note strong { color: var(--aps-ink); font-size: var(--aps-text-sm); }.workflow-note p { margin: 0; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.resumable-layout { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(220px, .65fr); gap: 28px; align-items: start; }.resumable-main { display: grid; gap: 16px; }.resumable-summary { padding-top: 0; }@media (max-width: 900px) { .upload-workflow-grid, .resumable-layout { grid-template-columns: 1fr; }.upload-workflow-intro { align-items: flex-start; flex-direction: column; gap: 14px; }.upload-workflow-intro .app-button-control { width: 100%; } }@media (max-width: 560px) { .card-heading > span { display: none; }.queue-actions > .app-button-control { flex: 1 1 100%; } }
</style>
