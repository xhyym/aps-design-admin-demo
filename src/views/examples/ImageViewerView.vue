<script setup lang="ts">
import { computed, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppImage, AppImageViewer, type ImageViewerItem } from "aps-design-pro";
import { AppCard } from "aps-design-pro";

const isViewerOpen = ref(false);
const activeImageIndex = ref(0);
const actionStatus = ref("选择任意图片即可进入多图预览。");

const previewItems: ImageViewerItem[] = [
  { src: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=85", alt: "明亮的协作办公空间", title: "协作办公空间" },
  { src: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1800&q=85", alt: "现代会议空间", title: "会议空间" },
  { src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1800&q=85", alt: "桌面上的笔记本电脑", title: "产品工作台" },
  { src: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1800&q=85", alt: "开放式团队工位", title: "团队工位" },
];
const activeItemLabel = computed(() => previewItems[activeImageIndex.value]?.title ?? "未选择图片");

function openViewer(index: number): void {
  activeImageIndex.value = index;
  isViewerOpen.value = true;
  actionStatus.value = `已打开：${previewItems[index].title}。`;
}

function handleImageChange(index: number, item: ImageViewerItem): void {
  activeImageIndex.value = index;
  actionStatus.value = `当前查看：${item.title}。`;
}

function handleImageDownload(item: ImageViewerItem): void {
  actionStatus.value = `已请求下载：${item.title}。实际文件权限与下载策略由业务接口控制。`;
}
</script>

<template>
  <section class="image-viewer-page page-content page-stack" aria-label="图片预览器组件示例">
    <header class="image-viewer-heading"><div><h1>图片预览器</h1><p>面向相册、商品详情和内容资产库的多图浮层，统一处理切换、缩放、旋转、缩略图、键盘导航和焦点回收。</p></div><AppButton size="small" @click="openViewer(activeImageIndex)">预览当前图片</AppButton></header>

    <AppCard as="article" padding="large" class="image-viewer-card">
      <header class="image-viewer-card-heading"><div><h2>资源图片</h2><p>点击任意缩略图，从对应索引打开。预览器只发出下载事件，不直接假设资源拥有公开下载权限。</p></div><span>{{ activeItemLabel }}</span></header>
      <div class="image-viewer-grid"><button v-for="(item, index) in previewItems" :key="item.src" type="button" :aria-label="`预览${item.title}`" :class="{ 'is-active': activeImageIndex === index }" @click="openViewer(index)"><AppImage :src="item.src" :alt="item.alt" :preview="false" aspect-ratio="4 / 3" /><span>{{ item.title }}</span></button></div>
      <p class="image-viewer-status" aria-live="polite">{{ actionStatus }}</p>
    </AppCard>

    <AppImageViewer v-model="isViewerOpen" v-model:active-index="activeImageIndex" :items="previewItems" aria-label="办公空间资源预览" @change="handleImageChange" @download="handleImageDownload" @close="actionStatus = '预览器已关闭，焦点已回到触发控件。'" />
  </section>
</template>

<style scoped>
.image-viewer-page { display: grid; min-height: 0; align-content: start; gap: var(--aps-page-stack-gap); }.image-viewer-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; }.image-viewer-heading h1, .image-viewer-heading p, .image-viewer-card-heading h2, .image-viewer-card-heading p { margin: 0; }.image-viewer-heading h1 { color: var(--aps-ink); font-size: var(--aps-text-2xl); font-weight: 740; letter-spacing: -.035em; }.image-viewer-heading p { max-width: 760px; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }.image-viewer-card { display: grid; gap: 22px; }.image-viewer-card-heading { display: flex; align-items: start; justify-content: space-between; gap: 16px; }.image-viewer-card-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: 720; }.image-viewer-card-heading p { max-width: 720px; margin-top: 6px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.image-viewer-card-heading > span { flex: 0 0 auto; color: var(--aps-faint); font-size: var(--aps-text-xs); font-weight: 650; }.image-viewer-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }.image-viewer-grid > button { display: grid; min-width: 0; gap: 8px; padding: 0; border: 1px solid transparent; border-radius: 12px; background: transparent; color: var(--aps-muted); text-align: left; }.image-viewer-grid > button:hover, .image-viewer-grid > button.is-active { color: var(--aps-blue); }.image-viewer-grid > button.is-active :deep(.app-image) { outline: 2px solid var(--aps-blue); outline-offset: 2px; }.image-viewer-grid > button:focus-visible { outline: 2px solid var(--aps-blue); outline-offset: 3px; }.image-viewer-grid :deep(.app-image) { min-height: 132px; border-radius: 10px; }.image-viewer-grid > button > span { overflow: hidden; padding-inline: 2px; font-size: var(--aps-text-sm); font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }.image-viewer-status { min-height: 20px; margin: 0; color: var(--aps-faint); font-size: var(--aps-text-xs); line-height: 1.5; }@media (max-width: 900px) { .image-viewer-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }.image-viewer-heading { align-items: start; }@media (max-width: 600px) { .image-viewer-heading { flex-direction: column; }.image-viewer-heading .app-button-control { width: 100%; }.image-viewer-card-heading > span { display: none; } }
</style>
