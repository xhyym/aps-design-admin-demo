<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import {
  AppDrawer,
  AppIcon,
  AppIconButton,
  AppRadioGroup,
  AppSwitch,
  type RadioOption,
} from "aps-design-pro";
import { starterNavigation } from "@/config/navigation";
import {
  useAppStore,
} from "@/stores/app";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const authStore = useAuthStore();
const { sidebarCollapsed, sidebarWidth, density, fontScale, theme, accent } = storeToRefs(appStore);
const isSettingsOpen = ref(false);
const isAuthenticationRequired = import.meta.env.VITE_AUTH_REQUIRED === "true";

const pageTitle = computed(() => String(route.meta.title ?? "经营总览"));
const shellClasses = computed(() => ({
  "is-sidebar-collapsed": sidebarCollapsed.value,
  "sidebar-width-narrow": sidebarWidth.value === "narrow",
  "sidebar-width-wide": sidebarWidth.value === "wide",
}));

const themeOptions: RadioOption[] = [
  { label: "浅色", value: "light", description: "中性明亮的默认界面" },
  { label: "深色", value: "dark", description: "适合低光环境与长时间使用" },
];
const accentOptions: RadioOption[] = [
  { label: "蓝", value: "blue", description: "默认主题，适合通用后台" },
  { label: "绿", value: "green", description: "沉稳、效率与增长" },
  { label: "橙", value: "orange", description: "运营与提醒场景" },
  { label: "紫", value: "purple", description: "品牌与科技感" },
  { label: "青", value: "teal", description: "数据与技术场景" },
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

/** 单选组件会返回字符串，先收窄为受支持值，再更新全局偏好状态。 */
function updateTheme(value: string): void {
  if (value === "light" || value === "dark") appStore.setTheme(value);
}

function updateAccent(value: string): void {
  if (value === "blue" || value === "green" || value === "orange" || value === "purple" || value === "teal") {
    appStore.setAccent(value);
  }
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

/** 认证启用时，退出必须同时清理令牌并返回公开登录页。 */
async function logout(): Promise<void> {
  authStore.logout();
  await router.replace("/login");
}
</script>

<template>
  <div class="starter-shell" :class="shellClasses">
    <aside class="starter-sidebar" aria-label="主导航">
      <div class="starter-brand-row">
        <RouterLink class="starter-brand" to="/dashboard">
          <span>APS</span>
          <span v-if="!sidebarCollapsed">Design Pro</span>
        </RouterLink>
        <AppIconButton
          icon="panel"
          :label="sidebarCollapsed ? '展开侧栏' : '收起侧栏'"
          size="small"
          @click="appStore.toggleSidebar"
        />
      </div>

      <nav class="starter-navigation">
        <RouterLink
          v-for="item in starterNavigation"
          :key="item.key"
          :to="item.path"
          class="starter-navigation-item"
          active-class="is-active"
          :aria-label="item.label"
        >
          <AppIcon :name="item.icon" :size="17" />
          <span v-if="!sidebarCollapsed">{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <main class="starter-main">
      <header class="starter-header">
        <span>{{ pageTitle }}</span>
        <div class="starter-header-actions">
          <AppIconButton icon="settings" label="偏好设置" size="small" @click="isSettingsOpen = true" />
          <button v-if="isAuthenticationRequired" class="starter-logout" type="button" @click="logout">退出登录</button>
        </div>
      </header>
      <RouterView />
    </main>

    <AppDrawer v-model="isSettingsOpen" title="偏好设置" description="设置仅保存在当前设备，并即时作用于所有页面。">
      <div class="settings-stack">
        <section class="settings-section">
          <h3>主题外观</h3>
          <div class="setting-group">
            <strong>明暗模式</strong>
            <AppRadioGroup name="theme" :model-value="theme" :options="themeOptions" direction="vertical" appearance="cards" @update:model-value="updateTheme" />
          </div>
          <div class="setting-group">
            <strong>主题色</strong>
            <AppRadioGroup name="accent" :model-value="accent" :options="accentOptions" direction="vertical" appearance="cards" @update:model-value="updateAccent" />
          </div>
        </section>
        <section class="settings-section">
          <h3>阅读与密度</h3>
          <div class="setting-group">
            <strong>字体大小</strong>
            <AppRadioGroup name="font-scale" :model-value="fontScale" :options="fontScaleOptions" direction="vertical" appearance="cards" @update:model-value="updateFontScale" />
          </div>
          <div class="setting-group">
            <strong>内容密度</strong>
            <AppRadioGroup name="density" :model-value="density" :options="densityOptions" direction="vertical" appearance="cards" @update:model-value="updateDensity" />
          </div>
        </section>
        <section class="settings-section">
          <h3>侧边栏</h3>
          <AppRadioGroup name="sidebar-width" :model-value="sidebarWidth" :options="sidebarWidthOptions" direction="vertical" appearance="cards" @update:model-value="updateSidebarWidth" />
          <AppSwitch
            :model-value="sidebarCollapsed"
            label="收起导航文字"
            :description="sidebarCollapsed ? '当前仅显示导航图标。' : '当前显示完整导航文字。'"
            @update:model-value="appStore.setSidebarCollapsed"
          />
        </section>
      </div>
    </AppDrawer>
  </div>
</template>

<style scoped>
.starter-shell { --starter-sidebar-size: 236px; display: grid; min-height: 100vh; grid-template-columns: var(--starter-sidebar-size) minmax(0, 1fr); background: var(--aps-page-bg, #f6f8fb); transition: grid-template-columns 180ms ease; }
.starter-shell.sidebar-width-narrow { --starter-sidebar-size: 216px; }
.starter-shell.sidebar-width-wide { --starter-sidebar-size: 264px; }
.starter-shell.is-sidebar-collapsed { grid-template-columns: 72px minmax(0, 1fr); }
.starter-sidebar { display: flex; min-width: 0; flex-direction: column; gap: 28px; padding: 18px 12px; border-right: 1px solid var(--aps-border, #e5eaf1); background: var(--aps-surface, #fff); }
.starter-brand-row { display: flex; min-height: 38px; align-items: center; justify-content: space-between; gap: 8px; }
.starter-brand { display: inline-flex; min-width: 0; align-items: baseline; gap: 5px; padding: 0 6px; color: var(--aps-ink, #172033); font-size: 16px; font-weight: var(--aps-font-weight-heading); letter-spacing: -.02em; text-decoration: none; white-space: nowrap; }
.starter-brand > span:first-child { color: var(--aps-blue, #2468f2); }
.starter-navigation { display: grid; gap: 4px; }
.starter-navigation-item { display: flex; min-height: 40px; align-items: center; justify-content: flex-start; gap: 10px; padding: 0 10px; border-radius: 8px; color: var(--aps-muted, #697386); font-size: 14px; font-weight: 600; text-decoration: none; white-space: nowrap; }
.starter-navigation-item:hover, .starter-navigation-item.is-active { background: var(--aps-blue-soft, #edf5ff); color: var(--aps-blue, #2468f2); }
.is-sidebar-collapsed .starter-sidebar { padding-right: 10px; padding-left: 10px; }
.is-sidebar-collapsed .starter-brand-row { justify-content: center; }
.is-sidebar-collapsed .starter-navigation-item { justify-content: center; padding: 0; }
.is-sidebar-collapsed .starter-brand-row :deep(.app-icon-button-control) { position: absolute; left: 58px; z-index: 2; }
.starter-main { min-width: 0; }
.starter-header { display: flex; align-items: center; justify-content: space-between; height: 64px; padding: 0 28px; border-bottom: 1px solid var(--aps-border, #e5eaf1); background: var(--aps-surface, #fff); color: var(--aps-ink, #172033); font-size: 15px; font-weight: var(--aps-font-weight-strong); }
.starter-header-actions { display: flex; align-items: center; gap: 8px; }
.starter-logout { padding: 5px 8px; border: 0; border-radius: 6px; background: var(--aps-surface-soft, #f1f4f8); color: var(--aps-muted, #697386); font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
.starter-logout:hover { color: var(--aps-ink, #172033); }
.settings-stack { display: grid; gap: 24px; }
.settings-section { display: grid; gap: 14px; }
.settings-section h3, .settings-section p { margin: 0; }
.settings-section h3 { color: var(--aps-ink, #172033); font-size: 14px; font-weight: 700; }
.setting-group { display: grid; gap: 8px; }
.setting-group + .setting-group { padding-top: 14px; border-top: 1px solid var(--aps-line-soft, #edf0f4); }
.setting-group > strong { color: var(--aps-muted, #697386); font-size: 12px; font-weight: var(--aps-font-weight-strong); }
@media (max-width: 640px) { .starter-shell, .starter-shell.is-sidebar-collapsed { grid-template-columns: 1fr; }.starter-sidebar { flex-direction: row; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; }.starter-navigation { display: block; }.starter-navigation-item { min-height: 34px; }.is-sidebar-collapsed .starter-brand-row :deep(.app-icon-button-control) { position: static; }.starter-header { padding: 0 18px; } }
</style>
