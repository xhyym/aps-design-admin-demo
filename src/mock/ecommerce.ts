import type {
  CampaignRecord,
  InventoryRecord,
  MemberRecord,
  OperationsDashboardData,
  ProductRecord,
  RefundRecord,
} from "@/types/ecommerce";

/**
 * 电商演示数据只用于前端能力验证，不对应真实订单、商品或会员资料。
 * 数据刻意覆盖低库存、售后审核、沉默会员等运营边界，便于页面展示状态处理。
 */
export const products: ProductRecord[] = [
  { id: "product-001", name: "云岚手冲咖啡礼盒", sku: "COF-GIFT-001", category: "咖啡器具", price: 269, stock: 186, sales: 1482, status: "on_sale", updatedAt: "今天 10:32", coverTone: "blue" },
  { id: "product-002", name: "山野冷萃咖啡液 12 瓶", sku: "COF-COLD-012", category: "即饮咖啡", price: 128, stock: 42, sales: 2693, status: "on_sale", updatedAt: "今天 09:18", coverTone: "green" },
  { id: "product-003", name: "曜石手冲壶 600ml", sku: "BREW-KETTLE-600", category: "咖啡器具", price: 319, stock: 18, sales: 729, status: "on_sale", updatedAt: "昨天 18:20", coverTone: "graphite" },
  { id: "product-004", name: "深烘拼配挂耳咖啡 20 包", sku: "COF-DRIP-020", category: "咖啡豆", price: 96, stock: 0, sales: 3811, status: "on_sale", updatedAt: "昨天 15:08", coverTone: "orange" },
  { id: "product-005", name: "春日限定品鉴套装", sku: "COF-SPRING-BOX", category: "礼盒", price: 199, stock: 88, sales: 356, status: "draft", updatedAt: "2026-08-01 16:40", coverTone: "purple" },
  { id: "product-006", name: "旅行随行保温杯", sku: "LIFE-MUG-450", category: "生活方式", price: 159, stock: 214, sales: 941, status: "on_sale", updatedAt: "2026-07-31 11:22", coverTone: "blue" },
  { id: "product-007", name: "埃塞俄比亚日晒豆 250g", sku: "BEAN-ETH-250", category: "咖啡豆", price: 109, stock: 23, sales: 1183, status: "on_sale", updatedAt: "2026-07-30 17:56", coverTone: "orange" },
  { id: "product-008", name: "木质滤杯与滤纸套装", sku: "BREW-DRIPPER-01", category: "咖啡器具", price: 149, stock: 67, sales: 516, status: "archived", updatedAt: "2026-07-28 14:10", coverTone: "graphite" },
];

export const refunds: RefundRecord[] = [
  { id: "refund-001", refundNo: "RF-20260803-0008", orderNo: "SO-20260803-0318", memberName: "陈一然", reason: "商品破损", amount: 128, status: "pending", requestedAt: "今天 10:26" },
  { id: "refund-002", refundNo: "RF-20260803-0007", orderNo: "SO-20260803-0309", memberName: "周予安", reason: "发货超时", amount: 269, status: "reviewing", requestedAt: "今天 09:42" },
  { id: "refund-003", refundNo: "RF-20260802-0015", orderNo: "SO-20260802-0286", memberName: "宋知夏", reason: "少件漏发", amount: 96, status: "approved", requestedAt: "昨天 16:11" },
  { id: "refund-004", refundNo: "RF-20260802-0011", orderNo: "SO-20260802-0268", memberName: "许言", reason: "不喜欢", amount: 159, status: "completed", requestedAt: "昨天 11:25" },
  { id: "refund-005", refundNo: "RF-20260801-0029", orderNo: "SO-20260801-0211", memberName: "姜澄", reason: "已拆封使用", amount: 319, status: "rejected", requestedAt: "2026-08-01 17:06" },
];

export const members: MemberRecord[] = [
  { id: "member-001", name: "陈一然", phone: "138****4206", level: "黑金会员", tags: ["高复购", "咖啡器具"], totalSpent: 12860, orderCount: 38, lastOrderAt: "今天 10:08", status: "normal" },
  { id: "member-002", name: "周予安", phone: "156****8301", level: "铂金会员", tags: ["售后跟进", "企业团购"], totalSpent: 7650, orderCount: 19, lastOrderAt: "今天 09:21", status: "risk" },
  { id: "member-003", name: "宋知夏", phone: "188****0938", level: "黄金会员", tags: ["礼盒偏好"], totalSpent: 4260, orderCount: 12, lastOrderAt: "昨天 18:32", status: "normal" },
  { id: "member-004", name: "李明澈", phone: "139****6005", level: "黄金会员", tags: ["沉默唤醒"], totalSpent: 3588, orderCount: 9, lastOrderAt: "2026-06-11 14:16", status: "silent" },
  { id: "member-005", name: "林言", phone: "186****7410", level: "普通会员", tags: ["冷萃偏好"], totalSpent: 896, orderCount: 4, lastOrderAt: "2026-07-30 10:42", status: "normal" },
  { id: "member-006", name: "安禾", phone: "133****2157", level: "铂金会员", tags: ["新品尝鲜", "内容社群"], totalSpent: 6840, orderCount: 16, lastOrderAt: "2026-07-29 20:10", status: "normal" },
];

export const campaigns: CampaignRecord[] = [
  { id: "campaign-001", name: "盛夏冷萃周", type: "限时折扣", status: "running", period: "08-01 至 08-07", target: "冷萃咖啡液", progress: 68, revenue: 84260 },
  { id: "campaign-002", name: "新客首单礼", type: "优惠券", status: "running", period: "07-15 至 08-31", target: "全部商品", progress: 54, revenue: 126480 },
  { id: "campaign-003", name: "会员日满减", type: "满减", status: "scheduled", period: "08-08 至 08-10", target: "会员用户", progress: 0, revenue: 0 },
  { id: "campaign-004", name: "春日礼盒清仓", type: "会员专享", status: "ended", period: "07-20 至 07-31", target: "礼盒品类", progress: 100, revenue: 45720 },
];

export const inventories: InventoryRecord[] = [
  { id: "stock-001", sku: "COF-GIFT-001", productName: "云岚手冲咖啡礼盒", warehouse: "杭州主仓", available: 186, locked: 14, safetyStock: 60, status: "healthy", updatedAt: "今天 10:31" },
  { id: "stock-002", sku: "COF-COLD-012", productName: "山野冷萃咖啡液 12 瓶", warehouse: "杭州主仓", available: 42, locked: 18, safetyStock: 45, status: "warning", updatedAt: "今天 10:18" },
  { id: "stock-003", sku: "BREW-KETTLE-600", productName: "曜石手冲壶 600ml", warehouse: "上海前置仓", available: 18, locked: 6, safetyStock: 30, status: "critical", updatedAt: "今天 09:56" },
  { id: "stock-004", sku: "COF-DRIP-020", productName: "深烘拼配挂耳咖啡 20 包", warehouse: "杭州主仓", available: 0, locked: 0, safetyStock: 80, status: "critical", updatedAt: "今天 09:40" },
  { id: "stock-005", sku: "LIFE-MUG-450", productName: "旅行随行保温杯", warehouse: "广州区域仓", available: 214, locked: 9, safetyStock: 50, status: "healthy", updatedAt: "昨天 18:28" },
  { id: "stock-006", sku: "BEAN-ETH-250", productName: "埃塞俄比亚日晒豆 250g", warehouse: "上海前置仓", available: 23, locked: 12, safetyStock: 35, status: "warning", updatedAt: "昨天 17:40" },
];

export const operationsDashboard: OperationsDashboardData = {
  updatedAt: "今天 10:32",
  metrics: [
    { label: "今日成交额", value: "¥ 86,420", detail: "较昨日同期", trend: "+12.6%", tone: "success", icon: "chart" },
    { label: "待发货订单", value: "128", detail: "其中超时风险", trend: "6 单", tone: "warning", icon: "grid" },
    { label: "新增会员", value: "346", detail: "新客转化率", trend: "18.4%", tone: "info", icon: "users" },
    { label: "库存预警", value: "4", detail: "需要补货 SKU", trend: "立即处理", tone: "danger", icon: "warning" },
  ],
  todos: [
    { id: "todo-001", title: "4 个 SKU 低于安全库存", description: "挂耳咖啡已售罄，冷萃和手冲壶将在本周耗尽。", actionLabel: "查看库存", path: "/inventory/overview", tone: "danger" },
    { id: "todo-002", title: "2 笔退款等待审核", description: "包含一笔商品破损退款，请在 24 小时内完成处理。", actionLabel: "处理售后", path: "/after-sales/refunds", tone: "warning" },
    { id: "todo-003", title: "会员日活动尚未发布", description: "活动将于 8 月 8 日开启，建议今日完成券包与商品校验。", actionLabel: "前往营销", path: "/marketing/campaigns", tone: "info" },
  ],
  salesCategories: ["7/28", "7/29", "7/30", "7/31", "8/01", "8/02", "8/03"],
  salesSeries: [{ name: "成交额", data: [61200, 68540, 59420, 73860, 92140, 76780, 86420] }, { name: "目标", data: [60000, 60000, 60000, 70000, 80000, 80000, 80000] }],
  channelCategories: ["官网商城", "小程序", "内容社群", "企业团购"],
  channelSeries: [{ name: "成交额", data: [28640, 24780, 18920, 14080] }],
  recentOrders: [
    { id: "order-001", orderNo: "SO-20260803-0318", memberName: "陈一然", amount: 128, status: "待发货", createdAt: "10:08" },
    { id: "order-002", orderNo: "SO-20260803-0317", memberName: "安禾", amount: 269, status: "待发货", createdAt: "09:52" },
    { id: "order-003", orderNo: "SO-20260803-0316", memberName: "叶晴", amount: 438, status: "配送中", createdAt: "09:47" },
    { id: "order-004", orderNo: "SO-20260803-0315", memberName: "林言", amount: 96, status: "已完成", createdAt: "09:31" },
  ],
};
