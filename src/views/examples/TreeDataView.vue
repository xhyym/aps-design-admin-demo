<script setup lang="ts">
import { computed, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppTag } from "aps-design-pro";
import { AppTree } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import type { TreeLoadContext, TreeOption } from "aps-design-pro";

interface WorkspaceNode extends TreeOption {
  kind: "workspace" | "folder" | "resource";
  owner?: string;
  children?: WorkspaceNode[];
}

const WORKSPACE_NODES: WorkspaceNode[] = [
  { label: "产品工作区", value: "workspace-product", kind: "workspace", children: [{ label: "需求与规划", value: "folder-planning", kind: "folder", children: [{ label: "路线图 2026", value: "resource-roadmap", kind: "resource", owner: "林知远" }, { label: "客户反馈归档", value: "resource-feedback", kind: "resource", owner: "王语桐" }] }, { label: "交付与验收", value: "folder-delivery", kind: "folder", children: [{ label: "订单履约工作台", value: "resource-orders", kind: "resource", owner: "陈瑶" }, { label: "权限验收清单", value: "resource-permissions", kind: "resource", owner: "周予安" }] }] },
  { label: "数据工作区", value: "workspace-data", kind: "workspace", children: [{ label: "经营分析", value: "folder-analysis", kind: "folder", children: [{ label: "月度经营报表", value: "resource-monthly", kind: "resource", owner: "张晓晨" }, { label: "指标口径说明", value: "resource-metrics", kind: "resource", owner: "赵珂" }] }] },
];
const VIRTUAL_TREE_NODES: TreeOption[] = Array.from({ length: 480 }, (_, groupIndex) => ({
  label: `资源分组 ${String(groupIndex + 1).padStart(3, "0")}`,
  value: `virtual-group-${groupIndex + 1}`,
  children: Array.from({ length: 6 }, (_, resourceIndex) => ({
    label: `资源条目 ${String(groupIndex + 1).padStart(3, "0")}-${String(resourceIndex + 1).padStart(2, "0")}`,
    value: `virtual-resource-${groupIndex + 1}-${resourceIndex + 1}`,
  })),
}));
const VIRTUAL_TREE_NODE_TOTAL = 480 * 7;
const LAZY_TREE_NODES: TreeOption[] = [
  { label: "客户项目空间", value: "lazy-customer" },
  { label: "历史归档空间", value: "lazy-archive" },
];

const expandedKeys = ref(["workspace-product", "folder-planning", "folder-delivery", "workspace-data", "folder-analysis"]);
const selectedKeys = ref(["resource-roadmap"]);
const checkedKeys = ref(["resource-orders", "resource-permissions"]);
const virtualExpandedKeys = ref(VIRTUAL_TREE_NODES.map((node) => node.value));
const virtualSelectedKeys = ref(["virtual-resource-1-1"]);
const lazyExpandedKeys = ref<string[]>([]);
const lazyCheckedKeys = ref<string[]>([]);
const lazyTreeStatus = ref("展开节点加载子级；“历史归档空间”首次会失败，点击展开按钮可重试。");
const failedLazyNodes = new Set<string>();
const selectedLabel = computed(() => findNodeLabel(selectedKeys.value[0], WORKSPACE_NODES) ?? "未选择节点");
const virtualSelectedLabel = computed(() => findNodeLabel(virtualSelectedKeys.value[0], VIRTUAL_TREE_NODES) ?? "未选择节点");

function findNodeLabel(value: string | undefined, nodes: TreeOption[]): string | undefined {
  if (!value) return undefined;
  for (const node of nodes) {
    if (node.value === value) return node.label;
    const childLabel = findNodeLabel(value, node.children ?? []);
    if (childLabel) return childLabel;
  }
  return undefined;
}

function collectBranchKeys(nodes: TreeOption[]): string[] {
  return nodes.flatMap((node) => node.children?.length ? [node.value, ...collectBranchKeys(node.children)] : []);
}

/** 示例使用可取消的延迟模拟请求时序，组件层始终只接收标准的异步加载函数。 */
function waitForLazyTreeLoad(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, 420);
    signal.addEventListener("abort", () => {
      window.clearTimeout(timer);
      reject(new DOMException("节点加载已取消", "AbortError"));
    }, { once: true });
  });
}

async function loadLazyTreeChildren({ option, signal }: TreeLoadContext): Promise<TreeOption[]> {
  await waitForLazyTreeLoad(signal);
  if (option.value === "lazy-archive" && !failedLazyNodes.has(option.value)) {
    failedLazyNodes.add(option.value);
    throw new Error("归档索引暂时不可用，请再次展开节点重试。");
  }
  const children: Record<string, TreeOption[]> = {
    "lazy-customer": [
      { label: "华东交付组", value: "lazy-customer-east" },
      { label: "华南交付组", value: "lazy-customer-south", leaf: true },
    ],
    "lazy-customer-east": [
      { label: "苏州澄明项目", value: "lazy-customer-east-suzhou", leaf: true },
      { label: "杭州观澜项目", value: "lazy-customer-east-hangzhou", leaf: true },
    ],
    "lazy-archive": [
      { label: "2025 年项目归档", value: "lazy-archive-2025", leaf: true },
      { label: "2024 年项目归档", value: "lazy-archive-2024", leaf: true },
    ],
  };
  return children[option.value] ?? [];
}

function handleLazyTreeLoad(node: TreeOption): void {
  lazyTreeStatus.value = `已加载“${node.label}”的下级资源。`;
}

function handleLazyTreeLoadError(error: Error, node: TreeOption): void {
  lazyTreeStatus.value = `“${node.label}”加载失败：${error.message}`;
}

function handleLazyTreeExpand(node: TreeOption): void {
  lazyTreeStatus.value = `正在展开“${node.label}”，如节点未加载将自动请求子级。`;
}

function handleLazyTreeCollapse(node: TreeOption): void {
  lazyTreeStatus.value = `已收起“${node.label}”。`;
}

function resetTreeState(): void {
  expandedKeys.value = collectBranchKeys(WORKSPACE_NODES);
  selectedKeys.value = ["resource-roadmap"];
  checkedKeys.value = ["resource-orders", "resource-permissions"];
  virtualExpandedKeys.value = VIRTUAL_TREE_NODES.map((node) => node.value);
  virtualSelectedKeys.value = ["virtual-resource-1-1"];
  lazyExpandedKeys.value = [];
  lazyCheckedKeys.value = [];
  failedLazyNodes.clear();
  lazyTreeStatus.value = "展开节点加载子级；“历史归档空间”首次会失败，点击展开按钮可重试。";
}
</script>

<template>
  <section class="tree-data-page page-content page-stack" aria-label="树形数据组件示例">
    <section class="tree-data-intro"><div><h1>树形数据</h1><p>树用于目录、组织、权限和资源层级展示；它与下拉选择器分离，页面可独立控制展开、选中和勾选状态。</p></div><AppButton variant="secondary" leading-icon="refresh" @click="resetTreeState">恢复示例</AppButton></section>

    <section class="tree-data-grid">
      <AppCard as="article" padding="large" class="tree-data-card">
        <header><div><h2>资源目录</h2><p>搜索会保留匹配节点的父级路径；方向键可展开、收起，回车可切换选中项。</p></div><span>浏览与定位</span></header>
        <AppTree v-model:expanded-keys="expandedKeys" v-model:selected-keys="selectedKeys" :nodes="WORKSPACE_NODES" filterable multiple show-line aria-label="资源目录" />
        <footer><span>当前定位：<strong>{{ selectedLabel }}</strong></span><div><AppButton variant="ghost" size="small" @click="expandedKeys = []">收起全部</AppButton><AppButton variant="secondary" size="small" @click="expandedKeys = collectBranchKeys(WORKSPACE_NODES)">展开全部</AppButton></div></footer>
      </AppCard>

      <AppCard as="article" padding="large" class="tree-data-card">
        <header><div><h2>资源授权</h2><p>勾选状态独立于当前定位，适用于批量授权、归档或内容发布范围等业务。</p></div><span>多项勾选</span></header>
        <AppTree v-model:expanded-keys="expandedKeys" v-model:checked-keys="checkedKeys" :nodes="WORKSPACE_NODES" checkable filterable show-line :selectable="false" aria-label="资源授权" />
        <footer><span>已勾选 {{ checkedKeys.length }} 项</span><div class="checked-tags"><AppTag v-for="key in checkedKeys" :key="key" :label="findNodeLabel(key, WORKSPACE_NODES) ?? key" tone="blue" size="small" /></div></footer>
      </AppCard>

      <AppCard as="article" padding="large" class="tree-data-card lazy-tree-card">
        <header><div><h2>按需加载与手风琴</h2><p>懒加载、失败重试、手风琴收起与点击勾选由同一个 AppTree 组合；业务层只提供子级数据与稳定节点值。</p></div><span>异步层级</span></header>
        <AppTree v-model:expanded-keys="lazyExpandedKeys" v-model:checked-keys="lazyCheckedKeys" :nodes="LAZY_TREE_NODES" lazy :load-data="loadLazyTreeChildren" accordion checkable check-on-click-node filterable show-line :selectable="false" aria-label="按需加载项目树" @load="handleLazyTreeLoad" @load-error="handleLazyTreeLoadError" @node-expand="handleLazyTreeExpand" @node-collapse="handleLazyTreeCollapse" />
        <footer><span class="lazy-tree-status" aria-live="polite">{{ lazyTreeStatus }}</span><div><AppTag :label="`已勾选 ${lazyCheckedKeys.length} 项`" tone="blue" size="small" /></div></footer>
      </AppCard>

      <AppCard as="article" padding="large" class="tree-data-card virtual-tree-card">
        <header><div><h2>大规模资源树</h2><p>3,360 个节点使用同一个 AppTree，通过虚拟渲染只保留当前视口附近的节点；搜索、展开和选中状态仍可直接交互验收。</p></div><span>虚拟渲染</span></header>
        <AppTree v-model:expanded-keys="virtualExpandedKeys" v-model:selected-keys="virtualSelectedKeys" :nodes="VIRTUAL_TREE_NODES" virtual :virtual-height="360" :virtual-item-height="42" filterable show-line aria-label="大规模资源树" />
        <footer><span>共 {{ VIRTUAL_TREE_NODE_TOTAL.toLocaleString() }} 个节点，当前定位：<strong>{{ virtualSelectedLabel }}</strong></span><div><AppButton variant="ghost" size="small" @click="virtualExpandedKeys = []">收起全部</AppButton><AppButton variant="secondary" size="small" @click="virtualExpandedKeys = VIRTUAL_TREE_NODES.map((node) => node.value)">展开全部</AppButton></div></footer>
      </AppCard>
    </section>
  </section>
</template>

<style scoped>
.tree-data-page { display: grid; align-content: start; gap: var(--aps-page-stack-gap); }.tree-data-intro { display: flex; align-items: end; justify-content: space-between; gap: 24px; }.tree-data-intro h1, .tree-data-intro p { margin: 0; }.tree-data-intro h1 { color: var(--aps-ink); font-size: var(--aps-text-2xl); font-weight: var(--aps-font-weight-heading); letter-spacing: -.035em; }.tree-data-intro p { max-width: 720px; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }.tree-data-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--aps-page-stack-gap); }.tree-data-card { display: grid; align-content: start; gap: 20px; }.virtual-tree-card { grid-column: 1 / -1; }.tree-data-card header { display: flex; align-items: start; justify-content: space-between; gap: 18px; }.tree-data-card h2, .tree-data-card p { margin: 0; }.tree-data-card h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: var(--aps-font-weight-heading); }.tree-data-card header p { margin-top: 7px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.tree-data-card header > span { flex: 0 0 auto; padding: 4px 8px; border-radius: 6px; background: var(--aps-surface-soft); color: var(--aps-faint); font-size: var(--aps-text-xs); font-weight: var(--aps-font-weight-primary); }.tree-data-card footer { display: flex; min-height: 35px; align-items: center; justify-content: space-between; gap: 12px; padding-top: 16px; border-top: 1px solid var(--aps-line-soft); color: var(--aps-muted); font-size: var(--aps-text-sm); }.tree-data-card footer strong { color: var(--aps-ink); font-weight: var(--aps-font-weight-strong); }.tree-data-card footer > div { display: inline-flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }.checked-tags { max-width: 65%; }.checked-tags :deep(.app-tag) { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }.lazy-tree-status { min-width: 0; flex: 1; line-height: 1.5; }@media (max-width: 920px) { .tree-data-grid { grid-template-columns: 1fr; }.tree-data-intro { align-items: flex-start; flex-direction: column; gap: 14px; }.tree-data-intro .app-button-control { width: 100%; } }.tree-data-card header > span { max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }@media (max-width: 560px) { .tree-data-card header > span { display: none; }.tree-data-card footer { align-items: flex-start; flex-direction: column; }.tree-data-card footer > div { justify-content: flex-start; }.checked-tags { max-width: none; } }
</style>
