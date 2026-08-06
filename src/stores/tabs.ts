import { ref, watch } from "vue";
import { defineStore } from "pinia";
import type { IconName } from "aps-design-pro";

export interface AppTab {
  name: string;
  title: string;
  path: string;
  icon: IconName;
  pinned: boolean;
}

/** 页签只维护访问上下文；固定状态决定是否允许批量关闭。 */
export const useTabsStore = defineStore("tabs", () => {
  const tabs = ref<AppTab[]>(readStoredTabs());

  watch(tabs, (value) => localStorage.setItem("aps-open-tabs", JSON.stringify(value)), { deep: true });

  function ensureTab(tab: AppTab): void {
    const existingTab = tabs.value.find((item) => item.path === tab.path);
    if (existingTab) {
      Object.assign(existingTab, tab);
      return;
    }
    tabs.value.push(tab);
  }

  function removeTab(path: string): void {
    const index = tabs.value.findIndex((item) => item.path === path && !item.pinned);
    if (index >= 0) tabs.value.splice(index, 1);
  }

  function togglePin(path: string): void {
    const tab = tabs.value.find((item) => item.path === path);
    if (!tab || tab.path === "/dashboard") return;
    tab.pinned = !tab.pinned;
  }

  function closeOtherTabs(path: string): void {
    tabs.value = tabs.value.filter((item) => item.pinned || item.path === path);
  }

  function closeTabsToLeft(path: string): void {
    const targetIndex = tabs.value.findIndex((item) => item.path === path);
    if (targetIndex < 0) return;
    tabs.value = tabs.value.filter((item, index) => index >= targetIndex || item.pinned);
  }

  function closeTabsToRight(path: string): void {
    const targetIndex = tabs.value.findIndex((item) => item.path === path);
    if (targetIndex < 0) return;
    tabs.value = tabs.value.filter((item, index) => index <= targetIndex || item.pinned);
  }

  function closeAllTabs(): void {
    tabs.value = tabs.value.filter((item) => item.pinned);
  }

  return { tabs, ensureTab, removeTab, togglePin, closeOtherTabs, closeTabsToLeft, closeTabsToRight, closeAllTabs };
});

function readStoredTabs(): AppTab[] {
  const defaultTabs: AppTab[] = [{ name: "dashboard", title: "工作台", path: "/dashboard", icon: "grid", pinned: true }];
  const storedValue = localStorage.getItem("aps-open-tabs");
  if (!storedValue) return defaultTabs;

  try {
    const parsedValue = JSON.parse(storedValue) as AppTab[];
    const validTabs = parsedValue
      .filter((item) => item.name && item.title && item.path)
      .map((item) => ({ ...item, icon: item.icon ?? getDefaultTabIcon(item.name), pinned: item.path === "/dashboard" || Boolean(item.pinned) }));
    return validTabs.some((item) => item.path === "/dashboard") ? validTabs : defaultTabs;
  } catch {
    localStorage.removeItem("aps-open-tabs");
    return defaultTabs;
  }
}

function getDefaultTabIcon(name: string): IconName {
  const iconMap: Record<string, IconName> = { dashboard: "grid", users: "users", roles: "shield", menus: "menu", profile: "user" };
  return iconMap[name] ?? "grid";
}
