<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { createRole, getRoles, removeRole, updateRole } from "@/api/modules/system";
import { AppButton } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import { AppCheckboxGroup } from "aps-design-pro";
import { AppConfirmDialog } from "aps-design-pro";
import { AppDataTable } from "aps-design-pro";
import { AppDrawer } from "aps-design-pro";
import { AppFilterBar } from "aps-design-pro";
import { AppFormField } from "aps-design-pro";
import { AppIconButton } from "aps-design-pro";
import { AppInput } from "aps-design-pro";
import { AppPagination } from "aps-design-pro";
import { AppSearchInput } from "aps-design-pro";
import { AppTableToolbar } from "aps-design-pro";
import { AppTextarea } from "aps-design-pro";
import { useFeedbackStore } from "@/stores/feedback";
import type { CheckboxOption, DataTableColumn } from "aps-design-pro";
import type { SystemRole, SystemRoleInput } from "@/types/system";

interface RoleDraft extends SystemRoleInput { id?: string; }
interface PermissionGroup { title: string; options: CheckboxOption[]; }

const permissionGroups: PermissionGroup[] = [
  { title: "工作台", options: [{ value: "dashboard:view", label: "查看工作台" }] },
  { title: "成员管理", options: [{ value: "system:user:read", label: "查看成员" }, { value: "system:user:write", label: "管理成员" }] },
  { title: "系统配置", options: [{ value: "system:role:read", label: "查看角色" }, { value: "system:role:write", label: "管理角色" }, { value: "system:menu:read", label: "查看菜单" }, { value: "system:menu:write", label: "管理菜单" }] },
];
const roleColumns: DataTableColumn<SystemRole>[] = [
  { key: "name", label: "角色" }, { key: "description", label: "说明" }, { key: "permissions", label: "权限范围" }, { key: "memberCount", label: "成员数", align: "center" }, { key: "updatedAt", label: "最近更新" },
];
const feedbackStore = useFeedbackStore();
const keyword = ref("");
const roles = ref<SystemRole[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const isLoading = ref(true);
const isSaving = ref(false);
const isDeleting = ref(false);
const errorMessage = ref("");
const formError = ref("");
const isRoleDrawerOpen = ref(false);
const deleteTarget = ref<SystemRole | null>(null);
const roleDraft = reactive<RoleDraft>(createEmptyRoleDraft());

function createEmptyRoleDraft(): RoleDraft { return { name: "", code: "", description: "", permissions: [] }; }
function refreshRoles(): void { void loadRoles(); }

async function loadRoles(resetPage = false): Promise<void> {
  if (resetPage) page.value = 1;
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const response = await getRoles({ keyword: keyword.value.trim(), page: page.value, pageSize: pageSize.value });
    roles.value = response.list;
    total.value = response.total;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "无法加载角色列表，请稍后重试。";
  } finally {
    isLoading.value = false;
  }
}

function handlePageChange(nextPage: number): void { page.value = nextPage; void loadRoles(); }
function handlePageSizeChange(nextPageSize: number): void { pageSize.value = nextPageSize; void loadRoles(true); }
function resetFilters(): void { keyword.value = ""; void loadRoles(true); }
function openCreateDrawer(): void { Object.assign(roleDraft, createEmptyRoleDraft()); formError.value = ""; isRoleDrawerOpen.value = true; }
function openEditDrawer(role: SystemRole): void { Object.assign(roleDraft, { id: role.id, name: role.name, code: role.code, description: role.description, permissions: [...role.permissions] }); formError.value = ""; isRoleDrawerOpen.value = true; }
function handleDrawerVisible(visible: boolean): void { if (!visible && !isSaving.value) { isRoleDrawerOpen.value = false; formError.value = ""; } }

async function saveRole(): Promise<void> {
  const payload: SystemRoleInput = { name: roleDraft.name.trim(), code: roleDraft.code.trim(), description: roleDraft.description.trim(), permissions: [...roleDraft.permissions] };
  if (!payload.name || !payload.code || !payload.description) { formError.value = "请完整填写角色信息。"; return; }
  if (!/^[a-z][a-z0-9-]*$/.test(payload.code)) { formError.value = "角色编码仅支持小写字母、数字和连字符，并以字母开头。"; return; }
  if (payload.permissions.length === 0) { formError.value = "请至少选择一项权限。"; return; }
  isSaving.value = true;
  formError.value = "";
  try {
    if (roleDraft.id) await updateRole({ id: roleDraft.id, ...payload }); else await createRole(payload);
    isRoleDrawerOpen.value = false;
    feedbackStore.show(roleDraft.id ? "角色权限已更新。" : "角色已创建。", "success");
    await loadRoles();
  } catch (error) {
    formError.value = error instanceof Error ? error.message : "保存角色失败，请稍后重试。";
  } finally {
    isSaving.value = false;
  }
}

async function confirmRemove(): Promise<void> {
  if (!deleteTarget.value) return;
  isDeleting.value = true;
  try {
    await removeRole(deleteTarget.value.id);
    deleteTarget.value = null;
    feedbackStore.show("角色已删除。", "success");
    await loadRoles();
  } catch (error) {
    feedbackStore.show(error instanceof Error ? error.message : "删除角色失败，请稍后重试。", "error");
  } finally {
    isDeleting.value = false;
  }
}

onMounted(loadRoles);
</script>

<template>
  <section class="page-content page-stack list-page-layout">
    <AppCard as="section" padding="large" content-overflow="visible" class="list-search-panel" aria-label="角色筛选条件"><AppFilterBar @submit="loadRoles(true)" @reset="resetFilters"><AppFormField label="关键词" for="role-keyword" label-position="inline" label-width="44px" label-gap="6px"><AppSearchInput id="role-keyword" v-model="keyword" placeholder="搜索角色名称或编码" aria-label="搜索角色" /></AppFormField><template #actions><AppButton type="submit" :disabled="isLoading" leading-icon="search">查询</AppButton></template></AppFilterBar></AppCard>
    <AppCard as="section" padding="none" content-overflow="visible" fill-height class="data-table-card" aria-label="角色列表"><AppTableToolbar><AppButton leading-icon="plus" @click="openCreateDrawer">创建角色</AppButton><template #actions><AppIconButton icon="refresh" label="刷新角色列表" :disabled="isLoading" @click="refreshRoles" /></template></AppTableToolbar><AppDataTable :rows="roles" :columns="roleColumns" row-key="id" :loading="isLoading" :error-message="errorMessage" fill-height action-label="操作" empty-title="没有找到匹配角色" empty-description="调整搜索条件后再试一次。" empty-icon="shield" @retry="refreshRoles"><template #cell-name="{ row }"><strong class="role-name">{{ row.name }}</strong><span class="role-code">{{ row.code }}</span></template><template #cell-description="{ row }"><span class="description-cell">{{ row.description }}</span></template><template #cell-permissions="{ row }"><span class="permission-summary">{{ row.permissions.join("、") }}</span></template><template #cell-memberCount="{ row }">{{ row.memberCount }} 人</template><template #actions="{ row }"><div class="table-actions"><AppButton variant="text" size="small" @click="openEditDrawer(row)">配置</AppButton><AppButton variant="text" size="small" @click="deleteTarget = row">删除</AppButton></div></template></AppDataTable><AppPagination v-if="!isLoading && !errorMessage && roles.length" :page="page" :page-size="pageSize" :total="total" :page-size-options="[10, 20, 30, 50, 100]" @update:page="handlePageChange" @update:page-size="handlePageSizeChange" /></AppCard>
    <AppDrawer :model-value="isRoleDrawerOpen" :title="roleDraft.id ? '配置角色权限' : '创建角色'" description="角色权限变更会立即影响后续访问范围。" width="wide" @update:model-value="handleDrawerVisible"><form id="role-form" class="drawer-form" @submit.prevent="saveRole"><div class="role-form-grid"><AppFormField label="角色名称" for="role-name" required><AppInput id="role-name" v-model="roleDraft.name" /></AppFormField><AppFormField label="角色编码" for="role-code" required><AppInput id="role-code" v-model="roleDraft.code" :disabled="Boolean(roleDraft.id)" placeholder="例如 operation-lead" /></AppFormField></div><AppFormField label="角色说明" for="role-description" required><AppTextarea id="role-description" v-model="roleDraft.description" /></AppFormField><section class="permission-section"><header><h3>权限范围</h3><p>为角色勾选可访问的功能。</p></header><div class="permission-groups"><section v-for="group in permissionGroups" :key="group.title"><h4>{{ group.title }}</h4><AppCheckboxGroup v-model="roleDraft.permissions" :options="group.options" :columns="2" :aria-label="`${group.title}权限`" /></section></div></section><p v-if="formError" class="form-error" role="alert">{{ formError }}</p></form><template #footer><AppButton variant="secondary" :disabled="isSaving" @click="handleDrawerVisible(false)">取消</AppButton><AppButton type="submit" form="role-form" :loading="isSaving">{{ isSaving ? "正在保存…" : "保存角色" }}</AppButton></template></AppDrawer>
    <AppConfirmDialog :model-value="Boolean(deleteTarget)" title="确认删除角色？" :description="`删除「${deleteTarget?.name ?? ''}」后，拥有该角色的成员需要重新分配权限。`" confirm-text="确认删除" danger :is-submitting="isDeleting" @update:model-value="deleteTarget = null" @confirm="confirmRemove" />
  </section>
</template>

<style scoped>
.role-name, .role-code { display: block; }.role-name { color: var(--aps-ink); font-size: var(--aps-text-base); font-weight: 680; }.role-code { margin-top: 3px; color: var(--aps-faint); font-size: var(--aps-text-xs); }.description-cell { display: inline-block; min-width: 190px; max-width: 300px; color: var(--aps-muted); line-height: 1.55; white-space: normal; }.permission-summary { display: inline-block; max-width: 180px; overflow: hidden; color: var(--aps-muted); text-overflow: ellipsis; white-space: nowrap; }.table-actions { display: inline-flex; align-items: center; gap: 7px; }.drawer-form { display: grid; gap: var(--aps-form-gap); }.role-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }.permission-section { padding-top: 3px; }.permission-section header h3, .permission-section header p { margin: 0; }.permission-section header h3 { color: var(--aps-ink); font-size: var(--aps-text-base); font-weight: 700; }.permission-section header p { margin-top: 4px; color: var(--aps-muted); font-size: var(--aps-text-sm); }.permission-groups { display: grid; gap: 10px; margin-top: 12px; }.permission-groups section { padding: 16px; border: 1px solid var(--aps-line-soft); border-radius: 10px; }.permission-groups h4 { margin: 0 0 10px; color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: 680; }.permission-groups :deep(.app-checkbox-group-option) { min-height: 30px; }.form-error { margin: -3px 0 0; color: var(--aps-red); font-size: var(--aps-text-sm); }@media (max-width: 680px) { .role-form-grid { grid-template-columns: 1fr; } }
</style>
