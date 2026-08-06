<script setup lang="ts">
import { ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import { AppCollapse, type CollapseItem } from "aps-design-pro";

const expandedKeys = ref<string[]>(["overview"]);
const accordionKey = ref<string>("service");
const latestAction = ref("已展开产品概览");

const items: CollapseItem[] = [
  { key: "overview", title: "产品概览", description: "将复杂信息拆成可逐层阅读的内容块，默认只保留最重要的摘要。" },
  { key: "permission", title: "权限说明", description: "折叠面板可以放入权限提示、字段解释和长文本，不改变页面的主结构。" },
  { key: "disabled", title: "暂不可用的配置", description: "禁用项保留信息层级，但不会参与键盘和鼠标交互。", disabled: true },
];

const accordionItems: CollapseItem[] = [
  { key: "service", title: "服务状态", content: "当前工作区服务运行正常，最近一次同步在 2 分钟前完成。" },
  { key: "security", title: "安全策略", content: "登录策略、会话时长和二次验证可以放在同一组互斥内容中。" },
  { key: "billing", title: "计费周期", content: "计费周期支持月度和年度配置，切换面板时会自动收起上一个面板。" },
];

function resetCollapse(): void {
  expandedKeys.value = ["overview"];
  accordionKey.value = "service";
  latestAction.value = "已恢复默认展开项";
}

function recordAction(value: string[] | string): void {
  const keys = Array.isArray(value) ? value : value ? [value] : [];
  latestAction.value = keys.length ? `当前展开：${keys.join("、")}` : "当前没有展开项";
}
</script>

<template>
  <section class="collapse-page page-content page-stack" aria-label="折叠面板组件示例">
    <header class="collapse-page-heading">
      <div>
        <h1>折叠面板</h1>
        <p>用于说明、详情和配置分组；支持多面板同时展开，也支持手风琴模式保持内容聚焦。</p>
      </div>
      <AppButton variant="secondary" leading-icon="refresh" @click="resetCollapse">恢复示例</AppButton>
    </header>

    <div class="collapse-demo-grid">
      <AppCard as="article" padding="large" class="collapse-demo-card">
        <header class="demo-card-heading"><div><h2>多面板模式</h2><p>可同时展开多个内容块，禁用项保留状态提示。</p></div><span>多选展开</span></header>
        <AppCollapse v-model="expandedKeys" :items="items" aria-label="多面板内容" @change="recordAction">
          <template #item-permission><p>权限说明支持放置任意业务插槽内容，例如链接、标签或操作按钮。</p><a href="#permission" @click.prevent="latestAction = '已查看权限文档'">查看权限文档</a></template>
        </AppCollapse>
        <output class="collapse-status" aria-live="polite">{{ latestAction }}</output>
      </AppCard>

      <AppCard as="article" padding="large" class="collapse-demo-card">
        <header class="demo-card-heading"><div><h2>手风琴模式</h2><p>同一时间只保留一个展开项，适合步骤说明和互斥配置。</p></div><span>单项展开</span></header>
        <AppCollapse v-model="accordionKey" :items="accordionItems" accordion aria-label="手风琴内容" @change="recordAction" />
        <p class="collapse-note">`v-model` 可以绑定字符串（手风琴）或字符串数组（多面板），业务层无需维护内部动画状态。</p>
      </AppCard>
    </div>
  </section>
</template>

<style scoped>
.collapse-page { display: grid; min-height: 0; align-content: start; gap: var(--aps-page-stack-gap); }.collapse-page-heading { display: flex; align-items: end; justify-content: space-between; gap: 24px; }.collapse-page-heading h1, .collapse-page-heading p { margin: 0; }.collapse-page-heading h1 { color: var(--aps-ink); font-size: var(--aps-text-2xl); font-weight: 740; letter-spacing: -.035em; }.collapse-page-heading p { max-width: 720px; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }.collapse-demo-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--aps-page-stack-gap); }.collapse-demo-card { display: grid; align-content: start; gap: 22px; }.demo-card-heading { display: flex; align-items: start; justify-content: space-between; gap: 14px; }.demo-card-heading h2, .demo-card-heading p { margin: 0; }.demo-card-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: 720; }.demo-card-heading p { margin-top: 6px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.demo-card-heading span { flex: 0 0 auto; padding: 4px 8px; border-radius: 6px; background: var(--aps-surface-soft); color: var(--aps-faint); font-size: var(--aps-text-xs); font-weight: 650; }.collapse-demo-card :deep(.collapse-panel-inner a) { display: inline-block; margin-top: 8px; color: var(--aps-blue); }.collapse-status { padding-top: 14px; border-top: 1px solid var(--aps-line-soft); color: var(--aps-muted); font-size: var(--aps-text-sm); }.collapse-note { margin: 0; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }@media (max-width: 820px) { .collapse-page-heading { align-items: start; flex-direction: column; gap: 14px; }.collapse-page-heading .app-button-control { width: 100%; }.collapse-demo-grid { grid-template-columns: 1fr; } }@media (max-width: 420px) { .demo-card-heading span { display: none; } }
</style>
