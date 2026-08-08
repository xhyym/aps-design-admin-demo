<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import { AppConfirmDialog } from "aps-design-pro";
import { AppContextMenu, type ContextMenuItem } from "aps-design-pro";
import { AppDrawer } from "aps-design-pro";
import { AppDropdown, type DropdownItem } from "aps-design-pro";
import { AppBreadcrumb } from "aps-design-pro";
import { AppGlobalSearch, type GlobalSearchItem } from "aps-design-pro";
import { AppSidebarSubmenuPopover } from "aps-design-pro";
import type { NavigationItem as SidebarNavigationItem } from "aps-design-pro";
import { AppBrandMark } from "aps-design-pro";
import { AppIcon, type IconName } from "aps-design-pro";
import { AppIconButton } from "aps-design-pro";
import { AppPopover } from "aps-design-pro";
import { AppRadioGroup } from "aps-design-pro";
import { AppSwitch } from "aps-design-pro";
import { AppTooltip } from "aps-design-pro";
import { useAppStore } from "@/stores/app";
import { useAuthStore } from "@/stores/auth";
import { useFeedbackStore } from "@/stores/feedback";
import { useTabsStore, type AppTab } from "@/stores/tabs";
import type { NavigationItem } from "@/types/auth";
import type { BreadcrumbItem, RadioOption } from "aps-design-pro";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

type TabMenuAction = "refresh" | "pin" | "close-current" | "close-left" | "close-right" | "close-others" | "close-all";
type TabMenuAnchor = "tab" | "toolbar";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const authStore = useAuthStore();
const feedbackStore = useFeedbackStore();
const tabsStore = useTabsStore();
const { sidebarCollapsed, sidebarWidth, sidebarMenuStyle, density, fontScale, theme } = storeToRefs(appStore);
const { tabs } = storeToRefs(tabsStore);
const isSearchOpen = ref(false);
const isNotificationOpen = ref(false);
const isUserMenuOpen = ref(false);
const isSettingsOpen = ref(false);
const isTabMenuOpen = ref(false);
const isLogoutConfirmOpen = ref(false);
const isFullscreen = ref(false);
const tabMenuPath = ref("");
const tabMenuAnchor = ref<TabMenuAnchor>("toolbar");
const expandedNavigationGroups = ref<string[]>([]);
const collapsedNavigationGroup = ref<string | null>(null);
const excludedCacheNames = ref<string[]>([]);
const routeRefreshVersions = ref<Record<string, number>>({});
const isRouteViewVisible = ref(true);
const tabListElement = ref<HTMLElement | null>(null);
const canScrollTabsLeft = ref(false);
const canScrollTabsRight = ref(false);
const notifications = ref<NotificationItem[]>([
  { id: "notification-1", title: "权限变更待处理", description: "有 2 项菜单权限变更需要确认。", time: "10 分钟前", read: false },
  { id: "notification-2", title: "成员审核已完成", description: "3 位新成员已加入产品工作区。", time: "今天 09:18", read: false },
  { id: "notification-3", title: "安全策略已更新", description: "会话有效期已应用到当前工作区。", time: "昨天", read: true },
]);

const navigation = computed(() => authStore.profile?.navigation ?? []);
const currentTitle = computed(() => String(route.meta.title ?? "工作台"));
const currentIcon = computed<IconName>(() => route.meta.icon ?? "grid");
const currentPath = computed(() => route.path);
const keepAliveViewNames = computed(() => [...new Set(router.getRoutes()
  .filter((item) => item.meta.keepAlive && item.meta.cacheName && !excludedCacheNames.value.includes(item.meta.cacheName))
  .map((item) => item.meta.cacheName as string))]);
const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const trail = findNavigationTrail(navigation.value, currentPath.value);
  if (!trail) return [{ label: currentTitle.value }];

  return trail.map((item, index) => ({
    label: item.label,
    href: index < trail.length - 1 ? item.path : undefined,
  }));
});
const unreadCount = computed(() => notifications.value.filter((item) => !item.read).length);
const tabMenuTarget = computed(() => tabs.value.find((item) => item.path === tabMenuPath.value) ?? tabs.value.find((item) => item.path === currentPath.value) ?? null);
const tabMenuIndex = computed(() => tabMenuTarget.value ? tabs.value.findIndex((item) => item.path === tabMenuTarget.value?.path) : -1);
const canCloseTabsToLeft = computed(() => tabMenuIndex.value > 0 && tabs.value.slice(0, tabMenuIndex.value).some((item) => !item.pinned));
const canCloseTabsToRight = computed(() => tabMenuIndex.value >= 0 && tabs.value.slice(tabMenuIndex.value + 1).some((item) => !item.pinned));
const userMenuItems: DropdownItem[] = [
  { key: "profile", label: "个人中心", icon: "user" },
  { key: "settings", label: "偏好设置", icon: "settings" },
  { key: "website", label: "访问官网", icon: "arrow-right" },
  { key: "logout", label: "退出登录", icon: "logout", danger: true, divided: true },
];
const themeOptions: RadioOption[] = [
  { label: "浅色", value: "light", description: "中性明亮的默认界面" },
  { label: "深色", value: "dark", description: "适合低光环境与长时间使用" },
];
const fontScaleOptions: RadioOption[] = [
  { label: "小", value: "small", description: "13 px 基准字号" },
  { label: "默认", value: "default", description: "14 px 基准字号" },
  { label: "大", value: "large", description: "15 px 基准字号" },
];
const densityOptions: RadioOption[] = [
  { label: "舒适", value: "comfortable", description: "保留更多留白，适合日常浏览" },
  { label: "紧凑", value: "compact", description: "缩减操作间距，适合高密度任务" },
];
const sidebarWidthOptions: RadioOption[] = [
  { label: "窄", value: "narrow", description: "216 px，释放更多内容宽度" },
  { label: "默认", value: "default", description: "236 px，平衡导航与内容" },
  { label: "宽", value: "wide", description: "264 px，适合复杂菜单名称" },
];
const sidebarMenuStyleOptions: RadioOption[] = [
  { label: "平滑", value: "smooth" },
  { label: "紧凑", value: "compact" },
  { label: "即时", value: "instant" },
];
const tabMenuItems = computed<ContextMenuItem[]>(() => {
  const target = tabMenuTarget.value;
  if (!target) return [];
  return [
    { key: "refresh", label: "刷新页面", icon: "refresh" },
    { key: "pin", label: target.pinned ? "取消固定" : "固定标签", icon: "pin", disabled: target.path === "/dashboard" },
    { key: "close-current", label: "关闭当前", icon: "close", disabled: target.pinned, divided: true },
    { key: "close-left", label: "关闭左侧", disabled: !canCloseTabsToLeft.value },
    { key: "close-right", label: "关闭右侧", disabled: !canCloseTabsToRight.value },
    { key: "close-others", label: "关闭其他" },
    { key: "close-all", label: "关闭全部" },
  ];
});
const globalSearchItems = computed<GlobalSearchItem[]>(() => [
  ...flattenNavigation(navigation.value),
  { title: "个人中心", description: "查看账户资料与安全设置", path: "/profile", icon: "user" },
]);

/** 路由首次进入某个导航分组时自动展开；后续是否收起完全由用户控制。 */
watch(
  [navigation, currentPath],
  ([items, path]) => {
    const currentGroup = items.find((item) => item.children?.some((child) => child.path === path));
    if (currentGroup && !expandedNavigationGroups.value.includes(currentGroup.key)) {
      expandedNavigationGroups.value = [...expandedNavigationGroups.value, currentGroup.key];
    }
  },
  { immediate: true },
);

/** 展开侧栏后移除折叠态浮层记录，避免布局切换时保留不可见的菜单状态。 */
watch(sidebarCollapsed, (collapsed) => {
  if (!collapsed) collapsedNavigationGroup.value = null;
});

watch(
  () => route.fullPath,
  () => {
    if (route.name && route.meta.title) {
      tabsStore.ensureTab({
        name: String(route.name),
        title: String(route.meta.title),
        path: route.path,
        icon: currentIcon.value,
        pinned: route.name === "dashboard",
      });
    }
    isNotificationOpen.value = false;
    isUserMenuOpen.value = false;
    isTabMenuOpen.value = false;
    tabMenuPath.value = "";
  },
  { immediate: true },
);

/** 页签增删后重新计算可滚动范围，避免新增页签时滚动按钮状态滞后。 */
watch(tabs, () => {
  void nextTick(syncTabScrollState);
}, { deep: true });

/** 将权限导航扁平化为可搜索页面，分组节点不作为重复入口显示。 */
function flattenNavigation(items: NavigationItem[]): GlobalSearchItem[] {
  return items.flatMap((item) => {
    if (item.children) return flattenNavigation(item.children);
    return [{ title: item.label, description: item.path, path: item.path, icon: item.icon }];
  });
}

/** 先查找子节点，避免分组默认路径与首个子页面相同时丢失层级。 */
function findNavigationTrail(items: NavigationItem[], path: string, ancestors: NavigationItem[] = []): NavigationItem[] | null {
  for (const item of items) {
    const trail = [...ancestors, item];
    const childTrail = item.children?.length ? findNavigationTrail(item.children, path, trail) : null;
    if (childTrail) return childTrail;
    if (item.path === path) return trail;
  }
  return null;
}

function isNavigationGroupExpanded(item: NavigationItem): boolean {
  return expandedNavigationGroups.value.includes(item.key);
}

/** 分组的展开状态只由用户点击维护，当前路由不会阻止收起操作。 */
function toggleNavigationGroup(item: NavigationItem): void {
  if (!item.children) return;
  expandedNavigationGroups.value = expandedNavigationGroups.value.includes(item.key)
    ? expandedNavigationGroups.value.filter((key) => key !== item.key)
    : [...expandedNavigationGroups.value, item.key];
}

/** 折叠态采用悬浮子菜单；状态集中在布局层，确保多个一级菜单不会同时展开。 */
function updateCollapsedNavigationGroup(item: NavigationItem, visible: boolean): void {
  collapsedNavigationGroup.value = visible ? item.key : null;
}

function navigateFromCollapsedSubmenu(item: SidebarNavigationItem): void {
  collapsedNavigationGroup.value = null;
  void router.push(item.path);
}

function openTabMenu(path: string, anchor: TabMenuAnchor = "toolbar"): void {
  tabMenuPath.value = path;
  tabMenuAnchor.value = anchor;
  isTabMenuOpen.value = true;
}

/** 页签栏隐藏原生滚动条后，使用显式状态驱动左右滚动入口。 */
function syncTabScrollState(): void {
  const tabList = tabListElement.value;
  if (!tabList) return;
  const maximumScrollLeft = Math.max(0, tabList.scrollWidth - tabList.clientWidth);
  canScrollTabsLeft.value = tabList.scrollLeft > 1;
  canScrollTabsRight.value = tabList.scrollLeft < maximumScrollLeft - 1;
}

/** 每次按当前可视宽度的一半平移，避免用户反复点击才能定位到目标页签。 */
function scrollTabs(direction: -1 | 1): void {
  const tabList = tabListElement.value;
  if (!tabList) return;
  const distance = Math.max(160, Math.round(tabList.clientWidth * 0.5));
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  tabList.scrollBy({ left: direction * distance, behavior });
}

/** 鼠标停留在页签区域时将纵向滚轮映射为横向滚动，触控板横向手势仍由浏览器原生处理。 */
function handleTabWheel(event: WheelEvent): void {
  const tabList = tabListElement.value;
  if (!tabList || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
  const maximumScrollLeft = Math.max(0, tabList.scrollWidth - tabList.clientWidth);
  const nextScrollLeft = Math.min(maximumScrollLeft, Math.max(0, tabList.scrollLeft + event.deltaY));
  if (nextScrollLeft === tabList.scrollLeft) return;
  event.preventDefault();
  tabList.scrollLeft = nextScrollLeft;
  syncTabScrollState();
}

/** 只清理当前触发源的菜单状态，防止标签右键与工具栏菜单彼此干扰。 */
function updateTabMenuVisibility(path: string, anchor: TabMenuAnchor, visible: boolean): void {
  if (visible) {
    openTabMenu(path, anchor);
    return;
  }
  if (tabMenuPath.value === path && tabMenuAnchor.value === anchor) {
    isTabMenuOpen.value = false;
    tabMenuPath.value = "";
  }
}

function closeTab(path: string): void {
  const isCurrentTab = path === currentPath.value;
  tabsStore.removeTab(path);
  void evictRouteCache(path);
  if (isCurrentTab) navigateToAvailableTab();
}

/** 批量关闭后统一校验当前路由，避免页面仍停留在已移除的标签上。 */
function navigateToAvailableTab(): void {
  if (tabs.value.some((item) => item.path === currentPath.value)) return;
  const fallbackTab = tabs.value.at(-1);
  if (fallbackTab) void router.push(fallbackTab.path);
}

function handleTabAction(action: TabMenuAction): void {
  const target = tabMenuTarget.value;
  if (!target) return;

  if (action === "refresh") {
    isTabMenuOpen.value = false;
    if (target.path === currentPath.value) void refreshCurrentRoute();
    else void evictRouteCache(target.path);
    return;
  }
  if (action === "pin") tabsStore.togglePin(target.path);
  if (action === "close-current") closeTab(target.path);
  if (action === "close-left") tabsStore.closeTabsToLeft(target.path);
  if (action === "close-right") tabsStore.closeTabsToRight(target.path);
  if (action === "close-others") tabsStore.closeOtherTabs(target.path);
  if (action === "close-all") tabsStore.closeAllTabs();

  navigateToAvailableTab();
  isTabMenuOpen.value = false;
}

function getRouteCacheName(path: string): string | null {
  return router.resolve(path).meta.cacheName ?? null;
}

function getRouteViewKey(routeName: string | symbol | null | undefined): string {
  const key = String(routeName ?? route.fullPath);
  return `${key}-${routeRefreshVersions.value[key] ?? 0}`;
}

/** 仅移除指定路由的 KeepAlive 实例；同一视图组件的不同示例会作为同一缓存族同步失效。 */
async function evictRouteCache(path: string): Promise<void> {
  const cacheName = getRouteCacheName(path);
  if (!cacheName || excludedCacheNames.value.includes(cacheName)) return;
  excludedCacheNames.value = [...excludedCacheNames.value, cacheName];
  await nextTick();
  excludedCacheNames.value = excludedCacheNames.value.filter((item) => item !== cacheName);
}

/** 刷新只重建当前页面实例和数据，不再使用 router.go 破坏整个应用状态。 */
async function refreshCurrentRoute(): Promise<void> {
  const routeKey = String(route.name ?? route.fullPath);
  const cacheName = getRouteCacheName(route.path);
  if (cacheName) excludedCacheNames.value = [...excludedCacheNames.value, cacheName];
  isRouteViewVisible.value = false;
  await nextTick();
  if (cacheName) excludedCacheNames.value = excludedCacheNames.value.filter((item) => item !== cacheName);
  routeRefreshVersions.value = { ...routeRefreshVersions.value, [routeKey]: (routeRefreshVersions.value[routeKey] ?? 0) + 1 };
  await nextTick();
  isRouteViewVisible.value = true;
}

function handleTabMenuSelection(action: string): void {
  handleTabAction(action as TabMenuAction);
}

function selectSearchItem(item: GlobalSearchItem): void {
  isSearchOpen.value = false;
  void router.push(item.path);
}

/** 面包屑只负责路径定位，路由状态仍由 Vue Router 统一维护。 */
function navigateBreadcrumb(href: string): void {
  void router.push(href);
}

function markAllNotificationsRead(): void {
  notifications.value = notifications.value.map((item) => ({ ...item, read: true }));
  feedbackStore.show("通知已全部标记为已读。", "success");
}

function openProfile(): void {
  void router.push("/profile");
}

function openOfficialWebsite(): void {
  window.open("https://apsdesignpro.com/", "_blank", "noopener,noreferrer");
}

function handleUserMenuAction(action: string): void {
  if (action === "profile") openProfile();
  if (action === "settings") isSettingsOpen.value = true;
  if (action === "website") openOfficialWebsite();
  if (action === "logout") requestLogout();
}

function updateTheme(value: string): void {
  if (value === "light" || value === "dark") appStore.setTheme(value);
}

function updateFontScale(value: string): void {
  if (value === "small" || value === "default" || value === "large") appStore.setFontScale(value);
}

function updateDensity(value: string): void {
  if (value === "comfortable" || value === "compact") appStore.setDensity(value);
}

function updateSidebarWidth(value: string): void {
  if (value === "narrow" || value === "default" || value === "wide") appStore.setSidebarWidth(value);
}

function updateSidebarMenuStyle(value: string): void {
  if (value === "smooth" || value === "compact" || value === "instant") appStore.setSidebarMenuStyle(value);
}

function requestLogout(): void {
  isUserMenuOpen.value = false;
  isLogoutConfirmOpen.value = true;
}

function logout(): void {
  authStore.logout();
  isLogoutConfirmOpen.value = false;
  feedbackStore.show("已安全退出当前工作区。", "success");
  void router.push({ name: "login" });
}

function syncFullscreenState(): void {
  isFullscreen.value = Boolean(document.fullscreenElement);
}

async function toggleFullscreen(): Promise<void> {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "当前浏览器不支持全屏显示。";
    feedbackStore.show(`无法切换全屏：${message}`, "error");
  }
}

function handleGlobalShortcut(event: KeyboardEvent): void {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    isSearchOpen.value = true;
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleGlobalShortcut);
  document.addEventListener("fullscreenchange", syncFullscreenState);
  window.addEventListener("resize", syncTabScrollState);
  syncFullscreenState();
  void nextTick(syncTabScrollState);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleGlobalShortcut);
  document.removeEventListener("fullscreenchange", syncFullscreenState);
  window.removeEventListener("resize", syncTabScrollState);
});
</script>

<template>
  <div class="app-shell" :class="[`density-${density}`, `font-scale-${fontScale}`, `sidebar-width-${sidebarWidth}`, `sidebar-menu-style-${sidebarMenuStyle}`, { 'is-sidebar-collapsed': sidebarCollapsed }]">
    <aside class="app-sidebar" aria-label="主导航">
      <div class="brand-area">
        <RouterLink class="brand" to="/dashboard" aria-label="aps-design-pro 工作台">
          <AppBrandMark />
          <span class="brand-copy">aps-design-pro</span>
        </RouterLink>
      </div>

      <nav class="side-nav">
        <template v-for="item in navigation" :key="item.key">
          <RouterLink v-if="!item.children" class="nav-link" :to="item.path" :title="sidebarCollapsed ? item.label : undefined">
            <AppIcon :name="item.icon" :size="18" />
            <span>{{ item.label }}</span>
          </RouterLink>
          <div v-else class="nav-group">
            <AppSidebarSubmenuPopover
              v-if="sidebarCollapsed"
              :model-value="collapsedNavigationGroup === item.key"
              :item="item"
              :active-path="currentPath"
              @update:model-value="updateCollapsedNavigationGroup(item, $event)"
              @navigate="navigateFromCollapsedSubmenu"
            >
              <template #default="{ open, controls, openSubmenu }">
                <button
                  class="nav-link nav-parent"
                  type="button"
                  :aria-label="item.label"
                  :aria-expanded="open"
                  :aria-controls="controls"
                  @click="openSubmenu"
                >
                  <AppIcon :name="item.icon" :size="18" />
                  <span>{{ item.label }}</span>
                  <AppIcon class="nav-parent-chevron" name="chevron-down" :size="15" />
                </button>
              </template>
            </AppSidebarSubmenuPopover>

            <template v-else>
              <button class="nav-link nav-parent" type="button" :aria-expanded="isNavigationGroupExpanded(item)" @click="toggleNavigationGroup(item)">
                <AppIcon :name="item.icon" :size="18" />
                <span>{{ item.label }}</span>
                <AppIcon class="nav-parent-chevron" name="chevron-down" :size="15" />
              </button>
              <Transition name="nav-children-transition">
                <div v-if="isNavigationGroupExpanded(item)" class="nav-children-transition">
                  <div class="nav-children">
                    <RouterLink v-for="child in item.children" :key="child.key" class="nav-child" :to="child.path">
                      <AppIcon class="nav-child-icon" :name="child.icon" :size="16" />
                      <span>{{ child.label }}</span>
                    </RouterLink>
                  </div>
                </div>
              </Transition>
            </template>
          </div>
        </template>
      </nav>

      <div class="sidebar-footer">
        <button class="workspace-card" type="button" @click="isSettingsOpen = true">
          <AppBrandMark size="default" />
          <span class="workspace-copy"><strong>产品工作区</strong><small>运行正常</small></span>
          <AppIcon class="workspace-arrow" name="settings" :size="16" />
        </button>
      </div>
    </aside>

    <section class="app-main">
      <header class="topbar">
        <div class="topbar-left">
          <AppTooltip :text="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"><AppIconButton icon="panel" :label="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'" @click="appStore.toggleSidebar()" /></AppTooltip>
          <AppBreadcrumb class="topbar-breadcrumb" :items="breadcrumbItems" @navigate="navigateBreadcrumb" />
        </div>

        <div class="topbar-actions">
          <button class="quick-search" type="button" aria-label="搜索功能或页面" @click="isSearchOpen = true"><AppIcon name="search" :size="16" /><span>搜索功能或页面</span><kbd>⌘ K</kbd></button>
          <AppTooltip :text="isFullscreen ? '退出全屏' : '进入全屏'"><AppIconButton class="fullscreen-button" :icon="isFullscreen ? 'fullscreen-exit' : 'fullscreen'" :label="isFullscreen ? '退出全屏' : '进入全屏'" @click="toggleFullscreen" /></AppTooltip>

          <AppPopover v-model="isNotificationOpen" label="通知中心">
            <template #trigger="{ open, toggle }"><span class="notification-button"><AppIconButton icon="bell" label="查看通知" :active="open" :aria-expanded="open" @click="toggle" /><span v-if="unreadCount" class="notification-count">{{ unreadCount }}</span></span></template>
            <section class="notification-popover" aria-label="通知中心">
              <header><div><h2>通知中心</h2><p>共 {{ unreadCount }} 条未读</p></div><button class="text-button" type="button" :disabled="unreadCount === 0" @click="markAllNotificationsRead">全部已读</button></header>
              <div class="notification-list"><article v-for="item in notifications" :key="item.id" :class="{ 'is-unread': !item.read }"><span class="notification-dot" aria-hidden="true"></span><div><strong>{{ item.title }}</strong><p>{{ item.description }}</p><time>{{ item.time }}</time></div></article></div>
            </section>
          </AppPopover>

          <AppDropdown v-model="isUserMenuOpen" :items="userMenuItems" menu-label="账户菜单" @select="handleUserMenuAction"><template #trigger="{ open, toggle }"><button class="profile-button" type="button" :aria-expanded="open" @click="toggle"><span class="profile-avatar">{{ authStore.profile?.initials }}</span><span class="profile-copy"><strong>{{ authStore.profile?.name }}</strong><small>{{ authStore.profile?.title }}</small></span><AppIcon name="chevron-down" :size="15" /></button></template><template #header><div class="user-popover-profile"><div class="user-popover-avatar" aria-hidden="true">{{ authStore.profile?.initials }}</div><div><strong>{{ authStore.profile?.name }}</strong><span>{{ authStore.profile?.title }}</span></div></div></template></AppDropdown>
        </div>
      </header>

      <div class="tabbar" aria-label="打开的页面标签">
        <div ref="tabListElement" class="tab-list" @scroll="syncTabScrollState" @wheel="handleTabWheel">
          <AppContextMenu v-for="tab in tabs" :key="tab.path" :model-value="isTabMenuOpen && tabMenuPath === tab.path && tabMenuAnchor === 'tab'" :items="tabMenuItems" :menu-label="`${tab.title}标签操作`" @update:model-value="updateTabMenuVisibility(tab.path, 'tab', $event)" @select="handleTabMenuSelection"><template #trigger><RouterLink class="app-tab" :class="{ 'is-active': tab.path === currentPath }" :to="tab.path" @contextmenu.prevent="openTabMenu(tab.path, 'tab')"><AppIcon class="tab-icon" :name="tab.icon" :size="14" /><span>{{ tab.title }}</span><button v-if="!tab.pinned" class="tab-close" type="button" :aria-label="`关闭${tab.title}`" @click.prevent.stop="closeTab(tab.path)"><AppIcon name="close" :size="13" /></button></RouterLink></template></AppContextMenu>
        </div>
        <div class="tab-actions">
          <AppTooltip text="向左滚动页签"><AppIconButton class="tab-action-button tab-scroll-button" icon="chevron-left" label="向左滚动页签" size="small" :disabled="!canScrollTabsLeft" @click="scrollTabs(-1)" /></AppTooltip>
          <AppTooltip text="向右滚动页签"><AppIconButton class="tab-action-button tab-scroll-button" icon="chevron-right" label="向右滚动页签" size="small" :disabled="!canScrollTabsRight" @click="scrollTabs(1)" /></AppTooltip>
          <AppTooltip text="刷新当前页面"><AppIconButton class="tab-action-button" icon="refresh" label="刷新当前页面" size="small" @click="handleTabAction('refresh')" /></AppTooltip>
          <AppContextMenu :model-value="isTabMenuOpen && tabMenuAnchor === 'toolbar'" :items="tabMenuItems" menu-label="标签操作" placement="bottom-end" @update:model-value="updateTabMenuVisibility(currentPath, 'toolbar', $event)" @select="handleTabMenuSelection"><template #trigger="{ open, toggle }"><AppTooltip text="更多标签操作"><AppIconButton class="tab-action-button" icon="dots" label="更多标签操作" size="small" :active="open" :aria-expanded="open" @click="toggle" /></AppTooltip></template></AppContextMenu>
        </div>
      </div>

      <main class="view-container"><RouterView v-slot="{ Component, route: viewRoute }"><KeepAlive :include="keepAliveViewNames" :max="12"><component v-if="isRouteViewVisible" :is="Component" :key="getRouteViewKey(viewRoute.name)" /></KeepAlive></RouterView></main>
    </section>
    <AppGlobalSearch v-model="isSearchOpen" :items="globalSearchItems" @select="selectSearchItem" />

    <AppDrawer v-model="isSettingsOpen" title="偏好设置" description="设置自动保存在当前设备，并即时作用于所有页面。">
      <div class="settings-stack">
        <section class="settings-section"><h3>外观</h3><AppRadioGroup name="theme" :model-value="theme" :options="themeOptions" direction="vertical" appearance="cards" @update:model-value="updateTheme" /></section>
        <section class="settings-section"><h3>字体大小</h3><AppRadioGroup name="font-scale" :model-value="fontScale" :options="fontScaleOptions" direction="vertical" appearance="cards" @update:model-value="updateFontScale" /></section>
        <section class="settings-section"><h3>内容密度</h3><AppRadioGroup name="density" :model-value="density" :options="densityOptions" direction="vertical" appearance="cards" @update:model-value="updateDensity" /></section>
        <section class="settings-section"><h3>侧边栏</h3><AppRadioGroup name="sidebar-width" :model-value="sidebarWidth" :options="sidebarWidthOptions" direction="vertical" appearance="cards" @update:model-value="updateSidebarWidth" /><div class="sidebar-menu-style"><strong>菜单展开</strong><AppRadioGroup name="sidebar-menu-style" :model-value="sidebarMenuStyle" :options="sidebarMenuStyleOptions" @update:model-value="updateSidebarMenuStyle" /></div><div class="sidebar-setting"><AppSwitch :model-value="sidebarCollapsed" label="收起导航文字" :description="sidebarCollapsed ? '当前仅显示导航图标。' : '当前显示完整导航文字。'" @update:model-value="appStore.setSidebarCollapsed" /></div></section>
      </div>
    </AppDrawer>
    <AppConfirmDialog v-model="isLogoutConfirmOpen" title="确认退出登录？" description="退出后需要重新验证身份才能访问工作区。" confirm-text="退出登录" danger @confirm="logout" />
  </div>
</template>

<style scoped>
.app-shell { --aps-sidebar-size: 236px; display: grid; grid-template-columns: var(--aps-sidebar-size) minmax(0, 1fr); height: 100vh; height: 100dvh; overflow: hidden; background: var(--aps-canvas); transition: grid-template-columns 180ms ease; }
.app-shell.sidebar-width-narrow { --aps-sidebar-size: 216px; }
.app-shell.sidebar-width-wide { --aps-sidebar-size: 264px; }
.app-shell.is-sidebar-collapsed { grid-template-columns: 76px minmax(0, 1fr); }
.app-sidebar { display: flex; min-width: 0; min-height: 0; height: 100%; flex-direction: column; overflow: hidden; padding: 16px 12px 14px; border-right: 1px solid var(--aps-line-soft); background: var(--aps-sidebar); transition: padding 180ms ease; }
.brand-area { display: flex; min-height: 50px; align-items: center; padding: 0 8px; }
.brand { display: inline-flex; width: 100%; min-height: 42px; align-items: center; gap: 10px; color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: 760; letter-spacing: -.035em; }
.side-nav { display: grid; min-height: 0; flex: 1 1 auto; align-content: start; gap: 4px; margin-top: 18px; padding: 0 2px 12px 0; overflow-y: auto; overscroll-behavior: contain; -ms-overflow-style: none; scrollbar-width: none; }
.side-nav::-webkit-scrollbar { display: none; }
.nav-link, .nav-child { display: flex; min-height: 42px; align-items: center; border-radius: 10px; color: var(--aps-muted); font-size: var(--aps-text-base); font-weight: 620; transition: background-color 180ms ease, color 180ms ease; }
.nav-link { gap: 11px; padding: 0 11px; }
.nav-link:hover, .nav-link.router-link-active, .nav-child:hover, .nav-child.router-link-active { background: var(--aps-blue-soft); color: var(--aps-blue); }
.nav-parent { width: 100%; border: 0; background: transparent; font: inherit; text-align: left; cursor: pointer; }
.nav-parent-chevron { margin-left: auto; color: var(--aps-faint); transition: transform 180ms ease; }
.nav-parent[aria-expanded="true"] .nav-parent-chevron { transform: rotate(180deg); }
.nav-parent:focus-visible { outline: 2px solid var(--aps-blue); outline-offset: 2px; }
.nav-group { display: grid; gap: 2px; }
.nav-children-transition { display: grid; grid-template-rows: 1fr; overflow: hidden; }
.nav-children { display: grid; min-height: 0; gap: 2px; margin-left: 29px; padding: 1px 0 4px; overflow: hidden; }
.sidebar-menu-style-smooth .nav-children-transition-enter-active, .sidebar-menu-style-smooth .nav-children-transition-leave-active { transition: grid-template-rows 200ms cubic-bezier(.22, 1, .36, 1), opacity 160ms ease, transform 180ms ease; will-change: grid-template-rows, opacity, transform; }
.sidebar-menu-style-smooth .nav-children-transition-enter-from, .sidebar-menu-style-smooth .nav-children-transition-leave-to { grid-template-rows: 0fr; opacity: 0; transform: translateY(-4px); }
.sidebar-menu-style-compact .nav-link, .sidebar-menu-style-compact .nav-child { min-height: 38px; }
.sidebar-menu-style-compact .nav-children-transition-enter-active, .sidebar-menu-style-compact .nav-children-transition-leave-active { transition: grid-template-rows 120ms ease-out, opacity 100ms ease-out; }
.sidebar-menu-style-compact .nav-children-transition-enter-from, .sidebar-menu-style-compact .nav-children-transition-leave-to { grid-template-rows: 0fr; opacity: 0; }
.sidebar-menu-style-instant .nav-children-transition-enter-active, .sidebar-menu-style-instant .nav-children-transition-leave-active { transition: none; }
.nav-child { gap: 9px; padding: 0 10px; font-size: var(--aps-text-base); }
.nav-child-icon { flex: 0 0 auto; opacity: .78; }
.sidebar-footer { flex: 0 0 auto; padding-top: 12px; border-top: 1px solid var(--aps-line-soft); }
.workspace-card { display: flex; width: 100%; min-height: 54px; align-items: center; gap: 9px; padding: 7px 8px; border: 1px solid var(--aps-line-soft); border-radius: 13px; background: var(--aps-surface); color: var(--aps-ink); text-align: left; }
.workspace-card:hover { border-color: var(--aps-line); }
.profile-avatar { display: grid; flex: 0 0 auto; place-items: center; border-radius: 8px; background: var(--aps-dark); color: var(--aps-surface); font-size: var(--aps-text-sm); font-weight: 750; }
.workspace-copy, .profile-copy { min-width: 0; }
.workspace-copy strong, .workspace-copy small, .profile-copy strong, .profile-copy small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.workspace-copy strong { font-size: var(--aps-text-xs); font-weight: 700; }
.workspace-copy small { margin-top: 1px; color: var(--aps-faint); font-size: var(--aps-text-2xs); }
.workspace-arrow { margin-left: auto; color: var(--aps-faint); }
.app-main { display: grid; min-width: 0; min-height: 0; height: 100%; grid-template-rows: var(--aps-topbar-height) var(--aps-tabbar-height) minmax(0, 1fr); overflow: hidden; }
.topbar { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 0 24px; border-bottom: 1px solid var(--aps-line-soft); background: var(--aps-topbar); }
.topbar-left, .topbar-actions, .profile-button { display: flex; align-items: center; }
.topbar-left, .topbar-actions { gap: 10px; }
.topbar-breadcrumb { max-width: min(360px, 32vw); }
.quick-search { display: inline-flex; width: min(265px, 24vw); height: 36px; align-items: center; gap: 8px; padding: 0 9px 0 11px; border: 1px solid var(--aps-line-soft); border-radius: 9px; background: var(--aps-surface-soft); color: var(--aps-faint); font-size: var(--aps-text-sm); text-align: left; }
.quick-search span { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.quick-search kbd { padding: 2px 4px; border: 1px solid var(--aps-line); border-radius: 4px; color: var(--aps-faint); font-family: var(--aps-font); font-size: var(--aps-text-2xs); }
.quick-search:hover { border-color: var(--aps-line); background: var(--aps-surface); color: var(--aps-muted); }
.notification-button { position: relative; }
.notification-count { position: absolute; top: 5px; right: 5px; display: grid; min-width: 14px; height: 14px; place-items: center; border: 2px solid var(--aps-topbar); border-radius: 50%; background: var(--aps-blue); color: #fff; font-size: 8px; font-weight: 750; }
.profile-button { gap: 8px; padding: 3px 5px; border: 0; border-radius: 10px; background: transparent; color: var(--aps-ink); text-align: left; }
.profile-button:hover { background: var(--aps-surface-soft); }
.profile-avatar { width: 31px; height: 31px; border-radius: 50%; background: #314b69; }
.profile-copy strong { font-size: var(--aps-text-sm); font-weight: 700; }
.profile-copy small { margin-top: 1px; color: var(--aps-faint); font-size: var(--aps-text-2xs); }
.notification-popover { width: min(360px, calc(100vw - 32px)); }
.notification-popover header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 15px 16px; border-bottom: 1px solid var(--aps-line-soft); }
.notification-popover h2, .notification-popover p { margin: 0; }
.notification-popover h2 { font-size: var(--aps-text-base); font-weight: 720; }
.notification-popover header p { margin-top: 2px; color: var(--aps-muted); font-size: var(--aps-text-xs); }
.text-button { min-height: 28px; padding: 0; border: 0; background: transparent; color: var(--aps-blue); font-size: var(--aps-text-xs); font-weight: 650; }
.text-button:disabled { color: var(--aps-faint); cursor: not-allowed; }
.notification-list { display: grid; max-height: 330px; overflow: auto; }
.notification-list article { display: grid; grid-template-columns: 7px minmax(0, 1fr); gap: 10px; padding: 13px 16px; border-bottom: 1px solid var(--aps-line-soft); }
.notification-list article:last-child { border-bottom: 0; }
.notification-dot { width: 6px; height: 6px; margin-top: 5px; border-radius: 50%; background: transparent; }
.notification-list .is-unread .notification-dot { background: var(--aps-blue); }
.notification-list strong { display: block; color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: 680; }
.notification-list p { margin: 3px 0 0; color: var(--aps-muted); font-size: var(--aps-text-xs); line-height: 1.5; }
.notification-list time { display: block; margin-top: 5px; color: var(--aps-faint); font-size: var(--aps-text-2xs); }
.user-popover-profile { display: grid; grid-template-columns: 31px minmax(0, 1fr); align-items: center; column-gap: 9px; padding: 10px; border-bottom: 1px solid var(--aps-line-soft); }
.user-popover-avatar { display: grid; width: 31px; height: 31px; place-items: center; border-radius: 50%; background: #314b69; color: var(--aps-surface); font-size: var(--aps-text-sm); font-weight: 750; line-height: 1; }
.user-popover-profile > div { display: grid; min-width: 0; min-height: 31px; align-content: center; }.user-popover-profile > div > strong, .user-popover-profile > div > span { display: block; }
.user-popover-profile strong { color: var(--aps-ink); font-size: var(--aps-text-sm); }
.user-popover-profile div > span { margin-top: 2px; color: var(--aps-faint); font-size: var(--aps-text-2xs); }
.tabbar { display: flex; min-width: 0; align-items: end; justify-content: space-between; gap: 8px; padding: 0 18px 0 24px; border-bottom: 1px solid var(--aps-line-soft); background: var(--aps-surface); }
.tab-list { display: flex; min-width: 0; align-items: end; gap: 4px; overflow-x: auto; -ms-overflow-style: none; scrollbar-width: none; }
.tab-list::-webkit-scrollbar { display: none; }
.app-tab { display: inline-flex; min-width: 92px; height: 34px; align-items: center; gap: 7px; padding: 0 8px 0 11px; border-radius: 8px 8px 0 0; color: var(--aps-muted); font-size: var(--aps-text-sm); white-space: nowrap; }
.app-tab:hover { background: var(--aps-surface-soft); color: var(--aps-ink); }
.app-tab.is-active { background: var(--aps-blue-soft); color: var(--aps-blue); font-weight: 680; }
.tab-icon { flex: 0 0 auto; }
.tab-close, .tab-action-button { display: grid; width: 20px; height: 20px; place-items: center; padding: 0; border: 0; border-radius: 5px; background: transparent; color: inherit; }
.tab-close:hover, .tab-action-button:hover { background: var(--aps-surface-soft); }
.tab-actions { display: flex; height: 34px; flex: 0 0 auto; align-items: center; align-self: flex-end; gap: 1px; }
.tab-action-button { width: 28px; height: 28px; color: var(--aps-muted); }
.view-container { min-width: 0; min-height: 0; overflow: auto; overscroll-behavior: contain; }
.settings-stack { display: grid; gap: 28px; }
.settings-section { display: grid; gap: 10px; }
.settings-section h3, .settings-section p { margin: 0; }
.settings-section h3 { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: 700; }
.sidebar-menu-style { display: grid; gap: 8px; padding-top: 16px; border-top: 1px solid var(--aps-line-soft); }.sidebar-menu-style > strong { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: 680; }.sidebar-setting { padding-top: 16px; border-top: 1px solid var(--aps-line-soft); }
.is-sidebar-collapsed .app-sidebar { padding-right: 10px; padding-left: 10px; }
.is-sidebar-collapsed .brand-area { padding: 0 4px; }
.is-sidebar-collapsed .brand-copy, .is-sidebar-collapsed .nav-link > span, .is-sidebar-collapsed .nav-children, .is-sidebar-collapsed .nav-parent-chevron, .is-sidebar-collapsed .workspace-copy, .is-sidebar-collapsed .workspace-arrow { display: none; }
.is-sidebar-collapsed .brand, .is-sidebar-collapsed .nav-link, .is-sidebar-collapsed .workspace-card { justify-content: center; }
.is-sidebar-collapsed .nav-link { padding: 0; }
.is-sidebar-collapsed .workspace-card { padding: 7px; }
@media (max-width: 900px) { .app-shell, .app-shell.is-sidebar-collapsed { grid-template-columns: 76px minmax(0, 1fr); }.app-sidebar { padding-right: 10px; padding-left: 10px; }.brand-area { padding: 0 4px; }.brand-copy, .nav-link > span, .nav-children, .nav-parent-chevron, .workspace-copy, .workspace-arrow { display: none; }.brand, .nav-link, .workspace-card { justify-content: center; }.nav-link { padding: 0; }.workspace-card { padding: 7px; }.profile-copy, .profile-button > svg { display: none; }.quick-search { width: 190px; }.topbar-breadcrumb { max-width: 240px; } }
@media (max-width: 620px) { .app-shell, .app-shell.is-sidebar-collapsed { grid-template-columns: 1fr; }.app-sidebar { display: none; }.topbar { padding: 0 14px; }.topbar-left { gap: 7px; }.topbar-breadcrumb { display: none; }.fullscreen-button { display: none; }.quick-search { width: 38px; padding: 0; justify-content: center; }.quick-search span, .quick-search kbd { display: none; }.tabbar { padding: 0 10px 0 14px; }.tab-actions .tab-scroll-button { display: none; } }
@media (prefers-reduced-motion: reduce) { .nav-children-transition { transition: none !important; } }
</style>
