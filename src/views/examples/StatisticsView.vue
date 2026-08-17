<script setup lang="ts">
import { computed, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppCountdown, AppStatistic, type StatisticFormatter } from "aps-design-pro";
import { AppSegmented } from "aps-design-pro";
import { AppSwitch } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import type { SelectOption } from "aps-design-pro";

const selectedPrecision = ref("2");
const useGroupSeparator = ref(true);
const countdownAt = ref(Date.now() + 3 * 60 * 60 * 1000);
const countdownNotice = ref("当前示例正在等待课程资源授权确认。");
const standaloneCountdownAt = ref(Date.now() + 90_000);
const standaloneCountdownNotice = ref("倒计时会在结束后主动释放刷新定时器。");

const precisionOptions: SelectOption[] = [
  { label: "整数", value: "0" },
  { label: "两位", value: "2" },
  { label: "四位", value: "4" },
];
const resolvedPrecision = computed(() => Number.parseInt(selectedPrecision.value, 10));
const groupSeparator = computed(() => useGroupSeparator.value ? "," : "");
const capacityFormatter: StatisticFormatter = (value) => `${value} GB`;

function startShortCountdown(): void {
  countdownAt.value = Date.now() + 5_200;
  countdownNotice.value = "已启动 5 秒倒计时，用于验收完成事件。";
}

function restartStandaloneCountdown(): void {
  standaloneCountdownAt.value = Date.now() + 12_000;
  standaloneCountdownNotice.value = "已重新开始 12 秒倒计时。";
}

function handleCountdownFinish(): void {
  countdownNotice.value = "授权确认窗口已结束，请重新发起新的确认流程。";
}

function handleStandaloneCountdownFinish(): void {
  standaloneCountdownNotice.value = "独立倒计时已结束，可通过右侧操作重新开始。";
}
</script>

<template>
  <section class="statistics-view page-content page-stack" aria-label="统计指标组件示例">
    <AppCard as="section">
      <header class="showcase-heading">
        <div><h2>数值格式</h2><p>金额、比例和资源容量统一通过统计组件展示，业务页不再分别处理精度与千分位。</p></div>
        <div class="format-controls">
          <AppSegmented v-model="selectedPrecision" :options="precisionOptions" size="small" aria-label="选择指标精度" />
          <AppSwitch v-model="useGroupSeparator" label="千分位" size="small" />
        </div>
      </header>
      <div class="statistic-grid">
        <AppStatistic label="本月课程营收" :value="248630.7" :precision="resolvedPrecision" :group-separator="groupSeparator" prefix="¥" detail="已确认到账金额" status="较上月增长 12.4%" tone="success" icon="chart" />
        <AppStatistic label="内容审核通过率" :value="96.28" :precision="resolvedPrecision" suffix="%" detail="近 30 天审核结果" status="运行正常" tone="info" icon="check" />
        <AppStatistic label="可用资源容量" :value="128" :formatter="capacityFormatter" detail="当前工作区分配额度" status="剩余 43 GB" tone="neutral" icon="grid" />
      </div>
    </AppCard>

    <AppCard as="section">
      <header class="showcase-heading">
        <div><h2>倒计时</h2><p>倒计时由指标组件维护刷新与资源释放；结束时只向业务页抛出完成事件。</p></div>
        <AppButton variant="secondary" size="small" leading-icon="refresh" @click="startShortCountdown">演示 5 秒完成</AppButton>
      </header>
      <div class="countdown-layout">
        <AppStatistic label="授权确认窗口" :value="0" :countdown-at="countdownAt" countdown-format="HH:mm:ss" detail="课程资源的本轮授权确认截止时间" :status="countdownNotice" tone="warning" icon="clock" @finish="handleCountdownFinish" />
        <div class="countdown-note"><strong>完成后的业务处理</strong><p>{{ countdownNotice }}</p><span>点击按钮可重新开始短倒计时，结束后状态会立即变化。</span></div>
      </div>
      <section class="standalone-countdown" aria-label="独立倒计时组件示例">
        <div><strong>独立倒计时</strong><p>不依赖统计卡片，可直接嵌入审批、支付、预约或任务流程。</p></div>
        <AppCountdown :value="standaloneCountdownAt" format="mm:ss" aria-label="课程确认倒计时" @finish="handleStandaloneCountdownFinish" />
        <div class="standalone-countdown-action"><span>{{ standaloneCountdownNotice }}</span><AppButton variant="secondary" size="small" leading-icon="refresh" @click="restartStandaloneCountdown">重新开始</AppButton></div>
      </section>
    </AppCard>
  </section>
</template>

<style scoped>
.statistics-view { max-width: 1180px; }.showcase-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 22px; }.showcase-heading h2, .showcase-heading p { margin: 0; }.showcase-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: var(--aps-font-weight-heading); letter-spacing: -.02em; }.showcase-heading p { max-width: 64ch; margin-top: 7px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.format-controls { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 12px; }.statistic-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }.countdown-layout { display: grid; grid-template-columns: minmax(260px, .8fr) minmax(0, 1.2fr); gap: 16px; }.countdown-note { display: grid; align-content: center; gap: 6px; padding: 20px 22px; border: 1px solid var(--aps-line-soft); border-radius: var(--aps-radius-card); background: var(--aps-surface-soft); }.countdown-note strong { color: var(--aps-ink); font-size: var(--aps-text-base); font-weight: var(--aps-font-weight-strong); }.countdown-note p { margin: 0; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.countdown-note span { margin-top: 5px; color: var(--aps-faint); font-size: var(--aps-text-xs); line-height: 1.55; }.standalone-countdown { display: grid; grid-template-columns: minmax(180px, 1fr) auto minmax(260px, 1.25fr); align-items: center; gap: 18px; margin-top: 18px; padding: 18px 20px; border: 1px solid var(--aps-line-soft); border-radius: 14px; background: var(--aps-surface-soft); }.standalone-countdown strong { color: var(--aps-ink); font-size: var(--aps-text-base); font-weight: var(--aps-font-weight-heading); }.standalone-countdown p { margin: 5px 0 0; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.55; }.standalone-countdown :deep(.app-countdown) { font-size: calc(var(--aps-text-2xl) + 2px); }.standalone-countdown-action { display: flex; align-items: center; justify-content: space-between; gap: 16px; }.standalone-countdown-action > span { color: var(--aps-faint); font-size: var(--aps-text-xs); line-height: 1.55; }@media (max-width: 900px) { .statistic-grid, .countdown-layout { grid-template-columns: 1fr; }.standalone-countdown { grid-template-columns: 1fr; }.standalone-countdown-action { align-items: flex-start; flex-direction: column; } }@media (max-width: 640px) { .showcase-heading { flex-direction: column; }.format-controls { align-items: flex-start; justify-content: flex-start; } }
</style>
