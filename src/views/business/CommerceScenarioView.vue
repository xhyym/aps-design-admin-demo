<script setup lang="ts">
import { computed, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppDataTable } from "aps-design-pro";
import { AppPagination } from "aps-design-pro";
import { AppStatusTag } from "aps-design-pro";
import { AppTableToolbar } from "aps-design-pro";
import { AppFilterBar } from "aps-design-pro";
import { AppFormField } from "aps-design-pro";
import { AppSearchInput } from "aps-design-pro";
import { AppSelect } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import { AppIconButton } from "aps-design-pro";
import { AppTableActions } from "aps-design-pro";
import { AppTableOperationBar } from "aps-design-pro";
import type { DataTableColumn, SelectOption, StatusTone } from "aps-design-pro";

export type CommerceScenarioKey =
  | "dashboard-tasks"
  | "product-categories"
  | "product-attributes"
  | "order-exports"
  | "after-sales-tickets"
  | "member-segments"
  | "marketing-coupons"
  | "inventory-warehouses"
  | "analytics-products";

interface CommerceScenarioRow {
  id: string;
  primary: string;
  secondary: string;
  category: string;
  value: string;
  status: string;
  updatedAt: string;
}

interface CommerceScenarioConfig {
  primaryLabel: string;
  secondaryLabel: string;
  categoryLabel: string;
  valueLabel: string;
  statusLabel: string;
  actionLabel: string;
  searchPlaceholder: string;
  emptyTitle: string;
  rows: CommerceScenarioRow[];
}

const props = defineProps<{ scenario: CommerceScenarioKey }>();
const keyword = ref("");
const status = ref("");
const page = ref(1);
const pageSize = ref(10);
const isLoading = ref(false);

function createRows(prefix: string, entries: Array<[string, string, string, string, string, string]>): CommerceScenarioRow[] {
  return entries.map(([primary, secondary, category, value, rowStatus, updatedAt], index) => ({ id: `${prefix}-${index + 1}`, primary, secondary, category, value, status: rowStatus, updatedAt }));
}

const scenarios: Record<CommerceScenarioKey, CommerceScenarioConfig> = {
  "dashboard-tasks": {
    primaryLabel: "待办事项", secondaryLabel: "负责人", categoryLabel: "任务类型", valueLabel: "截止时间", statusLabel: "处理状态", actionLabel: "处理任务", searchPlaceholder: "搜索任务、负责人或订单号", emptyTitle: "没有待处理任务", rows: createRows("task", [
      ["确认高风险退款", "陈婉", "售后审核", "今天 14:00", "待处理", "10 分钟前"], ["补充春季活动库存", "林知远", "库存预警", "今天 16:30", "进行中", "35 分钟前"], ["审核新渠道结算", "周宁", "财务对账", "今天 18:00", "待处理", "1 小时前"], ["发布会员日券包", "苏禾", "营销发布", "明天 09:00", "已排期", "昨天 17:20"],
    ]),
  },
  "product-categories": {
    primaryLabel: "分类名称", secondaryLabel: "分类编码", categoryLabel: "商品数量", valueLabel: "展示排序", statusLabel: "发布状态", actionLabel: "编辑分类", searchPlaceholder: "搜索分类名称或编码", emptyTitle: "没有匹配分类", rows: createRows("category", [
      ["咖啡器具", "coffee-tools", "126 件", "01", "已发布", "今天 09:12"], ["通勤包袋", "bags", "84 件", "02", "已发布", "昨天 18:44"], ["户外服饰", "outdoor-wear", "65 件", "03", "草稿", "昨天 15:26"], ["礼赠套装", "gift-sets", "42 件", "04", "已发布", "周一 11:08"],
    ]),
  },
  "product-attributes": {
    primaryLabel: "规格模板", secondaryLabel: "模板编码", categoryLabel: "关联商品", valueLabel: "字段数量", statusLabel: "使用状态", actionLabel: "配置模板", searchPlaceholder: "搜索规格模板或编码", emptyTitle: "没有匹配模板", rows: createRows("attribute", [
      ["咖啡豆规格", "coffee-bean-v2", "38 个", "6 个", "使用中", "今天 08:48"], ["服饰尺码", "apparel-size", "74 个", "4 个", "使用中", "昨天 16:30"], ["礼盒组合", "gift-combo", "12 个", "8 个", "草稿", "昨天 13:11"], ["仓配属性", "fulfillment", "96 个", "5 个", "使用中", "周一 09:42"],
    ]),
  },
  "order-exports": {
    primaryLabel: "导出任务", secondaryLabel: "创建人", categoryLabel: "数据范围", valueLabel: "文件大小", statusLabel: "任务状态", actionLabel: "下载文件", searchPlaceholder: "搜索任务编号或创建人", emptyTitle: "没有匹配导出任务", rows: createRows("export", [
      ["订单明细 2026-08-03", "林知远", "近 30 天订单", "18.4 MB", "已完成", "今天 10:12"], ["渠道结算汇总", "苏禾", "7 月渠道订单", "6.8 MB", "处理中", "今天 09:56"], ["会员首购名单", "周宁", "会员筛选结果", "2.1 MB", "已完成", "昨天 17:30"], ["异常订单清单", "陈婉", "风险订单", "840 KB", "失败", "昨天 14:06"],
    ]),
  },
  "after-sales-tickets": {
    primaryLabel: "售后工单", secondaryLabel: "客户", categoryLabel: "问题类型", valueLabel: "响应时限", statusLabel: "工单状态", actionLabel: "查看工单", searchPlaceholder: "搜索工单号、客户或订单号", emptyTitle: "没有匹配售后工单", rows: createRows("ticket", [
      ["AS-20260803-018", "赵雨桐", "商品质量", "剩余 38 分钟", "待响应", "今天 10:28"], ["AS-20260803-014", "何远", "物流异常", "已超时 12 分钟", "处理中", "今天 09:46"], ["AS-20260802-097", "韩雪", "退货退款", "已完成", "已关闭", "昨天 18:22"], ["AS-20260802-083", "郭宁", "发票补开", "剩余 3 小时", "待处理", "昨天 16:10"],
    ]),
  },
  "member-segments": {
    primaryLabel: "会员分群", secondaryLabel: "分群编码", categoryLabel: "会员数量", valueLabel: "近 30 日成交", statusLabel: "分群状态", actionLabel: "查看成员", searchPlaceholder: "搜索分群名称或编码", emptyTitle: "没有匹配会员分群", rows: createRows("segment", [
      ["高价值会员", "vip-high", "2,486 人", "¥ 486,920", "运行中", "今天 08:30"], ["春季活动新客", "spring-new", "8,120 人", "¥ 192,440", "运行中", "昨天 19:12"], ["沉默会员", "silent-90d", "4,632 人", "¥ 28,160", "待触达", "昨天 11:26"], ["咖啡器具偏好", "coffee-prefer", "1,906 人", "¥ 135,780", "运行中", "周一 15:48"],
    ]),
  },
  "marketing-coupons": {
    primaryLabel: "优惠券名称", secondaryLabel: "券码", categoryLabel: "适用商品", valueLabel: "已领取", statusLabel: "投放状态", actionLabel: "配置优惠券", searchPlaceholder: "搜索优惠券名称或券码", emptyTitle: "没有匹配优惠券", rows: createRows("coupon", [
      ["会员日满减券", "VIPDAY30", "全场商品", "1,208 张", "投放中", "今天 09:20"], ["咖啡器具专享券", "COFFEE20", "咖啡器具", "842 张", "投放中", "昨天 18:08"], ["新客首单券", "FIRST50", "指定商品", "3,481 张", "已结束", "昨天 12:26"], ["夏日户外券", "SUMMER80", "户外服饰", "0 张", "草稿", "周一 10:05"],
    ]),
  },
  "inventory-warehouses": {
    primaryLabel: "仓库名称", secondaryLabel: "仓库编码", categoryLabel: "可用 SKU", valueLabel: "今日出库", statusLabel: "仓库状态", actionLabel: "查看仓库", searchPlaceholder: "搜索仓库名称或编码", emptyTitle: "没有匹配仓库", rows: createRows("warehouse", [
      ["华东一号仓", "WH-EAST-01", "2,840 个", "1,208 单", "运行中", "今天 10:36"], ["华南前置仓", "WH-SOUTH-02", "1,486 个", "862 单", "运行中", "今天 10:18"], ["西南中转仓", "WH-SOUTHWEST-01", "860 个", "312 单", "补货中", "今天 09:44"], ["北方备货仓", "WH-NORTH-01", "1,204 个", "496 单", "运行中", "昨天 19:10"],
    ]),
  },
  "analytics-products": {
    primaryLabel: "商品名称", secondaryLabel: "商品编码", categoryLabel: "成交件数", valueLabel: "成交金额", statusLabel: "趋势", actionLabel: "查看详情", searchPlaceholder: "搜索商品名称或编码", emptyTitle: "没有匹配商品分析", rows: createRows("product-analysis", [
      ["曜石手冲壶 600ml", "BREW-KETTLE-600", "729 件", "¥ 232,551", "上升 18.2%", "今天 10:00"], ["深焙拼配挂耳咖啡", "COF-DRIP-020", "3,811 件", "¥ 365,856", "上升 11.6%", "今天 10:00"], ["云岚手冲咖啡礼盒", "COF-GIFT-001", "1,482 件", "¥ 395,658", "稳定", "今天 10:00"], ["轻量通勤包", "BAG-COMMUTE-002", "906 件", "¥ 246,432", "下降 4.8%", "今天 10:00"],
    ]),
  },
};

const scenario = computed(() => scenarios[props.scenario]);
const statusOptions = computed<SelectOption[]>(() => [{ label: "全部状态", value: "" }, ...Array.from(new Set(scenario.value.rows.map((row) => row.status))).map((label) => ({ label, value: label }))]);
const filteredRows = computed(() => scenario.value.rows.filter((row) => {
  const query = keyword.value.trim().toLocaleLowerCase();
  const matchesKeyword = !query || [row.primary, row.secondary, row.category].some((value) => value.toLocaleLowerCase().includes(query));
  return matchesKeyword && (!status.value || row.status === status.value);
}));
const visibleRows = computed(() => filteredRows.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));
const columns = computed<DataTableColumn<CommerceScenarioRow>[]>(() => [
  { key: "primary", label: scenario.value.primaryLabel, defaultWidth: 220, minWidth: 170 },
  { key: "secondary", label: scenario.value.secondaryLabel, defaultWidth: 180, minWidth: 140 },
  { key: "category", label: scenario.value.categoryLabel, defaultWidth: 150, minWidth: 120 },
  { key: "value", label: scenario.value.valueLabel, defaultWidth: 150, minWidth: 120 },
  { key: "status", label: scenario.value.statusLabel, defaultWidth: 126, minWidth: 108 },
  { key: "updatedAt", label: "最近更新", defaultWidth: 148, minWidth: 128 },
]);

function getStatusTone(value: string): StatusTone {
  if (["已完成", "已发布", "使用中", "运行中", "稳定"].includes(value)) return "success";
  if (["失败", "已超时", "下降 4.8%"].includes(value)) return "danger";
  if (["处理中", "投放中", "补货中", "上升 18.2%", "上升 11.6%"].includes(value)) return "warning";
  return "neutral";
}

function resetFilters(): void {
  keyword.value = "";
  status.value = "";
  page.value = 1;
}

function submitFilters(): void {
  page.value = 1;
}

function updatePage(nextPage: number): void { page.value = nextPage; }
function updatePageSize(nextPageSize: number): void { pageSize.value = nextPageSize; page.value = 1; }
function handleAction(row: CommerceScenarioRow): void { console.info(`[商城演示] 已打开${scenario.value.actionLabel}：${row.primary}`); }
</script>

<template>
  <section class="page-content page-stack list-page-layout">
    <AppCard as="section" padding="large" content-overflow="visible" class="list-search-panel" :aria-label="`${scenario.primaryLabel}筛选条件`">
      <AppFilterBar @submit="submitFilters" @reset="resetFilters">
        <AppFormField label="关键词" label-position="inline" label-width="48px" label-gap="8px"><AppSearchInput v-model="keyword" :placeholder="scenario.searchPlaceholder" @search="submitFilters" /></AppFormField>
        <AppFormField label="状态" label-position="inline" label-width="40px" label-gap="8px"><AppSelect v-model="status" :options="statusOptions" clearable /></AppFormField>
        <template #actions><AppButton type="submit" leading-icon="search" :loading="isLoading">查询</AppButton></template>
      </AppFilterBar>
    </AppCard>
    <AppCard as="section" padding="none" fill-height class="data-table-card" :aria-label="`${scenario.primaryLabel}列表`">
      <AppTableToolbar>
        <AppButton leading-icon="plus">{{ scenario.actionLabel }}</AppButton>
        <template #actions><AppTableOperationBar show-refresh @refresh="submitFilters"><template #before><AppIconButton icon="download" label="导出当前结果" /></template></AppTableOperationBar></template>
      </AppTableToolbar>
      <AppDataTable :rows="visibleRows" :columns="columns" row-key="id" fill-height :loading="isLoading" action-label="操作" :empty-title="scenario.emptyTitle" empty-description="调整关键词或状态后再试一次。" aria-label="商城业务数据表格">
        <template #cell-primary="{ row }"><div class="scenario-primary"><strong>{{ row.primary }}</strong><small>{{ row.secondary }}</small></div></template>
        <template #cell-secondary="{ row }"><span class="scenario-secondary">{{ row.secondary }}</span></template>
        <template #cell-status="{ row }"><AppStatusTag :label="row.status" :tone="getStatusTone(row.status)" /></template>
        <template #actions="{ row }"><AppTableActions><AppIconButton icon="edit" :label="scenario.actionLabel" size="small" @click="handleAction(row)" /></AppTableActions></template>
      </AppDataTable>
      <AppPagination v-if="filteredRows.length" :page="page" :page-size="pageSize" :total="filteredRows.length" :page-size-options="[10, 20, 30, 50]" @update:page="updatePage" @update:page-size="updatePageSize" />
    </AppCard>
  </section>
</template>

<style scoped>
.scenario-primary { min-width: 0; }.scenario-primary strong, .scenario-primary small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.scenario-primary strong { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: 680; }.scenario-primary small { margin-top: 3px; color: var(--aps-faint); font-size: var(--aps-text-xs); }.scenario-secondary { color: var(--aps-muted); font-family: var(--aps-font); font-size: var(--aps-text-sm); }
</style>
