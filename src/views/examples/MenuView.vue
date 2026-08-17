<script setup lang="ts">
import { ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppCheckbox, AppSegmented } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import { AppMenu, type MenuItem, type MenuMode } from "aps-design-pro";
import type { SelectOption } from "aps-design-pro";

const verticalActiveKey = ref("overview");
const horizontalActiveKey = ref("workspace-activity");
const isCollapsed = ref(false);
const uniqueOpened = ref(false);
const selectionStatus = ref("当前选中：项目概览");
const horizontalMode = ref<MenuMode>("horizontal");

const menuItems: MenuItem[] = [
  { key: "overview", label: "项目概览", icon: "grid" },
  { key: "workspace", label: "工作区", icon: "panel", badge: 3, children: [{ key: "workspace-activity", label: "近期活动", icon: "clock" }, { key: "workspace-members", label: "成员管理", icon: "users" }, { key: "workspace-archive", label: "归档内容", icon: "download", disabled: true }] },
  { key: "security", label: "访问控制", icon: "shield", children: [{ key: "security-roles", label: "角色策略", icon: "settings" }, { key: "security-audit", label: "审计记录", icon: "chart" }] },
  { key: "preferences", label: "偏好设置", icon: "settings" },
];
const modeOptions: SelectOption[] = [{ label: "横向菜单", value: "horizontal" }, { label: "纵向菜单", value: "vertical" }];

function handleMenuSelect(key: string, item: MenuItem): void {
  selectionStatus.value = `已选择：${item.label}（${key}）`;
}

function resetVerticalMenu(): void {
  verticalActiveKey.value = "overview";
  isCollapsed.value = false;
  uniqueOpened.value = false;
  selectionStatus.value = "已恢复默认菜单状态。";
}
</script>

<template>
  <section class="menu-view page-content page-stack" aria-label="通用菜单组件示例">
    <header class="menu-view-heading"><div><h1>通用菜单</h1><p>菜单与路由、权限系统解耦，只负责层级、选择、展开和折叠状态；业务可以将 select 事件接到任意跳转或数据筛选逻辑。</p></div><AppButton size="small" variant="secondary" leading-icon="refresh" @click="resetVerticalMenu">恢复示例</AppButton></header>

    <div class="menu-showcase-grid">
      <AppCard as="article" padding="large" class="menu-demo-card">
        <header class="menu-card-heading"><div><h2>纵向层级菜单</h2><p>支持任意子级、唯一展开、禁用状态与收起后的完整读屏标签。</p></div></header>
        <div class="menu-demo-controls"><AppCheckbox v-model="isCollapsed" label="收起菜单" /><AppCheckbox v-model="uniqueOpened" label="唯一展开" /></div>
        <div class="vertical-menu-stage" :class="{ 'is-collapsed': isCollapsed }"><AppMenu v-model="verticalActiveKey" :items="menuItems" :collapse="isCollapsed" :unique-opened="uniqueOpened" :default-openeds="['workspace']" aria-label="项目配置菜单" @select="handleMenuSelect" /></div>
      </AppCard>

      <AppCard as="article" padding="large" class="menu-demo-card">
        <header class="menu-card-heading"><div><h2>横向操作菜单</h2><p>二级节点在当前菜单下方展开，Esc 或反向方向键可以安全收起。</p></div></header>
        <div class="horizontal-menu-controls"><AppSegmented v-model="horizontalMode" :options="modeOptions" aria-label="菜单示例方向" /></div>
        <div class="horizontal-menu-stage"><AppMenu v-model="horizontalActiveKey" :items="menuItems" :mode="horizontalMode" :default-openeds="['workspace']" aria-label="工作区操作菜单" @select="handleMenuSelect" /></div>
        <p class="menu-status" aria-live="polite">{{ selectionStatus }}</p>
      </AppCard>
    </div>
  </section>
</template>

<style scoped>
.menu-view { display: grid; min-height: 0; align-content: start; gap: var(--aps-page-stack-gap); }.menu-view-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; }.menu-view-heading h1, .menu-view-heading p, .menu-card-heading h2, .menu-card-heading p { margin: 0; }.menu-view-heading h1 { color: var(--aps-ink); font-size: var(--aps-text-2xl); font-weight: var(--aps-font-weight-heading); letter-spacing: -.035em; }.menu-view-heading p { max-width: 760px; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }.menu-showcase-grid { display: grid; grid-template-columns: minmax(280px, .82fr) minmax(0, 1.18fr); gap: var(--aps-page-stack-gap); }.menu-demo-card { display: grid; align-content: start; gap: 20px; }.menu-card-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: var(--aps-font-weight-heading); }.menu-card-heading p { margin-top: 6px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.menu-demo-controls { display: flex; flex-wrap: wrap; gap: 12px 18px; }.vertical-menu-stage { width: 100%; min-height: 330px; padding: 8px; border: 1px solid var(--aps-line-soft); border-radius: 12px; background: var(--aps-surface-soft); transition: width 200ms ease; }.vertical-menu-stage.is-collapsed { width: 62px; }.horizontal-menu-controls { margin-bottom: 4px; }.horizontal-menu-stage { position: relative; min-height: 210px; padding: 12px; border: 1px solid var(--aps-line-soft); border-radius: 12px; background: var(--aps-surface-soft); }.menu-status { min-height: 20px; margin: 0; color: var(--aps-faint); font-size: var(--aps-text-xs); }@media (max-width: 880px) { .menu-showcase-grid { grid-template-columns: 1fr; } }.menu-view-heading { align-items: start; }@media (max-width: 600px) { .menu-view-heading { flex-direction: column; } }
</style>
