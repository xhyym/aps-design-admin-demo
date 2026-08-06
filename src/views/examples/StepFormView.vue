<script setup lang="ts">
import { ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppStepForm } from "aps-design-pro";
import { AppAlert } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import type { FormValue, FormWorkflowStep } from "aps-design-pro";

const activeStep = ref(0);
const model = ref<Record<string, FormValue>>({ name: "", category: "", delivery: "cloud", endpoint: "" });
const statusMessage = ref("依次填写信息；每一步通过校验后才可进入下一步。");
const steps: FormWorkflowStep[] = [
  { key: "basic", title: "基础信息", description: "填写项目名称和所属分类。", items: [{ key: "name", label: "项目名称", required: true, rules: [{ required: true }], span: 6 }, { key: "category", label: "项目分类", type: "select", required: true, rules: [{ required: true }], options: [{ label: "产品研发", value: "product" }, { label: "客户交付", value: "delivery" }], span: 6 }] },
  { key: "delivery", title: "交付设置", description: "私有部署需补充服务地址。", items: [{ key: "delivery", label: "部署方式", type: "select", options: [{ label: "云端协作", value: "cloud" }, { label: "私有部署", value: "private" }], span: 6 }, { key: "endpoint", label: "服务地址", visibleWhen: { field: "delivery", operator: "equals", value: "private" }, clearWhenHidden: true, required: true, rules: [{ required: true }], span: 6 }], beforeNext: async (value) => { await new Promise((resolve) => window.setTimeout(resolve, 240)); return value.category === "delivery" && value.delivery === "cloud" ? "客户交付项目需要选择私有部署。" : true; } },
  { key: "confirm", title: "确认提交", description: "确认已填写的信息并提交。", items: [] },
];
function submit(value: Record<string, FormValue>): void { statusMessage.value = `已提交“${value.name}”的项目配置。`; }
function reset(): void { activeStep.value = 0; model.value = { name: "", category: "", delivery: "cloud", endpoint: "" }; statusMessage.value = "已恢复初始草稿。"; }
</script>
<template><section class="step-form-view page-content page-stack" aria-label="多步骤表单组件示例"><header><div><h1>多步骤业务表单</h1><p>每一步复用统一字段校验；前置业务规则异步执行，回退不会丢失草稿。</p></div><AppButton variant="secondary" leading-icon="refresh" @click="reset">恢复示例</AppButton></header><AppAlert tone="info" title="当前状态" :description="statusMessage" /><AppCard as="article" padding="large"><AppStepForm v-model="model" v-model:active-step="activeStep" :steps="steps" :columns="12" @step-error="(_, message) => statusMessage = message" @submit="submit" /></AppCard></section></template>
<style scoped>
.step-form-view { display:grid; align-content:start; gap:var(--aps-page-stack-gap); }.step-form-view>header { display:flex; align-items:end; justify-content:space-between; gap:24px; }.step-form-view h1,.step-form-view p { margin:0; }.step-form-view h1 { color:var(--aps-ink); font-size:var(--aps-text-2xl); font-weight:740; letter-spacing:-.035em; }.step-form-view p { max-width:720px; margin-top:8px; color:var(--aps-muted); font-size:var(--aps-text-sm); line-height:1.65; }@media (max-width:640px){.step-form-view>header{align-items:flex-start;flex-direction:column}.step-form-view>header .app-button-control{width:100%;}}
</style>
