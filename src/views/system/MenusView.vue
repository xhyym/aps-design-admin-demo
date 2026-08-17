<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { createMenu, getMenus, removeMenu, updateMenu } from "@/api/modules/system";
import { AppButton } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import { AppConfirmDialog } from "aps-design-pro";
import { AppDataTable } from "aps-design-pro";
import { AppDrawer } from "aps-design-pro";
import { AppFilterBar } from "aps-design-pro";
import { AppFormField } from "aps-design-pro";
import { AppIconButton } from "aps-design-pro";
import { AppInput } from "aps-design-pro";
import { AppNumberInput } from "aps-design-pro";
import { AppPagination } from "aps-design-pro";
import { AppSearchInput } from "aps-design-pro";
import { AppSelect } from "aps-design-pro";
import { AppStatusTag } from "aps-design-pro";
import { AppTableToolbar } from "aps-design-pro";
import { AppTableActions } from "aps-design-pro";
import { AppTableOperationBar } from "aps-design-pro";
import { useFeedbackStore } from "@/stores/feedback";
import type { DataTableColumn, SelectOption, StatusTone } from "aps-design-pro";
import type { SystemMenu, SystemMenuInput } from "@/types/system";

interface MenuDraft extends SystemMenuInput { id?: string; }

const menuStatusOptions: SelectOption[] = [{ label: "启用", value: "enabled" }, { label: "停用", value: "disabled" }];
const menuColumns: DataTableColumn<SystemMenu>[] = [
  { key: "name", label: "菜单名称" }, { key: "path", label: "访问路径" }, { key: "permission", label: "权限编码" }, { key: "sortOrder", label: "排序", align: "center" }, { key: "status", label: "状态" }, { key: "updatedAt", label: "最近更新" },
];
const feedbackStore = useFeedbackStore();
const keyword = ref("");
const menus = ref<SystemMenu[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const isLoading = ref(true);
const isSaving = ref(false);
const isDeleting = ref(false);
const errorMessage = ref("");
const formError = ref("");
const isMenuDrawerOpen = ref(false);
const deleteTarget = ref<SystemMenu | null>(null);
const menuDraft = reactive<MenuDraft>(createEmptyMenuDraft());

function createEmptyMenuDraft(): MenuDraft { return { name: "", path: "/", permission: "", status: "enabled", sortOrder: 10 }; }
function refreshMenus(): void { void loadMenus(); }

async function loadMenus(resetPage = false): Promise<void> {
  if (resetPage) page.value = 1;
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const response = await getMenus({ keyword: keyword.value.trim(), page: page.value, pageSize: pageSize.value, sortBy: "sortOrder", sortOrder: "asc" });
    menus.value = response.list;
    total.value = response.total;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "无法加载菜单列表，请稍后重试。";
  } finally {
    isLoading.value = false;
  }
}

function handlePageChange(nextPage: number): void { page.value = nextPage; void loadMenus(); }
function handlePageSizeChange(nextPageSize: number): void { pageSize.value = nextPageSize; void loadMenus(true); }
function resetFilters(): void { keyword.value = ""; void loadMenus(true); }
function openCreateDrawer(): void { Object.assign(menuDraft, createEmptyMenuDraft()); formError.value = ""; isMenuDrawerOpen.value = true; }
function openEditDrawer(menu: SystemMenu): void { Object.assign(menuDraft, { id: menu.id, name: menu.name, path: menu.path, permission: menu.permission, status: menu.status, sortOrder: menu.sortOrder }); formError.value = ""; isMenuDrawerOpen.value = true; }
function handleDrawerVisible(visible: boolean): void { if (!visible && !isSaving.value) { isMenuDrawerOpen.value = false; formError.value = ""; } }

async function saveMenu(): Promise<void> {
  const payload: SystemMenuInput = { name: menuDraft.name.trim(), path: menuDraft.path.trim(), permission: menuDraft.permission.trim(), status: menuDraft.status, sortOrder: Number(menuDraft.sortOrder) };
  if (!payload.name || !payload.path || !payload.permission) { formError.value = "请完整填写菜单信息。"; return; }
  if (!payload.path.startsWith("/")) { formError.value = "访问路径必须以 / 开头。"; return; }
  if (!Number.isFinite(payload.sortOrder) || payload.sortOrder < 0) { formError.value = "排序值需要是大于或等于 0 的数字。"; return; }
  isSaving.value = true;
  formError.value = "";
  try {
    if (menuDraft.id) await updateMenu({ id: menuDraft.id, ...payload }); else await createMenu(payload);
    isMenuDrawerOpen.value = false;
    feedbackStore.show(menuDraft.id ? "菜单配置已更新。" : "菜单已创建。", "success");
    await loadMenus();
  } catch (error) {
    formError.value = error instanceof Error ? error.message : "保存菜单失败，请稍后重试。";
  } finally {
    isSaving.value = false;
  }
}

async function confirmRemove(): Promise<void> {
  if (!deleteTarget.value) return;
  isDeleting.value = true;
  try {
    await removeMenu(deleteTarget.value.id);
    deleteTarget.value = null;
    feedbackStore.show("菜单已删除。", "success");
    await loadMenus();
  } catch (error) {
    feedbackStore.show(error instanceof Error ? error.message : "删除菜单失败，请稍后重试。", "error");
  } finally {
    isDeleting.value = false;
  }
}

function getStatus(menu: SystemMenu): { label: string; tone: StatusTone } { return menu.status === "enabled" ? { label: "已启用", tone: "success" } : { label: "已停用", tone: "neutral" }; }

onMounted(loadMenus);
</script>

<template>
  <section class="page-content page-stack list-page-layout">
    <AppCard as="section" padding="large" content-overflow="visible" class="list-search-panel" aria-label="菜单筛选条件"><AppFilterBar @submit="loadMenus(true)" @reset="resetFilters"><AppFormField label="关键词" for="menu-keyword" label-position="inline" label-width="44px" label-gap="6px"><AppSearchInput id="menu-keyword" v-model="keyword" placeholder="搜索菜单、路径或权限编码" aria-label="搜索菜单" /></AppFormField><template #actions><AppButton type="submit" :disabled="isLoading" leading-icon="search">查询</AppButton></template></AppFilterBar></AppCard>
    <AppCard as="section" padding="none" fill-height class="data-table-card" aria-label="菜单列表"><AppTableToolbar><AppButton leading-icon="plus" @click="openCreateDrawer">新增菜单</AppButton><template #actions><AppTableOperationBar show-refresh :refresh-disabled="isLoading" refresh-label="刷新菜单列表" @refresh="refreshMenus" /></template></AppTableToolbar><AppDataTable :rows="menus" :columns="menuColumns" row-key="id" :loading="isLoading" :error-message="errorMessage" fill-height action-label="操作" empty-title="没有找到匹配菜单" empty-description="调整搜索条件后再试一次。" empty-icon="menu" @retry="refreshMenus"><template #cell-name="{ row }"><strong class="menu-name">{{ row.name }}</strong></template><template #cell-path="{ row }"><code>{{ row.path }}</code></template><template #cell-permission="{ row }"><code>{{ row.permission }}</code></template><template #cell-status="{ row }"><AppStatusTag :tone="getStatus(row).tone" :label="getStatus(row).label" /></template><template #actions="{ row }"><AppTableActions><AppIconButton icon="edit" label="编辑菜单" size="small" @click="openEditDrawer(row)" /><AppIconButton icon="trash" label="删除菜单" size="small" variant="danger" @click="deleteTarget = row" /></AppTableActions></template></AppDataTable><AppPagination v-if="!isLoading && !errorMessage && menus.length" :page="page" :page-size="pageSize" :total="total" :page-size-options="[10, 20, 30, 50, 100]" @update:page="handlePageChange" @update:page-size="handlePageSizeChange" /></AppCard>
    <AppDrawer :model-value="isMenuDrawerOpen" :title="menuDraft.id ? '编辑菜单' : '新增菜单'" description="菜单路径和权限编码用于路由访问控制。" @update:model-value="handleDrawerVisible"><form id="menu-form" class="drawer-form" @submit.prevent="saveMenu"><AppFormField label="菜单名称" for="menu-name" required><AppInput id="menu-name" v-model="menuDraft.name" /></AppFormField><AppFormField label="访问路径" for="menu-path" required><AppInput id="menu-path" v-model="menuDraft.path" placeholder="例如 /system/users" /></AppFormField><AppFormField label="权限编码" for="menu-permission" required><AppInput id="menu-permission" v-model="menuDraft.permission" placeholder="例如 system:user:read" /></AppFormField><div class="menu-form-grid"><AppFormField label="展示排序" for="menu-sort-order"><AppNumberInput id="menu-sort-order" v-model="menuDraft.sortOrder" :min="0" aria-label="展示排序" /></AppFormField><AppFormField label="状态" for="menu-status"><AppSelect id="menu-status" v-model="menuDraft.status" :options="menuStatusOptions" aria-label="菜单状态" /></AppFormField></div><p v-if="formError" class="form-error" role="alert">{{ formError }}</p></form><template #footer><AppButton variant="secondary" :disabled="isSaving" @click="handleDrawerVisible(false)">取消</AppButton><AppButton type="submit" form="menu-form" :loading="isSaving">{{ isSaving ? "正在保存…" : "保存菜单" }}</AppButton></template></AppDrawer>
    <AppConfirmDialog :model-value="Boolean(deleteTarget)" title="确认删除菜单？" :description="`删除「${deleteTarget?.name ?? ''}」后，相关入口将不再显示。`" confirm-text="确认删除" danger :is-submitting="isDeleting" @update:model-value="deleteTarget = null" @confirm="confirmRemove" />
  </section>
</template>

<style scoped>
.menu-name { color: var(--aps-ink); font-size: var(--aps-text-base); font-weight: var(--aps-font-weight-strong); }code { color: var(--aps-muted); font-family: var(--aps-font); font-size: var(--aps-text-sm); }.drawer-form { display: grid; gap: var(--aps-form-gap); }.menu-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }.form-error { margin: -3px 0 0; color: var(--aps-red); font-size: var(--aps-text-sm); }@media (max-width: 680px) { .menu-form-grid { grid-template-columns: 1fr; } }
</style>
