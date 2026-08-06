<script setup lang="ts">
import { computed, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppInputTag } from "aps-design-pro";
import { AppForm } from "aps-design-pro";
import { AppTag } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import type { FormItem, FormValue } from "aps-design-pro";

const projectTags = ref(["权限", "订单"]);
const isTagLimitReached = ref(false);
const lastTagAction = ref("可用回车、逗号或粘贴多项内容创建标签。");
const releaseForm = ref<Record<string, FormValue>>({ name: "", tags: ["稳定版"], note: "" });
const releaseFormItems: FormItem[] = [
  { key: "name", label: "版本名称", required: true, placeholder: "例如：2026.08 迭代", span: 2, rules: [{ required: true }] },
  { key: "tags", label: "发布标签", type: "tags", placeholder: "输入标签后按回车", maxTags: 4, tagMaxLength: 12, span: 2, rules: [{ validator: (value) => Array.isArray(value) && value.length > 0 ? true : "至少添加一个发布标签。" }] },
  { key: "note", label: "发布说明", type: "textarea", placeholder: "填写本次发布范围", span: 4 },
];
const releaseTags = computed(() => Array.isArray(releaseForm.value.tags) ? releaseForm.value.tags.filter((value): value is string => typeof value === "string") : []);

function handleTagCreated(value: string): void {
  isTagLimitReached.value = false;
  lastTagAction.value = `已添加标签“${value}”。`;
}

function handleTagRemoved(value: string): void {
  isTagLimitReached.value = false;
  lastTagAction.value = `已移除标签“${value}”。`;
}

function handleTagLimit(maximum: number): void {
  isTagLimitReached.value = true;
  lastTagAction.value = `最多只能保留 ${maximum} 个标签。`;
}

function resetTagDemo(): void {
  projectTags.value = ["权限", "订单"];
  isTagLimitReached.value = false;
  lastTagAction.value = "已恢复默认标签。";
}

function submitReleaseForm(value: Record<string, FormValue>): void {
  lastTagAction.value = `发布表单已通过校验，共包含 ${Array.isArray(value.tags) ? value.tags.length : 0} 个标签。`;
}
</script>

<template>
  <section class="tag-input-page page-content page-stack" aria-label="标签输入组件示例">
    <section class="tag-input-intro"><div><h1>标签与输入</h1><p>用于成员邀请、分类归档、检索条件和内容发布等多值录入场景；标签值始终是可直接提交给接口的字符串数组。</p></div><AppButton variant="secondary" leading-icon="refresh" @click="resetTagDemo">恢复示例</AppButton></section>

    <section class="tag-input-grid">
      <AppCard as="article" padding="large" class="tag-input-card">
        <header><div><h2>可创建标签</h2><p>支持回车、中文逗号、英文逗号、分号和多行粘贴；重复项自动忽略。</p></div><span>多值输入</span></header>
        <AppInputTag v-model="projectTags" placeholder="例如：数据、营销、权限" :max="5" :max-length="10" aria-label="项目标签" @create="handleTagCreated" @remove="handleTagRemoved" @exceed="handleTagLimit" />
        <div class="tag-demo-summary"><div><strong>当前标签</strong><span>{{ projectTags.length }} / 5</span></div><div class="tag-preview"><AppTag v-for="tag in projectTags" :key="tag" :label="tag" tone="blue" size="small" /></div></div>
        <p class="tag-action-message" :class="{ 'is-error': isTagLimitReached }" aria-live="polite">{{ lastTagAction }}</p>
      </AppCard>

      <AppCard as="article" padding="large" class="tag-input-card">
        <header><div><h2>表单字段接入</h2><p>配置式表单已支持标签字段，校验与接口错误回填仍沿用统一表单链路。</p></div><span>配置式表单</span></header>
        <AppForm v-model="releaseForm" :items="releaseFormItems" :columns="4" :gap="20" submit-text="验证表单" @submit="submitReleaseForm" />
        <p class="release-summary">当前发布标签：{{ releaseTags.join("、") || "未填写" }}</p>
      </AppCard>
    </section>
  </section>
</template>

<style scoped>
.tag-input-page { display: grid; align-content: start; gap: var(--aps-page-stack-gap); }.tag-input-intro { display: flex; align-items: end; justify-content: space-between; gap: 24px; }.tag-input-intro h1, .tag-input-intro p { margin: 0; }.tag-input-intro h1 { color: var(--aps-ink); font-size: var(--aps-text-2xl); font-weight: 740; letter-spacing: -.035em; }.tag-input-intro p { max-width: 720px; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }.tag-input-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--aps-page-stack-gap); }.tag-input-card { display: grid; align-content: start; gap: 22px; }.tag-input-card header { display: flex; align-items: start; justify-content: space-between; gap: 18px; }.tag-input-card h2, .tag-input-card p { margin: 0; }.tag-input-card h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: 720; }.tag-input-card header p { margin-top: 7px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.tag-input-card header > span { flex: 0 0 auto; padding: 4px 8px; border-radius: 6px; background: var(--aps-surface-soft); color: var(--aps-faint); font-size: var(--aps-text-xs); font-weight: 650; }.tag-demo-summary { display: grid; gap: 10px; padding: 14px; border: 1px solid var(--aps-line-soft); border-radius: 11px; background: var(--aps-surface-soft); }.tag-demo-summary > div:first-child { display: flex; align-items: center; justify-content: space-between; gap: 12px; }.tag-demo-summary strong { color: var(--aps-muted); font-size: var(--aps-text-sm); font-weight: 650; }.tag-demo-summary span { color: var(--aps-blue); font-size: var(--aps-text-sm); font-variant-numeric: tabular-nums; font-weight: 700; }.tag-preview { display: flex; flex-wrap: wrap; gap: 6px; }.tag-action-message, .release-summary { margin: 0; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.tag-action-message.is-error { color: var(--aps-red); }.release-summary { padding-top: 16px; border-top: 1px solid var(--aps-line-soft); }@media (max-width: 920px) { .tag-input-grid { grid-template-columns: 1fr; }.tag-input-intro { align-items: flex-start; flex-direction: column; gap: 14px; }.tag-input-intro .app-button-control { width: 100%; } }@media (max-width: 560px) { .tag-input-card header > span { display: none; } }
</style>
