<script setup lang="ts">
import { computed, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import { AppInput } from "aps-design-pro";
import { AppVirtualList } from "aps-design-pro";

interface ResourceItem {
  id: string;
  name: string;
  owner: string;
  group: string;
}

interface VirtualListController {
  scrollToIndex: (index: number, align?: "auto" | "start" | "center" | "end", behavior?: ScrollBehavior) => void;
  scrollToTop: (behavior?: ScrollBehavior) => void;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
}

const keyword = ref("");
const resourceList = ref<VirtualListController | null>(null);
const resources: ResourceItem[] = Array.from({ length: 2400 }, (_, index) => ({
  id: `resource-${index + 1}`,
  name: `资源节点 ${index + 1}`,
  owner: ["林知远", "王语桐", "陈瑶", "赵珂"][index % 4],
  group: index < 800 ? "产品" : index < 1600 ? "数据" : "运营",
}));
const filteredResources = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLocaleLowerCase();
  if (!normalizedKeyword) return resources;
  return resources.filter((item) => `${item.name} ${item.owner} ${item.group}`.toLocaleLowerCase().includes(normalizedKeyword));
});

function clearKeyword(): void {
  keyword.value = "";
}

function scrollToFirstResource(): void {
  resourceList.value?.scrollToTop();
}

function scrollToMiddleResource(): void {
  resourceList.value?.scrollToIndex(Math.floor(filteredResources.value.length / 2), "center");
}

function scrollToLastResource(): void {
  resourceList.value?.scrollToBottom();
}
</script>

<template>
  <section class="virtual-list-page page-content page-stack" aria-label="虚拟列表组件示例">
    <header class="virtual-page-heading">
      <div>
        <h1>虚拟列表</h1>
        <p>固定行高列表只渲染视口附近的内容，适合资源目录、成员目录和大型下拉数据。</p>
      </div>
      <span class="resource-count">{{ filteredResources.length.toLocaleString("zh-CN") }} 条结果</span>
    </header>

    <AppCard as="section" padding="large" class="virtual-demo-card" aria-label="虚拟列表演示">
      <div class="virtual-toolbar">
        <AppInput v-model="keyword" clearable placeholder="搜索资源名称、负责人或分组" aria-label="搜索资源" @clear="clearKeyword" />
        <div class="virtual-toolbar-actions"><span>视口内约渲染 20 行</span><AppButton variant="text" size="small" @click="scrollToFirstResource">回顶部</AppButton><AppButton variant="text" size="small" @click="scrollToMiddleResource">定位中段</AppButton><AppButton variant="text" size="small" @click="scrollToLastResource">到底部</AppButton></div>
      </div>
      <AppVirtualList ref="resourceList" :items="filteredResources" :item-height="58" :height="520" :item-key="(item) => item.id" aria-label="资源节点列表">
        <template #default="{ item, index }">
          <div class="resource-row"><span class="resource-index">{{ index + 1 }}</span><div class="resource-copy"><strong>{{ item.name }}</strong><span>{{ item.owner }} · {{ item.group }}</span></div><code>{{ item.id }}</code></div>
        </template>
      </AppVirtualList>
    </AppCard>
  </section>
</template>

<style scoped>
.virtual-list-page { display: grid; min-height: 0; align-content: start; gap: var(--aps-page-stack-gap); }.virtual-page-heading { display: flex; align-items: end; justify-content: space-between; gap: 24px; }.virtual-page-heading h1, .virtual-page-heading p { margin: 0; }.virtual-page-heading h1 { color: var(--aps-ink); font-size: var(--aps-text-2xl); font-weight: 740; letter-spacing: -.035em; }.virtual-page-heading p { max-width: 720px; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }.resource-count { flex: 0 0 auto; color: var(--aps-muted); font-size: var(--aps-text-sm); font-variant-numeric: tabular-nums; }.virtual-demo-card { display: grid; min-height: 0; gap: 16px; }.virtual-toolbar, .virtual-toolbar-actions { display: flex; align-items: center; gap: 16px; }.virtual-toolbar { justify-content: space-between; }.virtual-toolbar :deep(.app-input-control) { max-width: 380px; }.virtual-toolbar-actions { min-width: 0; justify-content: flex-end; gap: 4px; }.virtual-toolbar-actions > span { margin-right: 4px; color: var(--aps-faint); font-size: var(--aps-text-xs); white-space: nowrap; }.resource-row { display: flex; width: 100%; min-width: 0; align-items: center; gap: 12px; }.resource-index { width: 32px; flex: 0 0 32px; color: var(--aps-faint); font-size: var(--aps-text-xs); font-variant-numeric: tabular-nums; text-align: right; }.resource-copy { display: grid; min-width: 0; flex: 1 1 auto; gap: 2px; }.resource-copy strong { overflow: hidden; color: var(--aps-ink); font-size: var(--aps-text-sm); text-overflow: ellipsis; white-space: nowrap; }.resource-copy span, .resource-row code { color: var(--aps-faint); font-size: var(--aps-text-xs); }.resource-row code { flex: 0 0 auto; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }@media (max-width: 820px) { .virtual-toolbar { align-items: stretch; flex-direction: column; }.virtual-toolbar :deep(.app-input-control) { max-width: none; }.virtual-toolbar-actions { justify-content: flex-start; flex-wrap: wrap; } }@media (max-width: 620px) { .virtual-page-heading { align-items: start; flex-direction: column; gap: 8px; }.resource-row code { display: none; } }
</style>
