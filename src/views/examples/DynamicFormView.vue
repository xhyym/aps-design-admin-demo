<script setup lang="ts">
import { computed, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppCascader } from "aps-design-pro";
import { AppForm } from "aps-design-pro";
import { AppTreeSelect } from "aps-design-pro";
import { AppAlert } from "aps-design-pro";
import { AppTag } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import type { CascaderLoadRequest, CascaderOption, FormItem, FormValue, TreeOption, TreeSelectLoadRequest } from "aps-design-pro";

const cascaderRootOptions: CascaderOption[] = [
  { label: "华北区域", value: "region-north", leaf: false },
  { label: "华东区域", value: "region-east", leaf: false },
  { label: "受限资源区", value: "region-restricted", leaf: false },
];
const treeRootOptions: TreeOption[] = [
  { label: "产品研发中心", value: "tree-product", leaf: false },
  { label: "交付运营中心", value: "tree-delivery", leaf: false },
  { label: "归档业务线", value: "tree-archive", leaf: false },
];
const formModel = ref<Record<string, FormValue>>({
  deployment: "cloud",
  region: [],
  department: "",
  notification: "email",
  privateEndpoint: "",
  contactNumber: "",
  workspaceCode: "",
  note: "",
});
const directCascaderValue = ref<string[]>([]);
const directTreeValue = ref("");
const advancedFormRef = ref<{ resetFields: (keys?: string[]) => void } | null>(null);
const interactionStatus = ref("选择节点后将按需载入子级；受限节点首次会展示失败重试状态。");
const advancedFormStatus = ref("调整字段后可直接提交，输出始终是稳定的基础值与 key 数组。");
const failedOnce = new Set<string>();

const formItems: FormItem[] = [
  {
    key: "deployment",
    label: "部署方式",
    type: "select",
    options: [{ label: "云端协作", value: "cloud" }, { label: "私有部署", value: "private" }],
    required: true,
    rules: [{ required: true }],
    span: 2,
  },
  {
    key: "region",
    label: "服务区域",
    type: "cascader",
    cascaderOptions: cascaderRootOptions,
    cascaderLazy: true,
    cascaderLoadData: loadCascaderChildren,
    placeholder: "选择区域与城市",
    required: true,
    rules: [{ required: true }],
    span: 2,
  },
  {
    key: "department",
    label: "协作组织",
    type: "tree-select",
    treeOptions: treeRootOptions,
    treeLazy: true,
    treeLoadData: loadTreeChildren,
    placeholder: "选择负责组织",
    required: true,
    rules: [{ required: true }],
    span: 2,
  },
  {
    key: "privateEndpoint",
    label: "服务地址",
    placeholder: "例如 https://service.example.com",
    visibleWhen: { field: "deployment", operator: "equals", value: "private" },
    clearWhenHidden: true,
    required: true,
    rules: [{ required: true, message: "私有部署需要填写服务地址。", trigger: ["blur", "submit"] }],
    span: 3,
  },
  {
    key: "workspaceCode",
    label: "工作区编码",
    placeholder: "私有部署后可填写",
    disabled: { field: "deployment", operator: "not-equals", value: "private" },
    span: 3,
  },
  {
    key: "notification",
    label: "通知方式",
    type: "select",
    options: [{ label: "邮件通知", value: "email" }, { label: "短信通知", value: "sms" }],
    span: 2,
  },
  {
    key: "contactNumber",
    label: "通知手机号",
    inputType: "tel",
    placeholder: "用于接收上线提醒",
    visibleWhen: {
      match: "all",
      rules: [
        { field: "deployment", operator: "equals", value: "private" },
        { field: "notification", operator: "equals", value: "sms" },
      ],
    },
    clearWhenHidden: true,
    required: true,
    rules: [{ required: true, message: "短信通知需要填写手机号。", trigger: ["blur", "submit"] }, { pattern: /^1\d{10}$/, message: "请输入正确的 11 位手机号。", trigger: ["blur", "submit"] }],
    span: 4,
  },
  { key: "note", label: "补充说明", type: "textarea", placeholder: "可选填写协作说明", span: 6 },
];

/**
 * 同一个 AppForm 直接编排已有控件，验证配置式表单不会因控件类型增加而产生第二套实现。
 * 这组字段特意覆盖复选、单选、滑块、评分、颜色、时间选项与穿梭框等此前未接入的能力。
 */
const advancedFormModel = ref<Record<string, FormValue>>({
  featureEnabled: true,
  audiences: ["member"],
  publishMode: "approval",
  priority: 64,
  qualityScore: 4,
  accentColor: "#0071E3",
  publishAt: "10:00",
  approvers: ["reviewer-1"],
});
const advancedFormItems: FormItem[] = [
  {
    key: "featureEnabled",
    label: "启用预发布",
    type: "checkbox",
    placeholder: "本次变更进入灰度环境",
    span: 2,
  },
  {
    key: "audiences",
    label: "可见范围",
    type: "checkbox-group",
    options: [
      { label: "项目成员", value: "member", description: "已加入当前项目的成员" },
      { label: "交付团队", value: "delivery", description: "具备交付协作权限的成员" },
      { label: "外部访客", value: "guest", description: "需要额外的访问码验证" },
    ],
    required: true,
    rules: [{ required: true, message: "至少选择一个可见范围。" }],
    span: 4,
  },
  {
    key: "publishMode",
    label: "发布方式",
    type: "radio-group",
    options: [
      { label: "需要审批", value: "approval" },
      { label: "定时发布", value: "scheduled" },
      { label: "立即发布", value: "immediate" },
    ],
    required: true,
    rules: [{ required: true }],
    span: 3,
  },
  {
    key: "publishAt",
    label: "开放时段",
    type: "time-select",
    timeStart: "08:00",
    timeEnd: "20:00",
    minTime: "09:00",
    maxTime: "18:30",
    step: 30,
    required: true,
    rules: [{ required: true }],
    span: 3,
  },
  {
    key: "priority",
    label: "资源配额",
    type: "slider",
    min: 0,
    max: 100,
    step: 5,
    showInput: true,
    sliderMarks: [{ value: 0, label: "低" }, { value: 50, label: "中" }, { value: 100, label: "高" }],
    span: 3,
  },
  {
    key: "qualityScore",
    label: "上线信心",
    type: "rate",
    max: 5,
    allowHalf: true,
    rateTexts: ["待完善", "需复核", "可灰度", "可上线", "信心充分"],
    span: 3,
  },
  {
    key: "accentColor",
    label: "强调颜色",
    type: "color",
    colorPresets: ["#0071E3", "#23814A", "#B35D00", "#C6281B"],
    span: 2,
  },
  {
    key: "approvers",
    label: "审批成员",
    type: "transfer",
    transferTitles: ["可选成员", "审批成员"],
    transferOptions: [
      { key: "reviewer-1", label: "林知远", description: "产品负责人" },
      { key: "reviewer-2", label: "周一然", description: "交付经理" },
      { key: "reviewer-3", label: "陈书言", description: "质量负责人" },
      { key: "reviewer-4", label: "许安然", description: "客户成功经理" },
      { key: "reviewer-system", label: "系统机器人", description: "系统账号不可移除", disabled: true },
    ],
    required: true,
    rules: [{ required: true, message: "至少指定一位审批成员。" }],
    span: 6,
  },
];

const formSummary = computed(() => ({
  deployment: formModel.value.deployment === "private" ? "私有部署" : "云端协作",
  notification: formModel.value.notification === "sms" ? "短信通知" : "邮件通知",
  endpoint: String(formModel.value.privateEndpoint || "未启用"),
  contact: String(formModel.value.contactNumber || "未填写"),
}));

function waitForLoading(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, 420);
    signal.addEventListener("abort", () => {
      window.clearTimeout(timer);
      reject(new Error("层级数据请求已取消。"));
    }, { once: true });
  });
}

/** 业务层可在此接入任意接口；示例仅返回稳定值，不让组件依赖具体服务格式。 */
async function loadCascaderChildren({ option, signal }: Parameters<CascaderLoadRequest>[0]): Promise<CascaderOption[]> {
  await waitForLoading(signal);
  if (option.value === "region-restricted" && !failedOnce.has(option.value)) {
    failedOnce.add(option.value);
    throw new Error("当前资源暂不可用，请重试。");
  }
  const data: Record<string, CascaderOption[]> = {
    "region-north": [{ label: "北京市", value: "region-north-beijing", leaf: false }, { label: "天津市", value: "region-north-tianjin", leaf: false }],
    "region-east": [{ label: "上海市", value: "region-east-shanghai", leaf: false }, { label: "杭州市", value: "region-east-hangzhou", leaf: false }],
    "region-restricted": [{ label: "专项服务组", value: "region-restricted-special", leaf: true }],
    "region-north-beijing": [{ label: "海淀区", value: "region-north-beijing-haidian", leaf: true }, { label: "朝阳区", value: "region-north-beijing-chaoyang", leaf: true }],
    "region-north-tianjin": [{ label: "和平区", value: "region-north-tianjin-heping", leaf: true }],
    "region-east-shanghai": [{ label: "浦东新区", value: "region-east-shanghai-pudong", leaf: true }, { label: "静安区", value: "region-east-shanghai-jingan", leaf: true }],
    "region-east-hangzhou": [{ label: "西湖区", value: "region-east-hangzhou-xihu", leaf: true }],
  };
  return data[option.value] ?? [];
}

/** 树选择使用与级联完全一致的取消、缓存和重试语义，业务层只需关心节点数据。 */
async function loadTreeChildren({ option, signal }: Parameters<TreeSelectLoadRequest>[0]): Promise<TreeOption[]> {
  await waitForLoading(signal);
  if (option.value === "tree-archive" && !failedOnce.has(option.value)) {
    failedOnce.add(option.value);
    throw new Error("归档业务线正在整理，请重试。");
  }
  const data: Record<string, TreeOption[]> = {
    "tree-product": [{ label: "前端平台组", value: "tree-product-web", leaf: true }, { label: "服务端研发组", value: "tree-product-service", leaf: true }],
    "tree-delivery": [{ label: "实施交付组", value: "tree-delivery-implementation", leaf: true }, { label: "客户成功组", value: "tree-delivery-success", leaf: true }],
    "tree-archive": [{ label: "历史项目组", value: "tree-archive-history", leaf: true }],
  };
  return data[option.value] ?? [];
}

function handleCascaderLoad(option: CascaderOption): void {
  interactionStatus.value = `已载入“${option.label}”的下级选项。`;
}

function handleTreeLoad(option: TreeOption): void {
  interactionStatus.value = `已载入“${option.label}”的下级组织。`;
}

function handleLoadError(error: Error): void {
  interactionStatus.value = error.message;
}

function handleSubmit(value: Record<string, FormValue>): void {
  interactionStatus.value = `表单校验通过，将提交 ${Object.keys(value).length} 个字段。`;
}

function handleAdvancedSubmit(value: Record<string, FormValue>): void {
  advancedFormStatus.value = `校验通过：开放时段 ${String(value.publishAt)}，已指定 ${Array.isArray(value.approvers) ? value.approvers.length : 0} 位审批成员。`;
}

/** 局部重置复用表单初始化快照，不需要页面另存一份字段默认值。 */
function resetAdvancedPriority(): void {
  advancedFormRef.value?.resetFields(["priority"]);
  advancedFormStatus.value = "已仅恢复资源配额，其余已编辑字段保持不变。";
}

/** 示例同步显示字段校验结果，便于直接确认 blur 与提交两种触发时机。 */
function handleFieldValidate(field: string, valid: boolean, message: string): void {
  interactionStatus.value = valid ? `“${field}”字段校验通过。` : message;
}

function resetDemo(): void {
  failedOnce.clear();
  formModel.value = { deployment: "cloud", region: [], department: "", notification: "email", privateEndpoint: "", contactNumber: "", workspaceCode: "", note: "" };
  directCascaderValue.value = [];
  directTreeValue.value = "";
  resetAdvancedForm();
  interactionStatus.value = "已恢复初始状态，可重新验证显示、禁用、懒加载和重试。";
}

function resetAdvancedForm(): void {
  advancedFormModel.value = {
    featureEnabled: true,
    audiences: ["member"],
    publishMode: "approval",
    priority: 64,
    qualityScore: 4,
    accentColor: "#0071E3",
    publishAt: "10:00",
    approvers: ["reviewer-1"],
  };
  advancedFormStatus.value = "已恢复配置式控件的初始值。";
}
</script>

<template>
  <section class="dynamic-form-view page-content page-stack" aria-label="动态表单与层级选择组件示例">
    <header class="dynamic-form-intro">
      <div><h1>动态表单与层级选择</h1><p>表单项通过模型条件声明显示和禁用状态；级联与树选择按需获取子级，组件统一处理缓存、取消、加载失败与重试。</p></div>
      <AppButton variant="secondary" leading-icon="refresh" @click="resetDemo">恢复示例</AppButton>
    </header>

    <AppAlert tone="info" title="当前交互状态" :description="interactionStatus" />

    <section class="dynamic-form-grid">
      <AppCard as="article" padding="large" content-overflow="visible" class="form-card">
        <header class="card-heading"><div><h2>配置式业务表单</h2><p>切换“私有部署”和“短信通知”可查看字段显示、自动清理与禁用联动。</p></div><span>字段规则</span></header>
        <AppForm v-model="formModel" :items="formItems" :columns="6" :gap="22" submit-text="验证并提交" @submit="handleSubmit" @field-validate="handleFieldValidate" @reset="resetDemo" />
      </AppCard>

      <AppCard as="section" padding="large" class="summary-card">
        <header class="card-heading"><div><h2>当前配置</h2><p>仅展示可直接提交给业务服务的稳定值。</p></div><span>实时预览</span></header>
        <dl class="form-summary">
          <div><dt>部署方式</dt><dd>{{ formSummary.deployment }}</dd></div>
          <div><dt>通知方式</dt><dd>{{ formSummary.notification }}</dd></div>
          <div><dt>服务地址</dt><dd>{{ formSummary.endpoint }}</dd></div>
          <div><dt>通知号码</dt><dd>{{ formSummary.contact }}</dd></div>
        </dl>
        <section class="rule-notes" aria-label="规则说明"><strong>联动规则</strong><p>私有部署时显示服务地址，并允许填写工作区编码；私有部署且选择短信通知时，才显示通知手机号。</p></section>
      </AppCard>
    </section>

    <AppCard as="section" padding="large" content-overflow="visible" class="advanced-form-card">
      <header class="card-heading"><div><h2>配置式控件编排</h2><p>这些字段全部由 AppForm 的类型配置生成，提交值保持为 boolean、number、string 与 key 数组；业务无需为每种控件手写另一套表单布局。</p></div><div class="form-header-actions"><AppButton variant="ghost" size="small" @click="resetAdvancedPriority">仅重置配额</AppButton><span>统一编排</span></div></header>
      <AppForm ref="advancedFormRef" v-model="advancedFormModel" :items="advancedFormItems" :columns="6" :gap="22" submit-text="验证配置" @submit="handleAdvancedSubmit" @reset="resetAdvancedForm" />
      <output class="advanced-form-status" aria-live="polite">{{ advancedFormStatus }}</output>
    </AppCard>

    <section class="selection-grid">
      <AppCard as="article" padding="large" content-overflow="visible" class="selection-card">
        <header class="card-heading"><div><h2>级联懒加载</h2><p>展开“受限资源区”后会先显示失败状态，再次点击即可重试。</p></div><span>按路径缓存</span></header>
        <AppCascader v-model="directCascaderValue" :options="cascaderRootOptions" lazy :load-data="loadCascaderChildren" filterable clearable aria-label="服务区域级联选择" @load="handleCascaderLoad" @load-error="handleLoadError" />
        <footer class="selection-footer"><span>当前路径</span><strong>{{ directCascaderValue.join(" / ") || "未选择" }}</strong></footer>
      </AppCard>

      <AppCard as="article" padding="large" content-overflow="visible" class="selection-card">
        <header class="card-heading"><div><h2>树选择懒加载</h2><p>树节点首次展开时获取子级；失败节点保留原位置并支持重试。</p></div><span>节点缓存</span></header>
        <AppTreeSelect v-model="directTreeValue" :options="treeRootOptions" lazy :load-data="loadTreeChildren" filterable clearable aria-label="协作组织树选择" @load="handleTreeLoad" @load-error="handleLoadError" />
        <footer class="selection-footer"><span>当前组织</span><AppTag :label="directTreeValue || '未选择'" tone="blue" size="small" /></footer>
      </AppCard>
    </section>
  </section>
</template>

<style scoped>
.dynamic-form-view { display: grid; align-content: start; gap: var(--aps-page-stack-gap); }.dynamic-form-intro { display: flex; align-items: end; justify-content: space-between; gap: 24px; }.dynamic-form-intro h1, .dynamic-form-intro p { margin: 0; }.dynamic-form-intro h1 { color: var(--aps-ink); font-size: var(--aps-text-2xl); font-weight: 740; letter-spacing: -.035em; }.dynamic-form-intro p { max-width: 770px; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }.dynamic-form-grid { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(260px, .7fr); gap: var(--aps-page-stack-gap); align-items: start; }.form-card, .summary-card, .selection-card, .advanced-form-card { display: grid; align-content: start; gap: 22px; }.card-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }.card-heading h2, .card-heading p { margin: 0; }.card-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: 720; }.card-heading p { max-width: 54ch; margin-top: 7px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.card-heading > span, .form-header-actions > span { flex: 0 0 auto; padding: 4px 8px; border-radius: 6px; background: var(--aps-surface-soft); color: var(--aps-faint); font-size: var(--aps-text-xs); font-weight: 650; }.form-header-actions { display: inline-flex; align-items: center; justify-content: flex-end; gap: 8px; }.form-summary { display: grid; gap: 0; margin: 0; border-top: 1px solid var(--aps-line-soft); }.form-summary > div { display: grid; grid-template-columns: 80px minmax(0, 1fr); gap: 14px; padding: 13px 0; border-bottom: 1px solid var(--aps-line-soft); }.form-summary dt { color: var(--aps-faint); font-size: var(--aps-text-xs); }.form-summary dd { min-width: 0; margin: 0; overflow: hidden; color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: 620; text-align: right; text-overflow: ellipsis; white-space: nowrap; }.rule-notes { padding: 14px; border: 1px solid var(--aps-line-soft); border-radius: 11px; background: var(--aps-surface-soft); }.rule-notes strong { color: var(--aps-ink); font-size: var(--aps-text-sm); }.rule-notes p { margin: 6px 0 0; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.advanced-form-status { display: block; min-height: 20px; padding-top: 15px; border-top: 1px solid var(--aps-line-soft); color: var(--aps-muted); font-size: var(--aps-text-sm); }.selection-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--aps-page-stack-gap); }.selection-footer { display: flex; min-width: 0; align-items: center; justify-content: space-between; gap: 14px; padding-top: 16px; border-top: 1px solid var(--aps-line-soft); }.selection-footer span { color: var(--aps-faint); font-size: var(--aps-text-sm); }.selection-footer strong { min-width: 0; overflow: hidden; color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: 650; text-align: right; text-overflow: ellipsis; white-space: nowrap; }@media (max-width: 980px) { .dynamic-form-grid { grid-template-columns: 1fr; }.selection-grid { grid-template-columns: 1fr; }.dynamic-form-intro { align-items: flex-start; flex-direction: column; gap: 14px; }.dynamic-form-intro .app-button-control { width: 100%; } }@media (max-width: 560px) { .card-heading > span, .form-header-actions > span { display: none; }.form-header-actions { width: 100%; justify-content: flex-start; }.selection-footer { align-items: flex-start; flex-direction: column; }.selection-footer strong { text-align: left; } }
</style>
