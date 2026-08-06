<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { getOperationsDashboard } from "@/api/modules/ecommerce";
import { AppBarChartCard } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import { AppLineChartCard } from "aps-design-pro";
import { AppLoadingState } from "aps-design-pro";
import { AppStatePanel } from "aps-design-pro";
import { AppStatistic } from "aps-design-pro";
import type { OperationsDashboardData } from "@/types/ecommerce";

const analytics = ref<OperationsDashboardData | null>(null);
const isLoading = ref(true);
const errorMessage = ref("");
const totalSales = computed(() => analytics.value?.salesSeries[0]?.data.reduce((total, item) => total + item, 0) ?? 0);
const averageDailySales = computed(() => Math.round(totalSales.value / Math.max(1, analytics.value?.salesSeries[0]?.data.length ?? 1)));

async function loadAnalytics(): Promise<void> {
  isLoading.value = true;
  errorMessage.value = "";
  try { analytics.value = await getOperationsDashboard(); }
  catch (error) { analytics.value = null; errorMessage.value = error instanceof Error ? error.message : "经营分析数据加载失败，请稍后重试。"; }
  finally { isLoading.value = false; }
}
function formatAmount(amount: number): string { return `¥ ${amount.toLocaleString("zh-CN")}`; }
onMounted(() => { void loadAnalytics(); });
</script>

<template>
  <section class="page-content page-stack analytics-page">
    <header class="page-heading"><div><p class="page-kicker">数据分析</p><h1>经营分析</h1><span>从成交趋势和渠道贡献识别增长机会，帮助团队识别增长动作。</span></div></header>
    <AppCard v-if="isLoading" padding="none"><AppLoadingState title="正在计算经营分析" description="正在汇总近七日成交和渠道归因数据。" /></AppCard>
    <AppCard v-else-if="errorMessage" padding="none"><AppStatePanel type="error" title="经营分析暂时无法加载" :description="errorMessage" action-text="重新加载" @action="loadAnalytics" /></AppCard>
    <template v-else-if="analytics">
      <div class="metrics"><AppStatistic title="近 7 日成交额" :value="formatAmount(totalSales)" detail="较上个周期提升 9.8%" status="稳定增长" tone="success" icon="chart" /><AppStatistic title="日均成交额" :value="formatAmount(averageDailySales)" detail="已超过日均目标" status="目标达成" tone="success" icon="grid" /><AppStatistic title="新客转化率" value="18.4%" detail="官网商城贡献最高" status="继续观察" tone="info" icon="users" /></div>
      <div class="chart-grid"><AppLineChartCard title="成交额与目标" description="近七日趋势对比（元）" :series="analytics.salesSeries" :categories="analytics.salesCategories" :height="330" zoomable exportable export-file-name="经营趋势" /><AppBarChartCard title="渠道成交贡献" description="本周各渠道归因成交额（元）" :series="analytics.channelSeries" :categories="analytics.channelCategories" :height="330" /></div>
      <AppCard><div class="insight"><span>经营洞察</span><h2>官网商城贡献 {{ Math.round((analytics.channelSeries[0]?.data[0] ?? 0) / Math.max(1, totalSales) * 100) }}% 的成交额，冷萃周活动正在拉动新客首单。</h2><p>建议在本周末前为低库存商品补货，并将沉默会员纳入会员日券包的定向触达。</p></div></AppCard>
    </template>
  </section>
</template>

<style scoped>
.analytics-page { padding-bottom: 32px; }.page-heading h1, .page-heading p, .page-heading span { margin: 0; }.page-kicker { color: var(--aps-blue); font-size: var(--aps-text-xs); font-weight: 730; letter-spacing: .05em; }.page-heading h1 { margin-top: 7px; color: var(--aps-ink); font-size: 28px; font-weight: 760; letter-spacing: -.045em; }.page-heading span { display: block; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); }.metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--aps-page-stack-gap); }.chart-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--aps-page-stack-gap); }.insight span { color: var(--aps-blue); font-size: var(--aps-text-xs); font-weight: 720; }.insight h2 { max-width: 800px; margin: 8px 0 0; color: var(--aps-ink); font-size: 20px; font-weight: 720; letter-spacing: -.03em; line-height: 1.45; }.insight p { max-width: 700px; margin: 10px 0 0; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.7; }@media (max-width: 900px) { .metrics, .chart-grid { grid-template-columns: 1fr; } }
</style>
