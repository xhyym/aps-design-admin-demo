<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppVideoPlayer } from "aps-design-pro";
import { AppDragVerify } from "aps-design-pro";
import { AppRangeControl } from "aps-design-pro";
import { AppSlider } from "aps-design-pro";

interface RangeProbe {
  key: string;
  label: string;
  value: number;
}

const rangeProbes = reactive<RangeProbe[]>([
  { key: "start", label: "起点", value: 0 },
  { key: "quarter", label: "四分之一", value: 25 },
  { key: "middle", label: "中点", value: 50 },
  { key: "three-quarters", label: "四分之三", value: 75 },
  { key: "end", label: "终点", value: 100 },
]);
const sliderValue = ref(50);
const precisionValue = ref(0.5);
const isVerified = ref(false);
const latestAction = ref("等待调整范围控件");
const activeProbeSummary = computed(() => rangeProbes.map((probe) => `${probe.label} ${probe.value}%`).join(" · "));

function recordRangeChange(label: string, value: number): void {
  latestAction.value = `${label}已提交 ${value.toFixed(value % 1 === 0 ? 0 : 2)}`;
}

function resetRangeProbes(): void {
  const defaultValues = [0, 25, 50, 75, 100];
  rangeProbes.forEach((probe, index) => { probe.value = defaultValues[index]; });
  sliderValue.value = 50;
  precisionValue.value = 0.5;
  isVerified.value = false;
  latestAction.value = "已恢复五个基准位置";
}
</script>

<template>
  <section class="range-media-page page-content page-stack" aria-label="范围与媒体组件验收">
    <section class="range-media-intro">
      <div><h1>范围与媒体</h1><p>滑块、视频进度和音量使用同一套像素几何，圆点中心、填充终点和可点击区域必须始终落在同一个数值位置。</p></div>
      <AppButton variant="secondary" leading-icon="refresh" @click="resetRangeProbes">恢复基准</AppButton>
    </section>

    <section class="range-media-grid">
      <article class="range-card alignment-card">
        <header class="range-card-heading"><div><h2>轨道对齐基准</h2><p>分别检查 0%、25%、50%、75% 和 100% 时圆点与已填充轨道的交界。</p></div><span>共享底座</span></header>
        <div class="alignment-list">
          <div v-for="probe in rangeProbes" :key="probe.key" class="alignment-row">
            <div class="alignment-row-heading"><strong>{{ probe.label }}</strong><output>{{ probe.value }}%</output></div>
            <div class="range-ruler"><span class="range-ruler-ticks" aria-hidden="true"><i v-for="tick in [0, 25, 50, 75, 100]" :key="tick" :style="{ left: `${tick}%` }"></i></span><AppRangeControl v-model="probe.value" :min="0" :max="100" :step="1" :ariaLabel="`${probe.label}范围控件`" @change="recordRangeChange(probe.label, $event)" /></div>
          </div>
        </div>
        <output class="range-action-status" aria-live="polite">{{ latestAction }}</output>
      </article>

      <article class="range-card slider-card">
        <header class="range-card-heading"><div><h2>交互规格</h2><p>标准、精细步长和小尺寸轨道复用同一坐标计算，支持键盘和触控。</p></div><span>键盘可用</span></header>
        <div class="slider-stack"><AppSlider v-model="sliderValue" label="任务容量" :marks="[{ value: 0, label: '0' }, { value: 25, label: '25' }, { value: 50, label: '50' }, { value: 75, label: '75' }, { value: 100, label: '100' }]" show-input aria-label="任务容量" @change="recordRangeChange('任务容量', $event)" /><div class="compact-range"><div><strong>精细阈值</strong><output>{{ precisionValue.toFixed(2) }}</output></div><AppRangeControl v-model="precisionValue" :min="0" :max="1" :step="0.01" size="small" ariaLabel="精细阈值" @change="recordRangeChange('精细阈值', $event)" /></div><div class="compact-range"><div><strong>当前基准</strong><span>{{ activeProbeSummary }}</span></div><AppRangeControl :model-value="0.5" :min="0" :max="1" :step="0.01" size="small" disabled ariaLabel="中点基准" /></div></div>
      </article>
    </section>

    <section class="range-media-grid media-grid">
      <article class="range-card video-card">
        <header class="range-card-heading"><div><h2>视频播放进度</h2><p>播放时使用动画帧读取媒体时间，避免浏览器的低频事件导致圆点滞后。</p></div><span>媒体同步</span></header>
        <AppVideoPlayer src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" title="范围控件播放同步示例" />
      </article>
      <article class="range-card verification-card">
        <header class="range-card-heading"><div><h2>拖动边界</h2><p>拖动验证保留自身语义，但其把手行程也需要遵循容器可用宽度。</p></div><span>触控回归</span></header>
        <AppDragVerify v-model="isVerified" text="拖动至右侧检查边界" success-text="边界位置正确" aria-label="拖动边界检查" />
        <p class="verification-note">调整浏览器宽度后再次拖动，按钮不能越出容器，也不能提前触发成功。</p>
      </article>
    </section>
  </section>
</template>

<style scoped>
.range-media-page { display: grid; min-height: 0; align-content: start; gap: var(--aps-page-stack-gap); }.range-media-intro { display: flex; align-items: end; justify-content: space-between; gap: 28px; }.range-media-intro h1, .range-media-intro p { margin: 0; }.range-media-intro h1 { color: var(--aps-ink); font-size: var(--aps-text-2xl); font-weight: var(--aps-font-weight-heading); letter-spacing: -.035em; }.range-media-intro p { max-width: 720px; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }.range-media-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--aps-page-stack-gap); }.range-card { display: grid; min-width: 0; align-content: start; gap: 24px; padding: var(--aps-card-padding); border: 1px solid var(--aps-line-soft); border-radius: var(--aps-radius-card); background: var(--aps-surface); }.range-card-heading { display: flex; align-items: start; justify-content: space-between; gap: 20px; }.range-card-heading h2, .range-card-heading p { margin: 0; }.range-card-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: var(--aps-font-weight-heading); }.range-card-heading p { margin-top: 7px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.range-card-heading > span { flex: 0 0 auto; padding: 4px 8px; border-radius: 6px; background: var(--aps-surface-soft); color: var(--aps-faint); font-size: var(--aps-text-xs); font-weight: var(--aps-font-weight-primary); }.alignment-list, .slider-stack { display: grid; gap: 18px; }.alignment-row { display: grid; gap: 7px; }.alignment-row-heading, .compact-range > div { display: flex; align-items: center; justify-content: space-between; gap: 12px; }.alignment-row-heading strong, .compact-range strong { color: var(--aps-muted); font-size: var(--aps-text-sm); font-weight: var(--aps-font-weight-strong); }.alignment-row-heading output, .compact-range output { color: var(--aps-blue); font-size: var(--aps-text-sm); font-variant-numeric: tabular-nums; font-weight: var(--aps-font-weight-heading); }.range-ruler { position: relative; padding: 8px 0; }.range-ruler-ticks { position: absolute; z-index: 0; inset: 0 8px; pointer-events: none; }.range-ruler-ticks i { position: absolute; top: 50%; width: 1px; height: 14px; background: var(--aps-line); transform: translate(-.5px, -50%); }.range-ruler :deep(.app-range-control) { position: relative; z-index: 1; }.range-action-status { padding-top: 14px; border-top: 1px solid var(--aps-line-soft); color: var(--aps-muted); font-size: var(--aps-text-xs); }.compact-range { display: grid; gap: 8px; padding: 13px; border: 1px solid var(--aps-line-soft); border-radius: 11px; background: var(--aps-surface-soft); }.compact-range span { overflow: hidden; color: var(--aps-faint); font-size: var(--aps-text-xs); text-align: right; text-overflow: ellipsis; white-space: nowrap; }.media-grid { align-items: start; }.video-card { grid-column: span 1; }.verification-card { min-height: 100%; }.verification-note { margin: 0; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }@media (max-width: 900px) { .range-media-grid { grid-template-columns: 1fr; }.range-media-intro { align-items: flex-start; flex-direction: column; gap: 14px; }.range-media-intro .app-button-control { width: 100%; }.video-card { grid-column: auto; } }@media (max-width: 560px) { .range-card-heading { gap: 12px; }.range-card-heading > span { display: none; }.compact-range > div { align-items: flex-start; flex-direction: column; gap: 3px; }.compact-range span { width: 100%; text-align: left; } }
</style>
