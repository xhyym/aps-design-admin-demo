<script setup lang="ts">
import { computed, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppTag } from "aps-design-pro";
import { AppCascader } from "aps-design-pro";
import { AppCascaderPanel } from "aps-design-pro";
import { AppSegmented } from "aps-design-pro";
import { AppSelect } from "aps-design-pro";
import { AppTransfer } from "aps-design-pro";
import { AppTreeSelect } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import type { CascaderOption, SelectOption, TransferOption, TreeOption } from "aps-design-pro";

const permissionOptions: TransferOption[] = [
  { key: "dashboard:view", label: "查看工作台", description: "访问经营概览与个人任务" },
  { key: "order:read", label: "查看订单", description: "查询订单及客户的基础信息" },
  { key: "order:write", label: "处理订单", description: "创建、修改和取消订单" },
  { key: "member:read", label: "查看成员", description: "浏览工作区成员与组织关系" },
  { key: "member:write", label: "管理成员", description: "邀请、停用和调整成员角色" },
  { key: "settings:write", label: "修改全局设置", description: "涉及工作区安全策略", disabled: true },
];
const memberOptions: TransferOption[] = [
  { key: "member-1", label: "林知远", description: "产品负责人" },
  { key: "member-2", label: "周一然", description: "交付经理" },
  { key: "member-3", label: "陈书言", description: "数据分析师" },
  { key: "member-4", label: "许安然", description: "客户成功经理" },
  { key: "member-5", label: "系统机器人", description: "系统账号不可变更", disabled: true },
];
const selectedPermissionKeys = ref(["dashboard:view", "order:read"]);
const selectedMemberKeys = ref(["member-2"]);
const selectedTopic = ref("");
const selectedReviewTopics = ref(["requirements", "research"]);
const selectedDeliveryPaths = ref<string[][]>([["course", "frontend", "vue"], ["delivery", "private"]]);
const selectedAccessKeys = ref(["orders"]);
const selectionControlStatus = ref("最多选择 3 个评审主题；退格可在收起状态下删除最后一个标签。");
const createdTopics = ref<SelectOption[]>([
  { label: "需求拆解", value: "requirements" },
  { label: "交付复盘", value: "retrospective" },
  { label: "用户研究", value: "research" },
]);
const cascaderMode = ref<"single" | "multiple">("single");
const selectedResourcePath = ref(["course", "frontend", "vue"]);
const selectedAudiencePaths = ref<string[][]>([["course", "backend", "java"], ["delivery", "private"]]);
const permissionSummary = computed(() => permissionOptions.filter((option) => selectedPermissionKeys.value.includes(option.key)).map((option) => option.label));
const cascaderModeOptions: SelectOption[] = [
  { label: "单选路径", value: "single" },
  { label: "多选路径", value: "multiple" },
];
const resourceOptions: CascaderOption[] = [
  {
    label: "课程资源",
    value: "course",
    children: [
      { label: "前端开发", value: "frontend", children: [{ label: "Vue 工程化", value: "vue" }, { label: "React 架构", value: "react" }, { label: "移动端开发", value: "mobile" }] },
      { label: "后端服务", value: "backend", children: [{ label: "Java 服务端", value: "java" }, { label: "Go 微服务", value: "go" }, { label: "数据库设计", value: "database" }] },
      { label: "数据智能", value: "data", children: [{ label: "数据分析", value: "analysis" }, { label: "机器学习", value: "ml" }] },
    ],
  },
  {
    label: "交付范围",
    value: "delivery",
    children: [
      { label: "标准交付", value: "standard" },
      { label: "私有部署", value: "private" },
      { label: "定制实施", value: "custom" },
    ],
  },
];
const reviewTopicOptions: SelectOption[] = [
  { label: "需求拆解", value: "requirements", description: "确认交付边界" },
  { label: "用户研究", value: "research", description: "补齐目标用户证据" },
  { label: "技术评审", value: "technical", description: "确认架构可行性" },
  { label: "上线复盘", value: "retrospective", description: "沉淀交付改进项" },
  { label: "风险同步", value: "risk", description: "提前处理阻塞事项" },
];
const accessTreeOptions: TreeOption[] = [
  { label: "工作区", value: "workspace", children: [{ label: "项目概览", value: "dashboard" }, { label: "订单管理", value: "orders" }, { label: "客户资料", value: "customers" }] },
  { label: "系统配置", value: "system", children: [{ label: "成员管理", value: "members" }, { label: "角色权限", value: "roles" }] },
];
const cascaderSelectionText = computed(() => {
  const paths = cascaderMode.value === "single" ? [selectedResourcePath.value] : selectedAudiencePaths.value;
  return paths.map((path) => findCascaderPathLabel(path, resourceOptions)).filter(Boolean).join("、") || "暂未选择";
});

function resetPermissions(): void {
  selectedPermissionKeys.value = ["dashboard:view", "order:read"];
}

/** 创建事件只更新当前演示数据源；生产页面可在此处写入任意后端并回填 options。 */
function addCreatedTopic(option: SelectOption): void {
  if (!createdTopics.value.some((item) => item.value === option.value)) createdTopics.value = [...createdTopics.value, option];
}

function findCascaderPathLabel(path: string[], options: CascaderOption[]): string {
  const labels: string[] = [];
  let currentOptions = options;
  for (const value of path) {
    const option = currentOptions.find((item) => item.value === value);
    if (!option) return "";
    labels.push(option.label);
    currentOptions = option.children ?? [];
  }
  return labels.join(" / ");
}

function resetCascaderSelection(): void {
  selectedResourcePath.value = ["course", "frontend", "vue"];
  selectedAudiencePaths.value = [["course", "backend", "java"], ["delivery", "private"]];
}

function filterResourcePath(keyword: string, option: CascaderOption, path: CascaderOption[]): boolean {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase();
  return option.value.includes(normalizedKeyword) || path.some((item) => item.label.toLocaleLowerCase().includes(normalizedKeyword));
}

function filterAccessNode(keyword: string, option: TreeOption, path: TreeOption[]): boolean {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase();
  return option.value.includes(normalizedKeyword) || path.some((item) => item.label.toLocaleLowerCase().includes(normalizedKeyword));
}

function handleTopicLimit(option: SelectOption, limit: number): void {
  selectionControlStatus.value = `“${option.label}”未加入：当前评审主题最多选择 ${limit} 项。`;
}

function resetSelectionControls(): void {
  selectedReviewTopics.value = ["requirements", "research"];
  selectedDeliveryPaths.value = [["course", "frontend", "vue"], ["delivery", "private"]];
  selectedAccessKeys.value = ["orders"];
  selectionControlStatus.value = "最多选择 3 个评审主题；退格可在收起状态下删除最后一个标签。";
}
</script>

<template>
  <div class="advanced-selection-view page-content">
    <AppCard as="section" content-overflow="visible">
      <div class="showcase-heading"><div><h2>角色权限分配</h2><p>候选项和已选项仅传递稳定 key；搜索、批量勾选、禁用项和顺序归一化都由穿梭框处理。</p></div><span>复杂选择</span></div>
      <AppTransfer v-model="selectedPermissionKeys" :options="permissionOptions" :titles="['可授予权限', '当前角色权限']" aria-label="角色权限分配" />
      <footer class="selection-summary"><div><strong>当前已选 {{ selectedPermissionKeys.length }} 项</strong><span>{{ permissionSummary.join('、') || '暂未选择权限' }}</span></div><AppButton variant="secondary" size="small" @click="resetPermissions">恢复默认权限</AppButton></footer>
    </AppCard>

    <AppCard as="section" content-overflow="visible">
      <div class="showcase-heading"><div><h2>项目成员分配</h2><p>同一组件可在成员、字段、通知对象等业务中复用；不可变更的系统账号始终保持禁用。</p></div><span>业务复用</span></div>
      <AppTransfer v-model="selectedMemberKeys" :options="memberOptions" :titles="['待分配成员', '项目成员']" target-order="push" aria-label="项目成员分配" />
      <footer class="member-summary"><strong>已加入项目</strong><div><AppTag v-for="key in selectedMemberKeys" :key="key" :label="memberOptions.find((option) => option.key === key)?.label ?? key" tone="blue" size="small" /></div></footer>
    </AppCard>

    <AppCard as="section" content-overflow="visible">
      <div class="showcase-heading"><div><h2>可创建选择</h2><p>输入未匹配的主题后可直接创建；组件立即回显新值，并通过创建事件交由业务数据源持久化。</p></div><span>创建与排序</span></div>
      <div class="create-select-grid">
        <label><span>会议主题</span><AppSelect v-model="selectedTopic" :options="createdTopics" filterable allow-create clearable placeholder="输入或创建主题" aria-label="选择或创建会议主题" @create="addCreatedTopic" /></label>
        <div class="topic-preview"><strong>当前主题</strong><span>{{ selectedTopic || "暂未选择" }}</span></div>
      </div>
      <footer class="panel-selection-summary"><span>成员穿梭框使用追加排序，新成员会排在已选成员之后。</span><AppButton variant="secondary" size="small" @click="selectedTopic = ''">清空主题</AppButton></footer>
    </AppCard>

    <AppCard as="section" content-overflow="visible">
      <div class="showcase-heading"><div><h2>嵌入式级联面板</h2><p>独立面板适合放进抽屉、策略配置和长表单，不依赖触发器定位；支持路径过滤、单选、多选与层级展开。</p></div><AppSegmented v-model="cascaderMode" :options="cascaderModeOptions" size="small" aria-label="选择级联面板模式" /></div>
      <AppCascaderPanel v-if="cascaderMode === 'single'" v-model="selectedResourcePath" :options="resourceOptions" filterable aria-label="课程资源级联面板" />
      <AppCascaderPanel v-else v-model="selectedAudiencePaths" :options="resourceOptions" filterable multiple aria-label="可服务范围级联面板" />
      <footer class="panel-selection-summary"><span>{{ cascaderSelectionText }}</span><AppButton variant="secondary" size="small" @click="resetCascaderSelection">恢复默认</AppButton></footer>
    </AppCard>

    <AppCard as="section" content-overflow="visible">
      <div class="showcase-heading"><div><h2>受控选择策略</h2><p>多选限制、标签展示、树筛选与展开状态均由组件受控；页面只保存稳定值，可直接对接任意服务端字段。</p></div><span>能力验收</span></div>
      <div class="selection-control-grid">
        <label class="selection-control-field"><span>评审主题</span><AppSelect v-model="selectedReviewTopics" :options="reviewTopicOptions" multiple filterable clearable :multiple-limit="3" show-description aria-label="选择评审主题" @limit-exceed="handleTopicLimit" /><small>{{ selectionControlStatus }}</small></label>
        <label class="selection-control-field"><span>可交付范围</span><AppCascader v-model="selectedDeliveryPaths" :options="resourceOptions" multiple filterable clearable :show-all-levels="false" :filter-method="filterResourcePath" aria-label="选择可交付范围" /><small>多选标签仅展示最终节点，展开后可检验路径筛选与键盘方向键。</small></label>
        <label class="selection-control-field"><span>页面访问范围</span><AppTreeSelect v-model="selectedAccessKeys" :options="accessTreeOptions" multiple filterable clearable check-on-click-node accordion :default-expanded-keys="['workspace']" :filter-method="filterAccessNode" aria-label="选择页面访问范围" /><small>输入“角色”可验证仅保留匹配分支及其父级；点击节点文字可直接切换勾选。</small></label>
      </div>
      <footer class="panel-selection-summary"><span>当前范围：{{ selectedReviewTopics.length }} 个主题、{{ selectedDeliveryPaths.length }} 条路径、{{ selectedAccessKeys.length }} 个权限值。</span><AppButton variant="secondary" size="small" @click="resetSelectionControls">恢复默认</AppButton></footer>
    </AppCard>
  </div>
</template>

<style scoped>
.advanced-selection-view { display: grid; gap: 28px; }.showcase-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 22px; }.showcase-heading h2, .showcase-heading p { margin: 0; }.showcase-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: var(--aps-font-weight-heading); }.showcase-heading p { max-width: 65ch; margin-top: 7px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.showcase-heading > span { flex: 0 0 auto; padding: 4px 8px; border-radius: 6px; background: var(--aps-surface-soft); color: var(--aps-faint); font-size: var(--aps-text-xs); font-weight: var(--aps-font-weight-primary); }.selection-summary, .member-summary, .panel-selection-summary { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--aps-line-soft); }.selection-summary div { display: grid; min-width: 0; gap: 3px; }.selection-summary strong, .member-summary strong { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: var(--aps-font-weight-strong); }.selection-summary span, .panel-selection-summary span { overflow: hidden; color: var(--aps-muted); font-size: var(--aps-text-xs); text-overflow: ellipsis; white-space: nowrap; }.member-summary > div { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 7px; }.create-select-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(180px, .42fr); gap: 18px; }.create-select-grid label, .topic-preview { display: grid; align-content: start; gap: 8px; }.create-select-grid label > span, .topic-preview strong { color: var(--aps-muted); font-size: var(--aps-text-sm); font-weight: var(--aps-font-weight-primary); }.topic-preview { min-height: var(--aps-control-height); padding: 12px 14px; border: 1px solid var(--aps-line-soft); border-radius: 10px; background: var(--aps-surface-soft); }.topic-preview > span { overflow: hidden; color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: var(--aps-font-weight-strong); text-overflow: ellipsis; white-space: nowrap; }.selection-control-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }.selection-control-field { display: grid; min-width: 0; align-content: start; gap: 8px; padding: 14px; border: 1px solid var(--aps-line-soft); border-radius: 12px; background: var(--aps-surface-soft); }.selection-control-field > span { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: var(--aps-font-weight-strong); }.selection-control-field > small { min-height: 36px; color: var(--aps-faint); font-size: var(--aps-text-xs); line-height: 1.55; }@media (max-width: 920px) { .selection-control-grid { grid-template-columns: 1fr; }.selection-control-field > small { min-height: 0; } }@media (max-width: 720px) { .showcase-heading, .selection-summary, .member-summary, .panel-selection-summary { align-items: flex-start; flex-direction: column; }.member-summary > div { justify-content: flex-start; }.create-select-grid { grid-template-columns: 1fr; } }
</style>
