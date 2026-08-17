<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { uploadFile } from "@/api/modules/files";
import { AppAlert } from "aps-design-pro";
import { AppBarChartCard } from "aps-design-pro";
import { AppChatWindow, type ChatMessage } from "aps-design-pro";
import { AppCommentWidget, type CommentItem } from "aps-design-pro";
import { AppCountTo } from "aps-design-pro";
import { AppImageCropper, type CropResult } from "aps-design-pro";
import { AppLineChartCard } from "aps-design-pro";
import { AppNotification, type NotificationItem } from "aps-design-pro";
import { AppDragVerify } from "aps-design-pro";
import { AppProgress } from "aps-design-pro";
import { AppProgressCard } from "aps-design-pro";
import { AppRichTextEditor } from "aps-design-pro";
import { AppStatsCard } from "aps-design-pro";
import { AppUpload } from "aps-design-pro";
import { AppVideoPlayer } from "aps-design-pro";
import { AppWatermark } from "aps-design-pro";
import { AppButton, AppConfigProvider, AppIconButton, AppLink } from "aps-design-pro";
import {
  AppBarChart,
  AppChart,
  AppChartCard,
  AppDonutChart,
  AppDonutChartCard,
  AppDualBarCompareChart,
  AppHBarChart,
  AppKLineChart,
  AppLineChart,
  AppMapChart,
  AppRadarChart,
  AppRingChart,
  AppScatterChart,
} from "aps-design-pro";
import { AppPagination } from "aps-design-pro";
import { AppDivider, AppSpace } from "aps-design-pro";
import {
  AppCheckbox,
  AppCascader,
  AppColorPicker,
  AppColorPickerPanel,
  AppDatePicker,
  AppDateRangePicker,
  AppDateTimePicker,
  AppDateTimeRangePicker,
  AppForm,
  AppFormField,
  AppInput,
  AppNumberInput,
  AppRadioGroup,
  AppRangeControl,
  AppRate,
  AppSearchBar,
  AppSelect,
  AppSegmented,
  AppSlider,
  AppSwitch,
  AppTextarea,
  AppTimePicker,
  AppTimeRangePicker,
  AppTreeSelect,
} from "aps-design-pro";
import { AppAffix, AppAnchor, AppBreadcrumb, AppHorizontalMenu, AppTabs, AppTour } from "aps-design-pro";
import { AppDialog, AppDrawer, AppDropdown, AppPopover, AppPopconfirm } from "aps-design-pro";
import type { NavigationItem } from "@/types/auth";
import type { DropdownItem } from "aps-design-pro";
import type { AnchorItem, CascaderOption, ChartSeries, ControlSize, FormItem, FormValue, RadioOption, SelectOption, SliderMark, TabItem, TourStep, TreeOption, UploadFileItem, UploadRequest } from "aps-design-pro";

type ComponentSection = "overview" | "base" | "selection" | "forms" | "datetime" | "data" | "charts" | "navigation" | "overlay" | "feedback" | "content";
type ChartBoundaryMode = "normal" | "empty" | "extreme";

interface ExampleEntry {
  path: string;
  title: string;
  description: string;
  examples: string;
}

const props = withDefaults(defineProps<{ section?: ComponentSection }>(), { section: "overview" });

const searchExpanded = ref(false);
const searchModel = ref<Record<string, FormValue>>({ keyword: "", status: "", range: { start: "", end: "" } });
const formModel = ref<Record<string, FormValue>>({ username: "", mobile: "", level: "", address: "", startDate: "", appointmentTime: "", dateRange: { start: "", end: "" }, department: [], enabled: true, note: "" });
const selectedDate = ref("2026-08-01");
const selectedTime = ref("09:30");
const selectedTimeRange = ref({ start: "09:30", end: "18:00" });
const selectedDateTime = ref("2026-08-01T09:30");
const selectedDateRange = ref({ start: "2026-08-01", end: "2026-08-31" });
const selectedDateTimeRange = ref({ start: "2026-08-04T09:30", end: "2026-08-08T18:00" });
const capacity = ref(64);
const reminderMinutes = ref(30);
const precisionThreshold = ref(0.58);
const rangeGeometryProbe = ref(0.5);
const rangeGeometryMessage = ref("等待拖动或使用方向键调整");
const basicInput = ref("");
const basicSelection = ref("standard");
const remoteSelection = ref("");
const virtualSelection = ref("");
const basicChecked = ref(true);
const basicSwitch = ref(false);
const buttonActionStatus = ref("尚未执行快捷操作");
const isWeeklyDigestEnabled = ref(false);
const isWeeklyDigestAllowed = ref(true);
const switchChangeMessage = ref("尚未变更每周摘要状态");
const basicRadio = ref("team");
const basicQuantity = ref(2);
const configDemoSize = ref<ControlSize>("default");
const configDemoDisabled = ref(false);
const configDemoInput = ref("");
const configDemoNote = ref("");
const configDemoSelection = ref("standard");
const configDemoQuantity = ref(2);
const configDemoChecked = ref(true);
const configDemoSwitch = ref(false);
const configDemoRadio = ref("team");
const segmentedDensity = ref("comfortable");
const experienceScore = ref(3.5);
const brandColor = ref("#0071E3");
const brandPanelColor = ref("rgba(0, 113, 227, 0.82)");
const activeDemoTab = ref("overview");
const demoTabType = ref<"line" | "card" | "border-card">("line");
const demoTabPosition = ref<"top" | "left">("top");
const demoTabDirty = ref(false);
const demoTabStatus = ref("当前为概览页签，可切换形态、位置、新增和关闭操作。");
const demoTabSequence = ref(1);
const activeAnchorKey = ref("navigation-path");
const anchorScrollContainer = ref<HTMLElement | null>(null);
const navigationAnchorSection = ref<HTMLElement | null>(null);
const affixStatus = ref("普通流状态");
const isTourOpen = ref(false);
const activeTourIndex = ref(0);
const tourStatus = ref("尚未开始");
const examplePage = ref(1);
const examplePageSize = ref(20);
const isDialogOpen = ref(false);
const isDrawerOpen = ref(false);
const isPopoverOpen = ref(false);
const isDropdownOpen = ref(false);
const isPopconfirmOpen = ref(false);
const isPopconfirmSubmitting = ref(false);
const isNotificationOpen = ref(false);
const selectedOverlayAction = ref("尚未选择操作");
const capacityMarks: SliderMark[] = [
  { value: 0, label: "0" },
  { value: 25, label: "25" },
  { value: 50, label: "50" },
  { value: 75, label: "75" },
  { value: 100, label: "100" },
];
const reminderMarks: SliderMark[] = [
  { value: 0, label: "不提醒" },
  { value: 15, label: "15 分钟" },
  { value: 30, label: "30 分钟" },
  { value: 60, label: "1 小时" },
];
const basicOptions = [
  { label: "标准方案", value: "standard" },
  { label: "专业方案", value: "professional" },
  { label: "企业方案", value: "enterprise" },
];
const directoryOptions: SelectOption[] = Array.from({ length: 80 }, (_, index) => ({ label: `成员 ${String(index + 1).padStart(2, "0")}`, value: `member-${index + 1}`, description: index % 3 === 0 ? "产品工作区" : "数据工作区" }));
const largeSelectOptions: SelectOption[] = Array.from({ length: 2400 }, (_, index) => ({ label: `资源节点 ${index + 1}`, value: `resource-${index + 1}`, group: index < 800 ? "产品" : index < 1600 ? "数据" : "运营" }));
const basicRadioOptions: RadioOption[] = [
  { label: "团队可见", value: "team" },
  { label: "仅自己可见", value: "private" },
];
const configSizeOptions: RadioOption[] = [
  { label: "小", value: "small" },
  { label: "默认", value: "default" },
  { label: "大", value: "large" },
];
const densityOptions = [
  { label: "舒适", value: "comfortable" },
  { label: "紧凑", value: "compact" },
  { label: "宽松", value: "spacious", disabled: true },
];
const demoTabs = ref<TabItem[]>([
  { key: "overview", label: "概览", icon: "grid", content: "概览内容由业务页面或 panel 插槽承载，页签组件只维护可访问的导航与状态。" },
  { key: "records", label: "操作记录", icon: "menu", closable: true, content: "这里可放置审计记录、版本动态或可筛选的列表内容。" },
  { key: "settings", label: "设置", icon: "settings", closable: true, content: "离开此页签前可根据业务脏状态执行同步或异步确认。" },
]);
const demoTabTypeOptions: SelectOption[] = [
  { label: "线条", value: "line" },
  { label: "卡片", value: "card" },
  { label: "边框卡片", value: "border-card" },
];
const demoTabPositionOptions: SelectOption[] = [
  { label: "顶部", value: "top" },
  { label: "左侧", value: "left" },
];
const anchorItems: AnchorItem[] = [
  { key: "navigation-path", label: "路径与页签", targetId: "anchor-navigation-path" },
  { key: "navigation-menu", label: "水平菜单", targetId: "anchor-navigation-menu", children: [{ key: "navigation-menu-sub", label: "二级菜单状态", targetId: "anchor-navigation-menu-sub" }] },
  { key: "navigation-pagination", label: "分页导航", targetId: "anchor-navigation-pagination" },
  { key: "navigation-disabled", label: "禁用节点", disabled: true },
];
const tourSteps: TourStep[] = [
  { key: "tour-path", title: "先确认当前位置", description: "面包屑和页签共同保留当前页面上下文，适合多任务后台。", target: "#anchor-navigation-path", placement: "bottom", padding: 8 },
  { key: "tour-menu", title: "再切换业务菜单", description: "水平菜单支持二级展开，点击外部或按 Esc 都可以收起。", target: "#anchor-navigation-menu", placement: "top" },
  { key: "tour-affix", title: "最后使用吸顶工具栏", description: "长页面中的批量操作可以保持可见，且不接管页面滚动。", target: ".affix-demo-bar", placement: "top", padding: 6 },
];
const horizontalMenuItems: NavigationItem[] = [
  { key: "overview", label: "概览", path: "/examples/navigation", icon: "grid", permission: "dashboard:view" },
  {
    key: "workspace",
    label: "工作区",
    path: "/examples/navigation",
    icon: "panel",
    permission: "dashboard:view",
    children: [
      { key: "members", label: "成员与权限", path: "/system/users", icon: "users", permission: "system:user:read" },
      { key: "records", label: "操作记录", path: "/examples/data", icon: "chart", permission: "dashboard:view" },
    ],
  },
  { key: "settings", label: "设置", path: "/profile", icon: "settings", permission: "dashboard:view" },
];
const overlayMenuItems: DropdownItem[] = [
  { key: "copy", label: "复制链接", icon: "edit" },
  { key: "refresh", label: "重新加载", icon: "refresh" },
  { key: "remove", label: "移除项目", icon: "trash", danger: true, divided: true },
];
const formItems: FormItem[] = [
  { key: "username", label: "用户名", placeholder: "输入用户名", required: true, rules: [{ required: true }, { validator: async (value) => value === "system" ? "用户名 system 为保留名称，请使用其他名称。" : true }], span: 1 },
  { key: "mobile", label: "手机号", inputType: "tel", placeholder: "输入手机号", span: 1 },
  { key: "level", label: "用户等级", type: "select", options: [{ label: "普通成员", value: "member" }, { label: "运营主管", value: "operator" }, { label: "系统管理员", value: "admin" }], placeholder: "选择等级", span: 1 },
  { key: "address", label: "地址", placeholder: "输入地址", span: 1 },
  { key: "startDate", label: "生效日期", type: "date", span: 1 },
  { key: "appointmentTime", label: "服务时间", type: "time", span: 1 },
  { key: "dateRange", label: "有效周期", type: "daterange", span: 2 },
  { key: "department", label: "所属部门", type: "cascader", cascaderOptions: [{ label: "产品中心", value: "product", children: [{ label: "设计组", value: "design" }, { label: "研发组", value: "development" }] }, { label: "运营中心", value: "operation", children: [{ label: "市场组", value: "market" }] }], placeholder: "选择部门", span: 2 },
  { key: "enabled", label: "启用状态", type: "switch", span: 2 },
  { key: "note", label: "备注", type: "textarea", placeholder: "输入补充说明", span: 4 },
];
const cascaderValue = ref<string[]>([]);
const treeValue = ref<string[]>([]);
const cascaderOptions: CascaderOption[] = [
  {
    label: "中国",
    value: "cn",
    children: [
      { label: "北京", value: "bj", children: [{ label: "东城区", value: "dongcheng" }, { label: "朝阳区", value: "chaoyang" }, { label: "海淀区", value: "haidian" }] },
      { label: "上海", value: "sh", children: [{ label: "浦东新区", value: "pudong" }, { label: "静安区", value: "jingan" }, { label: "闵行区", value: "minhang" }] },
      { label: "广东", value: "gd", children: [{ label: "广州市", value: "guangzhou" }, { label: "深圳市", value: "shenzhen" }, { label: "佛山市", value: "foshan" }] },
      { label: "浙江", value: "zj", children: [{ label: "杭州市", value: "hangzhou" }, { label: "宁波市", value: "ningbo" }, { label: "温州市", value: "wenzhou" }] },
      { label: "四川", value: "sc", children: [{ label: "成都市", value: "chengdu" }, { label: "绵阳市", value: "mianyang" }, { label: "乐山市", value: "leshan" }] },
      { label: "湖北", value: "hb", children: [{ label: "武汉市", value: "wuhan" }, { label: "宜昌市", value: "yichang" }, { label: "襄阳市", value: "xiangyang" }] },
    ],
  },
  { label: "日本", value: "jp", children: [{ label: "东京都", value: "tokyo", children: [{ label: "千代田区", value: "chiyoda" }, { label: "涩谷区", value: "shibuya" }] }, { label: "大阪府", value: "osaka", children: [{ label: "大阪市", value: "osaka-city" }, { label: "堺市", value: "sakai" }] }] },
  { label: "新加坡", value: "sg", children: [{ label: "中央区", value: "central", children: [{ label: "市中心", value: "downtown" }, { label: "乌节", value: "orchard" }] }, { label: "东北区", value: "northeast", children: [{ label: "盛港", value: "sengkang" }, { label: "榜鹅", value: "punggol" }] }] },
];
const treeOptions: TreeOption[] = [{ label: "平台中心", value: "platform", children: [{ label: "用户管理", value: "users" }, { label: "角色权限", value: "roles" }] }, { label: "业务中心", value: "business", children: [{ label: "订单管理", value: "orders" }] }];
const uploadFiles = ref<UploadFileItem[]>([]);
const uploadRequest: UploadRequest = async ({ file, signal, onProgress }) => uploadFile(file, signal, onProgress);
const croppedImage = ref("");
const richText = ref("");
const comments = ref<CommentItem[]>([{ id: "comment-1", author: "林知远", content: "组件的输入与交互会保持统一。", time: "刚刚" }]);
const chartSeries = [{ name: "访问量", data: [38, 52, 45, 70, 62, 86, 78] }, { name: "转化量", data: [18, 30, 27, 42, 36, 51, 48], color: "#35a16b" }];
const weeklyChartCategories = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const channelShareSeries = [{ name: "官网", data: [48], color: "#0071e3" }, { name: "搜索", data: [32], color: "#35a16b" }, { name: "推荐", data: [20], color: "#b35d00" }];
const categoryRankingSeries = [{ name: "完成率", data: [92, 84, 76, 68, 54], color: "#0071e3" }];
const deliveryComparisonSeries = [{ name: "本期", data: [128, 96, 84, 112], color: "#0071e3" }, { name: "上期", data: [104, 88, 72, 96], color: "#9aa5b4" }];
const radarEvaluationSeries = [{ name: "当前版本", data: [86, 78, 92, 74, 88], color: "#0071e3" }, { name: "目标值", data: [92, 88, 96, 86, 94], color: "#35a16b" }];
const scatterLatencySeries = [{ name: "响应耗时", data: [118, 84, 142, 96, 168, 122, 104, 156], color: "#0071e3" }];
const scatterLatencyCategories = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
const serviceHealthSeries = [{ name: "健康", data: [82], color: "#35a16b" }, { name: "待处理", data: [18], color: "#d08a27" }];
const zoomableChartCategories = Array.from({ length: 30 }, (_, index) => `07/${String(index + 1).padStart(2, "0")}`);
const zoomableChartSeries = [
  { name: "访问量", data: [82, 95, 88, 104, 98, 116, 121, 110, 128, 142, 135, 154, 160, 148, 170, 177, 164, 186, 194, 181, 203, 212, 198, 220, 228, 216, 237, 245, 232, 258] },
  { name: "有效线索", data: [24, 28, 26, 31, 29, 35, 38, 34, 40, 45, 42, 48, 51, 47, 54, 57, 53, 61, 64, 60, 68, 71, 66, 74, 77, 73, 81, 84, 79, 89], color: "#35a16b" },
];
const chartVisibleRange = ref({ start: 9, end: 20 });
const chartExportStatus = ref("可拖动下方时间窗口，或使用右上角操作按钮。");
const largeChartCategories = Array.from({ length: 2400 }, (_, index) => "批次 " + String(index + 1).padStart(4, "0"));
const largeChartSeries = [
  { name: "请求量", data: Array.from({ length: 2400 }, (_, index) => Math.round(520 + Math.sin(index / 23) * 96 + Math.cos(index / 7) * 42 + (index % 113 === 0 ? 180 : 0))) },
  { name: "完成量", data: Array.from({ length: 2400 }, (_, index) => Math.round(420 + Math.sin(index / 23 + 0.7) * 74 + Math.cos(index / 11) * 34 + (index % 167 === 0 ? 130 : 0))), color: "#35a16b" },
];
const largeChartVisibleRange = ref({ start: 0, end: 2399 });
const chartBoundaryMode = ref<ChartBoundaryMode>("normal");
const chartBoundaryOptions: SelectOption[] = [{ label: "正常数据", value: "normal" }, { label: "空数据", value: "empty" }, { label: "极值与异常", value: "extreme" }];
const chartBoundaryCategories = ["01", "02", "03", "04", "05", "06"];
const chartBoundarySeries = computed<ChartSeries[]>(() => {
  if (chartBoundaryMode.value === "empty") return [];
  if (chartBoundaryMode.value === "extreme") return [{ name: "净变化", data: [Number.MAX_VALUE, Number.MAX_VALUE / 2, 0, -Number.MAX_VALUE / 2, -Number.MAX_VALUE, Number.NaN] }];
  return [{ name: "处理量", data: [68, 104, 82, 126, 96, 142] }, { name: "完成量", data: [42, 73, 58, 92, 76, 108], color: "#35a16b" }];
});
const notifications = ref<NotificationItem[]>([{ id: "n1", title: "权限变更待处理", description: "有 2 项菜单权限需要确认。", time: "10 分钟前", read: false }, { id: "n2", title: "数据已同步", description: "当前工作区数据已更新。", time: "昨天", read: true }]);
const showSuccessAlert = ref(true);
const isDragVerified = ref(false);
const chatOpen = ref(false);
const chatMessages = ref<ChatMessage[]>([{ id: "m1", role: "assistant", content: "你好，我可以帮你查找工作区功能。", time: "刚刚" }]);
const exampleEntries: ExampleEntry[] = [
  { path: "/examples/base", title: "基础控件", description: "按钮、输入、选择、开关、单选与数值步进。", examples: "输入、状态、选择" },
  { path: "/examples/selection", title: "选择控件", description: "分段控制、评分与颜色选择等轻量交互控件。", examples: "偏好、评分、颜色" },
  { path: "/examples/advanced-selection", title: "高级选择", description: "带搜索、批量勾选与禁用项的权限、成员穿梭选择。", examples: "穿梭、权限、成员" },
  { path: "/examples/forms", title: "表单与筛选", description: "表单配置、搜索栏、级联与树形选择。", examples: "输入、选择、校验" },
  { path: "/examples/tag-input", title: "标签与输入", description: "可拆分、去重、限制数量的标签输入，适合关键词和成员标记。", examples: "标签、粘贴、校验" },
  { path: "/examples/layout-grid", title: "栅格布局", description: "24 栅格、间距、偏移和响应式断点可用于筛选、表单和内容区。", examples: "行列、断点、偏移" },
  { path: "/examples/container-layout", title: "容器布局", description: "头部、侧栏、主内容和底部可组合为可滚动、可收起的页面骨架。", examples: "分区、侧栏、滚动" },
  { path: "/examples/menu", title: "通用菜单", description: "不绑定路由的横纵菜单，覆盖多级展开、禁用、收起与选择事件。", examples: "导航、层级、状态" },
  { path: "/examples/tree-data", title: "树形数据", description: "支持搜索保留父级、展开收起、单选多选和独立勾选的树组件。", examples: "目录、权限、层级" },
  { path: "/examples/datetime", title: "日期与时间", description: "日期、时间、日期时间、范围与刻度滑块。", examples: "选择、范围、数值" },
  { path: "/examples/range-media", title: "范围与媒体", description: "滑块、播放进度、音量与拖动边界的统一几何验收。", examples: "滑块、视频、触控" },
  { path: "/examples/data", title: "数据展示", description: "数据指标、进度状态与基础图表。", examples: "统计、趋势、图表" },
  { path: "/examples/progress", title: "进度条", description: "线性、圆形和仪表盘进度，支持不确定态、条纹与格式化文本。", examples: "加载、完成、配额" },
  { path: "/examples/display-workflow", title: "展示与流程", description: "头像、标签、骨架屏与可访问的横纵向步骤。", examples: "成员、状态、流程" },
  { path: "/examples/advanced-table", title: "高级表格", description: "高数据量虚拟滚动、冻结列与用户级表格偏好。", examples: "虚拟滚动、冻结、偏好" },
  { path: "/examples/table-patterns", title: "表格能力", description: "分组表头、汇总、树形层级、长文本与命名视图。", examples: "汇总、层级、视图" },
  { path: "/examples/charts", title: "图表与指标", description: "折线、柱状、饼环、雷达、散点与业务指标展示。", examples: "趋势、占比、分析" },
  { path: "/examples/navigation", title: "导航与页签", description: "面包屑、页签和分页等导航交互。", examples: "定位、切换、分页" },
  { path: "/examples/overlay", title: "弹窗与浮层", description: "对话框、抽屉、下拉菜单和信息浮层。", examples: "确认、补充、操作" },
  { path: "/examples/overlay-utilities", title: "浮层与辅助", description: "右键菜单、视口提示与指定容器的回到顶部。", examples: "右键、提示、滚动" },
  { path: "/examples/feedback", title: "反馈与交互", description: "提示、通知、进度与即时操作反馈。", examples: "告警、通知、状态" },
  { path: "/examples/content", title: "内容与媒体", description: "文件处理、富文本、裁剪与水印。", examples: "上传、编辑、媒体" },
  { path: "/examples/image-cropper", title: "图片裁剪", description: "统一预览与导出坐标的构图、缩放、旋转和多比例输出。", examples: "拖动、构图、导出" },
  { path: "/examples/image-viewer", title: "图片预览器", description: "多图浮层支持缩略图、缩放、旋转、键盘导航与下载事件。", examples: "预览、切换、缩放" },
];

onMounted(() => {
  anchorScrollContainer.value = navigationAnchorSection.value?.closest<HTMLElement>(".view-container") ?? document.querySelector<HTMLElement>(".view-container");
});

function submitForm(value: Record<string, FormValue>): void { formModel.value = value; }
/** 设置页签模拟未保存状态；离开钩子可替换为任意弹窗确认或服务端保存检查。 */
function guardDemoTabLeave(nextKey: string, activeKey: string): boolean {
  if (activeKey !== "settings" || !demoTabDirty.value) return true;
  demoTabStatus.value = `设置页签存在未保存修改，已拦截切换到“${nextKey}”。`;
  return false;
}

function addDemoTab(): void {
  demoTabSequence.value += 1;
  const key = `draft-${demoTabSequence.value}`;
  demoTabs.value = [...demoTabs.value, { key, label: `草稿 ${demoTabSequence.value}`, icon: "edit", closable: true, content: "新增页签通过 tab-add 事件交由业务层创建并持久化。" }];
  activeDemoTab.value = key;
  demoTabStatus.value = `已新增“草稿 ${demoTabSequence.value}”。`;
}

function closeDemoTab(key: string): void {
  const index = demoTabs.value.findIndex((item) => item.key === key);
  if (index < 0 || demoTabs.value.length <= 1) return;
  const closingTab = demoTabs.value[index];
  const nextTabs = demoTabs.value.filter((item) => item.key !== key);
  demoTabs.value = nextTabs;
  if (activeDemoTab.value === key) activeDemoTab.value = nextTabs[Math.min(index, nextTabs.length - 1)].key;
  demoTabStatus.value = `已关闭“${closingTab.label}”。`;
}

function updateDemoTabStatus(key: string): void {
  const item = demoTabs.value.find((entry) => entry.key === key);
  if (item) demoTabStatus.value = `当前页签：${item.label}`;
}

function reportDemoTabLeaveRejected(nextKey: string, activeKey: string): void {
  const nextTab = demoTabs.value.find((item) => item.key === nextKey);
  const activeTab = demoTabs.value.find((item) => item.key === activeKey);
  demoTabStatus.value = `已保留“${activeTab?.label ?? activeKey}”，未切换到“${nextTab?.label ?? nextKey}”。`;
}
/** 模拟业务层的异步权限校验，组件只等待结果，不持有业务规则。 */
async function validateWeeklyDigestChange(nextValue: boolean): Promise<boolean> {
  switchChangeMessage.value = "正在校验当前成员的订阅权限…";
  await new Promise<void>((resolve) => window.setTimeout(resolve, 360));
  if (nextValue && !isWeeklyDigestAllowed.value) {
    switchChangeMessage.value = "当前成员没有启用每周摘要的权限。";
    return false;
  }
  return true;
}
function updateWeeklyDigestStatus(value: boolean): void { switchChangeMessage.value = value ? "每周摘要已启用。" : "每周摘要已关闭。"; }
function reportBlockedWeeklyDigestChange(): void { switchChangeMessage.value = "切换已被业务权限规则拦截。"; }
function reportWeeklyDigestChangeError(message: string): void { switchChangeMessage.value = message; }
async function queryDirectoryOptions(keyword: string): Promise<SelectOption[]> {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 160));
  const normalizedKeyword = keyword.trim().toLocaleLowerCase();
  return normalizedKeyword ? directoryOptions.filter((option) => `${option.label} ${option.description ?? ""}`.toLocaleLowerCase().includes(normalizedKeyword)) : directoryOptions;
}
function resetNotifications(): void { notifications.value = notifications.value.map((item) => ({ ...item, read: true })); }
function readNotification(id: string): void { notifications.value = notifications.value.map((item) => item.id === id ? { ...item, read: true } : item); }
function sendMessage(content: string): void { chatMessages.value.push({ id: `${Date.now()}`, role: "user", content, time: "刚刚" }); }
function showCroppedImage(result: CropResult): void { croppedImage.value = result.dataUrl; }
function updateButtonActionStatus(action: string): void { buttonActionStatus.value = `已执行${action}`; }
function updateAffixStatus(stuck: boolean): void { affixStatus.value = stuck ? "已吸顶" : "普通流状态"; }
function confirmChartExport(fileName: string): void { chartExportStatus.value = `已生成 ${fileName}`; }
function startTour(): void { activeTourIndex.value = 0; tourStatus.value = "进行中"; isTourOpen.value = true; }
function finishTour(): void { tourStatus.value = "已完成"; }
function skipTour(): void { tourStatus.value = "已跳过"; }
/** 示例复现异步删除流程，组件只负责提交锁与关闭，成功状态仍由业务页决定。 */
async function confirmDraftRemoval(): Promise<void> {
  if (isPopconfirmSubmitting.value) return;
  isPopconfirmSubmitting.value = true;
  await new Promise<void>((resolve) => window.setTimeout(resolve, 520));
  isPopconfirmSubmitting.value = false;
  isPopconfirmOpen.value = false;
  selectedOverlayAction.value = "已移除过期草稿";
}
function isSectionVisible(section: Exclude<ComponentSection, "overview">): boolean { return props.section === "overview" || props.section === section; }
</script>

<template>
  <div class="component-gallery page-content">
    <section v-if="section === 'overview'" class="example-index" aria-label="组件示例目录">
      <RouterLink v-for="entry in exampleEntries" :key="entry.path" class="example-entry" :to="entry.path">
        <span>{{ entry.examples }}</span>
        <strong>{{ entry.title }}</strong>
        <p>{{ entry.description }}</p>
        <em>查看示例</em>
      </RouterLink>
    </section>
    <template v-if="isSectionVisible('base')">
      <section class="gallery-grid two-columns">
        <article class="gallery-card control-showcase">
          <header class="showcase-heading"><div><h2>输入与选择</h2><p>统一尺寸、聚焦态和错误态，适合直接组合进业务表单。</p></div><span>基础控件</span></header>
          <div class="base-control-grid">
            <AppFormField label="输入内容" for="basic-input"><AppInput id="basic-input" v-model="basicInput" clearable placeholder="请输入内容" /></AppFormField>
            <AppFormField label="选择方案"><AppSelect v-model="basicSelection" :options="basicOptions" clearable filterable aria-label="选择方案" /></AppFormField>
            <AppFormField label="数量"><AppNumberInput v-model="basicQuantity" :min="1" :max="9" aria-label="选择数量" /></AppFormField>
            <div class="choice-stack"><AppCheckbox v-model="basicChecked" label="启用通知" /><AppSwitch v-model="basicSwitch" label="自动保存" /></div>
          </div>
        </article>
        <article class="gallery-card control-showcase">
          <header class="showcase-heading"><div><h2>操作状态</h2><p>按钮、单选与禁用状态遵循同一套视觉层级。</p></div><span>可访问</span></header>
          <div class="button-row"><AppButton @click="updateButtonActionStatus('主要操作')">主要操作</AppButton><AppButton variant="secondary">次要操作</AppButton><AppButton variant="ghost">次级操作</AppButton><AppButton variant="danger">危险操作</AppButton></div>
          <div class="button-row"><AppButton plain @click="updateButtonActionStatus('浅色操作')">浅色操作</AppButton><AppButton variant="secondary" round @click="updateButtonActionStatus('圆角操作')">圆角操作</AppButton><AppButton circle leading-icon="refresh" aria-label="刷新组件示例" @click="updateButtonActionStatus('刷新')" /><AppIconButton icon="bell" label="打开通知中心" variant="secondary" @click="updateButtonActionStatus('通知')" /><AppIconButton icon="trash" label="删除草稿" variant="danger" circle @click="updateButtonActionStatus('删除草稿')" /></div>
          <p class="button-demo-status" role="status">{{ buttonActionStatus }}</p>
          <AppRadioGroup v-model="basicRadio" name="basic-visibility" :options="basicRadioOptions" />
        </article>
      </section>
      <section class="gallery-card control-showcase switch-showcase">
        <header class="showcase-heading"><div><h2>开关状态与前置校验</h2><p>支持开关状态文案、内嵌提示、语义色和异步前置校验；校验中自动锁定，避免重复触发业务提交。</p></div><span>可控变更</span></header>
        <div class="switch-demo-grid">
          <AppSwitch v-model="isWeeklyDigestAllowed" label="允许启用每周摘要" size="small" tone="green" />
          <AppSwitch v-model="isWeeklyDigestEnabled" active-text="启用" inactive-text="关闭" inline-prompt tone="green" aria-label="每周摘要" :before-change="validateWeeklyDigestChange" @change="updateWeeklyDigestStatus" @change-blocked="reportBlockedWeeklyDigestChange" @change-error="reportWeeklyDigestChangeError" />
          <AppSwitch model-value label="只读状态" active-text="已开启" disabled />
        </div>
        <p class="switch-demo-status" role="status">{{ switchChangeMessage }}</p>
      </section>
      <section class="gallery-card control-showcase config-provider-showcase">
        <header class="showcase-heading"><div><h2>组件全局配置</h2><p>Provider 仅提供上下文，不额外包裹布局；子组件未传尺寸或禁用态时自动继承最近配置。</p></div><span>AppConfigProvider</span></header>
        <div class="config-provider-controls">
          <AppRadioGroup v-model="configDemoSize" name="config-provider-size" :options="configSizeOptions" aria-label="设置组件默认尺寸" />
          <AppSwitch v-model="configDemoDisabled" label="全局禁用子组件" />
        </div>
        <AppConfigProvider :size="configDemoSize" :disabled="configDemoDisabled">
          <div class="config-provider-preview">
            <label class="config-preview-field"><span>单行输入</span><AppInput v-model="configDemoInput" placeholder="未传 size 或 disabled" clearable aria-label="配置 Provider 输入框示例" /></label>
            <label class="config-preview-field"><span>选择方案</span><AppSelect v-model="configDemoSelection" :options="basicOptions" aria-label="配置 Provider 选择示例" /></label>
            <label class="config-preview-field"><span>数量</span><AppNumberInput v-model="configDemoQuantity" :min="1" :max="9" aria-label="配置 Provider 数值示例" /></label>
            <div class="config-preview-field config-preview-choice"><span>状态控制</span><AppCheckbox v-model="configDemoChecked" label="启用通知" /><AppSwitch v-model="configDemoSwitch" label="自动保存" /></div>
            <label class="config-preview-field is-wide"><span>多行备注</span><AppTextarea v-model="configDemoNote" :rows="2" placeholder="未传 size 或 disabled 的多行输入框" aria-label="配置 Provider 多行输入示例" /></label>
            <div class="config-preview-field is-wide"><span>可见范围</span><AppRadioGroup v-model="configDemoRadio" name="config-provider-visibility" :options="basicRadioOptions" aria-label="配置 Provider 单选示例" /></div>
            <div class="config-provider-actions is-wide"><AppButton>保存当前配置</AppButton><AppButton variant="secondary">查看变更</AppButton></div>
          </div>
        </AppConfigProvider>
        <p class="config-provider-status">当前默认尺寸：{{ configDemoSize }}；全局禁用：{{ configDemoDisabled ? "已启用" : "未启用" }}。</p>
      </section>
      <section class="gallery-grid two-columns">
        <article class="gallery-card control-showcase">
          <header class="showcase-heading"><div><h2>基础布局原语</h2><p>分隔线与间距容器用于组合卡片、按钮和表单，不再让页面重复手写间距。</p></div><span>布局基础</span></header>
          <div class="primitive-stack">
            <AppSpace :size="16" wrap aria-label="基础操作组"><AppButton size="small">保存</AppButton><AppButton size="small" variant="secondary">预览</AppButton><AppButton size="small" variant="ghost">更多</AppButton></AppSpace>
            <AppDivider label="内容分隔" />
            <AppDivider content-position="left" :margin="4"><span>插槽内容与左对齐</span></AppDivider>
            <AppSpace direction="vertical" :size="8" align="start" aria-label="说明内容"><strong>工作区设置</strong><span class="primitive-muted">通过统一的间距令牌保持模块之间的节奏。</span></AppSpace>
          </div>
        </article>
        <article class="gallery-card control-showcase">
          <header class="showcase-heading"><div><h2>链接语义</h2><p>内部路由与外部地址使用同一入口，禁用状态保留可见反馈并阻止导航。</p></div><span>导航原语</span></header>
          <AppSpace direction="vertical" align="start" :size="12" aria-label="链接示例"><AppLink to="/examples/data">查看数据展示案例</AppLink><AppLink href="https://example.com" target="_blank" external underline="always">打开外部参考</AppLink><AppLink disabled>当前不可用</AppLink></AppSpace>
        </article>
      </section>
    </template>
    <template v-if="isSectionVisible('selection')">
      <section class="gallery-grid two-columns">
        <article class="gallery-card control-showcase">
          <header class="showcase-heading"><div><h2>分段控制</h2><p>适合有限、互斥的偏好选项；方向键会同步更新焦点和选择。</p></div><span>单选语义</span></header>
          <div class="selection-stack"><AppFormField label="内容密度"><AppSegmented v-model="segmentedDensity" :options="densityOptions" ariaLabel="内容密度选择" /></AppFormField><AppSegmented model-value="default" :options="[{ label: '默认', value: 'default' }, { label: '禁用', value: 'disabled', disabled: true }]" size="small" ariaLabel="小尺寸分段选择" /></div>
        </article>
        <article class="gallery-card control-showcase">
          <header class="showcase-heading"><div><h2>评分与颜色</h2><p>半星评分支持鼠标、触控与键盘；颜色组件支持浮层取色、透明度、格式化输出与可嵌入的面板形态。</p></div><span>精细输入</span></header>
          <div class="selection-stack"><AppFormField label="体验评分"><AppRate v-model="experienceScore" allow-half show-score ariaLabel="体验评分" /></AppFormField><AppFormField label="主题强调色"><AppColorPicker v-model="brandColor" show-alpha clearable :presets="['#0071E3', '#23814A', '#B35D00', '#C6281B']" ariaLabel="主题强调色" /></AppFormField><AppFormField label="嵌入取色面板"><AppColorPickerPanel v-model="brandPanelColor" format="rgb" show-alpha :predefine="['#0071E3', '#23814A', '#B35D00', '#C6281B']" ariaLabel="嵌入取色面板" /></AppFormField></div>
        </article>
      </section>
    </template>
    <template v-if="isSectionVisible('selection')">
      <section class="gallery-card selection-showcase">
        <header class="showcase-heading"><div><h2>远程与大数据选择</h2><p>远程搜索由业务层提供查询函数；虚拟列表只渲染可视区域，适合数千条资源选项。</p></div><span>异步与性能</span></header>
        <div class="advanced-selection-grid">
          <AppFormField label="远程成员"><AppSelect v-model="remoteSelection" :options="[]" filterable remote clearable :remote-method="queryDirectoryOptions" placeholder="输入姓名或工作区" aria-label="远程选择成员" /></AppFormField>
          <AppFormField label="资源目录"><AppSelect v-model="virtualSelection" :options="largeSelectOptions" filterable virtual clearable placeholder="搜索 2400 条资源" aria-label="虚拟选择资源" /></AppFormField>
        </div>
      </section>
    </template>
    <template v-if="isSectionVisible('forms')">
      <section class="gallery-card form-showcase">
        <header class="showcase-heading"><div><h2>表单组件</h2><p>四列栅格、字段跨列与横向标签适用于高密度信息录入。</p></div><span>可直接复用</span></header>
        <AppForm v-model="formModel" :items="formItems" :columns="4" :gap="24" label-position="inline" label-width="72px" submit-text="保存配置" @submit="submitForm" />
      </section>
      <section class="gallery-grid two-columns form-support-grid">
        <article class="gallery-card selection-showcase"><header class="showcase-heading"><div><h2>层级选择</h2><p>支持搜索、清空和多级数据定位。</p></div></header><div class="field-stack"><AppCascader v-model="cascaderValue" :options="cascaderOptions" filterable clearable aria-label="地区选择" /><AppTreeSelect v-model="treeValue" :options="treeOptions" filterable multiple clearable aria-label="权限选择" /></div></article>
        <article class="gallery-card form-search-showcase"><header class="showcase-heading"><div><h2>动态搜索栏</h2><p>字段与查询操作按同一套表单栅格对齐。</p></div></header><AppSearchBar v-model="searchModel" :items="[{ key: 'keyword', label: '关键词', placeholder: '搜索内容' }, { key: 'status', label: '状态', type: 'select', options: [{ label: '全部', value: '' }, { label: '启用', value: 'enabled' }] }, { key: 'range', label: '时间范围', type: 'daterange' }]" :primary-count="2" v-model:expanded="searchExpanded" @search="searchModel = $event" /></article>
      </section>
    </template>
    <template v-if="isSectionVisible('datetime')">
      <section class="gallery-grid two-columns">
        <article class="gallery-card control-showcase">
          <header class="showcase-heading"><div><h2>日期与时间</h2><p>控件直接输出稳定的 ISO 字符串；时间范围保留 `start` 与 `end`，服务端可无转换接收。</p></div><span>自定义选择器</span></header>
          <div class="date-control-grid">
            <AppFormField label="单个日期" for="example-date"><AppDatePicker id="example-date" v-model="selectedDate" clearable aria-label="选择单个日期" /></AppFormField>
            <AppFormField label="服务时间" for="example-time"><AppTimePicker id="example-time" v-model="selectedTime" clearable aria-label="选择服务时间" /></AppFormField>
            <AppFormField label="服务时段"><AppTimeRangePicker v-model="selectedTimeRange" min="08:00" max="20:00" :step="1800" clearable aria-label="选择服务时段" /></AppFormField>
            <AppFormField label="预约时段" for="example-datetime"><AppDateTimePicker id="example-datetime" v-model="selectedDateTime" clearable aria-label="选择预约日期和时间" /></AppFormField>
            <AppFormField label="有效周期"><AppDateRangePicker v-model="selectedDateRange" compact /></AppFormField>
            <AppFormField label="服务窗口"><AppDateTimeRangePicker v-model="selectedDateTimeRange" min="2026-08-01T08:00" max="2026-08-31T20:00" :step="1800" clearable aria-label="选择服务日期时间范围" /></AppFormField>
          </div>
        </article>
        <article class="gallery-card control-showcase">
          <header class="showcase-heading"><div><h2>滑块</h2><p>轨道、进度与圆点使用统一坐标，支持步长、刻度、数值输入、禁用与键盘微调。</p></div><span>数值录入</span></header>
          <div class="slider-stack">
            <AppSlider v-model="capacity" label="任务容量" :marks="capacityMarks" show-input aria-label="设置任务容量" />
            <AppSlider v-model="reminderMinutes" label="提前提醒" :min="0" :max="60" :step="15" :marks="reminderMarks" aria-label="设置提前提醒时间" />
            <AppSlider v-model="precisionThreshold" label="精细阈值" :min="0" :max="1" :step="0.01" show-input aria-label="设置精细阈值" />
            <AppSlider :model-value="72" label="不可操作的默认配置" disabled aria-label="不可操作的默认配置" />
            <div class="range-geometry-probe">
              <div><strong>轨道几何验证</strong><span>0.00</span><span>0.50</span><span>1.00</span></div>
              <AppRangeControl v-model="rangeGeometryProbe" :min="0" :max="1" :step="0.01" ariaLabel="范围控件轨道几何验证" @change="rangeGeometryMessage = `已提交 ${$event.toFixed(2)}`" />
              <output>{{ rangeGeometryMessage }} · 当前 {{ rangeGeometryProbe.toFixed(2) }}</output>
            </div>
          </div>
        </article>
      </section>
    </template>
    <template v-if="isSectionVisible('data')"><section class="gallery-grid three-columns"><AppStatsCard title="活跃成员" :value="128" trend="+12.6%" detail="较上周" icon="users" tone="success" /><AppProgressCard title="项目完成度" :percentage="72" description="本周交付目标" /><article class="gallery-card metric-card"><h2>数字动效</h2><AppCountTo :value="98234" prefix="¥ " suffix="" :duration="1000" /></article></section><section class="gallery-grid two-columns"><AppLineChartCard title="访问趋势" description="近 7 天访问量" :series="chartSeries" :categories="['周一','周二','周三','周四','周五','周六','周日']" /><AppBarChartCard title="渠道转化" :series="chartSeries" :categories="['官网','搜索','推荐','活动','社群','广告','其他']" /></section><section class="gallery-card pagination-showcase"><header class="showcase-heading"><div><h2>分页器</h2><p>支持页码、跳转、可配置每页数量与向上展开的下拉选项。</p></div></header><AppPagination :page="examplePage" :page-size="examplePageSize" :total="128" @update:page="examplePage = $event" @update:page-size="examplePageSize = $event" /></section></template>
    <template v-if="isSectionVisible('charts')">
      <section class="gallery-grid two-columns">
        <article class="gallery-card chart-showcase">
          <header class="showcase-heading"><div><h2>折线图</h2><p>适合连续时间范围内的趋势和多指标对照。</p></div><span>AppLineChart</span></header>
          <AppLineChart :series="chartSeries" :categories="weeklyChartCategories" :height="286" aria-label="访问趋势折线图" />
        </article>
        <article class="gallery-card chart-showcase">
          <header class="showcase-heading"><div><h2>柱状图</h2><p>用于离散分类的数据量级比较。</p></div><span>AppBarChart</span></header>
          <AppBarChart :series="chartSeries" :categories="weeklyChartCategories" :height="286" aria-label="渠道转化柱状图" />
        </article>
        <article class="gallery-card chart-showcase">
          <header class="showcase-heading"><div><h2>横向柱状图</h2><p>类目名称较长时，横向阅读更自然。</p></div><span>AppHBarChart</span></header>
          <AppHBarChart :series="categoryRankingSeries" :categories="['云数据平台', '智能推荐', '图表引擎', '审批流程', '文件协作']" :height="286" aria-label="产品完成率横向柱状图" />
        </article>
        <article class="gallery-card chart-showcase">
          <header class="showcase-heading"><div><h2>双柱对比图</h2><p>用同一维度快速比较当前与历史表现。</p></div><span>AppDualBarCompareChart</span></header>
          <AppDualBarCompareChart :series="deliveryComparisonSeries" :categories="['产品', '研发', '运营', '交付']" :height="286" aria-label="团队交付双柱对比图" />
        </article>
        <article class="gallery-card chart-showcase">
          <header class="showcase-heading"><div><h2>环形图</h2><p>清晰表达总量构成与各渠道占比。</p></div><span>AppDonutChart</span></header>
          <AppDonutChart :series="channelShareSeries" :categories="['官网', '搜索', '推荐']" :height="286" aria-label="渠道占比环形图" />
        </article>
        <article class="gallery-card chart-showcase">
          <header class="showcase-heading"><div><h2>进度环</h2><p>适合概览单个服务的健康状态。</p></div><span>AppRingChart</span></header>
          <AppRingChart :series="serviceHealthSeries" :categories="['健康', '待处理']" :height="286" aria-label="服务健康进度环" />
        </article>
        <article class="gallery-card chart-showcase">
          <header class="showcase-heading"><div><h2>雷达图</h2><p>在多维能力之间展示当前值与目标值。</p></div><span>AppRadarChart</span></header>
          <AppRadarChart :series="radarEvaluationSeries" :categories="['性能', '稳定性', '安全', '体验', '交付']" :height="286" aria-label="版本能力雷达图" />
        </article>
        <article class="gallery-card chart-showcase">
          <header class="showcase-heading"><div><h2>散点图</h2><p>用于观察采样点与异常波动。</p></div><span>AppScatterChart</span></header>
          <AppScatterChart :series="scatterLatencySeries" :categories="scatterLatencyCategories" :height="286" aria-label="服务响应散点图" />
        </article>
      </section>
      <section class="chart-advanced-showcase"><AppLineChartCard title="近 30 天增长趋势" description="拖动时间窗口查看局部数据，导出保留当前图表与可见范围。" :series="zoomableChartSeries" :categories="zoomableChartCategories" :visible-range="chartVisibleRange" :height="340" zoomable exportable export-file-name="近30天增长趋势" @update:visible-range="chartVisibleRange = $event" @export="confirmChartExport" /><p class="chart-interaction-note" role="status">{{ chartExportStatus }}</p></section>
      <section class="chart-advanced-showcase"><AppLineChartCard title="2,400 点趋势" description="保留局部峰谷并限制实际 SVG 绘制、标签和键盘焦点数量。" :series="largeChartSeries" :categories="largeChartCategories" :visible-range="largeChartVisibleRange" :height="340" :max-rendered-points="96" :max-axis-labels="8" zoomable @update:visible-range="largeChartVisibleRange = $event" /><p class="chart-interaction-note">当前案例传入 2,400 个分类点，绘制上限为 96；当时间窗口小于该上限时，组件会自动渲染窗口内的完整数据。</p></section>
      <section class="gallery-grid two-columns">
        <article class="gallery-card chart-showcase">
          <header class="showcase-heading"><div><h2>通用图表基座</h2><p>通过 type、序列与类目直接组合图表；缩放和导出能力无需在业务页面重复实现。</p></div><span>AppChart</span></header>
          <AppChart type="line" :series="zoomableChartSeries" :categories="zoomableChartCategories" :height="300" zoomable exportable export-file-name="通用图表基座" aria-label="通用图表基座" @export="confirmChartExport" />
        </article>
        <AppChartCard title="通用卡片包装器" description="卡片标题、描述、工具区和图表内容保持统一布局。" type="bar" :series="chartSeries" :categories="weeklyChartCategories" :height="300" />
      </section>
      <section class="chart-advanced-showcase"><AppDonutChartCard title="卡片化渠道占比" description="环形图同样支持通用卡片标题、说明与后续操作插槽。" :series="channelShareSeries" :categories="['官网', '搜索', '推荐']" :height="300" /></section>
      <section class="gallery-grid two-columns">
        <article class="gallery-card chart-showcase chart-reserved-showcase">
          <header class="showcase-heading"><div><h2>K 线图</h2><p>预留入口已展示；启用前需要约定 OHLC 数据结构。</p></div><span>AppKLineChart</span></header>
          <AppKLineChart :series="chartSeries" :categories="weeklyChartCategories" :height="220" aria-label="K线图预留能力" />
        </article>
        <article class="gallery-card chart-showcase chart-reserved-showcase">
          <header class="showcase-heading"><div><h2>地图图表</h2><p>预留入口已展示；业务层注册 GeoJSON 后即可启用。</p></div><span>AppMapChart</span></header>
          <AppMapChart :series="chartSeries" :categories="weeklyChartCategories" :height="220" aria-label="地图图表预留能力" />
        </article>
      </section>
    </template>
    <template v-if="isSectionVisible('charts')">
      <section class="gallery-card chart-boundary-showcase">
        <header class="showcase-heading"><div><h2>图表数据边界</h2><p>空数据不生成伪图形；极大值、负值与非有限值不会产生无效 SVG 坐标。</p></div><AppSegmented v-model="chartBoundaryMode" :options="chartBoundaryOptions" size="small" aria-label="切换图表数据边界案例" /></header>
        <AppLineChart :series="chartBoundarySeries" :categories="chartBoundaryCategories" :height="300" empty-text="当前条件下暂无可展示数据" aria-label="图表数据边界案例" />
        <p class="chart-interaction-note">极值案例保留正常数据点，非有限值会被跳过并形成断点；窄屏会自动减少横轴标签数量。</p>
      </section>
    </template>
    <template v-if="isSectionVisible('navigation')">
      <section class="gallery-grid two-columns">
        <article id="anchor-navigation-path" class="gallery-card control-showcase">
          <header class="showcase-heading"><div><h2>路径与页签</h2><p>页签支持线条、卡片与边框卡片形态，且可组合纵向位置、离开拦截、动态新增、关闭与受控面板。</p></div></header>
          <div class="navigation-stack"><AppBreadcrumb :items="[{ label: '工作台' }, { label: '组件示例' }, { label: '导航与页签' }]" /><div class="demo-tab-controls"><AppSegmented v-model="demoTabType" :options="demoTabTypeOptions" size="small" aria-label="页签形态" /><AppSegmented v-model="demoTabPosition" :options="demoTabPositionOptions" size="small" aria-label="页签位置" /><AppSwitch v-model="demoTabDirty" label="设置未保存" /></div><AppTabs v-model="activeDemoTab" :items="demoTabs" :type="demoTabType" :position="demoTabPosition" addable show-panels aria-label="示例页签" :before-leave="guardDemoTabLeave" @change="updateDemoTabStatus($event)" @close="closeDemoTab" @tab-add="addDemoTab" @before-leave-rejected="reportDemoTabLeaveRejected" /><output class="navigation-tab-status" aria-live="polite">{{ demoTabStatus }}</output></div>
        </article>
        <article id="anchor-navigation-pagination" class="gallery-card control-showcase">
          <header class="showcase-heading"><div><h2>分页导航</h2><p>页码和每页数量保持可键盘访问。</p></div></header>
          <AppPagination :page="examplePage" :page-size="examplePageSize" :total="128" @update:page="examplePage = $event" @update:page-size="examplePageSize = $event" />
        </article>
      </section>
      <section id="anchor-navigation-menu" class="gallery-card control-showcase">
        <header class="showcase-heading"><div><h2>水平菜单</h2><p>二级菜单由组件维护展开状态，支持外部点击与 Esc 关闭。</p></div><span>受控浮层</span></header>
        <AppHorizontalMenu :items="horizontalMenuItems" active-path="/examples/navigation" />
        <p id="anchor-navigation-menu-sub" class="navigation-anchor-note">二级菜单展开后仍保持同一组图标、焦点和选中态。</p>
      </section>
      <section ref="navigationAnchorSection" class="gallery-card control-showcase anchor-showcase" aria-label="锚点导航案例">
        <header class="showcase-heading"><div><h2>页面锚点</h2><p>锚点支持嵌套层级、滚动容器、偏移量和滚动时自动高亮。</p></div><span>新增组件</span></header>
        <div class="anchor-demo-layout">
          <AppAnchor v-model="activeAnchorKey" :items="anchorItems" :scroll-container="anchorScrollContainer" :offset="16" aria-label="导航示例锚点" />
          <div class="anchor-demo-copy">
            <section><h3>路径定位</h3><p>点击左侧条目会把当前内容滚动到可视区域，并保留浏览器原生链接语义。</p></section>
            <section><h3>层级状态</h3><p>滚动经过不同内容块时，当前锚点会根据 IntersectionObserver 自动更新。</p></section>
            <section><h3>业务接入</h3><p>组件只依赖目标 id 和滚动容器，不绑定路由或业务数据，适合设置页、长表单和文档页。</p></section>
          </div>
        </div>
      </section>
      <section class="gallery-card control-showcase affix-showcase" aria-label="吸顶组件案例">
        <header class="showcase-heading"><div><h2>吸顶工具栏</h2><p>吸顶组件复用当前页面滚动容器，进入临界位置后保留操作入口，并通过事件同步状态。</p></div><div class="showcase-heading-actions"><span>{{ affixStatus }}</span><span>{{ tourStatus }}</span><AppButton variant="secondary" size="small" @click="startTour">开始引导</AppButton></div></header>
        <AppAffix :target="anchorScrollContainer" :offset="12" aria-label="示例操作工具栏" @stuck-change="updateAffixStatus">
          <div id="tour-affix-toolbar" class="affix-demo-bar"><strong>批量操作</strong><span>滚动页面查看吸顶效果</span><button type="button">保存视图</button></div>
        </AppAffix>
        <div class="affix-demo-content"><p v-for="index in 12" :key="index">示例内容 {{ index }}：工具栏在长页面、筛选结果和报表操作中保持可见，但不会改变业务数据或滚动容器的所有权。</p></div>
      </section>
      <AppTour v-model="isTourOpen" v-model:step-index="activeTourIndex" :steps="tourSteps" :offset="12" @finish="finishTour" @skip="skipTour" />
    </template>
    <template v-if="isSectionVisible('overlay')"><section class="gallery-card control-showcase"><header class="showcase-heading"><div><h2>弹窗与浮层</h2><p>打开、关闭、Esc 和点击遮罩等行为由组件统一管理。</p></div><span>{{ selectedOverlayAction }}</span></header><div class="overlay-trigger-row"><AppButton @click="isDialogOpen = true">打开对话框</AppButton><AppButton variant="secondary" @click="isDrawerOpen = true">打开抽屉</AppButton><AppPopover v-model="isPopoverOpen" label="信息浮层"><template #trigger="{ toggle }"><AppButton variant="ghost" @click="toggle">查看说明</AppButton></template><p class="popover-copy">浮层关闭不会影响页面当前表单或筛选状态。</p></AppPopover><AppDropdown v-model="isDropdownOpen" :items="overlayMenuItems" menu-label="示例操作" @select="selectedOverlayAction = $event"><template #trigger="{ toggle }"><AppButton variant="ghost" trailing-icon="chevron-down" @click="toggle">更多操作</AppButton></template></AppDropdown><AppPopconfirm v-model="isPopconfirmOpen" title="移除过期草稿？" description="草稿内容将无法恢复，请确认不再需要。" confirm-text="确认移除" danger :is-confirming="isPopconfirmSubmitting" @confirm="confirmDraftRemoval" @cancel="selectedOverlayAction = '已取消移除草稿'"><template #trigger="{ toggle }"><AppButton variant="ghost" @click="toggle">移除草稿</AppButton></template></AppPopconfirm></div></section><AppDialog v-model="isDialogOpen" title="确认保存配置？" description="保存后会立即应用到当前工作区。"><p class="dialog-copy">对话框用于需要明确确认的关键操作。</p><template #footer><AppButton variant="secondary" @click="isDialogOpen = false">取消</AppButton><AppButton @click="isDialogOpen = false">确认保存</AppButton></template></AppDialog><AppDrawer v-model="isDrawerOpen" title="配置详情" description="抽屉适合承载不打断主任务的补充内容。"><div class="drawer-copy"><strong>当前配置</strong><p>已启用默认安全策略与操作记录。</p></div></AppDrawer></template>
    <template v-if="isSectionVisible('feedback')"><section class="gallery-grid two-columns"><article class="gallery-card"><h2>反馈状态</h2><div class="feedback-stack"><AppAlert v-if="showSuccessAlert" title="操作成功" description="配置已经保存并同步到当前工作区。" tone="success" closable @close="showSuccessAlert = false" /><AppAlert title="需要注意" description="还有 2 个字段没有完成校验。" tone="warning" /><AppProgress :percentage="64" label="同步进度" status="normal" /></div></article><article class="gallery-card notification-demo"><h2>通知中心</h2><p>通过触发器查看未读状态、单条已读与批量处理。</p><AppNotification v-model="isNotificationOpen" :items="notifications" @read="readNotification" @read-all="resetNotifications" /><AppButton variant="secondary" size="small" @click="chatOpen = true">打开聊天</AppButton></article><article class="gallery-card control-showcase"><header class="showcase-heading"><div><h2>拖动验证</h2><p>拖动、触控与左右方向键都由组件统一处理。</p></div><span>可访问</span></header><AppDragVerify v-model="isDragVerified" /></article></section></template>
    <template v-if="isSectionVisible('content')"><section class="gallery-grid two-columns"><article class="gallery-card content-card"><h2>上传与富文本</h2><AppUpload v-model="uploadFiles" accept=".png,.jpg,.pdf" :request="uploadRequest" /><AppRichTextEditor v-model="richText" :min-height="120" /></article><article class="gallery-card content-card"><h2>图片裁剪</h2><AppImageCropper aspect="4 / 3" @crop="showCroppedImage" /><img v-if="croppedImage" class="cropped-preview" :src="croppedImage" alt="裁剪后的图片预览" /></article></section><section class="gallery-grid two-columns"><article class="gallery-card content-card"><header class="showcase-heading"><div><h2>视频播放器</h2><p>播放、进度、音量与全屏均由组件统一控制。</p></div><span>自定义控件</span></header><AppVideoPlayer src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" title="产品能力演示" /></article><article class="gallery-card content-card"><h2>水印预览</h2><div class="watermark-stage"><span>内容工作区</span><AppWatermark text="aps-design-pro" :rows="4" :columns="3" :fixed="false" /></div></article><article class="gallery-card content-card"><header class="showcase-heading"><div><h2>评论输入</h2><p>评论复用统一的多行输入组件和提交状态。</p></div><span>内容交互</span></header><AppCommentWidget v-model="comments" /></article></section></template>
    <AppChatWindow v-model="chatOpen" :messages="chatMessages" @send="sendMessage" />
  </div>
</template>

<style scoped>
.component-gallery { display: grid; gap: 28px; }.example-index { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--aps-page-stack-gap); }.example-entry { display: grid; min-height: 180px; align-content: start; gap: 9px; padding: 24px; border: 1px solid var(--aps-line-soft); border-radius: var(--aps-radius-card); background: var(--aps-surface); color: var(--aps-ink); text-decoration: none; transition: border-color 180ms ease, background-color 180ms ease, transform 180ms ease; }.example-entry:hover { border-color: var(--aps-line); background: var(--aps-surface-soft); transform: translateY(-1px); }.example-entry span { color: var(--aps-faint); font-size: var(--aps-text-xs); font-weight: var(--aps-font-weight-primary); }.example-entry strong { font-size: var(--aps-text-lg); font-weight: var(--aps-font-weight-heading); }.example-entry p { max-width: 28ch; margin: 0; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.example-entry em { margin-top: auto; color: var(--aps-blue); font-size: var(--aps-text-sm); font-style: normal; font-weight: var(--aps-font-weight-primary); }.gallery-grid { display: grid; gap: 28px; }.two-columns { grid-template-columns: repeat(2, minmax(0, 1fr)); }.three-columns { grid-template-columns: repeat(3, minmax(0, 1fr)); }.gallery-card { min-width: 0; padding: var(--aps-card-padding); border: 1px solid var(--aps-line-soft); border-radius: var(--aps-radius-card); background: var(--aps-surface); }.gallery-card h2 { margin: 0; color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: var(--aps-font-weight-heading); }.showcase-heading { display: flex; align-items: start; justify-content: space-between; gap: 20px; }.showcase-heading p { margin: 7px 0 0; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.showcase-heading > span { flex: 0 0 auto; padding: 4px 8px; border-radius: 6px; background: var(--aps-surface-soft); color: var(--aps-faint); font-size: var(--aps-text-xs); font-weight: var(--aps-font-weight-primary); }.form-showcase { display: grid; gap: 32px; padding: 32px 36px; }.form-support-grid { align-items: start; }.selection-showcase, .form-search-showcase, .control-showcase, .content-card { display: grid; gap: 22px; }.form-search-showcase { min-width: 0; }.form-search-showcase :deep(.app-search-bar) { padding: 0; border: 0; border-radius: 0; background: transparent; }.field-stack, .feedback-stack, .slider-stack, .selection-stack { display: grid; gap: 16px; }.date-control-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 24px; }.metric-card { display: grid; align-content: center; }.metric-card .app-count-to { color: var(--aps-ink); font-size: 32px; font-weight: var(--aps-font-weight-heading); }.notification-demo { display: grid; align-content: start; grid-template-columns: minmax(0, 1fr) auto; gap: 14px; }.notification-demo h2, .notification-demo p { grid-column: 1 / -1; }.notification-demo p { margin: -8px 0 0; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.watermark-stage { display: grid; position: relative; min-height: 180px; place-items: center; overflow: hidden; border-radius: 10px; background: var(--aps-surface-soft); color: var(--aps-muted); }.watermark-stage > span { position: relative; z-index: 1; }@media (max-width: 900px) { .example-index, .two-columns, .three-columns, .date-control-grid { grid-template-columns: 1fr; }.form-showcase { padding: 28px 24px; } }.component-gallery :deep(.app-form) { gap: 24px; }
.base-control-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 24px; }.choice-stack, .navigation-stack { display: grid; align-content: end; gap: 14px; }.demo-tab-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }.navigation-tab-status { min-height: 20px; color: var(--aps-muted); font-size: var(--aps-text-xs); line-height: 1.5; }.button-row, .overlay-trigger-row { display: flex; flex-wrap: wrap; gap: 10px; }.button-demo-status { min-height: 18px; margin: 0; color: var(--aps-faint); font-size: var(--aps-text-xs); }.pagination-showcase { padding-bottom: 0; overflow: visible; }.chart-showcase { display: grid; min-height: 300px; grid-template-rows: auto minmax(0, 1fr); gap: 18px; }.popover-copy, .dialog-copy, .drawer-copy p { margin: 0; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.popover-copy { width: 220px; padding: 14px; }.dialog-copy { padding: 2px 0; }.drawer-copy { display: grid; gap: 6px; }.drawer-copy strong { color: var(--aps-ink); font-size: var(--aps-text-base); }@media (max-width: 900px) { .base-control-grid { grid-template-columns: 1fr; } }
.cropped-preview { width: 100%; max-height: 220px; object-fit: cover; border: 1px solid var(--aps-line-soft); border-radius: 10px; }
.range-geometry-probe { display: grid; gap: 8px; padding: 12px; border: 1px solid var(--aps-line-soft); border-radius: 10px; background: var(--aps-surface-soft); }.range-geometry-probe > div { display: grid; grid-template-columns: 1fr repeat(3, auto); align-items: center; gap: 10px; color: var(--aps-faint); font-size: var(--aps-text-xs); }.range-geometry-probe strong { color: var(--aps-muted); font-size: var(--aps-text-sm); }.range-geometry-probe output { color: var(--aps-muted); font-size: var(--aps-text-xs); }
.advanced-selection-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 24px; }
.chart-advanced-showcase, .chart-boundary-showcase { display: grid; gap: 10px; }.chart-boundary-showcase { gap: 18px; }.chart-interaction-note { margin: 0; padding: 0 4px; color: var(--aps-muted); font-size: var(--aps-text-xs); line-height: 1.5; }
.primitive-stack { display: grid; gap: 18px; }.switch-showcase { gap: 18px; }.switch-demo-grid { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 24px; }.switch-demo-status { min-height: 19px; margin: 0; padding-top: 13px; border-top: 1px solid var(--aps-line-soft); color: var(--aps-muted); font-size: var(--aps-text-sm); }.config-provider-showcase { gap: 18px; }.config-provider-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }.config-provider-preview { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; padding: 16px; border: 1px solid var(--aps-line-soft); border-radius: 10px; background: var(--aps-surface-soft); }.config-preview-field { display: grid; min-width: 0; gap: 6px; color: var(--aps-muted); font-size: var(--aps-text-xs); font-weight: var(--aps-font-weight-primary); }.config-preview-field.is-wide, .config-provider-actions.is-wide { grid-column: 1 / -1; }.config-preview-choice { align-content: start; grid-template-columns: repeat(2, minmax(0, max-content)); align-items: center; column-gap: 16px; row-gap: 8px; }.config-preview-choice > span { grid-column: 1 / -1; }.config-provider-actions { display: flex; flex-wrap: wrap; gap: 10px; }.config-provider-status { margin: 0; color: var(--aps-faint); font-size: var(--aps-text-xs); }@media (max-width: 640px) { .config-provider-preview { grid-template-columns: 1fr; }.config-preview-field.is-wide, .config-provider-actions.is-wide { grid-column: auto; } }
.primitive-muted { color: var(--aps-muted); font-size: var(--aps-text-sm); }
.anchor-showcase { min-width: 0; }.anchor-demo-layout { display: grid; grid-template-columns: minmax(150px, .34fr) minmax(0, 1fr); gap: 28px; align-items: start; }.anchor-demo-copy { display: grid; gap: 16px; }.anchor-demo-copy section { min-height: 104px; padding: 16px; border: 1px solid var(--aps-line-soft); border-radius: 10px; background: var(--aps-surface-soft); scroll-margin-top: 16px; }.anchor-demo-copy h3, .anchor-demo-copy p { margin: 0; }.anchor-demo-copy h3 { color: var(--aps-ink); font-size: var(--aps-text-base); font-weight: var(--aps-font-weight-heading); }.anchor-demo-copy p { margin-top: 7px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }.navigation-anchor-note { margin: 0; padding-top: 12px; border-top: 1px solid var(--aps-line-soft); color: var(--aps-muted); font-size: var(--aps-text-sm); }
.affix-showcase { min-width: 0; }.showcase-heading-actions { display: inline-flex; align-items: center; gap: 10px; }.affix-demo-bar { display: flex; min-height: 48px; align-items: center; gap: 14px; padding: 8px 12px; border: 1px solid var(--aps-line); border-radius: 10px; background: var(--aps-surface); }.affix-demo-bar strong { color: var(--aps-ink); font-size: var(--aps-text-sm); }.affix-demo-bar span { min-width: 0; flex: 1; overflow: hidden; color: var(--aps-faint); font-size: var(--aps-text-xs); text-overflow: ellipsis; white-space: nowrap; }.affix-demo-bar button { min-height: 30px; padding: 0 10px; border: 1px solid var(--aps-line); border-radius: 7px; background: var(--aps-surface-soft); color: var(--aps-ink); font: inherit; font-size: var(--aps-text-xs); font-weight: var(--aps-font-weight-primary); }.affix-demo-bar button:hover { border-color: var(--aps-blue); color: var(--aps-blue); }.affix-demo-content { display: grid; gap: 8px; margin-top: 12px; }.affix-demo-content p { margin: 0; padding: 13px 14px; border: 1px solid var(--aps-line-soft); border-radius: 9px; background: var(--aps-surface-soft); color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.55; }
@media (max-width: 900px) { .advanced-selection-grid { grid-template-columns: 1fr; } }
@media (max-width: 680px) { .anchor-demo-layout { grid-template-columns: 1fr; }.anchor-showcase :deep(.app-anchor) { position: static; }.anchor-showcase :deep(.anchor-list) { display: flex; overflow-x: auto; border-top: 1px solid var(--aps-line); border-left: 0; }.anchor-showcase :deep(.anchor-link) { flex: 0 0 auto; border-radius: 8px 8px 0 0; }.anchor-showcase :deep(.anchor-link::before) { top: auto; right: 0; bottom: -1px; left: 0; width: auto; height: 2px; } }
</style>
