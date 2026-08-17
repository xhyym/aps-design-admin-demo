<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
  AppButton,
  AppCard,
  AppConfirmDialog,
  AppDataTable,
  AppDialog,
  AppFilterBar,
  AppFormField,
  AppIconButton,
  AppInput,
  AppInputTag,
  AppPagination,
  AppSearchInput,
  AppSelect,
  AppStatusTag,
  AppTableActions,
  AppTableOperationBar,
  AppTableToolbar,
  AppTooltip,
} from "aps-design-pro";
import type { DataTableColumn, SelectOption, StatusTone } from "aps-design-pro";
import { createSpecificationTemplate, getSpecificationTemplates, removeSpecificationTemplate, updateSpecificationTemplate } from "@/api/modules/ecommerce";
import { useFeedbackStore } from "@/stores/feedback";
import type { SpecificationTemplate, SpecificationTemplateAttribute, SpecificationTemplateSaveInput, SpecificationTemplateStatus } from "@/types/ecommerce";

interface SpecificationTemplateDraft extends SpecificationTemplateSaveInput {
  id?: string;
}

const TEMPLATE_CODE_PATTERN = /^[a-z][a-z0-9-]{1,47}$/;
const TABLE_COLUMNS: DataTableColumn<SpecificationTemplate>[] = [
  { key: "name", label: "模板名称", defaultWidth: 220, minWidth: 180 },
  { key: "code", label: "模板编码", defaultWidth: 174, minWidth: 146 },
  { key: "attributes", label: "规格项", defaultWidth: 210, minWidth: 160 },
  { key: "productCount", label: "关联商品", defaultWidth: 126, minWidth: 108, align: "right" },
  { key: "status", label: "使用状态", defaultWidth: 126, minWidth: 108 },
  { key: "updatedAt", label: "最近更新", defaultWidth: 148, minWidth: 128 },
];
const statusOptions: SelectOption[] = [
  { label: "全部状态", value: "" },
  { label: "使用中", value: "enabled" },
  { label: "草稿", value: "draft" },
  { label: "已停用", value: "disabled" },
];
const formStatusOptions: SelectOption[] = statusOptions.filter((item) => item.value);

const feedbackStore = useFeedbackStore();
const keyword = ref("");
const status = ref<"" | SpecificationTemplateStatus>("");
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const templates = ref<SpecificationTemplate[]>([]);
const isLoading = ref(false);
const errorMessage = ref("");
const isDialogOpen = ref(false);
const isSaving = ref(false);
const formError = ref("");
const deleteTarget = ref<SpecificationTemplate | null>(null);
const isDeleting = ref(false);
const draft = reactive<SpecificationTemplateDraft>(createEmptyDraft());

const dialogTitle = computed(() => draft.id ? "编辑规格模板" : "新建规格模板");
const deleteDescription = computed(() => {
  const target = deleteTarget.value;
  if (!target) return "删除后不可恢复。";
  if (target.productCount > 0) return `该模板仍关联 ${target.productCount} 个商品，请先解除关联后再删除。`;
  return `删除“${target.name}”后不可恢复。`;
});

function createEmptyAttribute(index = 1): SpecificationTemplateAttribute {
  return { id: `draft-attribute-${index}-${Date.now()}`, name: "", values: [] };
}

function createEmptyDraft(): SpecificationTemplateDraft {
  return { id: undefined, name: "", code: "", description: "", attributes: [createEmptyAttribute()], status: "draft" };
}

function getStatusDisplay(value: SpecificationTemplateStatus): { label: string; tone: StatusTone } {
  if (value === "enabled") return { label: "使用中", tone: "success" };
  if (value === "disabled") return { label: "已停用", tone: "neutral" };
  return { label: "草稿", tone: "warning" };
}

function getAttributeSummary(attributes: SpecificationTemplateAttribute[]): string {
  return attributes.map((attribute) => `${attribute.name}（${attribute.values.length}）`).join("、");
}

function addAttribute(): void {
  if (draft.attributes.length >= 10) {
    formError.value = "最多配置 10 个规格项。";
    return;
  }
  draft.attributes.push(createEmptyAttribute(draft.attributes.length + 1));
  formError.value = "";
}

function removeAttribute(attributeId: string): void {
  if (draft.attributes.length <= 1) {
    formError.value = "至少保留 1 个规格项。";
    return;
  }
  draft.attributes = draft.attributes.filter((attribute) => attribute.id !== attributeId);
  formError.value = "";
}

async function loadTemplates(): Promise<void> {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const result = await getSpecificationTemplates({
      keyword: keyword.value.trim() || undefined,
      status: status.value || undefined,
      page: page.value,
      pageSize: pageSize.value,
    });
    templates.value = result.list;
    total.value = result.total;
    if (result.total > 0 && page.value > Math.ceil(result.total / pageSize.value)) {
      page.value = Math.max(1, Math.ceil(result.total / pageSize.value));
      await loadTemplates();
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "无法加载规格模板，请稍后重试。";
  } finally {
    isLoading.value = false;
  }
}

function submitFilters(): void {
  page.value = 1;
  void loadTemplates();
}

function resetFilters(): void {
  keyword.value = "";
  status.value = "";
  page.value = 1;
  void loadTemplates();
}

function updatePage(nextPage: number): void {
  page.value = nextPage;
  void loadTemplates();
}

function updatePageSize(nextPageSize: number): void {
  pageSize.value = nextPageSize;
  page.value = 1;
  void loadTemplates();
}

function openCreateDialog(): void {
  Object.assign(draft, createEmptyDraft());
  formError.value = "";
  isDialogOpen.value = true;
}

function openEditDialog(template: SpecificationTemplate): void {
  Object.assign(draft, {
    id: template.id,
    name: template.name,
    code: template.code,
    description: template.description,
    attributes: template.attributes.map((attribute) => ({ ...attribute, values: [...attribute.values] })),
    status: template.status,
  });
  formError.value = "";
  isDialogOpen.value = true;
}

function handleDialogVisible(visible: boolean): void {
  if (visible) {
    isDialogOpen.value = true;
    return;
  }
  if (isSaving.value) return;
  isDialogOpen.value = false;
  formError.value = "";
}

function hasDuplicateValues(attributes: SpecificationTemplateAttribute[]): boolean {
  const names = new Set<string>();
  return attributes.some((attribute) => {
    const name = attribute.name.trim().toLocaleLowerCase("zh-CN");
    if (names.has(name)) return true;
    names.add(name);
    const values = new Set<string>();
    return attribute.values.some((value) => {
      const normalizedValue = value.trim().toLocaleLowerCase("zh-CN");
      if (values.has(normalizedValue)) return true;
      values.add(normalizedValue);
      return false;
    });
  });
}

async function saveTemplate(): Promise<void> {
  const name = draft.name.trim();
  const code = draft.code.trim().toLocaleLowerCase("en-US");
  const attributes = draft.attributes.map((attribute, index) => ({
    id: attribute.id || `draft-attribute-${index + 1}-${Date.now()}`,
    name: attribute.name.trim(),
    values: attribute.values.map((value) => value.trim()).filter(Boolean),
  }));
  if (name.length < 2 || name.length > 40) {
    formError.value = "模板名称需为 2 至 40 个字符。";
    return;
  }
  if (!TEMPLATE_CODE_PATTERN.test(code)) {
    formError.value = "模板编码需以小写英文字母开头，仅可包含小写字母、数字和连字符。";
    return;
  }
  if (draft.description.trim().length > 200) {
    formError.value = "模板说明不能超过 200 个字符。";
    return;
  }
  if (!attributes.every((attribute) => attribute.name.length >= 1 && attribute.name.length <= 30 && attribute.values.length >= 1 && attribute.values.length <= 30 && attribute.values.every((value) => value.length <= 40))) {
    formError.value = "每个规格项都需要填写名称，并至少配置 1 个规格值。";
    return;
  }
  if (hasDuplicateValues(attributes)) {
    formError.value = "规格项名称及规格值不能重复，请修正后再保存。";
    return;
  }

  const payload: SpecificationTemplateSaveInput = { name, code, description: draft.description.trim(), attributes, status: draft.status };
  const isEditing = Boolean(draft.id);
  isSaving.value = true;
  formError.value = "";
  try {
    if (draft.id) await updateSpecificationTemplate(draft.id, payload);
    else await createSpecificationTemplate(payload);
    isDialogOpen.value = false;
    await loadTemplates();
    feedbackStore.show(isEditing ? "规格模板已更新。" : "规格模板已创建。", "success");
  } catch (error) {
    formError.value = error instanceof Error ? error.message : "保存规格模板失败，请稍后重试。";
  } finally {
    isSaving.value = false;
  }
}

async function confirmRemoveTemplate(): Promise<void> {
  const target = deleteTarget.value;
  if (!target || isDeleting.value) return;
  isDeleting.value = true;
  try {
    await removeSpecificationTemplate(target.id);
    deleteTarget.value = null;
    await loadTemplates();
    feedbackStore.show(`规格模板“${target.name}”已删除。`, "success");
  } catch (error) {
    feedbackStore.show(error instanceof Error ? error.message : "删除规格模板失败，请稍后重试。", "error");
  } finally {
    isDeleting.value = false;
  }
}

onMounted(() => {
  void loadTemplates();
});
</script>

<template>
  <section class="page-content page-stack list-page-layout" aria-label="规格模板管理">
    <AppCard as="section" padding="large" content-overflow="visible" class="list-search-panel" aria-label="规格模板筛选条件">
      <AppFilterBar @submit="submitFilters" @reset="resetFilters">
        <AppFormField label="关键词" for="specification-template-keyword" label-position="inline" label-width="48px" label-gap="8px">
          <AppSearchInput id="specification-template-keyword" v-model="keyword" placeholder="搜索模板名称、编码或说明" aria-label="搜索规格模板" @search="submitFilters" />
        </AppFormField>
        <AppFormField label="状态" for="specification-template-status" label-position="inline" label-width="40px" label-gap="8px">
          <AppSelect id="specification-template-status" v-model="status" :options="statusOptions" clearable aria-label="按使用状态筛选规格模板" />
        </AppFormField>
        <template #actions><AppButton type="submit" leading-icon="search" :loading="isLoading">查询</AppButton></template>
      </AppFilterBar>
    </AppCard>

    <AppCard as="section" padding="none" fill-height class="data-table-card" aria-label="规格模板列表">
      <AppTableToolbar>
        <AppButton leading-icon="plus" @click="openCreateDialog">新建模板</AppButton>
        <template #actions><AppTableOperationBar show-refresh :refresh-disabled="isLoading" refresh-label="刷新规格模板列表" @refresh="loadTemplates" /></template>
      </AppTableToolbar>
      <AppDataTable :rows="templates" :columns="TABLE_COLUMNS" row-key="id" fill-height :loading="isLoading" :error-message="errorMessage" action-label="操作" empty-title="没有匹配规格模板" empty-description="调整关键词或状态后再试一次。" empty-icon="menu" aria-label="规格模板数据表格" @retry="loadTemplates">
        <template #cell-name="{ row }"><div class="template-primary"><strong>{{ row.name }}</strong><small>{{ row.code }}</small></div></template>
        <template #cell-code="{ row }"><span class="template-code">{{ row.code }}</span></template>
        <template #cell-attributes="{ row }"><span class="attribute-summary" :title="getAttributeSummary(row.attributes)">{{ getAttributeSummary(row.attributes) }}</span><small class="attribute-count">{{ row.attributes.length }} 个规格项</small></template>
        <template #cell-productCount="{ row }"><span class="numeric">{{ row.productCount.toLocaleString("zh-CN") }} 件</span></template>
        <template #cell-status="{ row }"><AppStatusTag :label="getStatusDisplay(row.status).label" :tone="getStatusDisplay(row.status).tone" /></template>
        <template #actions="{ row }"><AppTableActions><AppIconButton icon="edit" label="编辑规格模板" size="small" @click="openEditDialog(row)" /><AppIconButton icon="trash" label="删除规格模板" size="small" variant="danger" @click="deleteTarget = row" /></AppTableActions></template>
      </AppDataTable>
      <AppPagination v-if="!isLoading && !errorMessage && total" :page="page" :page-size="pageSize" :total="total" :page-size-options="[10, 20, 30, 50]" @update:page="updatePage" @update:page-size="updatePageSize" />
    </AppCard>

    <AppDialog :model-value="isDialogOpen" :title="dialogTitle" :description="draft.id ? '模板编码创建后不可修改，规格项变更会影响后续商品编辑。' : '设置模板基础信息，并配置可复用的规格项。'" width="wide" :close-on-overlay="false" @update:model-value="handleDialogVisible">
      <form id="specification-template-form" class="template-form" @submit.prevent="saveTemplate">
        <div class="template-form-grid">
          <AppFormField label="模板名称" for="specification-template-name" required>
            <template #extra><AppTooltip text="用于后台展示与商品编辑器中识别。"><button type="button" class="field-hint" aria-label="查看模板名称说明">?</button></AppTooltip></template>
            <AppInput id="specification-template-name" v-model="draft.name" :max-length="40" show-word-limit placeholder="例如：咖啡豆规格" autocomplete="off" />
          </AppFormField>
          <AppFormField label="模板编码" for="specification-template-code" required>
            <template #extra><AppTooltip text="仅使用小写字母、数字和连字符；创建后不可修改。"><button type="button" class="field-hint" aria-label="查看模板编码说明">?</button></AppTooltip></template>
            <AppInput id="specification-template-code" v-model="draft.code" :readonly="Boolean(draft.id)" :max-length="48" show-word-limit placeholder="例如：coffee-bean-v2" autocomplete="off" />
          </AppFormField>
        </div>
        <div class="template-form-grid">
          <AppFormField label="使用状态" for="specification-template-form-status"><AppSelect id="specification-template-form-status" v-model="draft.status" :options="formStatusOptions" aria-label="设置规格模板使用状态" /></AppFormField>
          <AppFormField label="模板说明" for="specification-template-description"><AppInput id="specification-template-description" v-model="draft.description" :max-length="200" show-word-limit placeholder="补充模板适用范围" /></AppFormField>
        </div>
        <section class="attributes-panel" aria-labelledby="template-attributes-title">
          <header class="attributes-heading"><div><h3 id="template-attributes-title">规格项配置</h3><p>每个规格项至少配置 1 个规格值，最多 10 个规格项。</p></div><AppButton type="button" variant="secondary" size="small" leading-icon="plus" :disabled="draft.attributes.length >= 10" @click="addAttribute">添加规格项</AppButton></header>
          <div class="attribute-list">
            <article v-for="(attribute, index) in draft.attributes" :key="attribute.id" class="attribute-row">
              <span class="attribute-index">{{ String(index + 1).padStart(2, "0") }}</span>
              <AppInput v-model="attribute.name" :max-length="30" placeholder="规格名称，例如：容量" aria-label="输入规格项名称" />
              <AppInputTag v-model="attribute.values" :max="30" :max-length="40" add-on-blur placeholder="输入规格值后按回车" aria-label="输入规格值" />
              <AppIconButton icon="close" :label="`移除规格项 ${index + 1}`" size="small" :disabled="draft.attributes.length <= 1" @click="removeAttribute(attribute.id)" />
            </article>
          </div>
        </section>
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      </form>
      <template #footer><AppButton variant="secondary" :disabled="isSaving" @click="handleDialogVisible(false)">取消</AppButton><AppButton type="submit" form="specification-template-form" :loading="isSaving">{{ isSaving ? "正在保存…" : "保存模板" }}</AppButton></template>
    </AppDialog>

    <AppConfirmDialog :model-value="Boolean(deleteTarget)" title="确认删除规格模板？" :description="deleteDescription" confirm-text="确认删除" danger :is-submitting="isDeleting" @update:model-value="deleteTarget = null" @confirm="confirmRemoveTemplate" />
  </section>
</template>

<style scoped>
.template-primary { min-width: 0; }.template-primary strong, .template-primary small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.template-primary strong { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: var(--aps-font-weight-strong); }.template-primary small, .attribute-count { margin-top: 3px; color: var(--aps-faint); font-size: var(--aps-text-xs); }.template-code { color: var(--aps-muted); font-family: var(--aps-font); font-size: var(--aps-text-sm); }.attribute-summary { display: block; overflow: hidden; color: var(--aps-ink); text-overflow: ellipsis; white-space: nowrap; }.attribute-count { display: block; }.numeric { color: var(--aps-ink); font-variant-numeric: tabular-nums; }.template-form { display: grid; gap: 22px; }.template-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }.field-hint { display: inline-grid; width: 17px; height: 17px; place-items: center; margin: 0; padding: 0; border: 1px solid var(--aps-line); border-radius: 50%; background: var(--aps-surface-soft); color: var(--aps-muted); font: var(--aps-font-weight-primary) 11px/1 var(--aps-font); cursor: help; }.field-hint:hover, .field-hint:focus-visible { border-color: var(--aps-blue); background: var(--aps-blue-soft); color: var(--aps-blue); outline: none; }.attributes-panel { display: grid; gap: 14px; padding-top: 4px; }.attributes-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }.attributes-heading h3, .attributes-heading p { margin: 0; }.attributes-heading h3 { color: var(--aps-ink); font-size: var(--aps-text-md); font-weight: var(--aps-font-weight-heading); }.attributes-heading p { margin-top: 4px; color: var(--aps-muted); font-size: var(--aps-text-sm); }.attribute-list { display: grid; gap: 10px; }.attribute-row { display: grid; grid-template-columns: 34px minmax(120px, .75fr) minmax(220px, 1.5fr) 34px; align-items: center; gap: 10px; }.attribute-index { color: var(--aps-faint); font-family: var(--aps-font); font-size: var(--aps-text-xs); font-variant-numeric: tabular-nums; text-align: center; }.form-error { margin: -8px 0 0; color: var(--aps-red); font-size: var(--aps-text-sm); }@media (max-width: 680px) { .template-form-grid { grid-template-columns: 1fr; gap: 12px; }.attributes-heading { align-items: stretch; flex-direction: column; }.attribute-row { grid-template-columns: 26px minmax(0, 1fr) 34px; }.attribute-row :deep(.app-input-tag) { grid-column: 2 / -1; } }
</style>
