<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getCampaigns } from "@/api/modules/ecommerce";
import { AppButton } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import { AppLoadingState } from "aps-design-pro";
import { AppProgress } from "aps-design-pro";
import { AppStatePanel } from "aps-design-pro";
import { AppStatusTag } from "aps-design-pro";
import type { CampaignRecord, CampaignStatus } from "@/types/ecommerce";
import type { StatusTone } from "aps-design-pro";

const campaigns = ref<CampaignRecord[]>([]);
const isLoading = ref(true);
const errorMessage = ref("");

async function loadCampaigns(): Promise<void> {
  isLoading.value = true;
  errorMessage.value = "";
  try { campaigns.value = await getCampaigns(); }
  catch (error) { campaigns.value = []; errorMessage.value = error instanceof Error ? error.message : "营销活动加载失败，请稍后重试。"; }
  finally { isLoading.value = false; }
}
function getStatusDisplay(value: CampaignStatus): { label: string; tone: StatusTone } { const statusMap: Record<CampaignStatus, { label: string; tone: StatusTone }> = { scheduled: { label: "待发布", tone: "warning" }, running: { label: "进行中", tone: "success" }, ended: { label: "已结束", tone: "neutral" } }; return statusMap[value]; }
function formatAmount(amount: number): string { return `¥ ${amount.toLocaleString("zh-CN", { minimumFractionDigits: 0 })}`; }
onMounted(() => { void loadCampaigns(); });
</script>

<template>
  <section class="page-content page-stack marketing-page">
    <header class="page-heading"><div><p class="page-kicker">营销中心</p><h1>营销活动</h1><span>编排优惠券、满减和限时折扣，所有成效统一回流至经营数据。</span></div><AppButton leading-icon="plus">新建活动</AppButton></header>
    <AppCard v-if="isLoading" padding="none"><AppLoadingState title="正在读取营销活动" description="正在同步活动进度与交易归因数据。" /></AppCard>
    <AppCard v-else-if="errorMessage" padding="none"><AppStatePanel type="error" title="营销活动暂时无法加载" :description="errorMessage" action-text="重新加载" @action="loadCampaigns" /></AppCard>
    <template v-else>
      <div class="campaign-overview"><AppCard><div class="overview-item"><span>进行中活动</span><strong>{{ campaigns.filter((item) => item.status === "running").length }}</strong><small>需要每日关注预算与库存</small></div></AppCard><AppCard><div class="overview-item"><span>本周活动成交</span><strong>{{ formatAmount(campaigns.reduce((total, item) => total + item.revenue, 0)) }}</strong><small>包含已结束活动的归因数据</small></div></AppCard><AppCard><div class="overview-item"><span>待发布活动</span><strong>{{ campaigns.filter((item) => item.status === "scheduled").length }}</strong><small>请在开始前完成商品校验</small></div></AppCard></div>
      <div class="campaign-grid"><AppCard v-for="campaign in campaigns" :key="campaign.id" as="article" class="campaign-card" shadow="hover"><header><div><span>{{ campaign.type }}</span><h2>{{ campaign.name }}</h2></div><AppStatusTag :tone="getStatusDisplay(campaign.status).tone" :label="getStatusDisplay(campaign.status).label" /></header><dl><div><dt>活动时间</dt><dd>{{ campaign.period }}</dd></div><div><dt>适用范围</dt><dd>{{ campaign.target }}</dd></div><div><dt>归因成交额</dt><dd>{{ formatAmount(campaign.revenue) }}</dd></div></dl><AppProgress :percentage="campaign.progress" :label="campaign.status === 'ended' ? '活动完成度' : '活动周期进度'" :status="campaign.status === 'running' ? 'normal' : campaign.status === 'scheduled' ? 'warning' : 'success'" /><footer><button type="button">{{ campaign.status === "scheduled" ? "去发布" : "查看详情" }}</button><button type="button" class="secondary">复制活动</button></footer></AppCard></div>
    </template>
  </section>
</template>

<style scoped>
.marketing-page { padding-bottom: 32px; }.page-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }.page-heading h1, .page-heading p, .page-heading span { margin: 0; }.page-kicker { color: var(--aps-blue); font-size: var(--aps-text-xs); font-weight: 730; letter-spacing: .05em; }.page-heading h1 { margin-top: 7px; color: var(--aps-ink); font-size: 28px; font-weight: 760; letter-spacing: -.045em; }.page-heading span { display: block; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); }.campaign-overview { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--aps-page-stack-gap); }.overview-item { display: grid; gap: 8px; }.overview-item span, .overview-item small { color: var(--aps-muted); font-size: var(--aps-text-sm); }.overview-item strong { color: var(--aps-ink); font-size: 26px; font-weight: 740; letter-spacing: -.04em; }.overview-item small { color: var(--aps-faint); font-size: var(--aps-text-xs); }.campaign-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--aps-page-stack-gap); }.campaign-card :deep(.card-content) { display: grid; gap: 22px; }.campaign-card header { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }.campaign-card header span { color: var(--aps-blue); font-size: var(--aps-text-xs); font-weight: 700; }.campaign-card h2 { margin: 7px 0 0; color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: 720; letter-spacing: -.02em; }.campaign-card dl { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 0; padding: 14px 0; border-top: 1px solid var(--aps-line-soft); border-bottom: 1px solid var(--aps-line-soft); }.campaign-card dl div { min-width: 0; }.campaign-card dt, .campaign-card dd { margin: 0; }.campaign-card dt { color: var(--aps-faint); font-size: var(--aps-text-xs); }.campaign-card dd { margin-top: 6px; overflow: hidden; color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }.campaign-card footer { display: flex; gap: 12px; }.campaign-card footer button { padding: 0; border: 0; background: transparent; color: var(--aps-blue); font-size: var(--aps-text-sm); font-weight: 660; cursor: pointer; }.campaign-card footer .secondary { color: var(--aps-muted); }.campaign-card footer button:hover { text-decoration: underline; text-underline-offset: 3px; }@media (max-width: 820px) { .campaign-overview, .campaign-grid { grid-template-columns: 1fr; } }.page-heading { }@media (max-width: 620px) { .page-heading { align-items: flex-start; flex-direction: column; }.campaign-card dl { grid-template-columns: 1fr; gap: 10px; } }
</style>
