import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { login as loginRequest } from "@/api/modules/auth";
import type { LoginPayload, NavigationItem, UserProfile, UserProfileUpdate } from "@/types/auth";

const TOKEN_KEY = "aps-access-token";
const PROFILE_KEY = "aps-user-profile";

/**
 * 演示应用的导航以电商运营任务为主，每个一级业务入口都保留可直接打开的二级页面。
 * 后台组件实验室用于展示组件在真实业务中的组合方式。
 */
const DEFAULT_ECOMMERCE_NAVIGATION: NavigationItem[] = [
  {
    key: "dashboard",
    label: "经营总览",
    path: "/dashboard",
    icon: "grid",
    permission: "dashboard:view",
    children: [
      { key: "dashboard-overview", label: "经营总览", path: "/dashboard", icon: "grid", permission: "dashboard:view" },
      { key: "dashboard-tasks", label: "运营待办", path: "/dashboard/tasks", icon: "bell", permission: "dashboard:view" },
    ],
  },
  {
    key: "products",
    label: "商品中心",
    path: "/products/catalog",
    icon: "grid",
    permission: "business:product:read",
    children: [
      { key: "product-catalog", label: "商品与 SKU", path: "/products/catalog", icon: "grid", permission: "business:product:read" },
      { key: "product-categories", label: "分类与品牌", path: "/products/categories", icon: "menu", permission: "business:product:read" },
      { key: "product-attributes", label: "规格模板", path: "/products/attributes", icon: "edit", permission: "business:product:read" },
    ],
  },
  {
    key: "trade",
    label: "交易中心",
    path: "/trade/orders",
    icon: "chart",
    permission: "business:order:read",
    children: [
      { key: "orders", label: "交易订单", path: "/trade/orders", icon: "chart", permission: "business:order:read" },
      { key: "order-export", label: "导出任务", path: "/trade/export-tasks", icon: "download", permission: "business:order:read" },
    ],
  },
  {
    key: "after-sales",
    label: "退款与售后",
    path: "/after-sales/refunds",
    icon: "refresh",
    permission: "business:refund:read",
    children: [
      { key: "refunds", label: "退款审核", path: "/after-sales/refunds", icon: "refresh", permission: "business:refund:read" },
      { key: "after-sales-tickets", label: "售后工单", path: "/after-sales/tickets", icon: "bell", permission: "business:refund:read" },
    ],
  },
  {
    key: "members",
    label: "会员中心",
    path: "/members/list",
    icon: "users",
    permission: "business:member:read",
    children: [
      { key: "members", label: "会员列表", path: "/members/list", icon: "users", permission: "business:member:read" },
      { key: "member-segments", label: "会员分群", path: "/members/segments", icon: "filter", permission: "business:member:read" },
    ],
  },
  {
    key: "marketing",
    label: "营销中心",
    path: "/marketing/campaigns",
    icon: "bell",
    permission: "business:marketing:read",
    children: [
      { key: "marketing-campaigns", label: "营销活动", path: "/marketing/campaigns", icon: "bell", permission: "business:marketing:read" },
      { key: "marketing-coupons", label: "优惠券中心", path: "/marketing/coupons", icon: "check", permission: "business:marketing:read" },
    ],
  },
  {
    key: "inventory",
    label: "库存与履约",
    path: "/inventory/overview",
    icon: "panel",
    permission: "business:inventory:read",
    children: [
      { key: "inventory", label: "库存概览", path: "/inventory/overview", icon: "panel", permission: "business:inventory:read" },
      { key: "inventory-warehouses", label: "仓库管理", path: "/inventory/warehouses", icon: "panel", permission: "business:inventory:read" },
    ],
  },
  {
    key: "analytics",
    label: "数据分析",
    path: "/analytics/overview",
    icon: "chart",
    permission: "business:analytics:read",
    children: [
      { key: "analytics", label: "经营分析", path: "/analytics/overview", icon: "chart", permission: "business:analytics:read" },
      { key: "analytics-products", label: "商品分析", path: "/analytics/products", icon: "chart", permission: "business:analytics:read" },
    ],
  },
  {
    key: "system",
    label: "系统设置",
    path: "/system/users",
    icon: "settings",
    permission: "system:user:read",
    children: [
      { key: "users", label: "用户管理", path: "/system/users", icon: "users", permission: "system:user:read" },
      { key: "roles", label: "角色权限", path: "/system/roles", icon: "shield", permission: "system:role:read" },
      { key: "menus", label: "菜单配置", path: "/system/menus", icon: "menu", permission: "system:menu:read" },
    ],
  },
  {
    key: "examples",
    label: "组件实验室",
    path: "/examples/components",
    icon: "panel",
    permission: "dashboard:view",
    children: [
      { key: "components", label: "组件能力预览", path: "/examples/components", icon: "panel", permission: "dashboard:view" },
      { key: "component-forms", label: "表单与日期", path: "/examples/forms", icon: "filter", permission: "dashboard:view" },
      { key: "component-tables", label: "表格与图表", path: "/examples/advanced-table", icon: "columns", permission: "dashboard:view" },
      { key: "component-feedback", label: "反馈与流程", path: "/examples/feedback", icon: "bell", permission: "dashboard:view" },
    ],
  },
];

/** 管理 Mock 登录会话；未来接入真实认证服务时无需改动页面调用方式。 */
export const useAuthStore = defineStore("auth", () => {
  const accessToken = ref(sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY) ?? "");
  const profile = ref<UserProfile | null>(readStoredProfile());
  const isAuthenticated = computed(() => Boolean(accessToken.value && profile.value));

  async function login(payload: LoginPayload): Promise<void> {
    const result = await loginRequest(payload);
    const normalizedProfile = normalizeNavigation(result.profile);
    accessToken.value = result.accessToken;
    profile.value = normalizedProfile;

    sessionStorage.setItem(TOKEN_KEY, result.accessToken);
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(normalizedProfile));

    if (payload.remember) {
      localStorage.setItem(TOKEN_KEY, result.accessToken);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(normalizedProfile));
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(PROFILE_KEY);
    }
  }

  function logout(): void {
    accessToken.value = "";
    profile.value = null;
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
  }

  function hasPermission(permission: string): boolean {
    if (profile.value?.roles.includes("super-admin")) return true;
    return profile.value?.permissions.some((item) => item.code === permission) ?? false;
  }

  /** 同步更新当前会话资料，并按登录方式写入对应的持久化位置。 */
  function updateProfile(payload: UserProfileUpdate): void {
    if (!profile.value) return;
    profile.value = { ...profile.value, ...payload };
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile.value));
    if (localStorage.getItem(TOKEN_KEY)) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile.value));
  }

  return { accessToken, profile, isAuthenticated, login, logout, hasPermission, updateProfile };
});

/** 读取持久化资料时容错，避免损坏的浏览器存储阻断登录入口。 */
function readStoredProfile(): UserProfile | null {
  const rawProfile = sessionStorage.getItem(PROFILE_KEY) ?? localStorage.getItem(PROFILE_KEY);
  if (!rawProfile) return null;
  try { return normalizeNavigation(JSON.parse(rawProfile) as UserProfile); }
  catch {
    sessionStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(PROFILE_KEY);
    return null;
  }
}

/** 每次进入演示后台都以最新电商信息架构为准，避免旧会话继续显示已迁移的组件菜单。 */
function normalizeNavigation(profile: UserProfile): UserProfile {
  return {
    ...profile,
    tenantId: profile.tenantId || "workspace-default",
    navigation: DEFAULT_ECOMMERCE_NAVIGATION.map((item) => ({ ...item, children: item.children?.map((child) => ({ ...child })) })),
  };
}
