<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppLoading } from "aps-design-pro";
import { AppCard } from "aps-design-pro";

const isSectionLoading = ref(false);
const isFullscreenLoading = ref(false);
let fullscreenTimer: number | undefined;

/** 局部状态由业务显式开始与结束，AppLoading 本身不持有请求生命周期。 */
function toggleSectionLoading(): void {
  isSectionLoading.value = !isSectionLoading.value;
}

function clearFullscreenTimer(): void {
  if (fullscreenTimer === undefined) return;
  window.clearTimeout(fullscreenTimer);
  fullscreenTimer = undefined;
}

function startFullscreenLoading(): void {
  clearFullscreenTimer();
  isFullscreenLoading.value = true;
  fullscreenTimer = window.setTimeout(() => {
    isFullscreenLoading.value = false;
    fullscreenTimer = undefined;
  }, 4000);
}

onBeforeUnmount(clearFullscreenTimer);

</script>

<template>
  <section class="loading-overlay-view page-content page-stack">
    <AppCard as="section">
      <header class="showcase-heading"><div><h2>局部加载</h2><p>将加载状态限定在内容容器内，不阻塞页面其余操作；常用于表格、详情卡片和异步分段提交。</p></div><AppButton :variant="isSectionLoading ? 'secondary' : 'primary'" size="small" @click="toggleSectionLoading">{{ isSectionLoading ? "停止加载" : "启动加载" }}</AppButton></header>
      <AppLoading :loading="isSectionLoading" text="正在同步项目动态" aria-label="正在同步项目动态">
        <div class="activity-preview"><article><span class="activity-dot is-blue" /><div><strong>需求评审已完成</strong><p>负责人已补充验收说明，等待下一步排期。</p></div><time>10:42</time></article><article><span class="activity-dot is-green" /><div><strong>接口联调通过</strong><p>数据口径已同步到交付工作台。</p></div><time>昨天</time></article><article><span class="activity-dot is-neutral" /><div><strong>月度复盘待确认</strong><p>请在本周五前补充本阶段风险项。</p></div><time>周一</time></article></div>
      </AppLoading>
    </AppCard>

    <AppCard as="section">
      <header class="showcase-heading"><div><h2>全屏加载</h2><p>仅在阻塞整个工作流的操作中使用；全屏遮罩由组件配置层统一控制层级，避免覆盖对话框和提示。</p></div><AppButton variant="secondary" size="small" @click="startFullscreenLoading">演示全屏加载</AppButton></header>
      <p class="fullscreen-note">点击后将短暂展示全屏加载层，页面状态由外部业务逻辑控制。</p>
      <AppLoading :loading="isFullscreenLoading" fullscreen text="正在更新工作区设置" aria-label="正在更新工作区设置" />
    </AppCard>
  </section>
</template>

<style scoped>
.loading-overlay-view { max-width: 1040px; }.showcase-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 22px; }.showcase-heading h2, .showcase-heading p { margin: 0; }.showcase-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: 720; letter-spacing: -.02em; }.showcase-heading p { max-width: 68ch; margin-top: 7px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.activity-preview { display: grid; border-top: 1px solid var(--aps-line-soft); }.activity-preview article { display: grid; min-height: 74px; grid-template-columns: 10px minmax(0, 1fr) auto; align-items: center; gap: 12px; border-bottom: 1px solid var(--aps-line-soft); }.activity-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--aps-faint); }.activity-dot.is-blue { background: var(--aps-blue); }.activity-dot.is-green { background: var(--aps-green); }.activity-dot.is-neutral { background: var(--aps-faint); }.activity-preview strong, .activity-preview p { display: block; margin: 0; }.activity-preview strong { overflow: hidden; color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: 680; text-overflow: ellipsis; white-space: nowrap; }.activity-preview p { margin-top: 4px; color: var(--aps-muted); font-size: var(--aps-text-xs); }.activity-preview time { color: var(--aps-faint); font-size: var(--aps-text-xs); }.fullscreen-note { margin: 0; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }@media (max-width: 620px) { .showcase-heading { flex-direction: column; }.activity-preview article { grid-template-columns: 10px minmax(0, 1fr); }.activity-preview time { grid-column: 2; margin-top: -12px; } }
</style>
