<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { createUser, getUsers, removeUser, updateUser, updateUserStatus } from "@/api/modules/system";
import { AppButton } from "aps-design-pro";
import { AppAutocomplete } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import { AppConfirmDialog } from "aps-design-pro";
import { AppDataTable } from "aps-design-pro";
import { AppDrawer } from "aps-design-pro";
import { AppFilterBar } from "aps-design-pro";
import { AppFormField } from "aps-design-pro";
import { AppIconButton } from "aps-design-pro";
import { AppInput } from "aps-design-pro";
import { AppPagination } from "aps-design-pro";
import { AppSearchInput } from "aps-design-pro";
import { AppSelect } from "aps-design-pro";
import { AppStatusTag } from "aps-design-pro";
import { AppTableSettingsPanel } from "aps-design-pro";
import { AppTableActions } from "aps-design-pro";
import { AppTableOperationBar } from "aps-design-pro";
import { AppTableToolbar } from "aps-design-pro";
import { useTablePreferences } from "aps-design-pro";
import { useAuthStore } from "@/stores/auth";
import { useFeedbackStore } from "@/stores/feedback";
import type { SortOrder } from "@/types/api";
import type { AutocompleteOption, DataTableColumn, DataTableSort, SearchSuggestion, SelectOption, StatusTone, TablePreferenceScope, TableRowKey } from "aps-design-pro";
import type { SystemUser, SystemUserInput, UserStatus } from "@/types/system";

interface StatusDisplay { label: string; tone: StatusTone; }
interface UserDraft extends SystemUserInput { id?: string; }

const roleOptions: SelectOption[] = [
  { label: "系统管理员", value: "系统管理员", description: "管理全局设置与成员权限", group: "管理权限" },
  { label: "运营主管", value: "运营主管", description: "负责日常业务运营", group: "业务协作" },
  { label: "内容审核员", value: "内容审核员", description: "审核业务内容与流程", group: "审核与观察" },
  { label: "成员", value: "成员", description: "使用授权的业务功能", group: "业务协作" },
  { label: "数据观察员", value: "数据观察员", description: "只读访问数据看板", group: "审核与观察" },
];
const userStatusOptions: SelectOption[] = [
  { label: "正常", value: "active", description: "可以正常访问工作区" },
  { label: "待审核", value: "pending", description: "等待管理员完成审核" },
  { label: "已停用", value: "disabled", description: "暂时禁止访问工作区" },
];
const roleFilterOptions: SelectOption[] = [{ label: "全部角色", value: "" }, ...roleOptions];
const statusFilterOptions: SelectOption[] = [{ label: "全部状态", value: "" }, ...userStatusOptions];
const departmentOptions: AutocompleteOption[] = [
  { key: "product-experience", label: "产品与体验", description: "负责产品规划与体验设计" },
  { key: "operations", label: "运营管理", description: "负责业务增长与运营策略" },
  { key: "content-service", label: "内容服务", description: "负责内容生产与审核" },
  { key: "customer-success", label: "客户成功", description: "负责客户交付与服务" },
  { key: "data-analysis", label: "数据分析", description: "负责数据分析与洞察" },
];
const USER_TABLE_COLUMNS: DataTableColumn<SystemUser>[] = [
  { key: "name", label: "成员", defaultWidth: 220, minWidth: 190, maxWidth: 360, sortable: true },
  { key: "department", label: "部门", defaultWidth: 156, minWidth: 132, maxWidth: 260 },
  { key: "role", label: "角色", defaultWidth: 132, minWidth: 116, maxWidth: 220 },
  { key: "status", label: "状态", defaultWidth: 120, minWidth: 108, maxWidth: 180 },
  { key: "lastActiveAt", label: "最近活跃", defaultWidth: 164, minWidth: 142, maxWidth: 260 },
];
const feedbackStore = useFeedbackStore();
const authStore = useAuthStore();
const keyword = ref("");
const roleFilter = ref("");
const statusFilter = ref<"" | UserStatus>("");
const isAdvancedFilterOpen = ref(false);
const users = ref<SystemUser[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const sortOrder = ref<SortOrder>("asc");
const selectedIds = ref<string[]>([]);
const isLoading = ref(true);
const isSaving = ref(false);
const isDeleting = ref(false);
const isStatusUpdating = ref(false);
const errorMessage = ref("");
const formError = ref("");
const isUserDrawerOpen = ref(false);
const deleteTarget = ref<SystemUser | null>(null);
const pendingStatus = ref<UserStatus | null>(null);
const userDraft = reactive<UserDraft>(createEmptyUserDraft());
const searchSuggestions = computed<SearchSuggestion[]>(() => users.value.map((user) => ({
  key: user.id,
  label: user.name,
  value: user.name,
  description: `${user.account} · ${user.department}`,
})));

const userTablePreferenceScope = computed<TablePreferenceScope | null>(() => {
  const profile = authStore.profile;
  if (!profile) return null;
  return { tenantId: profile.tenantId, userId: profile.id, route: "/system/users", tableId: "member-list" };
});
const {
  preference: userTablePreference,
  defaultPreference: defaultUserTablePreference,
  resolvedColumns: userTableColumns,
  columnWidths: userColumnWidths,
  tableSize: userTableSize,
  isSaving: isSavingUserTablePreference,
  saveError: userTablePreferenceError,
  updatePreference: updateUserTablePreference,
  updateColumnWidths: updateUserColumnWidths,
} = useTablePreferences({ columns: USER_TABLE_COLUMNS, scope: userTablePreferenceScope });
const statusConfirmTitle = computed(() => pendingStatus.value === "active" ? "启用所选成员" : "停用所选成员");
const statusConfirmDescription = computed(() => pendingStatus.value === "active" ? `将恢复 ${selectedIds.value.length} 位成员的访问权限。` : `将停用 ${selectedIds.value.length} 位成员的访问权限，成员将无法继续进入工作区。`);

function createEmptyUserDraft(): UserDraft {
  return { name: "", account: "", department: "", role: "成员", status: "active" };
}

async function loadUsers(resetPage = false): Promise<void> {
  if (resetPage) {
    page.value = 1;
    selectedIds.value = [];
  }
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const response = await getUsers({ keyword: keyword.value.trim(), role: roleFilter.value || undefined, status: statusFilter.value || undefined, page: page.value, pageSize: pageSize.value, sortBy: "name", sortOrder: sortOrder.value });
    users.value = response.list;
    total.value = response.total;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "无法加载用户列表，请稍后重试。";
  } finally {
    isLoading.value = false;
  }
}

function handlePageChange(nextPage: number): void { page.value = nextPage; void loadUsers(); }
function handlePageSizeChange(nextPageSize: number): void { pageSize.value = nextPageSize; void loadUsers(true); }
function refreshUsers(): void { void loadUsers(); }
function searchUsers(): void { void loadUsers(true); }
function resetFilters(): void { keyword.value = ""; roleFilter.value = ""; statusFilter.value = ""; void loadUsers(true); }
function handleSortChange(sort: DataTableSort): void { if (sort.key === "name") { sortOrder.value = sort.order; void loadUsers(); } }
function updateSelectedIds(nextKeys: TableRowKey[]): void { selectedIds.value = nextKeys.filter((key): key is string => typeof key === "string"); }
function openCreateDrawer(): void {
  Object.assign(userDraft, createEmptyUserDraft());
  formError.value = "";
  isUserDrawerOpen.value = true;
}

function openEditDrawer(user: SystemUser): void {
  Object.assign(userDraft, { id: user.id, name: user.name, account: user.account, department: user.department, role: user.role, status: user.status });
  formError.value = "";
  isUserDrawerOpen.value = true;
}

function handleDrawerVisible(visible: boolean): void {
  if (!visible && !isSaving.value) {
    isUserDrawerOpen.value = false;
    formError.value = "";
  }
}

/** 新建与编辑共用同一份表单数据，按 id 决定服务层调用。 */
async function saveUser(): Promise<void> {
  const payload: SystemUserInput = {
    name: userDraft.name.trim(), account: userDraft.account.trim(), department: userDraft.department.trim(), role: userDraft.role, status: userDraft.status,
  };
  if (!payload.name || !payload.account || !payload.department) {
    formError.value = "请完整填写成员信息。";
    return;
  }
  isSaving.value = true;
  formError.value = "";
  try {
    if (userDraft.id) await updateUser({ id: userDraft.id, ...payload });
    else await createUser(payload);
    isUserDrawerOpen.value = false;
    feedbackStore.show(userDraft.id ? "成员信息已更新。" : "成员已添加。", "success");
    await loadUsers();
  } catch (error) {
    formError.value = error instanceof Error ? error.message : "保存成员失败，请稍后重试。";
  } finally {
    isSaving.value = false;
  }
}

function requestRemove(user: SystemUser): void { deleteTarget.value = user; }

async function confirmRemove(): Promise<void> {
  if (!deleteTarget.value) return;
  isDeleting.value = true;
  try {
    await removeUser(deleteTarget.value.id);
    deleteTarget.value = null;
    feedbackStore.show("成员已删除。", "success");
    await loadUsers();
  } catch (error) {
    feedbackStore.show(error instanceof Error ? error.message : "删除成员失败，请稍后重试。", "error");
  } finally {
    isDeleting.value = false;
  }
}

function requestStatusChange(status: UserStatus): void { if (selectedIds.value.length > 0) pendingStatus.value = status; }

async function confirmStatusChange(): Promise<void> {
  if (!pendingStatus.value) return;
  isStatusUpdating.value = true;
  try {
    await updateUserStatus(selectedIds.value, pendingStatus.value);
    const completedStatus = pendingStatus.value;
    pendingStatus.value = null;
    selectedIds.value = [];
    feedbackStore.show(completedStatus === "active" ? "所选成员已启用。" : "所选成员已停用。", "success");
    await loadUsers();
  } catch (error) {
    feedbackStore.show(error instanceof Error ? error.message : "更新成员状态失败，请稍后重试。", "error");
  } finally {
    isStatusUpdating.value = false;
  }
}

function getStatusDisplay(status: SystemUser["status"]): StatusDisplay {
  const statusMap: Record<SystemUser["status"], StatusDisplay> = { active: { label: "正常", tone: "success" }, pending: { label: "待审核", tone: "warning" }, disabled: { label: "已停用", tone: "danger" } };
  return statusMap[status];
}

onMounted(loadUsers);
</script>

<template>
  <section class="page-content page-stack list-page-layout">
    <AppCard as="section" padding="large" content-overflow="visible" class="list-search-panel" aria-label="成员筛选条件">
      <AppFilterBar :expanded="isAdvancedFilterOpen" collapsible @submit="searchUsers" @reset="resetFilters" @update:expanded="isAdvancedFilterOpen = $event">
        <AppFormField label="关键词" for="user-keyword" label-position="inline" label-width="44px" label-gap="6px"><AppSearchInput id="user-keyword" v-model="keyword" :suggestions="searchSuggestions" placeholder="搜索姓名、账号或部门" aria-label="搜索成员" @search="searchUsers" /></AppFormField>
        <template #advanced><AppFormField label="角色" for="user-role-filter" label-position="inline" label-width="32px" label-gap="6px"><AppSelect id="user-role-filter" v-model="roleFilter" :options="roleFilterOptions" placeholder="全部角色" aria-label="按角色筛选成员" clearable filterable /></AppFormField><AppFormField label="状态" for="user-status-filter" label-position="inline" label-width="32px" label-gap="6px"><AppSelect id="user-status-filter" v-model="statusFilter" :options="statusFilterOptions" placeholder="全部状态" aria-label="按状态筛选成员" clearable /></AppFormField></template>
        <template #actions><AppButton type="submit" :disabled="isLoading" leading-icon="search">查询</AppButton></template>
      </AppFilterBar>
    </AppCard>
    <AppCard as="section" padding="none" fill-height class="data-table-card" aria-label="成员列表">
      <AppTableToolbar :selected-count="selectedIds.length">
        <AppButton leading-icon="plus" @click="openCreateDrawer">新增成员</AppButton>
        <template #actions><AppTableOperationBar show-refresh :refresh-disabled="isLoading" refresh-label="刷新成员列表" @refresh="refreshUsers"><template #settings><AppTableSettingsPanel :model-value="userTablePreference" :default-value="defaultUserTablePreference" :columns="USER_TABLE_COLUMNS" :saving="isSavingUserTablePreference" :save-error="userTablePreferenceError" @update:model-value="updateUserTablePreference" /></template></AppTableOperationBar></template>
        <template #bulk><AppIconButton icon="check" label="启用已选成员" size="small" variant="secondary" @click="requestStatusChange('active')" /><AppIconButton icon="close" label="停用已选成员" size="small" variant="secondary" @click="requestStatusChange('disabled')" /><AppIconButton icon="close" label="取消选择" size="small" @click="selectedIds = []" /></template>
      </AppTableToolbar>
      <AppDataTable :rows="users" :columns="userTableColumns" row-key="id" :loading="isLoading" :error-message="errorMessage" selectable resizable fill-height :selected-keys="selectedIds" :sort="{ key: 'name', order: sortOrder }" :column-widths="userColumnWidths" :striped="userTablePreference.striped" :show-column-dividers="userTablePreference.showColumnDividers" :size="userTableSize" action-label="操作" empty-title="没有找到匹配成员" empty-description="调整搜索条件后再试一次。" empty-icon="users" @update:selected-keys="updateSelectedIds" @update:column-widths="updateUserColumnWidths" @sort-change="handleSortChange" @retry="refreshUsers"><template #cell-name="{ row }"><div class="member-cell"><span class="member-avatar">{{ row.name.slice(0, 1) }}</span><div><strong>{{ row.name }}</strong><span>{{ row.account }}</span></div></div></template><template #cell-status="{ row }"><AppStatusTag :tone="getStatusDisplay(row.status).tone" :label="getStatusDisplay(row.status).label" /></template><template #actions="{ row }"><AppTableActions><AppIconButton icon="edit" label="编辑成员" size="small" @click="openEditDrawer(row)" /><AppIconButton icon="trash" label="删除成员" size="small" variant="danger" @click="requestRemove(row)" /></AppTableActions></template></AppDataTable>
      <AppPagination v-if="!isLoading && !errorMessage && users.length" :page="page" :page-size="pageSize" :total="total" :page-size-options="[10, 20, 30, 50, 100]" @update:page="handlePageChange" @update:page-size="handlePageSizeChange" />
    </AppCard>
    <AppDrawer :model-value="isUserDrawerOpen" :title="userDraft.id ? '编辑成员' : '新增成员'" description="请确认账号、部门和角色信息准确无误。" @update:model-value="handleDrawerVisible"><form id="user-form" class="drawer-form" @submit.prevent="saveUser"><AppFormField label="姓名" for="user-name" required><AppInput id="user-name" v-model="userDraft.name" autocomplete="name" /></AppFormField><AppFormField label="账号" for="user-account" required><AppInput id="user-account" v-model="userDraft.account" :disabled="Boolean(userDraft.id)" autocomplete="username" /></AppFormField><AppFormField label="部门" for="user-department" required><AppAutocomplete id="user-department" v-model="userDraft.department" :options="departmentOptions" clearable /></AppFormField><AppFormField label="角色" for="user-role"><AppSelect id="user-role" v-model="userDraft.role" :options="roleOptions" aria-label="成员角色" filterable /></AppFormField><AppFormField label="状态" for="user-status"><AppSelect id="user-status" v-model="userDraft.status" :options="userStatusOptions" aria-label="成员状态" /></AppFormField><p v-if="formError" class="form-error" role="alert">{{ formError }}</p></form><template #footer><AppButton variant="secondary" :disabled="isSaving" @click="handleDrawerVisible(false)">取消</AppButton><AppButton type="submit" form="user-form" :loading="isSaving">{{ isSaving ? "正在保存…" : "保存成员" }}</AppButton></template></AppDrawer>
    <AppConfirmDialog :model-value="Boolean(deleteTarget)" title="确认删除成员？" :description="`删除「${deleteTarget?.name ?? ''}」后，该成员将无法继续访问工作区。`" confirm-text="确认删除" danger :is-submitting="isDeleting" @update:model-value="deleteTarget = null" @confirm="confirmRemove" />
    <AppConfirmDialog :model-value="Boolean(pendingStatus)" :title="statusConfirmTitle" :description="statusConfirmDescription" :confirm-text="pendingStatus === 'active' ? '确认启用' : '确认停用'" :danger="pendingStatus === 'disabled'" :is-submitting="isStatusUpdating" @update:model-value="pendingStatus = null" @confirm="confirmStatusChange" />
  </section>
</template>

<style scoped>
.member-cell { display: flex; align-items: center; gap: 10px; }.member-avatar { display: grid; width: 31px; height: 31px; place-items: center; border-radius: 50%; background: #e9eef5; color: #314b69; font-size: var(--aps-text-sm); font-weight: 720; }.member-cell strong, .member-cell span { display: block; }.member-cell strong { color: var(--aps-ink); font-size: var(--aps-text-base); font-weight: 680; }.member-cell div > span { margin-top: 2px; color: var(--aps-faint); font-size: var(--aps-text-xs); }.drawer-form { display: grid; gap: var(--aps-form-gap); }.form-error { margin: -3px 0 0; color: var(--aps-red); font-size: var(--aps-text-sm); }
</style>
