<script setup lang="ts">
import { computed, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppStatusTag } from "aps-design-pro";
import { AppDescriptions } from "aps-design-pro";
import { AppCheckbox } from "aps-design-pro";
import { AppCheckboxGroup, type CheckboxGroupLimitEvent } from "aps-design-pro";
import { AppRadio, type RadioValue } from "aps-design-pro";
import { AppRadioGroup } from "aps-design-pro";
import { AppSegmented } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import type { CheckboxOption, DescriptionItem, RadioOption, SelectOption } from "aps-design-pro";

const selectedPermissions = ref(["project:view", "project:export"]);
const selectedNotificationChannels = ref(["in-app"]);
const publicationVisibility = ref("workspace");
const reviewMode = ref("approval");
const thirdPartySyncState = ref<"enabled" | "paused">("enabled");
const retentionPeriod = ref<RadioValue>(30);
const descriptionDirection = ref<"horizontal" | "vertical">("horizontal");
const descriptionLabelAlign = ref<"left" | "right">("right");
const displayWithBorder = ref(true);
const limitMessage = ref("最多可选择三项权限。");

const permissionOptions: CheckboxOption[] = [
  { label: "查看项目", value: "project:view" },
  { label: "导出数据", value: "project:export" },
  { label: "编辑任务", value: "task:write" },
  { label: "管理成员", value: "member:manage" },
  { label: "删除项目", value: "project:delete", disabled: true },
];
const notificationOptions: CheckboxOption[] = [
  { label: "站内通知", value: "in-app", description: "在工作台消息中心同步提醒" },
  { label: "邮件摘要", value: "email", description: "每日汇总未完成项目动态" },
  { label: "移动端推送", value: "push", description: "仅发送重要状态变化" },
];
const directionOptions: SelectOption[] = [
  { label: "横向", value: "horizontal" },
  { label: "纵向", value: "vertical" },
];
const descriptionLabelAlignOptions: SelectOption[] = [
  { label: "标签居左", value: "left" },
  { label: "标签居右", value: "right" },
];
const reviewModeOptions: RadioOption[] = [
  { label: "需要审批", value: "approval" },
  { label: "直接发布", value: "immediate" },
  { label: "定时发布", value: "scheduled" },
];
const projectDescriptions = computed<DescriptionItem[]>(() => [
  { key: "name", label: "项目名称", value: "2026 年交付协同升级", span: 2, minWidth: "260px" },
  { key: "status", label: "当前状态", align: "center", labelAlign: "center" },
  { key: "owner", label: "负责人", value: "林知远" },
  { key: "period", label: "计划周期", value: "2026.08.01 — 2026.09.30", span: 2 },
  { key: "updated", label: "最近更新", value: "今天 10:42" },
]);

function resetPermissions(): void {
  selectedPermissions.value = ["project:view", "project:export"];
  limitMessage.value = "最多可选择三项权限。";
}

function handleLimitExceeded(event: CheckboxGroupLimitEvent): void {
  limitMessage.value = event.type === "maximum"
    ? `已达到最多 ${event.limit} 项，无法添加“${event.option.label}”。`
    : `至少保留 ${event.limit} 项，无法取消“${event.option.label}”。`;
}
</script>

<template>
  <section class="choice-descriptions-view page-content page-stack">
    <AppCard as="section" content-overflow="visible">
      <header class="showcase-heading">
        <div><h2>权限勾选</h2><p>选择结果仅保留稳定权限值；达到上限时会阻止变更并给出明确反馈。</p></div>
        <AppButton variant="secondary" size="small" @click="resetPermissions">恢复默认</AppButton>
      </header>
      <AppCheckboxGroup v-model="selectedPermissions" :options="permissionOptions" appearance="buttons" :max="3" aria-label="项目权限" @limit-exceed="handleLimitExceeded" />
      <footer class="selection-footer"><span>{{ limitMessage }}</span><strong>已选择 {{ selectedPermissions.length }} 项</strong></footer>
      <div class="controlled-value-demo">
        <AppCheckbox v-model="thirdPartySyncState" true-value="enabled" false-value="paused" bordered label="同步第三方项目状态" description="提交值保留为 enabled 或 paused，不依赖布尔值转换。" />
        <span>当前提交值：{{ thirdPartySyncState }}</span>
      </div>
    </AppCard>

    <AppCard as="section">
      <header class="showcase-heading"><div><h2>通知渠道</h2><p>卡片形态适合需要补充说明的多选场景，支持按栅格展示并自动适配小屏幕。</p></div></header>
      <AppCheckboxGroup v-model="selectedNotificationChannels" :options="notificationOptions" appearance="cards" :columns="3" aria-label="通知渠道" />
      <p class="selection-result">已启用：{{ selectedNotificationChannels.map((value) => notificationOptions.find((option) => option.value === value)?.label).filter(Boolean).join("、") || "暂未选择" }}</p>
    </AppCard>

    <AppCard as="section">
      <header class="showcase-heading"><div><h2>发布范围</h2><p>独立单选适合少量明确选项；单选组同时支持按钮式、卡片式与网格化排布。</p></div></header>
      <div class="radio-card-grid"><AppRadio v-model="publicationVisibility" name="publication-visibility" value="workspace" label="仅工作区成员" description="仅可通过成员权限访问内容" appearance="card" /><AppRadio v-model="publicationVisibility" name="publication-visibility" value="public" label="公开展示" description="可在公开产品页中被检索到" appearance="card" /></div>
      <div class="radio-group-row"><div><strong>审核方式</strong><span>当前选择：{{ reviewModeOptions.find((option) => option.value === reviewMode)?.label }}</span></div><AppRadioGroup v-model="reviewMode" :options="reviewModeOptions" appearance="buttons" aria-label="审核方式" /></div>
      <div class="radio-number-demo"><strong>数据保留周期</strong><div><AppRadio v-model="retentionPeriod" name="retention-period" :value="30" label="30 天" /><AppRadio v-model="retentionPeriod" name="retention-period" :value="90" label="90 天" /></div><span>数值型值：{{ retentionPeriod }}</span></div>
    </AppCard>

    <AppCard as="section">
      <header class="showcase-heading description-heading">
        <div><h2>项目概览</h2><p>描述列表支持边框、横纵方向、跨列和具名插槽，可用于详情页、抽屉和信息确认场景。</p></div>
        <div class="description-controls"><AppSegmented v-model="descriptionDirection" :options="directionOptions" size="small" aria-label="描述列表方向" /><AppSegmented v-model="descriptionLabelAlign" :options="descriptionLabelAlignOptions" size="small" aria-label="描述列表标签对齐" /><AppButton :variant="displayWithBorder ? 'primary' : 'secondary'" size="small" @click="displayWithBorder = !displayWithBorder">{{ displayWithBorder ? "已显示边框" : "显示边框" }}</AppButton></div>
      </header>
      <AppDescriptions title="项目字段快照" :items="projectDescriptions" :columns="3" :direction="descriptionDirection" :border="displayWithBorder" :label-align="descriptionLabelAlign" label-width="84px" aria-label="项目概览字段">
        <template #item-status><AppStatusTag tone="info" label="进行中" /></template>
        <template #extra><AppStatusTag tone="success" label="已同步" size="small" /></template>
      </AppDescriptions>
    </AppCard>

    <AppCard as="section" header="可配置卡片" footer="卡片底部可作为状态提示或操作区域" shadow="hover" interactive>
      <p class="card-api-copy">卡片支持标题、底部、阴影策略、内容边距和可见溢出控制；悬停此卡片可验收 hover 阴影。</p>
    </AppCard>
  </section>
</template>

<style scoped>
.choice-descriptions-view { max-width: 1180px; }.showcase-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 22px; }.showcase-heading h2, .showcase-heading p { margin: 0; }.showcase-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: var(--aps-font-weight-heading); letter-spacing: -.02em; }.showcase-heading p { max-width: 68ch; margin-top: 7px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.selection-footer { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--aps-line-soft); font-size: var(--aps-text-xs); }.selection-footer span { color: var(--aps-muted); }.selection-footer strong { flex: 0 0 auto; color: var(--aps-ink); font-weight: var(--aps-font-weight-strong); }.controlled-value-demo { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--aps-line-soft); }.controlled-value-demo > span { flex: 0 0 auto; color: var(--aps-faint); font-size: var(--aps-text-xs); }.selection-result { margin: 18px 0 0; color: var(--aps-muted); font-size: var(--aps-text-sm); }.radio-card-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }.radio-group-row { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--aps-line-soft); }.radio-group-row > div { display: grid; gap: 3px; }.radio-group-row strong, .radio-number-demo strong { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: var(--aps-font-weight-strong); }.radio-group-row span, .radio-number-demo span { color: var(--aps-muted); font-size: var(--aps-text-xs); }.radio-number-demo { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 12px 18px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--aps-line-soft); }.radio-number-demo > div { display: flex; flex-wrap: wrap; gap: 12px 16px; }.description-controls { display: flex; align-items: center; gap: 8px; }.card-api-copy { max-width: 70ch; margin: 0; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }@media (max-width: 720px) { .showcase-heading, .description-heading, .radio-group-row, .controlled-value-demo { align-items: flex-start; flex-direction: column; }.description-controls { flex-wrap: wrap; }.selection-footer { align-items: flex-start; flex-direction: column; }.radio-card-grid { grid-template-columns: 1fr; }.radio-number-demo { grid-template-columns: 1fr; } }
</style>
