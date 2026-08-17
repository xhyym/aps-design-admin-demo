<script setup lang="ts">
import { computed, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppInfiniteScroll } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import type { InfiniteScrollLoadReason } from "aps-design-pro";

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  category: string;
  time: string;
}

const PAGE_SIZE = 12;
const ACTIVITY_SOURCE: ActivityItem[] = Array.from({ length: 72 }, (_, index) => {
  const activityNumber = index + 1;
  const category = ["权限策略", "订单服务", "内容工作区", "数据任务"][index % 4];
  return {
    id: `activity-${activityNumber}`,
    title: `${category}已完成第 ${activityNumber} 项更新`,
    description: ["已同步到当前工作区成员。", "已完成权限校验与操作记录归档。", "等待下一批数据继续处理。", "已更新关联任务的展示状态。"][index % 4],
    category,
    time: `今天 ${String(18 - Math.floor(index / 4)).padStart(2, "0")}:${String((index * 7) % 60).padStart(2, "0")}`,
  };
});

const visibleActivities = ref<ActivityItem[]>(ACTIVITY_SOURCE.slice(0, PAGE_SIZE));
const isLoading = ref(false);
const isFinished = ref(false);
const loadError = ref("");
const shouldFailNextRequest = ref(true);
const showEmptyState = ref(false);
let requestVersion = 0;

const summary = computed(() => showEmptyState.value
  ? "当前展示空数据状态"
  : `已加载 ${visibleActivities.value.length} / ${ACTIVITY_SOURCE.length} 条记录`);

/** 页面负责分页游标和失败语义，组件只在接近底部时请求下一批数据。 */
async function loadMore(_reason: InfiniteScrollLoadReason): Promise<void> {
  if (isLoading.value || isFinished.value) return;
  const currentRequestVersion = ++requestVersion;
  isLoading.value = true;
  loadError.value = "";
  await new Promise<void>((resolve) => window.setTimeout(resolve, 420));
  if (currentRequestVersion !== requestVersion) return;

  const startIndex = visibleActivities.value.length;
  if (startIndex === PAGE_SIZE && shouldFailNextRequest.value) {
    shouldFailNextRequest.value = false;
    loadError.value = "下一批记录暂时不可用，请重试。";
    isLoading.value = false;
    return;
  }

  const nextItems = ACTIVITY_SOURCE.slice(startIndex, startIndex + PAGE_SIZE);
  visibleActivities.value = [...visibleActivities.value, ...nextItems];
  isFinished.value = startIndex + nextItems.length >= ACTIVITY_SOURCE.length;
  isLoading.value = false;
}

function resetDemo(): void {
  requestVersion += 1;
  visibleActivities.value = ACTIVITY_SOURCE.slice(0, PAGE_SIZE);
  isLoading.value = false;
  isFinished.value = false;
  loadError.value = "";
  shouldFailNextRequest.value = true;
  showEmptyState.value = false;
}

function toggleEmptyState(): void {
  showEmptyState.value = !showEmptyState.value;
}
</script>

<template>
  <section class="infinite-scroll-page page-content page-stack" aria-label="无限滚动组件示例">
    <header class="infinite-page-heading">
      <div><h1>无限滚动</h1><p>组件只管理滚动边界、加载反馈与重试入口；分页游标、请求和结束条件始终由业务页面维护。</p></div>
      <div class="infinite-page-actions"><span>{{ summary }}</span><AppButton variant="secondary" size="small" @click="toggleEmptyState">{{ showEmptyState ? "查看加载流程" : "查看空数据" }}</AppButton><AppButton variant="ghost" size="small" @click="resetDemo">恢复示例</AppButton></div>
    </header>

    <AppCard as="section" padding="large" class="infinite-demo-card" aria-label="无限滚动演示">
      <div class="infinite-demo-caption"><div><h2>工作区动态</h2><p>首次向下滚动会加载下一批记录；第二批会保留失败状态，使用底部的重试入口即可继续。</p></div><span>固定滚动容器</span></div>
      <AppInfiniteScroll v-if="showEmptyState" :items="[]" finished :height="480" aria-label="空数据无限滚动列表示例"><template #empty>当前筛选条件下没有可展示的工作区动态。</template></AppInfiniteScroll>
      <AppInfiniteScroll v-else :items="visibleActivities" :loading="isLoading" :finished="isFinished" :error-message="loadError" :height="480" aria-label="工作区动态无限滚动列表" @load="loadMore">
        <article v-for="item in visibleActivities" :key="item.id" class="activity-row"><div class="activity-dot" aria-hidden="true"></div><div class="activity-copy"><div><strong>{{ item.title }}</strong><span>{{ item.category }}</span></div><p>{{ item.description }}</p></div><time>{{ item.time }}</time></article>
      </AppInfiniteScroll>
    </AppCard>
  </section>
</template>

<style scoped>
.infinite-scroll-page { display: grid; min-height: 0; align-content: start; gap: var(--aps-page-stack-gap); }.infinite-page-heading { display: flex; align-items: end; justify-content: space-between; gap: 24px; }.infinite-page-heading h1, .infinite-page-heading p, .infinite-demo-caption h2, .infinite-demo-caption p { margin: 0; }.infinite-page-heading h1 { color: var(--aps-ink); font-size: var(--aps-text-2xl); font-weight: var(--aps-font-weight-heading); letter-spacing: -.035em; }.infinite-page-heading p { max-width: 720px; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }.infinite-page-actions { display: inline-flex; flex: 0 0 auto; align-items: center; gap: 8px; }.infinite-page-actions > span { margin-right: 4px; color: var(--aps-faint); font-size: var(--aps-text-xs); font-variant-numeric: tabular-nums; white-space: nowrap; }.infinite-demo-card { display: grid; gap: 18px; }.infinite-demo-caption { display: flex; align-items: start; justify-content: space-between; gap: 16px; }.infinite-demo-caption h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: var(--aps-font-weight-heading); }.infinite-demo-caption p { max-width: 680px; margin-top: 6px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.infinite-demo-caption > span { flex: 0 0 auto; color: var(--aps-faint); font-size: var(--aps-text-xs); font-weight: var(--aps-font-weight-primary); }.activity-row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px; min-height: 64px; padding: 11px 16px; border-bottom: 1px solid var(--aps-line-soft); }.activity-row:last-child { border-bottom: 0; }.activity-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--aps-blue); box-shadow: 0 0 0 4px var(--aps-blue-soft); }.activity-copy { display: grid; min-width: 0; gap: 4px; }.activity-copy > div { display: flex; min-width: 0; align-items: center; gap: 8px; }.activity-copy strong { overflow: hidden; color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: var(--aps-font-weight-strong); text-overflow: ellipsis; white-space: nowrap; }.activity-copy span { flex: 0 0 auto; padding: 2px 6px; border-radius: 5px; background: var(--aps-surface-soft); color: var(--aps-faint); font-size: var(--aps-text-2xs); }.activity-copy p { margin: 0; overflow: hidden; color: var(--aps-muted); font-size: var(--aps-text-xs); text-overflow: ellipsis; white-space: nowrap; }.activity-row time { flex: 0 0 auto; color: var(--aps-faint); font-size: var(--aps-text-xs); font-variant-numeric: tabular-nums; white-space: nowrap; }@media (max-width: 760px) { .infinite-page-heading { align-items: start; flex-direction: column; }.infinite-page-actions { flex-wrap: wrap; }.infinite-demo-caption { align-items: start; flex-direction: column; gap: 7px; } }@media (max-width: 520px) { .activity-row { grid-template-columns: auto minmax(0, 1fr); }.activity-row time { display: none; }.infinite-page-actions > span { width: 100%; } }
</style>
