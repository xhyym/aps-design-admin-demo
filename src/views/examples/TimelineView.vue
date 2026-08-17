<script setup lang="ts">
import { computed, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppTag } from "aps-design-pro";
import { AppSegmented } from "aps-design-pro";
import { AppTimeline } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import type { SelectOption, TimelineItem, TimelineMode } from "aps-design-pro";

const auditItems: TimelineItem[] = [
  { key: "release", title: "版本发布已创建", description: "已锁定发布内容，并完成发布窗口校验。", timestamp: "今天 10:08", state: "success" },
  { key: "review", title: "变更审核通过", description: "2 位负责人已确认本次发布范围。", timestamp: "今天 10:16", state: "success" },
  { key: "deploy", title: "正在向灰度环境部署", description: "当前进度 64%，健康检查持续通过。", timestamp: "今天 10:24", state: "processing" },
];

const historyItems: TimelineItem[] = [
  { key: "access", title: "访问策略已更新", description: "权限组“课程运营”新增内容编辑范围。", timestamp: "08-02 09:42", state: "success" },
  { key: "warning", title: "同步任务出现延迟", description: "已自动切换到备用队列，未影响前台数据。", timestamp: "08-02 09:11", state: "warning" },
  { key: "recover", title: "备用队列处理完成", description: "滞后任务已回补，服务指标恢复正常。", timestamp: "08-02 09:18", state: "success" },
  { key: "audit", title: "异常访问被拦截", description: "来源 IP 已进入安全审计队列。", timestamp: "08-02 08:47", state: "error" },
];

const modeOptions: SelectOption[] = [
  { label: "单侧", value: "left" },
  { label: "交替", value: "alternate" },
];
const selectedMode = ref<TimelineMode>("alternate");
const isReversed = ref(false);
const showEmpty = ref(false);
const latestAction = computed(() => `${selectedMode.value === "alternate" ? "交替" : "单侧"}布局 · ${isReversed.value ? "按时间反序" : "原始顺序"}`);

function resetTimelineDemo(): void {
  selectedMode.value = "alternate";
  isReversed.value = false;
  showEmpty.value = false;
}
</script>

<template>
  <section class="timeline-page page-content page-stack" aria-label="时间线组件示例">
    <header class="timeline-page-heading">
      <div>
        <h1>时间线</h1>
        <p>把订单、审批、部署与审计记录统一为可读的时间序列；展示顺序与状态由业务页传入，组件只维护结构、语义和视觉反馈。</p>
      </div>
      <AppButton variant="secondary" leading-icon="refresh" @click="resetTimelineDemo">恢复示例</AppButton>
    </header>

    <div class="timeline-demo-grid">
      <AppCard as="article" padding="large" class="timeline-demo-card">
        <header class="demo-card-heading"><div><h2>状态与等待节点</h2><p>成功、进行中、告警和失败共用稳定的标记逻辑；未完成的后续任务使用等待节点表达。</p></div><span>业务流水</span></header>
        <AppTimeline :items="auditItems" current-key="deploy" pending pending-text="等待灰度环境完成后继续发布" aria-label="版本发布动态" />
      </AppCard>

      <AppCard as="article" padding="large" class="timeline-demo-card">
        <header class="demo-card-heading"><div><h2>布局与顺序</h2><p>交替布局适合审计记录和较长时间轴；小屏会自动回退为单侧可读布局。</p></div><span>{{ latestAction }}</span></header>
        <div class="timeline-controls"><AppSegmented v-model="selectedMode" :options="modeOptions" size="small" aria-label="时间线布局" /><AppButton variant="ghost" size="small" @click="isReversed = !isReversed">{{ isReversed ? "恢复顺序" : "按时间反序" }}</AppButton></div>
        <AppTimeline :items="historyItems" :mode="selectedMode" :reverse="isReversed" aria-label="工作区审计记录" />
      </AppCard>
    </div>

    <AppCard as="article" padding="large" class="timeline-demo-card timeline-slot-card">
      <header class="demo-card-heading"><div><h2>业务插槽与空数据</h2><p>默认结构足够用于常规记录；需要补充负责人、状态标签或自定义摘要时，只替换内容区域，不复制时间线骨架。</p></div><span>可扩展内容</span></header>
      <div class="timeline-slot-layout">
        <AppTimeline :items="historyItems.slice(0, 3)" timestamp-placement="top" aria-label="带业务摘要的时间线">
          <template #item="{ item, index }">
            <div class="timeline-custom-content"><div><strong>{{ item.title }}</strong><p>{{ item.description }}</p></div><AppTag :label="index === 0 ? '系统任务' : '已记录'" :tone="index === 0 ? 'blue' : 'neutral'" size="small" /></div>
          </template>
        </AppTimeline>
        <section class="empty-demo" aria-label="时间线空数据示例"><div><strong>空数据状态</strong><p>请求成功但没有记录时，组件保留语义化反馈，不渲染空白区域。</p></div><AppButton variant="secondary" size="small" @click="showEmpty = !showEmpty">{{ showEmpty ? "显示记录" : "显示空数据" }}</AppButton><AppTimeline v-if="showEmpty" :items="[]" empty-text="当前筛选条件下没有可展示的审计记录。" aria-label="空数据时间线" /></section>
      </div>
    </AppCard>
  </section>
</template>

<style scoped>
.timeline-page { display: grid; min-height: 0; align-content: start; gap: var(--aps-page-stack-gap); }.timeline-page-heading { display: flex; align-items: end; justify-content: space-between; gap: 24px; }.timeline-page-heading h1, .timeline-page-heading p { margin: 0; }.timeline-page-heading h1 { color: var(--aps-ink); font-size: var(--aps-text-2xl); font-weight: var(--aps-font-weight-heading); letter-spacing: -.035em; }.timeline-page-heading p { max-width: 730px; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }.timeline-demo-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--aps-page-stack-gap); }.timeline-demo-card { display: grid; align-content: start; gap: 22px; }.demo-card-heading { display: flex; align-items: start; justify-content: space-between; gap: 14px; }.demo-card-heading h2, .demo-card-heading p { margin: 0; }.demo-card-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: var(--aps-font-weight-heading); }.demo-card-heading p { margin-top: 6px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.demo-card-heading > span { flex: 0 0 auto; max-width: 168px; overflow: hidden; padding: 4px 8px; border-radius: 6px; background: var(--aps-surface-soft); color: var(--aps-faint); font-size: var(--aps-text-xs); font-weight: var(--aps-font-weight-primary); text-overflow: ellipsis; white-space: nowrap; }.timeline-controls { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 4px; border-bottom: 1px solid var(--aps-line-soft); }.timeline-slot-layout { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(250px, .75fr); gap: 30px; }.timeline-custom-content { display: flex; min-width: 0; align-items: start; justify-content: space-between; gap: 12px; }.timeline-custom-content > div { min-width: 0; }.timeline-custom-content strong, .timeline-custom-content p { display: block; margin: 0; }.timeline-custom-content strong { overflow: hidden; color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: var(--aps-font-weight-strong); text-overflow: ellipsis; white-space: nowrap; }.timeline-custom-content p { margin-top: 4px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.55; }.timeline-custom-content :deep(.app-tag) { flex: 0 0 auto; margin-top: 1px; }.empty-demo { display: grid; align-content: start; gap: 14px; padding-left: 28px; border-left: 1px solid var(--aps-line-soft); }.empty-demo > div { display: grid; gap: 5px; }.empty-demo strong { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: var(--aps-font-weight-strong); }.empty-demo p { margin: 0; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.empty-demo :deep(.app-timeline) { margin-top: 2px; }@media (max-width: 900px) { .timeline-demo-grid, .timeline-slot-layout { grid-template-columns: 1fr; }.empty-demo { padding-top: 22px; padding-left: 0; border-top: 1px solid var(--aps-line-soft); border-left: 0; } }@media (max-width: 640px) { .timeline-page-heading { align-items: start; flex-direction: column; gap: 14px; }.timeline-page-heading .app-button-control { width: 100%; }.demo-card-heading > span { display: none; }.timeline-controls { align-items: start; flex-direction: column; }.timeline-controls .app-segmented, .timeline-controls .app-button-control { width: 100%; }.timeline-controls .app-segmented { justify-content: stretch; }.timeline-controls :deep(.app-segmented > button) { flex: 1; } }
</style>
