<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { getOperationsDashboard } from "@/api/modules/ecommerce";
import { AppAlert } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import { AppBarChartCard } from "aps-design-pro";
import { AppDataTable } from "aps-design-pro";
import { AppIconButton } from "aps-design-pro";
import { AppLineChartCard } from "aps-design-pro";
import { AppLoadingState } from "aps-design-pro";
import { AppStatePanel } from "aps-design-pro";
import { AppStatistic } from "aps-design-pro";
import { AppStatusTag } from "aps-design-pro";
import { formatCountdownValue, useCountdown } from "aps-design-pro";
import type { OperationsDashboardData } from "@/types/ecommerce";
import type { DataTableColumn, StatusTone } from "aps-design-pro";

interface RecentOrder {
  id: string;
  orderNo: string;
  memberName: string;
  amount: number;
  status: string;
  createdAt: string;
}

const dashboardData = ref<OperationsDashboardData | null>(null);
const isLoading = ref(true);
const errorMessage = ref("");
const AUTO_REFRESH_INTERVAL_MS = 60_000;
const nextRefreshAt = ref<number | null>(Date.now() + AUTO_REFRESH_INTERVAL_MS);
const noticeDescription = computed(() => dashboardData.value
  ? `数据更新于 ${dashboardData.value.updatedAt}，指标会随着工作区数据同步更新。`
  : "正在读取订单、商品与售后数据。"
);
const { remainingMilliseconds } = useCountdown(nextRefreshAt, () => {
  void refreshDashboard();
}, 1_000);
const refreshStatusText = computed(() => isLoading.value
  ? "刷新中"
  : `${formatCountdownValue(remainingMilliseconds.value, "ss")} 秒后自动刷新`
);
const orderColumns: DataTableColumn<RecentOrder>[] = [
  { key: "orderNo", label: "订单号", defaultWidth: 176, minWidth: 156 },
  { key: "memberName", label: "会员", defaultWidth: 124, minWidth: 104 },
  { key: "amount", label: "实付金额", defaultWidth: 120, minWidth: 108, align: "right" },
  { key: "status", label: "订单状态", defaultWidth: 112, minWidth: 104 },
  { key: "createdAt", label: "下单时间", defaultWidth: 108, minWidth: 96 },
];

/** 经营总览独立读取数据服务，失败时保留可恢复状态而非静默展示空白页面。 */
async function loadDashboard(): Promise<void> {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    dashboardData.value = await getOperationsDashboard();
  } catch (error) {
    dashboardData.value = null;
    errorMessage.value = error instanceof Error ? error.message : "经营数据暂时无法加载，请稍后重试。";
  } finally {
    isLoading.value = false;
  }
}

/** 手动与自动刷新共用同一入口，成功或失败后都重新开始下一轮倒计时。 */
async function refreshDashboard(): Promise<void> {
  await loadDashboard();
  nextRefreshAt.value = Date.now() + AUTO_REFRESH_INTERVAL_MS;
}

function getOrderTone(status: string): StatusTone {
  if (status === "待发货") return "warning";
  if (status === "配送中") return "info";
  return "success";
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", minimumFractionDigits: 2 }).format(amount);
}

onMounted(() => { void refreshDashboard(); });
</script>

<template>
  <section class="page-content page-stack operations-dashboard">
    <header class="dashboard-toolbar" aria-label="经营数据状态">
      <AppAlert tone="info" title="星野咖啡 · 运营中台" :description="noticeDescription">
        <template #action>
          <span class="dashboard-refresh-countdown" aria-live="polite">{{ refreshStatusText }}</span>
          <AppIconButton icon="refresh" label="刷新经营数据" variant="secondary" :loading="isLoading" @click="refreshDashboard" />
        </template>
      </AppAlert>
    </header>

    <AppCard v-if="isLoading" padding="none"><AppLoadingState title="正在汇总经营数据" description="正在读取订单、商品与售后的最新状态。" /></AppCard>
    <AppCard v-else-if="errorMessage" padding="none"><AppStatePanel type="error" title="经营总览暂时无法加载" :description="errorMessage" action-text="重新加载" @action="loadDashboard" /></AppCard>

    <template v-else-if="dashboardData">
      <div class="metric-grid" aria-label="核心经营指标">
        <AppStatistic v-for="metric in dashboardData.metrics" :key="metric.label" :title="metric.label" :value="metric.value" :detail="metric.detail" :status="metric.trend" :tone="metric.tone" :icon="metric.icon" />
      </div>

      <div class="analysis-grid">
        <AppLineChartCard title="近 7 日成交趋势" description="成交额与日目标对比（元）" :series="dashboardData.salesSeries" :categories="dashboardData.salesCategories" :height="276" exportable export-file-name="近7日成交趋势" />
        <AppBarChartCard title="渠道成交贡献" description="按渠道查看本周成交额（元）" :series="dashboardData.channelSeries" :categories="dashboardData.channelCategories" :height="276" />
      </div>

      <div class="content-grid">
        <AppCard as="section" padding="none" class="order-card">
          <template #header><div class="card-heading"><div><h2>实时订单</h2><p>最新支付完成的订单会优先进入履约队列</p></div><RouterLink v-slot="{ navigate }" custom to="/trade/orders"><AppIconButton icon="arrow-right" label="查看全部实时订单" size="small" @click="navigate" /></RouterLink></div></template>
          <AppDataTable :rows="dashboardData.recentOrders" :columns="orderColumns" row-key="id" show-index size="small" empty-title="暂无新订单" empty-description="当前时段还没有支付完成的订单。" aria-label="实时订单列表">
            <template #cell-orderNo="{ row }"><RouterLink class="table-link" :to="`/trade/orders/${row.id}`">{{ row.orderNo }}</RouterLink></template>
            <template #cell-amount="{ row }"><strong class="table-amount">{{ formatAmount(row.amount) }}</strong></template>
            <template #cell-status="{ row }"><AppStatusTag :tone="getOrderTone(row.status)" :label="row.status" /></template>
          </AppDataTable>
        </AppCard>

        <AppCard as="section" padding="none" class="todo-card">
          <template #header><div class="card-heading"><div><h2>运营待办</h2><p>按风险与时效排序，优先处理影响交易的事项</p></div></div></template>
          <div class="todo-list">
            <article v-for="todo in dashboardData.todos" :key="todo.id" :class="`is-${todo.tone}`">
              <span class="todo-dot" aria-hidden="true"></span>
              <div><strong>{{ todo.title }}</strong><p>{{ todo.description }}</p><RouterLink :to="todo.path">{{ todo.actionLabel }}<span aria-hidden="true">→</span></RouterLink></div>
            </article>
          </div>
        </AppCard>
      </div>
    </template>
  </section>
</template>

<style scoped>
.operations-dashboard {
  padding-bottom: 32px;
}

.dashboard-toolbar {
  display: flex;
  align-items: center;
}

.dashboard-toolbar :deep(.app-alert) {
  width: 100%;
}

.dashboard-refresh-countdown {
  color: currentColor;
  font-size: var(--aps-text-xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--aps-page-stack-gap);
}

.analysis-grid,
.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.34fr) minmax(300px, .86fr);
  gap: var(--aps-page-stack-gap);
}

.order-card,
.todo-card {
  min-width: 0;
}

/* 两张卡片共用标题区的内边距和高度，避免表格容器与待办列表改变标题基线。 */
.card-heading {
  display: flex;
  min-height: 72px;
  box-sizing: border-box;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px var(--aps-card-padding) 14px;
}

.card-heading > div {
  min-width: 0;
}

.card-heading h2,
.card-heading p {
  margin: 0;
}

.card-heading h2 {
  color: var(--aps-ink);
  font-size: var(--aps-text-base);
  font-weight: var(--aps-font-weight-heading);
}

.card-heading p {
  margin-top: 4px;
  color: var(--aps-muted);
  font-size: var(--aps-text-xs);
}

.card-heading a,
.table-link,
.todo-list a {
  color: var(--aps-blue);
  font-size: var(--aps-text-sm);
  font-weight: var(--aps-font-weight-strong);
  white-space: nowrap;
}

.card-heading a:hover,
.table-link:hover,
.todo-list a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.table-amount {
  color: var(--aps-ink);
  font-variant-numeric: tabular-nums;
}

.todo-list {
  display: grid;
}

.todo-list article {
  display: grid;
  grid-template-columns: 9px minmax(0, 1fr);
  gap: 11px;
  padding: 15px var(--aps-card-padding);
  border-bottom: 1px solid var(--aps-line-soft);
}

.todo-list article:last-child {
  border-bottom: 0;
}

.todo-dot {
  width: 7px;
  height: 7px;
  margin-top: 6px;
  border-radius: 50%;
  background: var(--aps-blue);
}

.todo-list .is-warning .todo-dot {
  background: var(--aps-orange);
}

.todo-list .is-danger .todo-dot {
  background: var(--aps-red);
}

.todo-list strong {
  color: var(--aps-ink);
  font-size: var(--aps-text-sm);
  font-weight: var(--aps-font-weight-heading);
}

.todo-list p {
  margin: 5px 0 0;
  color: var(--aps-muted);
  font-size: var(--aps-text-xs);
  line-height: 1.55;
}

.todo-list a {
  display: inline-flex;
  gap: 5px;
  margin-top: 9px;
  font-size: var(--aps-text-xs);
}

@media (max-width: 1120px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .analysis-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .dashboard-toolbar :deep(.alert-actions) {
    gap: 6px;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
