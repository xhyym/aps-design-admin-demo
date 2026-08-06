<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getMembers } from "@/api/modules/ecommerce";
import { AppButton } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import { AppDataTable } from "aps-design-pro";
import { AppFilterBar } from "aps-design-pro";
import { AppFormField } from "aps-design-pro";
import { AppPagination } from "aps-design-pro";
import { AppSearchInput } from "aps-design-pro";
import { AppSelect } from "aps-design-pro";
import { AppStatusTag } from "aps-design-pro";
import { AppTableToolbar } from "aps-design-pro";
import type { MemberLevel, MemberListQuery, MemberRecord } from "@/types/ecommerce";
import type { DataTableColumn, SelectOption, StatusTone } from "aps-design-pro";

const members = ref<MemberRecord[]>([]);
const total = ref(0);
const isLoading = ref(false);
const errorMessage = ref("");
const keyword = ref("");
const level = ref<MemberLevel | "">("");
const page = ref(1);
const pageSize = ref(10);
const levelOptions: SelectOption[] = [{ label: "全部等级", value: "" }, { label: "黑金会员", value: "黑金会员" }, { label: "铂金会员", value: "铂金会员" }, { label: "黄金会员", value: "黄金会员" }, { label: "普通会员", value: "普通会员" }];
const columns: DataTableColumn<MemberRecord>[] = [
  { key: "name", label: "会员", defaultWidth: 170, minWidth: 142 },
  { key: "level", label: "会员等级", defaultWidth: 116, minWidth: 104 },
  { key: "tags", label: "会员标签", defaultWidth: 220, minWidth: 180 },
  { key: "totalSpent", label: "累计消费", defaultWidth: 128, minWidth: 108, align: "right" },
  { key: "orderCount", label: "订单数", defaultWidth: 96, minWidth: 82, align: "right" },
  { key: "lastOrderAt", label: "最近消费", defaultWidth: 142, minWidth: 124 },
  { key: "status", label: "健康度", defaultWidth: 100, minWidth: 88 },
];
async function loadMembers(resetPage = false): Promise<void> {
  if (resetPage) page.value = 1;
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const query: MemberListQuery = { keyword: keyword.value, level: level.value, page: page.value, pageSize: pageSize.value };
    const result = await getMembers(query);
    members.value = result.list;
    total.value = result.total;
  } catch (error) {
    members.value = [];
    total.value = 0;
    errorMessage.value = error instanceof Error ? error.message : "会员列表加载失败，请稍后重试。";
  } finally { isLoading.value = false; }
}
function resetFilters(): void { keyword.value = ""; level.value = ""; void loadMembers(true); }
function updatePage(nextPage: number): void { page.value = nextPage; void loadMembers(); }
function updatePageSize(nextPageSize: number): void { pageSize.value = nextPageSize; page.value = 1; void loadMembers(); }
function formatAmount(amount: number): string { return `¥ ${amount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}`; }
function getHealthDisplay(status: MemberRecord["status"]): { label: string; tone: StatusTone } { const statusMap: Record<MemberRecord["status"], { label: string; tone: StatusTone }> = { normal: { label: "活跃", tone: "success" }, silent: { label: "待唤醒", tone: "warning" }, risk: { label: "需关注", tone: "danger" } }; return statusMap[status]; }
onMounted(() => { void loadMembers(); });
</script>

<template>
  <section class="page-content page-stack list-page-layout">
    <AppCard as="section" padding="large" content-overflow="visible" class="list-search-panel" aria-label="会员筛选条件"><AppFilterBar @submit="loadMembers(true)" @reset="resetFilters"><AppFormField label="关键词" for="member-keyword" label-position="inline" label-width="48px" label-gap="8px"><AppSearchInput id="member-keyword" v-model="keyword" placeholder="搜索姓名或手机号" @search="loadMembers(true)" /></AppFormField><template #advanced><AppFormField label="等级" for="member-level" label-position="inline" label-width="40px" label-gap="8px"><AppSelect id="member-level" v-model="level" :options="levelOptions" /></AppFormField></template><template #actions><AppButton type="submit" leading-icon="search" :loading="isLoading">查询</AppButton></template></AppFilterBar></AppCard>
    <AppCard as="section" padding="none" fill-height class="data-table-card" aria-label="会员列表"><AppTableToolbar><AppButton leading-icon="plus">新增会员</AppButton><template #actions><AppButton variant="secondary" size="small" leading-icon="download">导出会员</AppButton></template></AppTableToolbar><AppDataTable :rows="members" :columns="columns" row-key="id" :loading="isLoading" :error-message="errorMessage" virtual fill-height :virtual-row-height="66" empty-title="没有匹配会员" empty-description="调整关键词或会员等级后再试一次。" aria-label="会员列表"><template #cell-name="{ row }"><div class="member-cell"><span>{{ row.name.slice(0, 1) }}</span><div><strong>{{ row.name }}</strong><small>{{ row.phone }}</small></div></div></template><template #cell-tags="{ row }"><div class="tag-list"><span v-for="tag in row.tags" :key="tag">{{ tag }}</span></div></template><template #cell-totalSpent="{ row }"><strong class="numeric">{{ formatAmount(row.totalSpent) }}</strong></template><template #cell-status="{ row }"><AppStatusTag :tone="getHealthDisplay(row.status).tone" :label="getHealthDisplay(row.status).label" /></template><template #actions><button type="button" class="table-link">查看画像</button></template></AppDataTable><AppPagination v-if="!isLoading && !errorMessage && members.length" :page="page" :page-size="pageSize" :total="total" :page-size-options="[10, 20, 30]" @update:page="updatePage" @update:page-size="updatePageSize" /></AppCard>
  </section>
</template>

<style scoped>
.member-cell { display: flex; align-items: center; gap: 9px; }.member-cell > span { display: grid; width: 30px; height: 30px; place-items: center; border-radius: 50%; background: var(--aps-blue-soft); color: var(--aps-blue); font-size: var(--aps-text-sm); font-weight: 740; }.member-cell strong, .member-cell small { display: block; }.member-cell strong { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: 680; }.member-cell small { margin-top: 2px; color: var(--aps-faint); font-size: var(--aps-text-xs); }.tag-list { display: flex; flex-wrap: wrap; gap: 5px; }.tag-list span { padding: 3px 6px; border-radius: 5px; background: var(--aps-surface-soft); color: var(--aps-muted); font-size: var(--aps-text-xs); }.numeric { color: var(--aps-ink); font-variant-numeric: tabular-nums; }.table-link { padding: 0; border: 0; background: transparent; color: var(--aps-blue); font: inherit; font-size: var(--aps-text-sm); font-weight: 660; cursor: pointer; }.table-link:hover { text-decoration: underline; text-underline-offset: 3px; }
</style>
