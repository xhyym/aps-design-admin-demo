<script setup lang="ts">
import { computed, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppCheckbox } from "aps-design-pro";
import { AppProgress, type ProgressStatus } from "aps-design-pro";
import { AppCard } from "aps-design-pro";

const lineProgress = ref(64);
const circleProgress = ref(72);
const isStriped = ref(true);
const isIndeterminate = ref(false);
const actionStatus = ref("可调整进度，或切换不确定态查看加载中的边界表现。");
const estimatedMinutes = computed(() => Math.max(0, Math.ceil((100 - lineProgress.value) / 9)));

function updateLineProgress(delta: number): void {
  lineProgress.value = Math.min(100, Math.max(0, lineProgress.value + delta));
  actionStatus.value = `同步进度已调整为 ${lineProgress.value}%。`;
}

function resetProgress(): void {
  lineProgress.value = 64;
  circleProgress.value = 72;
  isStriped.value = true;
  isIndeterminate.value = false;
  actionStatus.value = "已恢复默认进度状态。";
}

function formatTransferProgress(percentage: number): string {
  return `${Math.round(percentage)}% · 约 ${estimatedMinutes.value} 分钟`;
}
</script>

<template>
  <section class="progress-view page-content page-stack" aria-label="进度条组件示例">
    <header class="progress-view-heading"><div><h1>进度条</h1><p>线性、圆形和仪表盘进度共享状态、格式化与无障碍语义；业务页只需传递当前数值或不确定态。</p></div><AppButton variant="secondary" size="small" leading-icon="refresh" @click="resetProgress">恢复示例</AppButton></header>

    <div class="progress-demo-grid">
      <AppCard as="article" padding="large" class="progress-demo-card">
        <header class="progress-card-heading"><div><h2>线性进度与加载态</h2><p>支持自定义格式、内嵌文本、条纹流动和请求尚未返回精确数值时的不确定态。</p></div></header>
        <div class="progress-controls"><AppButton size="small" variant="secondary" @click="updateLineProgress(-8)">减少 8%</AppButton><AppButton size="small" @click="updateLineProgress(8)">增加 8%</AppButton><AppCheckbox v-model="isStriped" label="条纹流动" /><AppCheckbox v-model="isIndeterminate" label="不确定态" /></div>
        <AppProgress :percentage="lineProgress" label="资源同步" :striped="isStriped" :striped-flow="isStriped && !isIndeterminate" :indeterminate="isIndeterminate" :format="formatTransferProgress" aria-label="资源同步进度" />
        <AppProgress :percentage="lineProgress" text-inside :show-text="true" color="#0071e3" aria-label="内嵌文字进度" />
      </AppCard>

      <AppCard as="article" padding="large" class="progress-demo-card">
        <header class="progress-card-heading"><div><h2>圆形与仪表盘</h2><p>适合卡片指标、任务达成率与配额用量；状态色可传递完成、风险或异常语义。</p></div></header>
        <div class="circle-progress-row"><div><AppProgress :percentage="circleProgress" type="circle" :width="132" aria-label="课程完成度" /><span>课程完成度</span></div><div><AppProgress :percentage="86" type="dashboard" status="success" :width="132" aria-label="服务健康度" /><span>服务健康度</span></div><div><AppProgress :percentage="34" type="circle" status="warning" :width="132" aria-label="存储配额" /><span>存储配额</span></div></div>
        <div class="progress-controls"><AppButton size="small" variant="secondary" @click="circleProgress = Math.max(0, circleProgress - 10)">降低完成度</AppButton><AppButton size="small" @click="circleProgress = Math.min(100, circleProgress + 10)">提高完成度</AppButton></div>
      </AppCard>
    </div>

    <AppCard as="article" padding="large" class="progress-state-card"><header class="progress-card-heading"><div><h2>状态色与边界值</h2><p>百分比会收敛到 0–100；颜色、文本和圆形中心状态由同一组件输出。</p></div></header><div class="state-progress-row"><AppProgress v-for="item in ([{ status: 'normal', value: 18, label: '待开始' }, { status: 'success', value: 100, label: '已完成' }, { status: 'warning', value: 48, label: '需关注' }, { status: 'error', value: 76, label: '失败重试' }] as Array<{ status: ProgressStatus; value: number; label: string }>)" :key="item.status" :percentage="item.value" :status="item.status" :label="item.label" /></div><p class="progress-status" aria-live="polite">{{ actionStatus }}</p></AppCard>
  </section>
</template>

<style scoped>
.progress-view { display: grid; min-height: 0; align-content: start; gap: var(--aps-page-stack-gap); }.progress-view-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; }.progress-view-heading h1, .progress-view-heading p, .progress-card-heading h2, .progress-card-heading p { margin: 0; }.progress-view-heading h1 { color: var(--aps-ink); font-size: var(--aps-text-2xl); font-weight: var(--aps-font-weight-heading); letter-spacing: -.035em; }.progress-view-heading p { max-width: 760px; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }.progress-demo-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--aps-page-stack-gap); }.progress-demo-card, .progress-state-card { display: grid; align-content: start; gap: 22px; }.progress-card-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: var(--aps-font-weight-heading); }.progress-card-heading p { margin-top: 6px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.progress-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; }.progress-demo-card :deep(.app-progress) { min-width: 0; }.circle-progress-row { display: flex; flex-wrap: wrap; justify-content: space-around; gap: 22px; }.circle-progress-row > div { display: grid; justify-items: center; gap: 9px; color: var(--aps-muted); font-size: var(--aps-text-sm); font-weight: var(--aps-font-weight-primary); }.state-progress-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; }.progress-status { min-height: 20px; margin: 0; color: var(--aps-faint); font-size: var(--aps-text-xs); }@media (max-width: 900px) { .progress-demo-grid { grid-template-columns: 1fr; }.state-progress-row { grid-template-columns: repeat(2, minmax(0, 1fr)); } }.progress-view-heading { align-items: start; }@media (max-width: 600px) { .progress-view-heading { flex-direction: column; }.circle-progress-row { justify-content: flex-start; }.state-progress-row { grid-template-columns: 1fr; } }
</style>
