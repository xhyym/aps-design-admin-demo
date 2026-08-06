<script setup lang="ts">
import { computed, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppTag } from "aps-design-pro";
import { AppCol, AppRow, AppCard } from "aps-design-pro";
import { AppSegmented } from "aps-design-pro";
import type { SelectOption } from "aps-design-pro";

const gutterPreset = ref("20");
const gutterOptions: SelectOption[] = [
  { label: "无间距", value: "0" },
  { label: "12 px", value: "12" },
  { label: "20 px", value: "20" },
  { label: "32 px", value: "32" },
];
const gutter = computed(() => Number(gutterPreset.value));

/** 恢复默认间距，用于直观验收行列的横向与纵向间隔同步变化。 */
function resetGutter(): void {
  gutterPreset.value = "20";
}
</script>

<template>
  <section class="layout-grid-page page-content page-stack" aria-label="栅格布局组件示例">
    <header class="layout-grid-heading">
      <div>
        <h1>栅格布局</h1>
        <p>行列组件提供 24 栅格、响应式断点、偏移与统一间距，复杂筛选、动态表单和内容区可复用同一套布局规则。</p>
      </div>
      <AppTag label="响应式布局" tone="blue" />
    </header>

    <AppCard as="article" padding="large" class="layout-card">
      <header class="layout-card-heading"><div><h2>间距与断点</h2><p>切换间距后，横向列内边距与纵向行距同时更新；缩小视口时，列按 xs、sm、lg 配置自动重排。</p></div><span>{{ gutter }} px</span></header>
      <div class="layout-grid-controls">
        <AppSegmented v-model="gutterPreset" :options="gutterOptions" aria-label="栅格间距" data-testid="grid-gutter-control" />
        <AppButton size="small" variant="secondary" leading-icon="refresh" @click="resetGutter">恢复默认</AppButton>
      </div>
      <AppRow :gutter="[gutter, gutter]" aria-label="响应式三列示例" data-testid="responsive-grid-row">
        <AppCol :xs="24" :sm="12" :lg="8"><article class="grid-demo-cell"><strong>内容概览</strong><span>xs: 24 / sm: 12 / lg: 8</span></article></AppCol>
        <AppCol :xs="24" :sm="12" :lg="8"><article class="grid-demo-cell"><strong>待处理事项</strong><span>xs: 24 / sm: 12 / lg: 8</span></article></AppCol>
        <AppCol :xs="24" :sm="24" :lg="8"><article class="grid-demo-cell"><strong>最近活动</strong><span>xs: 24 / sm: 24 / lg: 8</span></article></AppCol>
        <AppCol :xs="24" :md="16"><article class="grid-demo-cell is-wide"><strong>主工作区</strong><span>移动端完整宽度，桌面端占 16 / 24。</span></article></AppCol>
        <AppCol :xs="24" :md="8"><article class="grid-demo-cell"><strong>辅助信息</strong><span>与主工作区在 md 断点并排。</span></article></AppCol>
      </AppRow>
      <output class="grid-value" aria-live="polite" data-testid="grid-gutter-value">当前栅格间距：{{ gutter }} px</output>
    </AppCard>

    <AppCard as="article" padding="large" class="layout-card">
      <header class="layout-card-heading"><div><h2>列偏移</h2><p>偏移只作用于当前断点；小屏保持完整宽度，内容不会因为桌面端留白而挤压或溢出。</p></div><span>md 偏移</span></header>
      <AppRow :gutter="gutter" aria-label="列偏移示例">
        <AppCol :xs="24" :md="{ span: 18, offset: 3 }"><article class="grid-demo-cell is-centered"><strong>居中的审批摘要</strong><span>xs: 24；md: span 18，offset 3。</span></article></AppCol>
      </AppRow>
    </AppCard>
  </section>
</template>

<style scoped>
.layout-grid-page { display: grid; min-height: 0; align-content: start; gap: var(--aps-page-stack-gap); }.layout-grid-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; }.layout-grid-heading h1, .layout-grid-heading p, .layout-card-heading h2, .layout-card-heading p { margin: 0; }.layout-grid-heading h1 { color: var(--aps-ink); font-size: var(--aps-text-2xl); font-weight: 740; letter-spacing: -.035em; }.layout-grid-heading p { max-width: 780px; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }.layout-card { display: grid; min-width: 0; gap: 20px; }.layout-card-heading { display: flex; min-width: 0; align-items: start; justify-content: space-between; gap: 16px; }.layout-card-heading > div { min-width: 0; }.layout-card-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: 720; }.layout-card-heading p { max-width: 720px; margin-top: 6px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.layout-card-heading > span { flex: 0 0 auto; padding: 4px 8px; border-radius: 6px; background: var(--aps-surface-soft); color: var(--aps-faint); font-size: var(--aps-text-xs); font-weight: 650; white-space: nowrap; }.layout-grid-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }.grid-demo-cell { display: grid; min-height: 112px; align-content: center; gap: 6px; padding: 18px; border: 1px solid var(--aps-line-soft); border-radius: 12px; background: var(--aps-surface-soft); }.grid-demo-cell.is-wide { background: var(--aps-blue-soft); }.grid-demo-cell.is-centered { min-height: 98px; background: var(--aps-surface); border-color: var(--aps-line); text-align: center; }.grid-demo-cell strong { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: 700; }.grid-demo-cell span { color: var(--aps-faint); font-size: var(--aps-text-xs); line-height: 1.55; }.grid-value { display: block; min-height: 20px; padding-top: 2px; color: var(--aps-muted); font-size: var(--aps-text-sm); }@media (max-width: 640px) { .layout-grid-heading { align-items: start; flex-direction: column; }.layout-card-heading > span { display: none; }.layout-grid-controls :deep(.app-segmented) { max-width: 100%; overflow-x: auto; } }
</style>
