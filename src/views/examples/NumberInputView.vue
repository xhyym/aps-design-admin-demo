<script setup lang="ts">
import { ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppNumberInput, type NumberInputFormatter, type NumberInputParser } from "aps-design-pro";
import { AppCard } from "aps-design-pro";

const coursePrice = ref(299.5);
const storageCapacity = ref(64);
const batchQuota = ref(16);
const changeStatus = ref("等待数值变更。");

const currencyFormatter: NumberInputFormatter = (value) => `¥ ${new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
const currencyParser: NumberInputParser = (value) => Number(value.replace(/[^\d.-]/g, ""));

function resetValues(): void {
  coursePrice.value = 299.5;
  storageCapacity.value = 64;
  batchQuota.value = 16;
  changeStatus.value = "已恢复默认数值。";
}

function updateChangeStatus(label: string, value: number): void {
  changeStatus.value = `${label}已确认：${value}`;
}
</script>

<template>
  <section class="number-input-view page-content page-stack" aria-label="数值输入组件示例">
    <AppCard as="section">
      <header class="showcase-heading">
        <div><h2>精度与严格步进</h2><p>金额按 0.25 元步进、保留两位小数；手动输入任意数值后会收敛到可用步长和边界范围。</p></div>
        <AppButton variant="secondary" size="small" @click="resetValues">恢复示例</AppButton>
      </header>
      <div class="number-demo-grid">
        <label class="number-demo-field"><span>课程售价</span><AppNumberInput v-model="coursePrice" :min="0" :max="999.99" :step="0.25" :precision="2" step-strictly :formatter="currencyFormatter" :parser="currencyParser" aria-label="课程售价" @change="updateChangeStatus('课程售价', $event)" /><small>支持带货币符号的展示与解析。</small></label>
        <label class="number-demo-field"><span>存储容量</span><AppNumberInput v-model="storageCapacity" :min="0" :max="1024" :step="8" controls-position="right" aria-label="存储容量" @change="updateChangeStatus('存储容量', $event)" /><small>右侧控制器适合空间有限的设置表单。</small></label>
      </div>
      <p class="change-status" aria-live="polite">{{ changeStatus }}</p>
    </AppCard>

    <AppCard as="section">
      <header class="showcase-heading"><div><h2>清空值与键盘操作</h2><p>清空后可回退到明确数值；聚焦输入框时，方向上/下键也可按设置步长调整。</p></div></header>
      <div class="quota-layout">
        <label class="number-demo-field"><span>批量处理上限</span><AppNumberInput v-model="batchQuota" :min="0" :max="100" :step="2" :value-on-clear="0" :controls="false" placeholder="输入上限" aria-label="批量处理上限" @change="updateChangeStatus('批量处理上限', $event)" /><small>清空后立即回退为 0。</small></label>
        <div class="keyboard-note"><strong>当前上限：{{ batchQuota }}</strong><span>点击输入框后按 ↑ 或 ↓ 验收键盘步进。</span></div>
      </div>
    </AppCard>
  </section>
</template>

<style scoped>
.number-input-view { max-width: 960px; }.showcase-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 22px; }.showcase-heading h2, .showcase-heading p { margin: 0; }.showcase-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: 720; letter-spacing: -.02em; }.showcase-heading p { max-width: 62ch; margin-top: 7px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.number-demo-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }.number-demo-field { display: grid; gap: 7px; color: var(--aps-muted); font-size: var(--aps-text-sm); font-weight: 650; }.number-demo-field small { color: var(--aps-faint); font-size: var(--aps-text-xs); font-weight: 400; line-height: 1.5; }.change-status { min-height: 20px; margin: 14px 0 0; color: var(--aps-faint); font-size: var(--aps-text-xs); }.quota-layout { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); align-items: end; gap: 16px; }.keyboard-note { display: grid; min-height: 92px; align-content: center; gap: 5px; padding: 16px 18px; border: 1px solid var(--aps-line-soft); border-radius: 12px; background: var(--aps-surface-soft); }.keyboard-note strong { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: 680; }.keyboard-note span { color: var(--aps-faint); font-size: var(--aps-text-xs); line-height: 1.5; }@media (max-width: 700px) { .showcase-heading { flex-direction: column; }.number-demo-grid, .quota-layout { grid-template-columns: 1fr; } }
</style>
