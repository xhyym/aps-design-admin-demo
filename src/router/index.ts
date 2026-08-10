import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import AppLayout from "@/layouts/AppLayout.vue";
import { useAuthStore } from "@/stores/auth";
import type { IconName } from "aps-design-pro";

const LoginView = () => import("@/views/auth/LoginView.vue");
const WorkbenchView = () => import("@/views/dashboard/WorkbenchView.vue");
const UsersView = () => import("@/views/system/UsersView.vue");
const RolesView = () => import("@/views/system/RolesView.vue");
const MenusView = () => import("@/views/system/MenusView.vue");
const ForbiddenView = () => import("@/views/system/ForbiddenView.vue");
const NotFoundView = () => import("@/views/system/NotFoundView.vue");
const ProfileView = () => import("@/views/profile/ProfileView.vue");
const ComponentsView = () => import("@/views/examples/ComponentsView.vue");
const AdvancedTableView = () => import("@/views/examples/AdvancedTableView.vue");
const DisplayWorkflowView = () => import("@/views/examples/DisplayWorkflowView.vue");
const AdvancedSelectionView = () => import("@/views/examples/AdvancedSelectionView.vue");
const AdvancedControlsView = () => import("@/views/examples/AdvancedControlsView.vue");
const RangeMediaView = () => import("@/views/examples/RangeMediaView.vue");
const TagInputView = () => import("@/views/examples/TagInputView.vue");
const TreeDataView = () => import("@/views/examples/TreeDataView.vue");
const CalendarView = () => import("@/views/examples/CalendarView.vue");
const CollapseView = () => import("@/views/examples/CollapseView.vue");
const InfiniteScrollView = () => import("@/views/examples/InfiniteScrollView.vue");
const TimelineView = () => import("@/views/examples/TimelineView.vue");
const VirtualListView = () => import("@/views/examples/VirtualListView.vue");
const TablePatternsView = () => import("@/views/examples/TablePatternsView.vue");
const TableExtensionsView = () => import("@/views/examples/TableExtensionsView.vue");
const ContentMediaView = () => import("@/views/examples/ContentMediaView.vue");
const EditableTableView = () => import("@/views/examples/EditableTableView.vue");
const DynamicFormView = () => import("@/views/examples/DynamicFormView.vue");
const UploadWorkflowView = () => import("@/views/examples/UploadWorkflowView.vue");
const StepFormView = () => import("@/views/examples/StepFormView.vue");
const FeedbackStatesView = () => import("@/views/examples/FeedbackStatesView.vue");
const OverlayUtilitiesView = () => import("@/views/examples/OverlayUtilitiesView.vue");
const OverlayActionsView = () => import("@/views/examples/OverlayActionsView.vue");
const LayoutGridView = () => import("@/views/examples/LayoutGridView.vue");
const ContainerLayoutView = () => import("@/views/examples/ContainerLayoutView.vue");
const ApplicationShellView = () => import("@/views/examples/ApplicationShellView.vue");
const MenuView = () => import("@/views/examples/MenuView.vue");
const ChoiceDescriptionsView = () => import("@/views/examples/ChoiceDescriptionsView.vue");
const LoadingOverlayView = () => import("@/views/examples/LoadingOverlayView.vue");
const TypographyView = () => import("@/views/examples/TypographyView.vue");
const StatisticsView = () => import("@/views/examples/StatisticsView.vue");
const BadgeView = () => import("@/views/examples/BadgeView.vue");
const InputFeaturesView = () => import("@/views/examples/InputFeaturesView.vue");
const NumberInputView = () => import("@/views/examples/NumberInputView.vue");
const ProgressView = () => import("@/views/examples/ProgressView.vue");
const RateView = () => import("@/views/examples/RateView.vue");
const ImageCropperView = () => import("@/views/examples/ImageCropperView.vue");
const ImageViewerView = () => import("@/views/examples/ImageViewerView.vue");
const OrdersView = () => import("@/views/business/OrdersView.vue");
const OrderDetailView = () => import("@/views/business/OrderDetailView.vue");
const OrderExportTasksView = () => import("@/views/business/OrderExportTasksView.vue");
const ProductsView = () => import("@/views/business/ProductsView.vue");
const ProductCategoriesView = () => import("@/views/business/ProductCategoriesView.vue");
const ProductAttributesView = () => import("@/views/business/ProductAttributesView.vue");
const AfterSalesView = () => import("@/views/business/AfterSalesView.vue");
const MembersView = () => import("@/views/business/MembersView.vue");
const MarketingView = () => import("@/views/business/MarketingView.vue");
const InventoryView = () => import("@/views/business/InventoryView.vue");
const AnalyticsView = () => import("@/views/business/AnalyticsView.vue");
const CommerceScenarioView = () => import("@/views/business/CommerceScenarioView.vue");

declare module "vue-router" {
  interface RouteMeta {
    title?: string;
    permission?: string;
    keepAlive?: boolean;
    cacheName?: string;
    public?: boolean;
    icon?: IconName;
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: { public: true, title: "登录" },
  },
  {
    path: "/",
    component: AppLayout,
    redirect: "/dashboard",
    children: [
      { path: "dashboard", name: "dashboard", component: WorkbenchView, meta: { title: "经营总览", icon: "grid", permission: "dashboard:view", keepAlive: true, cacheName: "WorkbenchView" } },
      { path: "dashboard/tasks", name: "dashboard-tasks", component: CommerceScenarioView, props: { scenario: "dashboard-tasks" }, meta: { title: "运营待办", icon: "grid", permission: "dashboard:view" } },
      { path: "system/users", name: "users", component: UsersView, meta: { title: "用户管理", icon: "users", permission: "system:user:read", keepAlive: true, cacheName: "UsersView" } },
      { path: "system/roles", name: "roles", component: RolesView, meta: { title: "角色权限", icon: "shield", permission: "system:role:read", keepAlive: true, cacheName: "RolesView" } },
      { path: "system/menus", name: "menus", component: MenusView, meta: { title: "菜单配置", icon: "menu", permission: "system:menu:read", keepAlive: true, cacheName: "MenusView" } },
      { path: "profile", name: "profile", component: ProfileView, meta: { title: "个人中心", icon: "user", keepAlive: true, cacheName: "ProfileView" } },
      { path: "trade/orders", name: "orders", component: OrdersView, meta: { title: "交易订单", icon: "chart", permission: "business:order:read", keepAlive: true, cacheName: "OrdersView" } },
      { path: "trade/orders/:id", name: "order-detail", component: OrderDetailView, meta: { title: "订单详情", icon: "chart", permission: "business:order:read" } },
      { path: "trade/export-tasks", name: "order-exports", component: OrderExportTasksView, meta: { title: "导出任务", icon: "download", permission: "business:order:read" } },
      { path: "products/catalog", name: "products", component: ProductsView, meta: { title: "商品与 SKU", icon: "grid", permission: "business:product:read", keepAlive: true, cacheName: "ProductsView" } },
      /* 编辑流程统一由商品列表中的 AppDialog 承载，旧地址保留重定向避免历史页签进入废弃的独立页面。 */
      { path: "products/catalog/create", redirect: "/products/catalog" },
      { path: "products/catalog/:id/edit", redirect: "/products/catalog" },
      { path: "products/categories", name: "product-categories", component: ProductCategoriesView, meta: { title: "分类与品牌", icon: "menu", permission: "business:product:read" } },
      { path: "products/attributes", name: "product-attributes", component: ProductAttributesView, meta: { title: "规格模板", icon: "edit", permission: "business:product:read" } },
      { path: "after-sales/refunds", name: "refunds", component: AfterSalesView, meta: { title: "退款与售后", icon: "refresh", permission: "business:refund:read", keepAlive: true, cacheName: "AfterSalesView" } },
      { path: "after-sales/tickets", name: "after-sales-tickets", component: CommerceScenarioView, props: { scenario: "after-sales-tickets" }, meta: { title: "售后工单", icon: "bell", permission: "business:refund:read" } },
      { path: "members/list", name: "members", component: MembersView, meta: { title: "会员中心", icon: "users", permission: "business:member:read", keepAlive: true, cacheName: "MembersView" } },
      { path: "members/segments", name: "member-segments", component: CommerceScenarioView, props: { scenario: "member-segments" }, meta: { title: "会员分群", icon: "filter", permission: "business:member:read" } },
      { path: "marketing/campaigns", name: "campaigns", component: MarketingView, meta: { title: "营销活动", icon: "bell", permission: "business:marketing:read", keepAlive: true, cacheName: "MarketingView" } },
      { path: "marketing/coupons", name: "marketing-coupons", component: CommerceScenarioView, props: { scenario: "marketing-coupons" }, meta: { title: "优惠券中心", icon: "check", permission: "business:marketing:read" } },
      { path: "inventory/overview", name: "inventory", component: InventoryView, meta: { title: "库存与履约", icon: "panel", permission: "business:inventory:read", keepAlive: true, cacheName: "InventoryView" } },
      { path: "inventory/warehouses", name: "inventory-warehouses", component: CommerceScenarioView, props: { scenario: "inventory-warehouses" }, meta: { title: "仓库管理", icon: "panel", permission: "business:inventory:read" } },
      { path: "analytics/overview", name: "analytics", component: AnalyticsView, meta: { title: "经营分析", icon: "chart", permission: "business:analytics:read", keepAlive: true, cacheName: "AnalyticsView" } },
      { path: "analytics/products", name: "analytics-products", component: CommerceScenarioView, props: { scenario: "analytics-products" }, meta: { title: "商品分析", icon: "chart", permission: "business:analytics:read" } },
      { path: "examples/components", name: "components", component: ComponentsView, props: { section: "overview" }, meta: { title: "组件概览", icon: "grid", permission: "dashboard:view", keepAlive: true, cacheName: "ComponentsView" } },
      { path: "examples/base", name: "component-base", component: ComponentsView, props: { section: "base" }, meta: { title: "基础控件", icon: "grid", permission: "dashboard:view", keepAlive: true, cacheName: "ComponentsView" } },
      { path: "examples/selection", name: "component-selection", component: ComponentsView, props: { section: "selection" }, meta: { title: "选择控件", icon: "check", permission: "dashboard:view", keepAlive: true, cacheName: "ComponentsView" } },
      { path: "examples/advanced-selection", name: "component-advanced-selection", component: AdvancedSelectionView, meta: { title: "高级选择", icon: "check", permission: "dashboard:view", keepAlive: true, cacheName: "AdvancedSelectionView" } },
      { path: "examples/tag-input", name: "component-tag-input", component: TagInputView, meta: { title: "标签与输入", icon: "edit", permission: "dashboard:view", keepAlive: true, cacheName: "TagInputView" } },
      { path: "examples/advanced-controls", name: "component-advanced-controls", component: AdvancedControlsView, meta: { title: "高级输入与布局", icon: "edit", permission: "dashboard:view", keepAlive: true, cacheName: "AdvancedControlsView" } },
      { path: "examples/layout-grid", name: "component-layout-grid", component: LayoutGridView, meta: { title: "栅格布局", icon: "grid", permission: "dashboard:view", keepAlive: true, cacheName: "LayoutGridView" } },
      { path: "examples/container-layout", name: "component-container-layout", component: ContainerLayoutView, meta: { title: "容器布局", icon: "panel", permission: "dashboard:view", keepAlive: true, cacheName: "ContainerLayoutView" } },
      { path: "examples/application-shell", name: "component-application-shell", component: ApplicationShellView, meta: { title: "应用外壳", icon: "panel", permission: "dashboard:view", keepAlive: true, cacheName: "ApplicationShellView" } },
      { path: "examples/menu", name: "component-menu", component: MenuView, meta: { title: "通用菜单", icon: "menu", permission: "dashboard:view", keepAlive: true, cacheName: "MenuView" } },
      { path: "examples/choice-descriptions", name: "component-choice-descriptions", component: ChoiceDescriptionsView, meta: { title: "复选与描述", icon: "check", permission: "dashboard:view", keepAlive: true, cacheName: "ChoiceDescriptionsView" } },
      { path: "examples/loading-overlay", name: "component-loading-overlay", component: LoadingOverlayView, meta: { title: "加载遮罩", icon: "refresh", permission: "dashboard:view", keepAlive: true, cacheName: "LoadingOverlayView" } },
      { path: "examples/typography", name: "component-typography", component: TypographyView, meta: { title: "文本排版", icon: "edit", permission: "dashboard:view", keepAlive: true, cacheName: "TypographyView" } },
      { path: "examples/statistics", name: "component-statistics", component: StatisticsView, meta: { title: "统计指标", icon: "chart", permission: "dashboard:view", keepAlive: true, cacheName: "StatisticsView" } },
      { path: "examples/badge", name: "component-badge", component: BadgeView, meta: { title: "徽标", icon: "bell", permission: "dashboard:view", keepAlive: true, cacheName: "BadgeView" } },
      { path: "examples/input-features", name: "component-input-features", component: InputFeaturesView, meta: { title: "输入能力", icon: "edit", permission: "dashboard:view", keepAlive: true, cacheName: "InputFeaturesView" } },
      { path: "examples/number-input", name: "component-number-input", component: NumberInputView, meta: { title: "数值输入", icon: "edit", permission: "dashboard:view", keepAlive: true, cacheName: "NumberInputView" } },
      { path: "examples/progress", name: "component-progress", component: ProgressView, meta: { title: "进度条", icon: "chart", permission: "dashboard:view", keepAlive: true, cacheName: "ProgressView" } },
      { path: "examples/rate", name: "component-rate", component: RateView, meta: { title: "评分", icon: "check", permission: "dashboard:view", keepAlive: true, cacheName: "RateView" } },
      { path: "examples/tree-data", name: "component-tree-data", component: TreeDataView, meta: { title: "树形数据", icon: "menu", permission: "dashboard:view", keepAlive: true, cacheName: "TreeDataView" } },
      { path: "examples/forms", name: "component-forms", component: ComponentsView, props: { section: "forms" }, meta: { title: "表单与筛选", icon: "filter", permission: "dashboard:view", keepAlive: true, cacheName: "ComponentsView" } },
      { path: "examples/dynamic-form", name: "component-dynamic-form", component: DynamicFormView, meta: { title: "动态表单", icon: "filter", permission: "dashboard:view", keepAlive: true, cacheName: "DynamicFormView" } },
      { path: "examples/upload-workflow", name: "component-upload-workflow", component: UploadWorkflowView, meta: { title: "上传任务", icon: "arrow-up", permission: "dashboard:view", keepAlive: true, cacheName: "UploadWorkflowView" } },
      { path: "examples/step-form", name: "component-step-form", component: StepFormView, meta: { title: "多步骤表单", icon: "menu", permission: "dashboard:view", keepAlive: true, cacheName: "StepFormView" } },
      { path: "examples/datetime", name: "component-datetime", component: ComponentsView, props: { section: "datetime" }, meta: { title: "日期与时间", icon: "calendar", permission: "dashboard:view", keepAlive: true, cacheName: "ComponentsView" } },
      { path: "examples/calendar", name: "component-calendar", component: CalendarView, meta: { title: "日历", icon: "calendar", permission: "dashboard:view", keepAlive: true, cacheName: "CalendarView" } },
      { path: "examples/collapse", name: "component-collapse", component: CollapseView, meta: { title: "折叠面板", icon: "panel", permission: "dashboard:view", keepAlive: true, cacheName: "CollapseView" } },
      { path: "examples/infinite-scroll", name: "component-infinite-scroll", component: InfiniteScrollView, meta: { title: "无限滚动", icon: "refresh", permission: "dashboard:view", keepAlive: true, cacheName: "InfiniteScrollView" } },
      { path: "examples/timeline", name: "component-timeline", component: TimelineView, meta: { title: "时间线", icon: "clock", permission: "dashboard:view", keepAlive: true, cacheName: "TimelineView" } },
      { path: "examples/virtual-list", name: "component-virtual-list", component: VirtualListView, meta: { title: "虚拟列表", icon: "grid", permission: "dashboard:view", keepAlive: true, cacheName: "VirtualListView" } },
      { path: "examples/range-media", name: "component-range-media", component: RangeMediaView, meta: { title: "范围与媒体", icon: "play", permission: "dashboard:view", keepAlive: true, cacheName: "RangeMediaView" } },
      { path: "examples/data", name: "component-data", component: ComponentsView, props: { section: "data" }, meta: { title: "数据展示", icon: "grid", permission: "dashboard:view", keepAlive: true, cacheName: "ComponentsView" } },
      { path: "examples/display-workflow", name: "component-display-workflow", component: DisplayWorkflowView, meta: { title: "展示与流程", icon: "grid", permission: "dashboard:view", keepAlive: true, cacheName: "DisplayWorkflowView" } },
      { path: "examples/advanced-table", name: "component-advanced-table", component: AdvancedTableView, meta: { title: "高级表格", icon: "columns", permission: "dashboard:view", keepAlive: true, cacheName: "AdvancedTableView" } },
      { path: "examples/editable-table", name: "component-editable-table", component: EditableTableView, meta: { title: "可编辑表格", icon: "edit", permission: "dashboard:view", keepAlive: true, cacheName: "EditableTableView" } },
      { path: "examples/table-patterns", name: "component-table-patterns", component: TablePatternsView, meta: { title: "表格能力", icon: "columns", permission: "dashboard:view", keepAlive: true, cacheName: "TablePatternsView" } },
      { path: "examples/table-extensions", name: "component-table-extensions", component: TableExtensionsView, meta: { title: "表格扩展", icon: "columns", permission: "dashboard:view", keepAlive: true, cacheName: "TableExtensionsView" } },
      { path: "examples/charts", name: "component-charts", component: ComponentsView, props: { section: "charts" }, meta: { title: "图表与指标", icon: "chart", permission: "dashboard:view", keepAlive: true, cacheName: "ComponentsView" } },
      { path: "examples/navigation", name: "component-navigation", component: ComponentsView, props: { section: "navigation" }, meta: { title: "导航与页签", icon: "menu", permission: "dashboard:view", keepAlive: true, cacheName: "ComponentsView" } },
      { path: "examples/overlay", name: "component-overlay", component: ComponentsView, props: { section: "overlay" }, meta: { title: "弹窗与浮层", icon: "panel", permission: "dashboard:view", keepAlive: true, cacheName: "ComponentsView" } },
      { path: "examples/overlay-utilities", name: "component-overlay-utilities", component: OverlayUtilitiesView, meta: { title: "浮层与辅助", icon: "dots", permission: "dashboard:view", keepAlive: true, cacheName: "OverlayUtilitiesView" } },
      { path: "examples/overlay-actions", name: "component-overlay-actions", component: OverlayActionsView, meta: { title: "消息框与动作", icon: "panel", permission: "dashboard:view", keepAlive: true, cacheName: "OverlayActionsView" } },
      { path: "examples/feedback", name: "component-feedback", component: ComponentsView, props: { section: "feedback" }, meta: { title: "反馈与交互", icon: "bell", permission: "dashboard:view", keepAlive: true, cacheName: "ComponentsView" } },
      { path: "examples/feedback-states", name: "component-feedback-states", component: FeedbackStatesView, meta: { title: "反馈状态", icon: "bell", permission: "dashboard:view", keepAlive: true, cacheName: "FeedbackStatesView" } },
      { path: "examples/content", name: "component-content", component: ComponentsView, props: { section: "content" }, meta: { title: "内容与媒体", icon: "edit", permission: "dashboard:view", keepAlive: true, cacheName: "ComponentsView" } },
      { path: "examples/image-cropper", name: "component-image-cropper", component: ImageCropperView, meta: { title: "图片裁剪", icon: "edit", permission: "dashboard:view", keepAlive: true, cacheName: "ImageCropperView" } },
      { path: "examples/image-viewer", name: "component-image-viewer", component: ImageViewerView, meta: { title: "图片预览器", icon: "eye", permission: "dashboard:view", keepAlive: true, cacheName: "ImageViewerView" } },
      { path: "examples/content-media", name: "component-content-media", component: ContentMediaView, meta: { title: "媒体基础", icon: "play", permission: "dashboard:view", keepAlive: true, cacheName: "ContentMediaView" } },
      { path: "forbidden", name: "forbidden", component: ForbiddenView, meta: { title: "无访问权限" } },
    ],
  },
  { path: "/:pathMatch(.*)*", name: "not-found", component: NotFoundView, meta: { public: true, title: "页面不存在" } },
];

const router = createRouter({ history: createWebHistory(), routes });

/** 路由守卫只处理会话与权限；页面菜单从用户资料生成，避免两套权限来源。 */
router.beforeEach((to) => {
  const authStore = useAuthStore();

  if (to.meta.public) {
    if (to.name === "login" && authStore.isAuthenticated) {
      return { name: "dashboard" };
    }
    return true;
  }

  if (!authStore.isAuthenticated) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  if (to.meta.permission && !authStore.hasPermission(to.meta.permission)) {
    return { name: "forbidden" };
  }

  return true;
});

export default router;
