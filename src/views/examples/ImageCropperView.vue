<script setup lang="ts">
import { computed, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppImageCropper, type CropResult } from "aps-design-pro";
import { AppCard } from "aps-design-pro";

interface AspectPreset {
  label: string;
  value: string;
}

const aspectPresets: AspectPreset[] = [
  { label: "方形", value: "1 / 1" },
  { label: "横向", value: "4 / 3" },
  { label: "宽屏", value: "16 / 9" },
];
const selectedAspect = ref("1 / 1");
const cropperKey = ref(0);
const sourceImage = ref(createSampleImage());
const croppedImage = ref("");
const cropStatus = ref("尚未导出");
const cropError = ref("");
const activeAspectLabel = computed(() => aspectPresets.find((item) => item.value === selectedAspect.value)?.label ?? "自定义比例");

/** 使用本地 SVG 示例图，保证案例导出不依赖跨域图片资源。 */
function createSampleImage(): string {
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1067" viewBox="0 0 1600 1067"><rect width="1600" height="1067" fill="#eff1f3"/><circle cx="1160" cy="344" r="278" fill="#1d1d1f"/><rect x="122" y="134" width="742" height="774" rx="56" fill="#ffffff"/><rect x="186" y="202" width="426" height="22" rx="11" fill="#1d1d1f"/><rect x="186" y="258" width="298" height="16" rx="8" fill="#a1a1a6"/><path d="M186 694c118-238 277-315 426-186 58 50 126 88 252 14v272H186V694Z" fill="#0071e3"/><circle cx="1050" cy="746" r="140" fill="#c7c7cc"/><path d="M1097 645h251v252h-251z" fill="#ffffff" opacity=".9"/><text x="186" y="372" fill="#1d1d1f" font-family="-apple-system, BlinkMacSystemFont, PingFang SC, sans-serif" font-size="62" font-weight="700">课程封面</text><text x="186" y="442" fill="#6e6e73" font-family="-apple-system, BlinkMacSystemFont, PingFang SC, sans-serif" font-size="30">统一裁剪与导出预览</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
}

function selectAspect(aspect: string): void {
  selectedAspect.value = aspect;
  cropStatus.value = `已切换为${aspectPresets.find((item) => item.value === aspect)?.label ?? "自定义"}比例`;
}

/** 导出结果只由组件事件交付，业务页可按 blob、尺寸或 data URL 接入不同的文件服务。 */
function handleCrop(result: CropResult): void {
  croppedImage.value = result.dataUrl;
  cropError.value = "";
  cropStatus.value = `已导出 ${result.width} × ${result.height}`;
}

function handleCropError(message: string): void {
  cropError.value = message;
  cropStatus.value = "导出失败";
}

function resetCropper(): void {
  sourceImage.value = createSampleImage();
  croppedImage.value = "";
  cropError.value = "";
  cropStatus.value = "已恢复默认构图";
  cropperKey.value += 1;
}
</script>

<template>
  <section class="image-cropper-page page-content page-stack" aria-label="图片裁剪组件案例">
    <header class="image-cropper-heading">
      <div><h1>图片裁剪</h1><p>预览与导出共用同一份源图几何；拖动、缩放和旋转后的构图会如实输出为业务可接收的图片结果。</p></div>
      <AppButton variant="secondary" leading-icon="refresh" @click="resetCropper">恢复示例</AppButton>
    </header>

    <div class="image-cropper-grid">
      <AppCard as="article" padding="large" class="cropper-card">
        <header class="cropper-card-heading"><div><h2>编辑构图</h2><p>拖动画面或使用方向键微调；缩放与旋转控制始终映射到导出的 Canvas 坐标。</p></div><span>{{ activeAspectLabel }}</span></header>
        <div class="aspect-controls" role="group" aria-label="裁剪比例">
          <AppButton v-for="preset in aspectPresets" :key="preset.value" size="small" :variant="selectedAspect === preset.value ? 'primary' : 'secondary'" :aria-pressed="selectedAspect === preset.value" @click="selectAspect(preset.value)">{{ preset.label }}</AppButton>
        </div>
        <AppImageCropper :key="cropperKey" v-model="sourceImage" data-testid="image-cropper" :aspect="selectedAspect" :output-width="960" @crop="handleCrop" @error="handleCropError" />
      </AppCard>

      <AppCard as="article" padding="large" class="cropper-card cropper-result-card">
        <header class="cropper-card-heading"><div><h2>导出结果</h2><p>页面接收 `blob`、`dataUrl`、宽度和高度后，再决定上传、保存草稿或替换封面。</p></div><span>{{ cropStatus }}</span></header>
        <div v-if="croppedImage" class="crop-result-preview"><img :src="croppedImage" :alt="`${activeAspectLabel}裁剪结果`" data-testid="crop-result-preview" /></div>
        <div v-else class="crop-result-empty"><strong>等待导出</strong><span>调整构图后点击“导出裁剪图”查看结果。</span></div>
        <p v-if="cropError" class="crop-result-error" role="alert">{{ cropError }}</p>
        <p class="crop-result-note">示例使用内置图片，确保浏览器能够安全地将 Canvas 导出为业务所需的图像数据。</p>
      </AppCard>
    </div>
  </section>
</template>

<style scoped>
.image-cropper-page { display: grid; min-height: 0; align-content: start; gap: var(--aps-page-stack-gap); }.image-cropper-heading { display: flex; align-items: end; justify-content: space-between; gap: 24px; }.image-cropper-heading h1, .image-cropper-heading p, .cropper-card-heading h2, .cropper-card-heading p, .crop-result-note { margin: 0; }.image-cropper-heading h1 { color: var(--aps-ink); font-size: var(--aps-text-2xl); font-weight: 740; letter-spacing: -.035em; }.image-cropper-heading p { max-width: 760px; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }.image-cropper-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--aps-page-stack-gap); }.cropper-card { display: grid; min-width: 0; align-content: start; gap: 20px; }.cropper-card-heading { display: flex; min-width: 0; align-items: start; justify-content: space-between; gap: 16px; }.cropper-card-heading > div { min-width: 0; }.cropper-card-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: 720; }.cropper-card-heading p { margin-top: 6px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.cropper-card-heading > span { flex: 0 0 auto; max-width: 145px; overflow: hidden; padding: 4px 8px; border-radius: 6px; background: var(--aps-surface-soft); color: var(--aps-faint); font-size: var(--aps-text-xs); font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }.aspect-controls { display: flex; flex-wrap: wrap; gap: 8px; }.cropper-result-card { grid-template-rows: auto minmax(260px, 1fr) auto; }.crop-result-preview, .crop-result-empty { display: grid; min-height: 260px; overflow: hidden; place-items: center; border: 1px solid var(--aps-line-soft); border-radius: 12px; background: var(--aps-surface-soft); }.crop-result-preview img { display: block; width: 100%; max-height: 480px; object-fit: contain; }.crop-result-empty { align-content: center; gap: 7px; padding: 24px; color: var(--aps-muted); text-align: center; }.crop-result-empty strong { color: var(--aps-ink); font-size: var(--aps-text-base); }.crop-result-empty span { max-width: 28ch; color: var(--aps-faint); font-size: var(--aps-text-sm); line-height: 1.55; }.crop-result-error { margin: 0; color: var(--aps-red); font-size: var(--aps-text-xs); }.crop-result-note { color: var(--aps-faint); font-size: var(--aps-text-xs); line-height: 1.6; }@media (max-width: 900px) { .image-cropper-grid { grid-template-columns: 1fr; }.image-cropper-heading { align-items: flex-start; flex-direction: column; gap: 14px; }.image-cropper-heading .app-button-control { width: 100%; } }@media (max-width: 560px) { .cropper-card-heading > span { display: none; }.cropper-result-card { grid-template-rows: auto auto auto; }.crop-result-preview, .crop-result-empty { min-height: 220px; } }
</style>
