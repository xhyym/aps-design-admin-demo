import { ref, watch } from "vue";
import { defineStore } from "pinia";

export type Density = "comfortable" | "compact";
export type FontScale = "small" | "default" | "large";
export type SidebarWidth = "narrow" | "default" | "wide";
export type Theme = "light" | "dark";
export type Accent = "blue" | "green" | "orange" | "purple" | "teal";

/** 管理后台壳层的本地偏好，业务页面不应直接承担主题与布局状态。 */
export const useAppStore = defineStore("app", () => {
  const sidebarCollapsed = ref(readBooleanPreference("aps-sidebar-collapsed"));
  const sidebarWidth = ref<SidebarWidth>(readSidebarWidthPreference());
  const density = ref<Density>(readDensityPreference());
  const fontScale = ref<FontScale>(readFontScalePreference());
  const theme = ref<Theme>(readThemePreference());
  const accent = ref<Accent>(readAccentPreference());

  watch(sidebarCollapsed, (value) => {
    localStorage.setItem("aps-sidebar-collapsed", String(value));
  });
  watch(sidebarWidth, (value) => {
    localStorage.setItem("aps-sidebar-width", value);
  });
  watch(density, (value) => {
    localStorage.setItem("aps-density", value);
    document.documentElement.dataset.density = value;
  }, { immediate: true });
  watch(fontScale, (value) => {
    localStorage.setItem("aps-font-scale", value);
    document.documentElement.dataset.fontScale = value;
  }, { immediate: true });
  watch(theme, (value) => {
    localStorage.setItem("aps-theme", value);
    document.documentElement.dataset.theme = value;
  }, { immediate: true });
  watch(accent, (value) => {
    localStorage.setItem("aps-accent", value);
    document.documentElement.dataset.accent = value;
  }, { immediate: true });

  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }

  function setSidebarCollapsed(collapsed: boolean): void {
    sidebarCollapsed.value = collapsed;
  }

  function setSidebarWidth(nextWidth: SidebarWidth): void {
    sidebarWidth.value = nextWidth;
  }

  function setDensity(nextDensity: Density): void {
    density.value = nextDensity;
  }

  function setFontScale(nextFontScale: FontScale): void {
    fontScale.value = nextFontScale;
  }

  function setTheme(nextTheme: Theme): void {
    theme.value = nextTheme;
  }

  function setAccent(nextAccent: Accent): void {
    accent.value = nextAccent;
  }

  return {
    sidebarCollapsed,
    sidebarWidth,
    density,
    fontScale,
    theme,
    accent,
    toggleSidebar,
    setSidebarCollapsed,
    setSidebarWidth,
    setDensity,
    setFontScale,
    setTheme,
    setAccent,
  };
});

function readBooleanPreference(key: string): boolean {
  return localStorage.getItem(key) === "true";
}

function readSidebarWidthPreference(): SidebarWidth {
  const savedValue = localStorage.getItem("aps-sidebar-width");
  return savedValue === "narrow" || savedValue === "wide" ? savedValue : "default";
}

function readDensityPreference(): Density {
  return localStorage.getItem("aps-density") === "compact" ? "compact" : "comfortable";
}

function readFontScalePreference(): FontScale {
  const savedValue = localStorage.getItem("aps-font-scale");
  return savedValue === "small" || savedValue === "large" ? savedValue : "default";
}

function readThemePreference(): Theme {
  return localStorage.getItem("aps-theme") === "dark" ? "dark" : "light";
}

function readAccentPreference(): Accent {
  const savedValue = localStorage.getItem("aps-accent");
  return savedValue === "green" || savedValue === "orange" || savedValue === "purple" || savedValue === "teal" ? savedValue : "blue";
}
