<script setup lang="ts">
import { ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppRate } from "aps-design-pro";
import { AppCard } from "aps-design-pro";

const courseScore = ref(3.5);
const deliveryScore = ref(4);
const actionStatus = ref("可点击星标评分，再次点击当前分值即可清空。");
const scoreTexts = ["很不满意", "不满意", "一般", "满意", "非常满意"];

function resetScores(): void {
  courseScore.value = 3.5;
  deliveryScore.value = 4;
  actionStatus.value = "已恢复默认评分。";
}

function updateScoreStatus(label: string, value: number): void {
  actionStatus.value = `${label}已更新为 ${value} 分。`;
}
</script>

<template>
  <section class="rate-view page-content page-stack" aria-label="评分组件示例">
    <AppCard as="section">
      <header class="showcase-heading">
        <div><h2>半星评分与清空</h2><p>半星由鼠标或触控落点决定；再次点击当前分值、按 Delete 或 Backspace 都可以清空评分。</p></div>
        <AppButton variant="secondary" size="small" @click="resetScores">恢复示例</AppButton>
      </header>
      <div class="rate-demo-grid">
        <div class="rate-demo-item"><strong>课程内容评分</strong><AppRate v-model="courseScore" allow-half clearable show-score aria-label="课程内容评分" @change="updateScoreStatus('课程内容评分', $event)" @clear="actionStatus = '课程内容评分已清空。'" /><span>当前数值：{{ courseScore }}</span></div>
        <div class="rate-demo-item"><strong>交付体验评分</strong><AppRate v-model="deliveryScore" clearable show-text :texts="scoreTexts" aria-label="交付体验评分" @change="updateScoreStatus('交付体验评分', $event)" @clear="actionStatus = '交付体验评分已清空。'" /><span>文本反馈由评分档位统一提供。</span></div>
      </div>
      <p class="rate-status" aria-live="polite">{{ actionStatus }}</p>
    </AppCard>

    <AppCard as="section">
      <header class="showcase-heading"><div><h2>只读展示与尺寸</h2><p>详情页只读展示不会占用键盘焦点；不同尺寸可随全局组件偏好或局部配置保持一致。</p></div></header>
      <div class="readonly-rate-row"><div><span>审核评分</span><AppRate :model-value="4.5" allow-half readonly show-text :texts="scoreTexts" size="small" aria-label="审核评分 4.5 分" /></div><div><span>服务评价</span><AppRate :model-value="5" readonly show-score size="large" aria-label="服务评价 5 分" /></div></div>
    </AppCard>
  </section>
</template>

<style scoped>
.rate-view { max-width: 960px; }.showcase-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 22px; }.showcase-heading h2, .showcase-heading p { margin: 0; }.showcase-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: var(--aps-font-weight-heading); letter-spacing: -.02em; }.showcase-heading p { max-width: 62ch; margin-top: 7px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.rate-demo-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; overflow: hidden; border: 1px solid var(--aps-line-soft); border-radius: 12px; background: var(--aps-line-soft); }.rate-demo-item { display: grid; min-height: 158px; align-content: center; gap: 9px; padding: 18px; background: var(--aps-surface); }.rate-demo-item > strong { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: var(--aps-font-weight-strong); }.rate-demo-item > span { color: var(--aps-faint); font-size: var(--aps-text-xs); line-height: 1.5; }.rate-status { min-height: 20px; margin: 14px 0 0; color: var(--aps-faint); font-size: var(--aps-text-xs); }.readonly-rate-row { display: flex; flex-wrap: wrap; gap: 32px; }.readonly-rate-row > div { display: grid; gap: 5px; }.readonly-rate-row span { color: var(--aps-muted); font-size: var(--aps-text-sm); font-weight: var(--aps-font-weight-primary); }@media (max-width: 700px) { .showcase-heading { flex-direction: column; }.rate-demo-grid { grid-template-columns: 1fr; } }
</style>
