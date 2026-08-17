<script setup lang="ts">
import { computed, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppCalendarPanel } from "aps-design-pro";
import { AppDatePicker } from "aps-design-pro";
import { AppDateRangePicker } from "aps-design-pro";
import { AppCalendar } from "aps-design-pro";
import { AppSegmented } from "aps-design-pro";
import { AppTimePanel } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import type { DatePickerPanelType, DatePickerPanelValue } from "aps-design-pro";
import type { DateRangePickerType } from "aps-design-pro";
import type { DatePickerShortcut, DateRangePickerShortcut, SelectOption } from "aps-design-pro";

const selectedDate = ref("2026-08-12");
const selectedMilestoneDate = ref("2026-08-17");
const selectedInlineDate = ref("2026-08-17");
const selectedInlineTime = ref("10:30");
const rangeValue = ref({ start: "2026-08-04", end: "2026-08-18" });
const periodRangeType = ref<DateRangePickerType>("monthrange");
const periodRangeValue = ref({ start: "2026-03", end: "2026-09" });
const latestAction = ref("等待选择日期");
const extendedPickerType = ref<DatePickerPanelType>("date");
const extendedPickerValue = ref<DatePickerPanelValue>("2026-08-17");
const dateRangeLabel = computed(() => `${rangeValue.value.start || "未设置"} 至 ${rangeValue.value.end || "未设置"}`);
const periodRangeLabel = computed(() => `${periodRangeValue.value.start || "未设置"} 至 ${periodRangeValue.value.end || "未设置"}`);
const extendedPickerLabel = computed(() => {
  if (Array.isArray(extendedPickerValue.value)) return extendedPickerValue.value.length ? extendedPickerValue.value.join("、") : "暂未选择";
  return extendedPickerValue.value || "暂未选择";
});
const extendedPickerOptions: SelectOption[] = [
  { label: "日期", value: "date" },
  { label: "多日期", value: "dates" },
  { label: "月份", value: "month" },
  { label: "多月份", value: "months" },
  { label: "年份", value: "year" },
  { label: "多年份", value: "years" },
  { label: "周", value: "week" },
];
const periodRangeOptions: SelectOption[] = [
  { label: "月份范围", value: "monthrange" },
  { label: "年份范围", value: "yearrange" },
];
const milestoneShortcuts: DatePickerShortcut[] = [
  { label: "方案评审", value: "2026-08-06" },
  { label: "中期验收", value: "2026-08-17" },
  { label: "交付检查", value: "2026-08-27" },
];
const rangeShortcuts: DateRangePickerShortcut[] = [
  { label: "第一周", value: { start: "2026-08-03", end: "2026-08-09" } },
  { label: "第二周", value: { start: "2026-08-11", end: "2026-08-16" } },
  { label: "全月周期", value: { start: "2026-08-01", end: "2026-08-31" } },
];

function recordDateChange(value: DatePickerPanelValue): void {
  if (Array.isArray(value)) {
    latestAction.value = value.length ? `已选择 ${value.length} 个日期` : "已清除日期";
    return;
  }
  latestAction.value = value ? `已选择 ${value}` : "已清除日期";
}

/** 排期锁定日由业务规则提供，选择器只负责在面板和快捷项中保持一致。 */
function isMilestoneDateBlocked(value: string): boolean {
  return value === "2026-08-10" || value === "2026-08-19";
}

function resetCalendar(): void {
  selectedDate.value = "2026-08-12";
  selectedMilestoneDate.value = "2026-08-17";
  selectedInlineDate.value = "2026-08-17";
  selectedInlineTime.value = "10:30";
  rangeValue.value = { start: "2026-08-04", end: "2026-08-18" };
  periodRangeType.value = "monthrange";
  periodRangeValue.value = { start: "2026-03", end: "2026-09" };
  extendedPickerType.value = "date";
  extendedPickerValue.value = "2026-08-17";
  latestAction.value = "已恢复示例日期";
}

function isExtendedPickerType(value: string): value is DatePickerPanelType {
  return value === "date" || value === "dates" || value === "month" || value === "months" || value === "year" || value === "years" || value === "week";
}

/** 切换模式时同步成符合该模式的数据结构，避免业务页持有不合法的历史选择值。 */
function updateExtendedPickerType(value: string): void {
  if (!isExtendedPickerType(value)) return;
  extendedPickerType.value = value;
  if (value === "dates") extendedPickerValue.value = ["2026-08-06", "2026-08-17"];
  else if (value === "month") extendedPickerValue.value = "2026-08";
  else if (value === "months") extendedPickerValue.value = ["2026-03", "2026-08", "2026-11"];
  else if (value === "year") extendedPickerValue.value = "2026";
  else if (value === "years") extendedPickerValue.value = ["2022", "2024", "2026"];
  else if (value === "week") extendedPickerValue.value = "2026-W33";
  else extendedPickerValue.value = "2026-08-17";
}

/** 范围粒度切换后同步合法值，示例可直接验收跨月和跨年的第二次选择。 */
function updatePeriodRangeType(value: string): void {
  if (value !== "monthrange" && value !== "yearrange") return;
  periodRangeType.value = value;
  periodRangeValue.value = value === "monthrange" ? { start: "2026-03", end: "2026-09" } : { start: "2022", end: "2026" };
}
</script>

<template>
  <section class="calendar-page page-content page-stack" aria-label="日历组件示例">
    <header class="calendar-page-heading">
      <div>
        <h1>日历</h1>
        <p>独立日历适合排期、预约和工作台场景；日期输入与范围选择仍可按需复用同一套日期值。</p>
      </div>
      <AppButton variant="secondary" leading-icon="refresh" @click="resetCalendar">恢复示例</AppButton>
    </header>

    <div class="calendar-demo-grid">
      <AppCard as="article" padding="large" class="calendar-demo-card">
        <header class="demo-card-heading"><div><h2>单日期选择</h2><p>支持最小值、最大值、今天和清除操作。</p></div><span>受控值</span></header>
        <AppCalendar v-model="selectedDate" min="2026-01-01" max="2026-12-31" aria-label="排期日期" @change="recordDateChange" />
        <output class="calendar-status" aria-live="polite">{{ latestAction }}</output>
      </AppCard>

      <AppCard as="article" padding="large" class="calendar-demo-card">
        <header class="demo-card-heading"><div><h2>月度与年度范围</h2><p>AppDateRangePicker 按粒度切换，不改变起止值的数据结构与范围选择流程。</p></div><span>能力升级</span></header>
        <AppSegmented :model-value="periodRangeType" :options="periodRangeOptions" size="small" aria-label="选择范围粒度" @update:model-value="updatePeriodRangeType" />
        <AppDateRangePicker v-model="periodRangeValue" :type="periodRangeType" :min="periodRangeType === 'monthrange' ? '2026-01' : '2020'" :max="periodRangeType === 'monthrange' ? '2026-12' : '2028'" clearable aria-label="经营统计周期" />
        <div class="range-summary"><strong>当前统计周期</strong><span>{{ periodRangeLabel }}</span></div>
      </AppCard>

      <AppCard as="article" padding="large" class="calendar-demo-card">
        <header class="demo-card-heading"><div><h2>日期范围</h2><p>范围高亮由日期组件统一输出 ISO 日期字符串。</p></div><span>业务组合</span></header>
        <AppDateRangePicker v-model="rangeValue" min="2026-08-01" max="2026-08-31" :disabled-date="isMilestoneDateBlocked" :shortcuts="rangeShortcuts" aria-label="项目周期" clearable />
        <div class="range-summary"><strong>当前周期</strong><span>{{ dateRangeLabel }}</span></div>
        <div class="calendar-notes"><p>适合合同周期、项目排期和报表筛选；业务层只需要保存 `start` 与 `end`。</p><RouterLink to="/examples/datetime">查看日期时间组合</RouterLink></div>
      </AppCard>

      <AppCard as="article" padding="large" class="calendar-demo-card">
        <header class="demo-card-heading"><div><h2>快捷日期与禁用规则</h2><p>快捷项和日历面板共用同一套边界及禁用日期判断，避免业务规则被绕过。</p></div><span>可配置</span></header>
        <AppDatePicker v-model="selectedMilestoneDate" min="2026-08-01" max="2026-08-31" :disabled-date="isMilestoneDateBlocked" :shortcuts="milestoneShortcuts" clearable aria-label="项目里程碑日期" @change="recordDateChange" />
        <div class="range-summary"><strong>当前里程碑</strong><span>{{ selectedMilestoneDate || "暂未选择" }}</span></div>
        <div class="calendar-notes"><p>8 月 10 日和 19 日为锁定日；点击输入框后可直接验收快捷选择和不可选日期状态。</p></div>
      </AppCard>

      <AppCard as="article" padding="large" class="calendar-demo-card extended-picker-card">
        <header class="demo-card-heading"><div><h2>日期选择模式</h2><p>同一个 AppDatePicker 可切换日期、月份、年份、周及其多选形态，不需要为不同粒度维护重复控件。</p></div><span>能力升级</span></header>
        <AppSegmented :model-value="extendedPickerType" :options="extendedPickerOptions" size="small" aria-label="选择日期模式" @update:model-value="updateExtendedPickerType" />
        <AppDatePicker v-model="extendedPickerValue" :type="extendedPickerType" clearable aria-label="扩展日期选择" />
        <div class="range-summary"><strong>当前值</strong><span>{{ extendedPickerLabel }}</span></div>
      </AppCard>

      <AppCard as="article" padding="large" class="calendar-demo-card">
        <header class="demo-card-heading"><div><h2>嵌入日期面板</h2><p>日期面板可脱离输入框直接嵌入预约、排期与看板，不依赖浮层状态。</p></div><span>AppCalendarPanel</span></header>
        <AppCalendarPanel v-model="selectedInlineDate" min="2026-08-01" max="2026-08-31" :disabled-date="isMilestoneDateBlocked" aria-label="内嵌里程碑日期" @select="recordDateChange" />
        <div class="range-summary"><strong>待排期日期</strong><span>{{ selectedInlineDate || "暂未选择" }}</span></div>
      </AppCard>

      <AppCard as="article" padding="large" class="calendar-demo-card">
        <header class="demo-card-heading"><div><h2>嵌入时间面板</h2><p>时间面板可独立用于预约卡片；确认和取消意图仍由业务页面接收。</p></div><span>AppTimePanel</span></header>
        <AppTimePanel v-model="selectedInlineTime" min="09:00" max="18:00" :step="900" aria-label="预约服务时间" @confirm="latestAction = `已确认 ${$event}`" @cancel="latestAction = '已取消时间选择'" />
        <div class="range-summary"><strong>预约时间</strong><span>{{ selectedInlineTime }}</span></div>
      </AppCard>
    </div>
  </section>
</template>

<style scoped>
.calendar-page { display: grid; min-height: 0; align-content: start; gap: var(--aps-page-stack-gap); }.calendar-page-heading { display: flex; align-items: end; justify-content: space-between; gap: 24px; }.calendar-page-heading h1, .calendar-page-heading p { margin: 0; }.calendar-page-heading h1 { color: var(--aps-ink); font-size: var(--aps-text-2xl); font-weight: var(--aps-font-weight-heading); letter-spacing: -.035em; }.calendar-page-heading p { max-width: 700px; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }.calendar-demo-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--aps-page-stack-gap); }.calendar-demo-card { display: grid; min-width: 0; align-content: start; gap: 22px; }.calendar-demo-card :deep(.app-calendar-panel), .calendar-demo-card :deep(.app-time-panel) { width: min(100%, 294px); }.demo-card-heading { display: flex; align-items: start; justify-content: space-between; gap: 14px; }.demo-card-heading h2, .demo-card-heading p { margin: 0; }.demo-card-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: var(--aps-font-weight-heading); }.demo-card-heading p { margin-top: 6px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.demo-card-heading span { flex: 0 0 auto; padding: 4px 8px; border-radius: 6px; background: var(--aps-surface-soft); color: var(--aps-faint); font-size: var(--aps-text-xs); font-weight: var(--aps-font-weight-primary); }.calendar-status { padding-top: 14px; border-top: 1px solid var(--aps-line-soft); color: var(--aps-muted); font-size: var(--aps-text-sm); }.range-summary { display: grid; gap: 6px; padding: 14px; border: 1px solid var(--aps-line-soft); border-radius: 11px; background: var(--aps-surface-soft); }.range-summary strong { color: var(--aps-muted); font-size: var(--aps-text-sm); }.range-summary span { color: var(--aps-ink); font-size: var(--aps-text-base); font-variant-numeric: tabular-nums; }.calendar-notes { display: grid; gap: 8px; }.calendar-notes p { margin: 0; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }.calendar-notes a { width: fit-content; color: var(--aps-blue); font-size: var(--aps-text-sm); }.calendar-notes a:hover { text-decoration: underline; text-underline-offset: 3px; }@media (max-width: 820px) { .calendar-page-heading { align-items: start; flex-direction: column; gap: 14px; }.calendar-page-heading .app-button-control { width: 100%; }.calendar-demo-grid { grid-template-columns: 1fr; } }@media (max-width: 420px) { .demo-card-heading span { display: none; } }
</style>
