<script setup lang="ts">
import { computed, ref } from "vue";
import { AppButton, AppGlobalComponent, AppIconButton, AppSvgIcon, AppThemeSvg } from "aps-design-pro";
import { AppCard, AppHeaderBar, AppLogo, AppPageContent, AppPageHeader } from "aps-design-pro";
import { AppFastEnter, AppGlobalSearch, AppMenuRight, AppMixedMenu, AppSidebarMenu, AppWorkTab } from "aps-design-pro";
import { AppOverlay, AppSettingsPanel } from "aps-design-pro";
import { useFeedbackStore } from "@/stores/feedback";
import type { CommandPaletteItem } from "aps-design-pro";
import type { ContextMenuItem } from "aps-design-pro";
import type { GlobalSearchItem } from "aps-design-pro";
import type { NavigationItem } from "@/types/auth";
import type { NavigationItem as AppNavigationItem } from "aps-design-pro";
import type { TabItem } from "aps-design-pro";

const feedbackStore = useFeedbackStore();
const isGlobalSearchOpen = ref(false);
const isCommandPaletteOpen = ref(false);
const isSettingsOpen = ref(false);
const isOverlayOpen = ref(false);
const isMenuRightOpen = ref(false);
const activeWorkTab = ref("overview");
const closedWorkTabKeys = ref<string[]>([]);
const navigationStatus = ref("等待选择导航节点。");

const shellNavigationItems: NavigationItem[] = [
  { key: "dashboard", label: "工作台", path: "/dashboard", icon: "grid", permission: "dashboard:view" },
  {
    key: "examples",
    label: "组件示例",
    path: "/examples/application-shell",
    icon: "panel",
    permission: "dashboard:view",
    children: [
      { key: "application-shell", label: "应用外壳", path: "/examples/application-shell", icon: "panel", permission: "dashboard:view" },
      { key: "navigation", label: "导航与页签", path: "/examples/navigation", icon: "menu", permission: "dashboard:view" },
    ],
  },
  { key: "profile", label: "个人中心", path: "/profile", icon: "user", permission: "dashboard:view" },
];
const workTabItems = computed<TabItem[]>(() => {
  const items: TabItem[] = [
    { key: "overview", label: "概览", icon: "grid" },
    { key: "activities", label: "操作记录", icon: "clock", closable: true },
    { key: "settings", label: "发布设置", icon: "settings", closable: true },
  ];
  return items.filter((item) => !closedWorkTabKeys.value.includes(item.key));
});
const globalSearchItems: GlobalSearchItem[] = [
  { title: "应用外壳", description: "查看布局和导航包装器", path: "/examples/application-shell", icon: "panel" },
  { title: "通用菜单", description: "查看嵌套菜单与收起状态", path: "/examples/menu", icon: "menu" },
  { title: "偏好设置", description: "调整当前工作区的显示偏好", path: "/profile", icon: "settings" },
];
const commandItems: CommandPaletteItem[] = [
  { key: "create", title: "创建发布任务", description: "打开新的发布任务", icon: "arrow-up" },
  { key: "refresh", title: "刷新当前数据", description: "重新获取工作区数据", icon: "refresh" },
  { key: "archive", title: "归档当前版本", description: "暂不可用的受限操作", icon: "download", disabled: true },
];
const menuRightItems: ContextMenuItem[] = [
  { key: "copy", label: "复制页面链接", icon: "edit" },
  { key: "refresh", label: "重新加载页面", icon: "refresh" },
  { key: "remove", label: "移除草稿", icon: "trash", danger: true, divided: true },
];

/** 命令与搜索组件只负责选择，实际跳转或业务动作由页面按需接管。 */
function handleSearchSelection(item: GlobalSearchItem): void {
  isGlobalSearchOpen.value = false;
  feedbackStore.success(`已选择：${item.title}`);
}

function handleCommandSelection(item: CommandPaletteItem): void {
  feedbackStore.info(`命令已执行：${item.title}`);
}

function handleNavigation(item: AppNavigationItem): void {
  navigationStatus.value = `已触发导航：${item.label}`;
}

function handleMenuRightSelection(key: string): void {
  const item = menuRightItems.find((option) => option.key === key);
  if (item) feedbackStore.info(`已选择操作：${item.label}`);
}

/** 关闭工作页签后，确保当前选中项始终指向仍然存在的页签。 */
function closeWorkTab(key: string): void {
  closedWorkTabKeys.value = [...closedWorkTabKeys.value, key];
  if (activeWorkTab.value === key) activeWorkTab.value = "overview";
}

function restoreWorkTabs(): void {
  closedWorkTabKeys.value = [];
  activeWorkTab.value = "overview";
}
</script>

<template>
  <AppGlobalComponent>
    <section class="application-shell-view page-content page-stack" aria-label="应用外壳与导航组件示例">
      <header class="application-shell-heading">
        <div>
          <h1>应用外壳</h1>
          <p>将后台顶部栏、页面标题、应用导航、工作页签、快捷入口与全局浮层拆为可组合组件；示例中的操作均可独立验收。</p>
        </div>
        <div class="heading-actions">
          <AppButton size="small" variant="secondary" leading-icon="search" @click="isGlobalSearchOpen = true">全局搜索</AppButton>
          <AppButton size="small" leading-icon="settings" @click="isSettingsOpen = true">打开设置</AppButton>
        </div>
      </header>

      <AppCard as="section" padding="none" class="shell-composition-card">
        <AppHeaderBar title="发布工作区" subtitle="顶部标题与操作区由应用壳统一编排">
          <AppButton size="small" variant="secondary" @click="isCommandPaletteOpen = true">命令面板</AppButton>
          <AppIconButton icon="settings" label="打开偏好设置" size="small" @click="isSettingsOpen = true" />
        </AppHeaderBar>

        <div class="composition-main">
          <aside class="composition-sidebar" aria-label="应用标识与侧边导航">
            <AppLogo label="studio console" />
            <AppSidebarMenu :items="shellNavigationItems" active-path="/examples/application-shell" @navigate="handleNavigation" />
            <p class="navigation-status" aria-live="polite">{{ navigationStatus }}</p>
          </aside>

          <AppPageContent as="section" :padded="false" class="composition-content">
            <AppPageHeader title="应用页面标题" description="页面头部只承载当前任务的标题、说明与必要操作，避免与系统级顶部栏混淆。">
              <template #actions><AppButton size="small" variant="secondary">保存草稿</AppButton><AppButton size="small">发布版本</AppButton></template>
            </AppPageHeader>
            <AppWorkTab v-model="activeWorkTab" aria-label="发布工作页签" :items="workTabItems" @close="closeWorkTab" />
            <div class="composition-body">
              <div><strong>{{ activeWorkTab === "overview" ? "发布概览" : activeWorkTab === "activities" ? "操作记录" : "发布设置" }}</strong><p>工作页签可切换、关闭并恢复；页面状态由业务层保存，组件本身不绑定路由。</p></div>
              <AppButton size="small" variant="text" @click="restoreWorkTabs">恢复已关闭页签</AppButton>
            </div>
          </AppPageContent>
        </div>
      </AppCard>

      <div class="shell-demo-grid">
        <AppCard as="section" padding="large" class="shell-demo-card">
          <header><div><h2>混合导航</h2><p>横向入口与侧边层级导航共用同一份数据。</p></div></header>
          <AppMixedMenu :items="shellNavigationItems" active-path="/examples/application-shell" @navigate="handleNavigation" />
        </AppCard>

        <AppCard as="section" padding="large" class="shell-demo-card">
          <header><div><h2>图标与动作菜单</h2><p>图标包装器保留语义标签，右侧操作区统一输出选择事件。</p></div></header>
          <div class="icon-actions">
            <span class="icon-sample"><AppSvgIcon name="panel" :size="19" label="布局图标" /> AppSvgIcon</span>
            <span class="icon-sample"><AppThemeSvg name="settings" :size="19" label="设置图标" /> AppThemeSvg</span>
            <AppMenuRight v-model="isMenuRightOpen" label="页面操作" :items="menuRightItems" @select="handleMenuRightSelection">
              <template #trigger="{ open, toggle }"><AppButton size="small" variant="secondary" :aria-expanded="open" trailing-icon="dots" @click="toggle">页面操作</AppButton></template>
            </AppMenuRight>
          </div>
        </AppCard>
      </div>

      <AppCard as="section" padding="large" class="overlay-demo-card">
        <header><div><h2>全局入口与遮罩层</h2><p>搜索、命令面板、偏好设置和通用遮罩均可关闭，键盘交互沿用对应底座。</p></div></header>
        <div class="overlay-demo-actions">
          <AppButton variant="secondary" leading-icon="search" @click="isGlobalSearchOpen = true">打开全局搜索</AppButton>
          <AppButton variant="secondary" leading-icon="grid" @click="isCommandPaletteOpen = true">打开命令面板</AppButton>
          <AppButton variant="secondary" leading-icon="panel" @click="isOverlayOpen = true">打开遮罩层</AppButton>
          <AppButton variant="secondary" leading-icon="bell" @click="feedbackStore.success('全局消息组件已显示。')">显示消息</AppButton>
        </div>
      </AppCard>
    </section>
  </AppGlobalComponent>

  <AppGlobalSearch v-model="isGlobalSearchOpen" :items="globalSearchItems" @select="handleSearchSelection" />
  <AppFastEnter v-model="isCommandPaletteOpen" :items="commandItems" @select="handleCommandSelection" />
  <AppSettingsPanel v-model="isSettingsOpen" title="应用壳偏好" description="用于验收设置面板的内容区、滚动区和底部操作区。" width="wide">
    <div class="settings-demo-copy"><strong>导航布局</strong><p>此面板包装抽屉组件，并完整透传默认内容插槽和底部操作插槽。</p></div>
    <template #footer><AppButton variant="secondary" @click="isSettingsOpen = false">取消</AppButton><AppButton @click="isSettingsOpen = false; feedbackStore.success('偏好已保存。')">保存偏好</AppButton></template>
  </AppSettingsPanel>
  <AppOverlay v-model="isOverlayOpen" layer="dialog" @update:model-value="isOverlayOpen = $event">
    <section class="overlay-sample-dialog" role="dialog" aria-modal="true" aria-label="通用遮罩层示例">
      <AppSvgIcon name="panel" :size="20" label="遮罩层图标" />
      <div><h2>通用遮罩层</h2><p>它为对话框、抽屉和全屏预览提供统一的层级与点击遮罩关闭能力。</p></div>
      <div class="overlay-sample-actions"><AppButton variant="secondary" @click="isOverlayOpen = false">关闭</AppButton><AppButton @click="isOverlayOpen = false; feedbackStore.success('操作已确认。')">确认</AppButton></div>
    </section>
  </AppOverlay>
</template>

<style scoped>
.application-shell-view { display: grid; min-height: 0; align-content: start; gap: var(--aps-page-stack-gap); }
.application-shell-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; }
.application-shell-heading h1, .application-shell-heading p, .shell-demo-card h2, .shell-demo-card p, .overlay-demo-card h2, .overlay-demo-card p { margin: 0; }
.application-shell-heading h1 { color: var(--aps-ink); font-size: var(--aps-text-2xl); font-weight: 740; letter-spacing: -.035em; }
.application-shell-heading p { max-width: 760px; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }
.heading-actions, .overlay-demo-actions, .icon-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.shell-composition-card { overflow: hidden; }
.composition-main { display: grid; grid-template-columns: 220px minmax(0, 1fr); min-height: 354px; }
.composition-sidebar { display: grid; align-content: start; gap: 18px; padding: 18px 14px; border-right: 1px solid var(--aps-line-soft); background: var(--aps-surface-soft); }
.navigation-status { min-height: 18px; margin: 0; padding-top: 12px; border-top: 1px solid var(--aps-line-soft); color: var(--aps-faint); font-size: var(--aps-text-xs); line-height: 1.45; }
.composition-content { display: grid; align-content: start; gap: 20px; padding: 24px; }
.composition-body { display: flex; align-items: start; justify-content: space-between; gap: 16px; padding: 18px; border: 1px solid var(--aps-line-soft); border-radius: 13px; background: var(--aps-surface-soft); }
.composition-body strong { color: var(--aps-ink); font-size: var(--aps-text-base); font-weight: 720; }
.composition-body p { max-width: 560px; margin: 6px 0 0; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }
.shell-demo-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(280px, .8fr); gap: var(--aps-page-stack-gap); }
.shell-demo-card, .overlay-demo-card { display: grid; align-content: start; gap: 20px; }
.shell-demo-card h2, .overlay-demo-card h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: 720; }
.shell-demo-card p, .overlay-demo-card p { margin-top: 6px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }
.shell-demo-card :deep(.app-mixed-menu) { gap: 16px; }
.shell-demo-card :deep(.app-sidebar-menu) { max-width: 280px; padding: 8px; border: 1px solid var(--aps-line-soft); border-radius: 12px; background: var(--aps-surface-soft); }
.icon-sample { display: inline-flex; align-items: center; gap: 7px; color: var(--aps-muted); font-size: var(--aps-text-sm); }
.icon-sample :deep(.app-svg-icon) { color: var(--aps-blue); }
.overlay-sample-dialog { display: grid; width: min(100%, 420px); gap: 13px; padding: 22px; border: 1px solid var(--aps-line-soft); border-radius: 16px; background: var(--aps-surface); box-shadow: var(--aps-shadow); }
.overlay-sample-dialog > :first-child { color: var(--aps-blue); }
.overlay-sample-dialog h2, .overlay-sample-dialog p { margin: 0; }
.overlay-sample-dialog h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: 720; }
.overlay-sample-dialog p { margin-top: 5px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }
.overlay-sample-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 4px; }
.settings-demo-copy { display: grid; gap: 6px; }.settings-demo-copy strong { color: var(--aps-ink); font-size: var(--aps-text-base); font-weight: 720; }.settings-demo-copy p { margin: 0; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }
@media (max-width: 860px) { .shell-demo-grid { grid-template-columns: 1fr; }.composition-main { grid-template-columns: 1fr; }.composition-sidebar { border-right: 0; border-bottom: 1px solid var(--aps-line-soft); }.composition-sidebar :deep(.app-sidebar-menu) { grid-template-columns: repeat(3, minmax(0, 1fr)); }.navigation-status { display: none; } }
@media (max-width: 660px) { .application-shell-heading { align-items: start; flex-direction: column; }.composition-content { padding: 18px; }.composition-body { flex-direction: column; }.composition-sidebar :deep(.app-sidebar-menu) { grid-template-columns: 1fr; }.overlay-demo-actions { align-items: stretch; }.overlay-demo-actions :deep(.app-button-control) { flex: 1 1 150px; } }
</style>
