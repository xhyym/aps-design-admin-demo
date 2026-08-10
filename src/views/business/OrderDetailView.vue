<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { getOrder, updateOrderStatus } from "@/api/modules/orders";
import { useFeedbackStore } from "@/stores/feedback";
import { AppButton } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import { AppTimeline } from "aps-design-pro";
import { AppDescriptions } from "aps-design-pro";
import { AppIcon } from "aps-design-pro";
import { AppLoadingState } from "aps-design-pro";
import { AppStatePanel } from "aps-design-pro";
import { AppStatusTag } from "aps-design-pro";
import { AppPopconfirm } from "aps-design-pro";
import type { DescriptionItem, StatusTone, TimelineItem, TimelineItemState } from "aps-design-pro";
import type { OrderStatus, OrderStatusAction, SalesOrder } from "@/types/orders";

interface OrderStatusDisplay {
  label: string;
  tone: StatusTone;
}

const route = useRoute();
const feedbackStore = useFeedbackStore();
const order = ref<SalesOrder | null>(null);
const isLoading = ref(true);
const errorMessage = ref("");
const isUpdating = ref(false);
const isCancelConfirmOpen = ref(false);
const orderDetails = computed<DescriptionItem[]>(() => order.value ? [
  { label: "客户", value: `${order.value.customerName} · ${order.value.customerPhone}` },
  { label: "订单来源", value: order.value.channel },
  { label: "下单时间", value: order.value.createdAt },
  { label: "支付时间", value: order.value.paidAt ?? "尚未支付" },
] : []);
/** 将订单响应转换为公共时间线数据，避免详情页再次维护一套时间线视觉与状态规则。 */
const orderTimeline = computed<TimelineItem[]>(() => order.value?.timeline.map((item, index) => ({
  key: `${order.value?.id ?? "order"}-${item.time}-${index}`,
  title: item.title,
  description: item.description,
  timestamp: item.time,
  state: getOrderTimelineState(order.value?.status, index),
})) ?? []);

async function loadOrder(): Promise<void> {
  const orderId = typeof route.params.id === "string" ? route.params.id : "";
  if (!orderId) {
    errorMessage.value = "订单标识无效。";
    isLoading.value = false;
    return;
  }
  isLoading.value = true;
  errorMessage.value = "";
  try {
    order.value = await getOrder(orderId);
  } catch (error) {
    order.value = null;
    errorMessage.value = error instanceof Error ? error.message : "无法加载订单详情，请稍后重试。";
  } finally {
    isLoading.value = false;
  }
}

function getStatusDisplay(value: OrderStatus): OrderStatusDisplay {
  const statusMap: Record<OrderStatus, OrderStatusDisplay> = {
    pending_payment: { label: "待支付", tone: "warning" }, paid: { label: "已支付", tone: "info" }, fulfilling: { label: "开通中", tone: "info" }, shipped: { label: "已交付", tone: "success" }, completed: { label: "已完成", tone: "success" }, cancelled: { label: "已关闭", tone: "neutral" },
  };
  return statusMap[value];
}

function getOrderTimelineState(status: OrderStatus | undefined, index: number): TimelineItemState {
  if (index > 0) return "success";
  if (status === "cancelled") return "error";
  if (status === "pending_payment" || status === "fulfilling") return "processing";
  return "success";
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", minimumFractionDigits: 2 }).format(amount);
}

const orderActionLabels: Partial<Record<OrderStatusAction, string>> = {
  remind_payment: "催付",
  cancel: "关闭订单",
  start_fulfillment: "开始履约",
  mark_shipped: "确认交付",
  complete: "完成订单",
};

const availableOrderActions = computed<OrderStatusAction[]>(() => {
  if (!order.value) return [];
  const actionMap: Partial<Record<OrderStatus, OrderStatusAction[]>> = {
    pending_payment: ["remind_payment", "cancel"],
    paid: ["start_fulfillment"],
    fulfilling: ["mark_shipped"],
    shipped: ["complete"],
  };
  return actionMap[order.value.status] ?? [];
});

async function handleOrderStatusAction(action: OrderStatusAction): Promise<void> {
  if (!order.value || isUpdating.value) return;
  isUpdating.value = true;
  try {
    order.value = await updateOrderStatus(order.value.id, { action });
    isCancelConfirmOpen.value = false;
    feedbackStore.show(`订单${orderActionLabels[action]}成功。`, "success");
  } catch (error) {
    feedbackStore.show(error instanceof Error ? error.message : `订单${orderActionLabels[action]}失败，请稍后重试。`, "error");
  } finally {
    isUpdating.value = false;
  }
}

watch(() => route.params.id, () => { void loadOrder(); }, { immediate: true });
</script>

<template>
  <section class="page-content page-stack">
    <div class="detail-topbar"><RouterLink class="back-link" to="/trade/orders"><AppIcon name="arrow-left" :size="15" />返回交易订单</RouterLink><div class="detail-topbar-actions"><AppButton v-if="availableOrderActions.includes('remind_payment')" variant="secondary" size="small" leading-icon="bell" :disabled="isUpdating" @click="handleOrderStatusAction('remind_payment')">催付</AppButton><AppButton v-if="availableOrderActions.includes('start_fulfillment')" variant="secondary" size="small" leading-icon="arrow-right" :disabled="isUpdating" @click="handleOrderStatusAction('start_fulfillment')">开始履约</AppButton><AppButton v-if="availableOrderActions.includes('mark_shipped')" variant="secondary" size="small" leading-icon="check" :disabled="isUpdating" @click="handleOrderStatusAction('mark_shipped')">确认交付</AppButton><AppButton v-if="availableOrderActions.includes('complete')" variant="secondary" size="small" leading-icon="check" :disabled="isUpdating" @click="handleOrderStatusAction('complete')">完成订单</AppButton><AppPopconfirm v-if="availableOrderActions.includes('cancel')" v-model="isCancelConfirmOpen" title="关闭当前订单？" description="关闭后将停止后续履约流程，订单状态会保留在动态记录中。" confirm-text="关闭订单" danger :is-confirming="isUpdating" @confirm="handleOrderStatusAction('cancel')"><template #trigger="{ toggle }"><AppButton variant="danger" size="small" leading-icon="close" :disabled="isUpdating" @click="toggle">关闭订单</AppButton></template></AppPopconfirm><AppButton variant="secondary" size="small" leading-icon="refresh" :loading="isLoading" :disabled="isUpdating" @click="loadOrder">刷新</AppButton></div></div>
    <AppCard v-if="isLoading" padding="none"><AppLoadingState title="正在加载订单详情" description="正在读取订单、商品与交付记录。" /></AppCard>
    <AppCard v-else-if="errorMessage" padding="none"><AppStatePanel type="error" title="订单详情暂时无法加载" :description="errorMessage" action-text="重新加载" @action="loadOrder" /></AppCard>
    <template v-else-if="order">
      <AppCard as="section" class="order-overview"><div class="order-overview-main"><p>订单编号</p><h1>{{ order.orderNo }}</h1><span>{{ order.productSummary }}</span></div><div class="order-overview-status"><AppStatusTag :tone="getStatusDisplay(order.status).tone" :label="getStatusDisplay(order.status).label" /><strong>{{ formatAmount(order.amount) }}</strong></div></AppCard>
      <div class="detail-grid"><AppCard as="section"><header class="section-heading"><h2>订单信息</h2><p>订单主体与支付信息</p></header><AppDescriptions :items="orderDetails" :columns="2" /></AppCard><AppCard as="section"><header class="section-heading"><h2>履约信息</h2><p>仓库发货、物流单号与收货地址</p></header><AppDescriptions :items="[{ label: '收件人', value: order.recipient }, { label: '收货地址', value: order.shippingAddress }, { label: '物流单号', value: order.trackingNo ?? '等待仓库出库' }]" :columns="1" /></AppCard></div>
      <AppCard as="section" padding="none" class="item-card"><header class="item-heading"><h2>商品明细</h2><span>{{ order.items.length }} 个商品</span></header><div class="order-items"><article v-for="item in order.items" :key="item.id"><div class="item-symbol"><AppIcon name="grid" :size="19" /></div><div class="item-copy"><strong>{{ item.name }}</strong><span>{{ item.sku }}</span></div><span>× {{ item.quantity }}</span><strong>{{ formatAmount(item.unitPrice * item.quantity) }}</strong></article></div></AppCard>
      <AppCard as="section"><header class="section-heading"><h2>订单动态</h2><p>从创建到交付的完整处理记录</p></header><AppTimeline :items="orderTimeline" :current-key="orderTimeline[0]?.key" aria-label="订单处理动态" /></AppCard>
    </template>
  </section>
</template>

<style scoped>
.detail-topbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; }.detail-topbar-actions { display: inline-flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }.back-link { display: inline-flex; min-height: 32px; align-items: center; gap: 5px; color: var(--aps-muted); font-size: var(--aps-text-sm); font-weight: 640; }.back-link:hover { color: var(--aps-blue); }.order-overview :deep(.card-content) { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; }.order-overview-main p, .order-overview-main h1, .order-overview-main span { margin: 0; }.order-overview-main p { color: var(--aps-muted); font-size: var(--aps-text-sm); }.order-overview-main h1 { margin-top: 6px; color: var(--aps-ink); font-size: 24px; font-weight: 730; letter-spacing: -.035em; }.order-overview-main span { display: block; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); }.order-overview-status { display: grid; justify-items: end; gap: 11px; }.order-overview-status strong { color: var(--aps-ink); font-size: 24px; font-weight: 730; font-variant-numeric: tabular-nums; }.detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--aps-page-stack-gap); }.section-heading h2, .section-heading p { margin: 0; }.section-heading h2, .item-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: 710; letter-spacing: -.02em; }.section-heading p { margin-top: 5px; color: var(--aps-muted); font-size: var(--aps-text-sm); }.section-heading + :deep(.app-descriptions), .section-heading + :deep(.app-timeline) { margin-top: 22px; }.item-heading { display: flex; min-height: 62px; align-items: center; justify-content: space-between; gap: 12px; padding: 0 var(--aps-table-cell-padding); border-bottom: 1px solid var(--aps-line); }.item-heading h2 { margin: 0; }.item-heading span { color: var(--aps-muted); font-size: var(--aps-text-sm); }.order-items article { display: grid; grid-template-columns: 40px minmax(0, 1fr) auto 112px; align-items: center; gap: 14px; min-height: 78px; padding: 0 var(--aps-table-cell-padding); border-bottom: 1px solid var(--aps-line-soft); color: var(--aps-muted); font-size: var(--aps-text-sm); }.order-items article:last-child { border-bottom: 0; }.item-symbol { display: grid; width: 36px; height: 36px; place-items: center; border-radius: 10px; background: var(--aps-blue-soft); color: var(--aps-blue); }.item-copy { min-width: 0; }.item-copy strong, .item-copy span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.item-copy strong { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: 670; }.item-copy span { margin-top: 3px; color: var(--aps-faint); font-size: var(--aps-text-xs); }.order-items article > strong { color: var(--aps-ink); font-size: var(--aps-text-sm); text-align: right; font-variant-numeric: tabular-nums; }@media (max-width: 760px) { .detail-topbar { align-items: flex-start; flex-direction: column; }.detail-topbar-actions { width: 100%; justify-content: flex-start; }.detail-grid { grid-template-columns: 1fr; }.order-overview :deep(.card-content) { align-items: flex-start; flex-direction: column; }.order-overview-status { justify-items: start; }.order-items article { grid-template-columns: 36px minmax(0, 1fr) auto; }.order-items article > strong { grid-column: 2 / -1; text-align: left; } }
</style>
