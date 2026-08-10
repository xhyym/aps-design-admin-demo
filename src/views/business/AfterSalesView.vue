<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
  AppButton,
  AppCard,
  AppConfirmDialog,
  AppDataTable,
  AppDescriptions,
  AppDialog,
  AppDropdown,
  AppFilterBar,
  AppFormField,
  AppIconButton,
  AppInput,
  AppNumberInput,
  AppPagination,
  AppSearchInput,
  AppSelect,
  AppStatusTag,
  AppTableActions,
  AppTableOperationBar,
  AppTableToolbar,
  AppTextarea,
  AppTimeline,
} from "aps-design-pro";
import type { DataTableColumn, DescriptionItem, DropdownItem, SelectOption, StatusTone, TimelineItem, TimelineItemState } from "aps-design-pro";
import { createRefund, getRefunds, removeRefund, reviewRefund, updateRefund } from "@/api/modules/ecommerce";
import { useFeedbackStore } from "@/stores/feedback";
import type { RefundListQuery, RefundRecord, RefundReviewAction, RefundSaveInput, RefundStatus, RefundType } from "@/types/ecommerce";

interface RefundDraft extends RefundSaveInput {
  id?: string;
}

interface RefundStatusDisplay {
  label: string;
  tone: StatusTone;
}

const REFUND_TABLE_COLUMNS: DataTableColumn<RefundRecord>[] = [
  { key: "refundNo", label: "售后单号", defaultWidth: 178, minWidth: 164 },
  { key: "memberName", label: "会员", defaultWidth: 100, minWidth: 92 },
  { key: "productName", label: "售后商品", defaultWidth: 174, minWidth: 150 },
  { key: "refundType", label: "退款方式", defaultWidth: 92, minWidth: 84 },
  { key: "amount", label: "退款金额", defaultWidth: 102, minWidth: 94, align: "right" },
  { key: "status", label: "审核状态", defaultWidth: 96, minWidth: 90 },
  { key: "requestedAt", label: "申请时间", defaultWidth: 120, minWidth: 112 },
];
const statusOptions: SelectOption[] = [
  { label: "全部状态", value: "" },
  { label: "待处理", value: "pending" },
  { label: "审核中", value: "reviewing" },
  { label: "待退款", value: "approved" },
  { label: "已完成", value: "completed" },
  { label: "已拒绝", value: "rejected" },
];
const refundTypeOptions: SelectOption[] = [
  { label: "全部方式", value: "" },
  { label: "仅退款", value: "refund_only" },
  { label: "退货退款", value: "return_refund" },
];
const refundFormTypeOptions = refundTypeOptions.filter((item) => item.value);
const reviewActionOptions: SelectOption[] = [
  { label: "审核通过", value: "approve" },
  { label: "驳回申请", value: "reject" },
];

const feedbackStore = useFeedbackStore();
const refunds = ref<RefundRecord[]>([]);
const total = ref(0);
const isLoading = ref(false);
const errorMessage = ref("");
const keyword = ref("");
const status = ref<RefundStatus | "">("");
const refundType = ref<RefundType | "">("");
const page = ref(1);
const pageSize = ref(10);
const isAdvancedFilterOpen = ref(false);
const openActionId = ref<string | null>(null);

const isRefundDialogOpen = ref(false);
const isSavingRefund = ref(false);
const refundFormError = ref("");
const refundDraft = reactive<RefundDraft>(createEmptyRefundDraft());

const reviewTarget = ref<RefundRecord | null>(null);
const reviewAction = ref<Exclude<RefundReviewAction, "complete">>("approve");
const reviewRemark = ref("");
const reviewFormError = ref("");
const isReviewing = ref(false);

const detailTarget = ref<RefundRecord | null>(null);
const deleteTarget = ref<RefundRecord | null>(null);
const isDeleting = ref(false);
const completeTarget = ref<RefundRecord | null>(null);
const isCompleting = ref(false);

const refundDialogTitle = computed(() => refundDraft.id ? "编辑退款申请" : "新建退款申请");
const reviewDialogDescription = computed(() => reviewTarget.value ? `请确认“${reviewTarget.value.refundNo}”的审核结论，提交后会写入处理记录。` : "请确认退款申请的审核结论。");
const deleteDescription = computed(() => deleteTarget.value ? `删除“${deleteTarget.value.refundNo}”后无法恢复。仅未审核或已拒绝的申请允许删除。` : "删除后无法恢复。");
const completeDescription = computed(() => completeTarget.value ? `确认“${completeTarget.value.refundNo}”的 ¥ ${completeTarget.value.amount.toFixed(2)} 已原路退回？确认后将完成本次退款。` : "确认退款已完成？");
const detailDescriptions = computed<DescriptionItem[]>(() => {
  const target = detailTarget.value;
  if (!target) return [];
  return [
    { label: "售后单号", value: target.refundNo },
    { label: "关联订单", value: target.orderNo },
    { label: "退款方式", value: getRefundTypeLabel(target.refundType) },
    { label: "退款金额", value: formatAmount(target.amount) },
    { label: "会员", value: `${target.memberName} · ${target.memberPhone}` },
    { label: "售后商品", value: target.productName },
    { label: "售后原因", value: target.reason },
    { label: "申请时间", value: target.requestedAt },
    { label: "审核状态", value: getStatusDisplay(target.status).label },
    { label: "审核人员", value: target.reviewerName ?? "等待审核" },
    { label: "审核时间", value: target.reviewedAt ?? "等待审核" },
    { label: "退款完成", value: target.completedAt ?? "等待退款" },
  ];
});
/** 将接口返回的处理动态映射为组件统一格式，避免页面另行维护状态视觉。 */
const refundTimeline = computed<TimelineItem[]>(() => detailTarget.value?.timeline.map((item, index) => ({
  key: `${detailTarget.value?.id ?? "refund"}-${item.time}-${index}`,
  title: item.title,
  description: item.description,
  timestamp: item.time,
  state: getTimelineState(detailTarget.value?.status, index),
})) ?? []);

function createEmptyRefundDraft(): RefundDraft {
  return {
    id: undefined,
    orderNo: "",
    memberName: "",
    memberPhone: "",
    productName: "",
    refundType: "refund_only",
    reason: "",
    reasonDetail: "",
    amount: 0,
  };
}

function getStatusDisplay(value: RefundStatus): RefundStatusDisplay {
  const statusMap: Record<RefundStatus, RefundStatusDisplay> = {
    pending: { label: "待处理", tone: "warning" },
    reviewing: { label: "审核中", tone: "info" },
    approved: { label: "待退款", tone: "info" },
    completed: { label: "已完成", tone: "success" },
    rejected: { label: "已拒绝", tone: "neutral" },
  };
  return statusMap[value];
}

function getRefundTypeLabel(value: RefundType): string {
  return value === "refund_only" ? "仅退款" : "退货退款";
}

function getTimelineState(currentStatus: RefundStatus | undefined, index: number): TimelineItemState {
  if (index > 0) return "success";
  if (currentStatus === "rejected") return "error";
  if (currentStatus === "pending" || currentStatus === "reviewing" || currentStatus === "approved") return "processing";
  return "success";
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", minimumFractionDigits: 2 }).format(amount);
}

async function loadRefunds(resetPage = false): Promise<void> {
  if (resetPage) page.value = 1;
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const query: RefundListQuery = {
      keyword: keyword.value.trim() || undefined,
      status: status.value || undefined,
      refundType: refundType.value || undefined,
      page: page.value,
      pageSize: pageSize.value,
    };
    const result = await getRefunds(query);
    refunds.value = result.list;
    total.value = result.total;

    /** 删除最后一页记录后主动回退页码，避免表格出现无法恢复的空白页。 */
    const lastPage = Math.max(1, Math.ceil(result.total / pageSize.value));
    if (result.total > 0 && page.value > lastPage) {
      page.value = lastPage;
      await loadRefunds();
    }
  } catch (error) {
    refunds.value = [];
    total.value = 0;
    errorMessage.value = error instanceof Error ? error.message : "退款申请列表加载失败，请稍后重试。";
  } finally {
    isLoading.value = false;
  }
}

function submitFilters(): void {
  void loadRefunds(true);
}

function resetFilters(): void {
  keyword.value = "";
  status.value = "";
  refundType.value = "";
  void loadRefunds(true);
}

function updatePage(nextPage: number): void {
  page.value = nextPage;
  void loadRefunds();
}

function updatePageSize(nextPageSize: number): void {
  pageSize.value = nextPageSize;
  page.value = 1;
  void loadRefunds();
}

function openCreateDialog(): void {
  Object.assign(refundDraft, createEmptyRefundDraft());
  refundFormError.value = "";
  isRefundDialogOpen.value = true;
}

function openEditDialog(refund: RefundRecord): void {
  if (refund.status !== "pending" && refund.status !== "reviewing") {
    feedbackStore.show("已完成审核的退款申请不能再修改。", "error");
    return;
  }
  Object.assign(refundDraft, {
    id: refund.id,
    orderNo: refund.orderNo,
    memberName: refund.memberName,
    memberPhone: refund.memberPhone,
    productName: refund.productName,
    refundType: refund.refundType,
    reason: refund.reason,
    reasonDetail: refund.reasonDetail,
    amount: refund.amount,
  });
  refundFormError.value = "";
  isRefundDialogOpen.value = true;
}

function handleRefundDialogVisible(visible: boolean): void {
  if (visible) {
    isRefundDialogOpen.value = true;
    return;
  }
  if (isSavingRefund.value) return;
  isRefundDialogOpen.value = false;
  refundFormError.value = "";
}

function validateRefundDraft(): RefundSaveInput | null {
  const payload: RefundSaveInput = {
    orderNo: refundDraft.orderNo.trim().toLocaleUpperCase("en-US"),
    memberName: refundDraft.memberName.trim(),
    memberPhone: refundDraft.memberPhone.trim(),
    productName: refundDraft.productName.trim(),
    refundType: refundDraft.refundType,
    reason: refundDraft.reason.trim(),
    reasonDetail: refundDraft.reasonDetail.trim(),
    amount: Number(refundDraft.amount),
  };
  if (!/^SO-\d{8}-\d{4}$/.test(payload.orderNo)) {
    refundFormError.value = "订单号格式应为 SO-YYYYMMDD-0000。";
    return null;
  }
  if (payload.memberName.length < 2 || payload.memberName.length > 20) {
    refundFormError.value = "会员姓名需为 2 至 20 个字符。";
    return null;
  }
  if (!/^(?:1\d{10}|1\d{2}\*{4}\d{4})$/.test(payload.memberPhone)) {
    refundFormError.value = "请输入 11 位手机号，或保留现有脱敏手机号。";
    return null;
  }
  if (payload.productName.length < 2 || payload.productName.length > 80) {
    refundFormError.value = "售后商品名称需为 2 至 80 个字符。";
    return null;
  }
  if (payload.reason.length < 2 || payload.reason.length > 30) {
    refundFormError.value = "售后原因需为 2 至 30 个字符。";
    return null;
  }
  if (payload.reasonDetail.length > 300) {
    refundFormError.value = "问题说明不能超过 300 个字符。";
    return null;
  }
  if (!Number.isFinite(payload.amount) || payload.amount <= 0 || payload.amount > 1_000_000) {
    refundFormError.value = "退款金额需大于 0，且不能超过 ¥1,000,000。";
    return null;
  }
  return { ...payload, amount: Number(payload.amount.toFixed(2)) };
}

async function saveRefund(): Promise<void> {
  const payload = validateRefundDraft();
  if (!payload || isSavingRefund.value) return;
  const isEditing = Boolean(refundDraft.id);
  isSavingRefund.value = true;
  refundFormError.value = "";
  try {
    const refund = refundDraft.id ? await updateRefund(refundDraft.id, payload) : await createRefund(payload);
    if (detailTarget.value?.id === refund.id) detailTarget.value = refund;
    isRefundDialogOpen.value = false;
    await loadRefunds(!isEditing);
    feedbackStore.show(isEditing ? "退款申请已更新。" : "退款申请已创建，等待审核。", "success");
  } catch (error) {
    refundFormError.value = error instanceof Error ? error.message : "保存退款申请失败，请稍后重试。";
  } finally {
    isSavingRefund.value = false;
  }
}

function openReviewDialog(refund: RefundRecord): void {
  if (refund.status !== "pending" && refund.status !== "reviewing") {
    feedbackStore.show("当前退款申请已完成审核，不能重复审核。", "error");
    return;
  }
  reviewTarget.value = refund;
  reviewAction.value = "approve";
  reviewRemark.value = "";
  reviewFormError.value = "";
}

function handleReviewDialogVisible(visible: boolean): void {
  if (visible) return;
  if (isReviewing.value) return;
  reviewTarget.value = null;
  reviewFormError.value = "";
}

async function submitReview(): Promise<void> {
  const target = reviewTarget.value;
  const remark = reviewRemark.value.trim();
  if (!target || isReviewing.value) return;
  if (reviewAction.value === "reject" && remark.length < 2) {
    reviewFormError.value = "驳回申请时，请填写至少 2 个字符的审核说明。";
    return;
  }
  isReviewing.value = true;
  reviewFormError.value = "";
  try {
    const refund = await reviewRefund(target.id, { action: reviewAction.value, remark: remark || undefined });
    if (detailTarget.value?.id === refund.id) detailTarget.value = refund;
    reviewTarget.value = null;
    await loadRefunds();
    feedbackStore.show(reviewAction.value === "approve" ? "退款申请已审核通过。" : "退款申请已驳回。", "success");
  } catch (error) {
    reviewFormError.value = error instanceof Error ? error.message : "审核退款申请失败，请稍后重试。";
  } finally {
    isReviewing.value = false;
  }
}

async function confirmCompleteRefund(): Promise<void> {
  const target = completeTarget.value;
  if (!target || isCompleting.value) return;
  isCompleting.value = true;
  try {
    const refund = await reviewRefund(target.id, { action: "complete" });
    if (detailTarget.value?.id === refund.id) detailTarget.value = refund;
    completeTarget.value = null;
    await loadRefunds();
    feedbackStore.show("退款已标记为完成。", "success");
  } catch (error) {
    feedbackStore.show(error instanceof Error ? error.message : "确认退款完成失败，请稍后重试。", "error");
  } finally {
    isCompleting.value = false;
  }
}

async function confirmRemoveRefund(): Promise<void> {
  const target = deleteTarget.value;
  if (!target || isDeleting.value) return;
  isDeleting.value = true;
  try {
    await removeRefund(target.id);
    if (detailTarget.value?.id === target.id) detailTarget.value = null;
    deleteTarget.value = null;
    await loadRefunds();
    feedbackStore.show("退款申请已删除。", "success");
  } catch (error) {
    feedbackStore.show(error instanceof Error ? error.message : "删除退款申请失败，请稍后重试。", "error");
  } finally {
    isDeleting.value = false;
  }
}

function handlePrimaryAction(refund: RefundRecord): void {
  if (refund.status === "pending" || refund.status === "reviewing") {
    openReviewDialog(refund);
    return;
  }
  if (refund.status === "approved") {
    completeTarget.value = refund;
    return;
  }
  detailTarget.value = refund;
}

function getPrimaryAction(refund: RefundRecord): { icon: "edit" | "check" | "eye"; label: string } {
  if (refund.status === "pending" || refund.status === "reviewing") return { icon: "edit", label: "审核退款申请" };
  if (refund.status === "approved") return { icon: "check", label: "确认退款完成" };
  return { icon: "eye", label: "查看退款申请详情" };
}

function getRefundActionItems(refund: RefundRecord): DropdownItem[] {
  const items: DropdownItem[] = [];
  if (refund.status === "pending" || refund.status === "reviewing" || refund.status === "approved") {
    items.push({ key: "detail", label: "查看详情", icon: "eye" });
  }
  if (refund.status === "pending" || refund.status === "reviewing") {
    items.push({ key: "edit", label: "编辑申请", icon: "edit" });
  }
  if (refund.status === "pending" || refund.status === "rejected") {
    items.push({ key: "remove", label: "删除申请", icon: "trash", danger: true, divided: true });
  }
  return items;
}

function handleRefundAction(refund: RefundRecord, action: string): void {
  openActionId.value = null;
  if (action === "detail") detailTarget.value = refund;
  if (action === "edit") openEditDialog(refund);
  if (action === "remove") deleteTarget.value = refund;
}

onMounted(() => {
  void loadRefunds();
});
</script>

<template>
  <section class="page-content page-stack list-page-layout" aria-label="退款审核">
    <AppCard as="section" padding="large" content-overflow="visible" class="list-search-panel" aria-label="退款审核筛选条件">
      <AppFilterBar :expanded="isAdvancedFilterOpen" collapsible @submit="submitFilters" @reset="resetFilters" @update:expanded="isAdvancedFilterOpen = $event">
        <AppFormField label="关键词" for="refund-keyword" label-position="inline" label-width="48px" label-gap="8px">
          <AppSearchInput id="refund-keyword" v-model="keyword" placeholder="搜索售后单、订单号、会员或商品" aria-label="搜索退款申请" @search="submitFilters" />
        </AppFormField>
        <template #advanced>
          <AppFormField label="状态" for="refund-status" label-position="inline" label-width="40px" label-gap="8px">
            <AppSelect id="refund-status" v-model="status" :options="statusOptions" clearable aria-label="按审核状态筛选退款申请" />
          </AppFormField>
          <AppFormField label="方式" for="refund-type" label-position="inline" label-width="40px" label-gap="8px">
            <AppSelect id="refund-type" v-model="refundType" :options="refundTypeOptions" clearable aria-label="按退款方式筛选退款申请" />
          </AppFormField>
        </template>
        <template #actions><AppButton type="submit" leading-icon="search" :loading="isLoading">查询</AppButton></template>
      </AppFilterBar>
    </AppCard>

    <AppCard as="section" padding="none" fill-height class="data-table-card" aria-label="退款申请列表">
      <AppTableToolbar>
        <AppButton leading-icon="plus" @click="openCreateDialog">新建申请</AppButton>
        <template #actions><AppTableOperationBar show-refresh :refresh-disabled="isLoading" refresh-label="刷新退款申请列表" @refresh="loadRefunds" /></template>
      </AppTableToolbar>
      <AppDataTable :rows="refunds" :columns="REFUND_TABLE_COLUMNS" row-key="id" :loading="isLoading" :error-message="errorMessage" virtual fill-height :virtual-row-height="70" action-label="操作" empty-title="没有匹配的退款申请" empty-description="调整查询条件后再试一次。" aria-label="退款申请数据表格" @retry="loadRefunds">
        <template #cell-refundNo="{ row }"><div class="refund-number"><button type="button" class="table-link" @click="detailTarget = row">{{ row.refundNo }}</button><small>{{ row.orderNo }}</small></div></template>
        <template #cell-memberName="{ row }"><div class="member-cell"><strong>{{ row.memberName }}</strong><small>{{ row.memberPhone }}</small></div></template>
        <template #cell-productName="{ row }"><div class="product-cell"><strong :title="row.productName">{{ row.productName }}</strong><small :title="row.reason">{{ row.reason }}</small></div></template>
        <template #cell-refundType="{ row }"><span class="refund-type">{{ getRefundTypeLabel(row.refundType) }}</span></template>
        <template #cell-amount="{ row }"><strong class="amount-cell">{{ formatAmount(row.amount) }}</strong></template>
        <template #cell-status="{ row }"><AppStatusTag :tone="getStatusDisplay(row.status).tone" :label="getStatusDisplay(row.status).label" /></template>
        <template #actions="{ row }"><AppTableActions><AppIconButton :icon="getPrimaryAction(row).icon" :label="getPrimaryAction(row).label" size="small" :disabled="isReviewing || isCompleting" @click="handlePrimaryAction(row)" /><AppDropdown v-if="getRefundActionItems(row).length" :model-value="openActionId === row.id" :items="getRefundActionItems(row)" menu-label="退款申请操作" @update:model-value="openActionId = $event ? row.id : null" @select="handleRefundAction(row, $event)"><template #trigger="{ toggle }"><AppIconButton icon="dots" label="更多退款申请操作" size="small" :disabled="isReviewing || isCompleting" @click="toggle" /></template></AppDropdown></AppTableActions></template>
      </AppDataTable>
      <AppPagination v-if="!isLoading && !errorMessage && total" :page="page" :page-size="pageSize" :total="total" :page-size-options="[10, 20, 30, 50]" @update:page="updatePage" @update:page-size="updatePageSize" />
    </AppCard>

    <AppDialog :model-value="isRefundDialogOpen" :title="refundDialogTitle" :description="refundDraft.id ? '待审核申请可补充订单、会员、商品及退款说明；审核状态不会被改写。' : '用于客服代客补录退款申请，创建后将进入待处理队列。'" width="wide" :close-on-overlay="false" @update:model-value="handleRefundDialogVisible">
      <form id="refund-form" class="refund-form" @submit.prevent="saveRefund">
        <div class="refund-form-grid">
          <AppFormField label="关联订单" for="refund-order-no" required><AppInput id="refund-order-no" v-model="refundDraft.orderNo" :max-length="16" placeholder="例如：SO-20260810-0001" autocomplete="off" /></AppFormField>
          <AppFormField label="退款方式" for="refund-form-type" required><AppSelect id="refund-form-type" v-model="refundDraft.refundType" :options="refundFormTypeOptions" aria-label="选择退款方式" /></AppFormField>
        </div>
        <div class="refund-form-grid">
          <AppFormField label="会员姓名" for="refund-member-name" required><AppInput id="refund-member-name" v-model="refundDraft.memberName" :max-length="20" placeholder="请输入会员姓名" autocomplete="off" /></AppFormField>
          <AppFormField label="会员手机" for="refund-member-phone" required><AppInput id="refund-member-phone" v-model="refundDraft.memberPhone" :max-length="11" placeholder="请输入 11 位手机号" autocomplete="off" /></AppFormField>
        </div>
        <div class="refund-form-grid">
          <AppFormField label="售后商品" for="refund-product-name" required><AppInput id="refund-product-name" v-model="refundDraft.productName" :max-length="80" placeholder="请输入商品名称" autocomplete="off" /></AppFormField>
          <AppFormField label="退款金额" for="refund-amount" required><AppNumberInput id="refund-amount" v-model="refundDraft.amount" :min="0.01" :max="1000000" :step="0.01" :precision="2" :controls="false" placeholder="请输入退款金额" aria-label="输入退款金额" /></AppFormField>
        </div>
        <AppFormField label="售后原因" for="refund-reason" required><AppInput id="refund-reason" v-model="refundDraft.reason" :max-length="30" show-word-limit placeholder="例如：商品破损、发货超时" autocomplete="off" /></AppFormField>
        <AppFormField label="问题说明" for="refund-reason-detail"><AppTextarea id="refund-reason-detail" v-model="refundDraft.reasonDetail" :rows="4" :max-length="300" show-word-limit placeholder="补充售后问题、客服确认结果或退货说明" /></AppFormField>
        <p v-if="refundFormError" class="form-error" role="alert">{{ refundFormError }}</p>
      </form>
      <template #footer><AppButton variant="secondary" :disabled="isSavingRefund" @click="handleRefundDialogVisible(false)">取消</AppButton><AppButton type="submit" form="refund-form" :loading="isSavingRefund">{{ isSavingRefund ? "正在保存…" : "保存申请" }}</AppButton></template>
    </AppDialog>

    <AppDialog :model-value="Boolean(reviewTarget)" title="审核退款申请" :description="reviewDialogDescription" :close-on-overlay="false" @update:model-value="handleReviewDialogVisible">
      <form id="refund-review-form" class="review-form" @submit.prevent="submitReview">
        <div v-if="reviewTarget" class="review-summary"><div><span>退款申请</span><strong>{{ reviewTarget.refundNo }}</strong></div><div><span>退款金额</span><strong>{{ formatAmount(reviewTarget.amount) }}</strong></div><div><span>售后原因</span><strong>{{ reviewTarget.reason }}</strong></div></div>
        <AppFormField label="审核结论" for="refund-review-action" required><AppSelect id="refund-review-action" v-model="reviewAction" :options="reviewActionOptions" aria-label="选择退款审核结论" /></AppFormField>
        <AppFormField :label="reviewAction === 'reject' ? '驳回说明' : '审核备注'" for="refund-review-remark" :required="reviewAction === 'reject'"><AppTextarea id="refund-review-remark" v-model="reviewRemark" :rows="4" :max-length="200" show-word-limit :placeholder="reviewAction === 'reject' ? '请说明驳回原因，至少 2 个字符' : '可选填写审核备注'" /></AppFormField>
        <p v-if="reviewFormError" class="form-error" role="alert">{{ reviewFormError }}</p>
      </form>
      <template #footer><AppButton variant="secondary" :disabled="isReviewing" @click="handleReviewDialogVisible(false)">取消</AppButton><AppButton type="submit" form="refund-review-form" :loading="isReviewing">{{ isReviewing ? "正在提交…" : "确认审核" }}</AppButton></template>
    </AppDialog>

    <AppDialog :model-value="Boolean(detailTarget)" title="退款申请详情" description="查看申请信息、审核备注与完整处理动态。" width="wide" @update:model-value="detailTarget = null">
      <div v-if="detailTarget" class="refund-detail">
        <header class="detail-heading"><div><p>退款申请</p><h2>{{ detailTarget.refundNo }}</h2></div><AppStatusTag :tone="getStatusDisplay(detailTarget.status).tone" :label="getStatusDisplay(detailTarget.status).label" /></header>
        <section class="detail-section"><h3>申请信息</h3><AppDescriptions :items="detailDescriptions" :columns="2" /></section>
        <section class="detail-section"><h3>问题说明</h3><p class="reason-detail">{{ detailTarget.reasonDetail || "申请人暂未补充问题说明。" }}</p></section>
        <section class="detail-section"><h3>审核备注</h3><p class="reason-detail">{{ detailTarget.auditRemark || "暂未填写审核备注。" }}</p></section>
        <section class="detail-section"><h3>处理动态</h3><AppTimeline :items="refundTimeline" :current-key="refundTimeline[0]?.key" aria-label="退款申请处理动态" /></section>
      </div>
      <template #footer><AppButton @click="detailTarget = null">关闭</AppButton></template>
    </AppDialog>

    <AppConfirmDialog :model-value="Boolean(completeTarget)" title="确认退款完成？" :description="completeDescription" confirm-text="确认完成" :is-submitting="isCompleting" @update:model-value="completeTarget = null" @confirm="confirmCompleteRefund" />
    <AppConfirmDialog :model-value="Boolean(deleteTarget)" title="确认删除退款申请？" :description="deleteDescription" confirm-text="确认删除" danger :is-submitting="isDeleting" @update:model-value="deleteTarget = null" @confirm="confirmRemoveRefund" />
  </section>
</template>

<style scoped>
.refund-number, .member-cell, .product-cell { min-width: 0; }.refund-number small, .member-cell small, .product-cell small { display: block; margin-top: 3px; overflow: hidden; color: var(--aps-faint); font-size: var(--aps-text-xs); text-overflow: ellipsis; white-space: nowrap; }.table-link { display: block; max-width: 100%; padding: 0; overflow: hidden; border: 0; background: transparent; color: var(--aps-blue); font: 660 var(--aps-text-sm)/1.4 var(--aps-font); text-align: left; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }.table-link:hover { color: var(--aps-blue-hover); text-decoration: underline; text-underline-offset: 3px; }.member-cell strong, .product-cell strong { display: block; overflow: hidden; color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: 660; text-overflow: ellipsis; white-space: nowrap; }.product-cell small { color: var(--aps-muted); }.refund-type { color: var(--aps-muted); font-size: var(--aps-text-sm); }.amount-cell { color: var(--aps-ink); font-size: var(--aps-text-sm); font-variant-numeric: tabular-nums; }.refund-form, .review-form { display: grid; gap: 18px; }.refund-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }.form-error { margin: -6px 0 0; color: var(--aps-red); font-size: var(--aps-text-sm); }.review-summary { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(74px, .7fr) minmax(0, 1fr); gap: 10px; padding: 12px 14px; border: 1px solid var(--aps-line-soft); border-radius: var(--aps-radius-md); background: var(--aps-surface-soft); }.review-summary div { min-width: 0; }.review-summary span, .review-summary strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.review-summary span { color: var(--aps-faint); font-size: var(--aps-text-xs); }.review-summary strong { margin-top: 4px; color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: 670; font-variant-numeric: tabular-nums; }.refund-detail { display: grid; gap: 22px; }.detail-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding-bottom: 18px; border-bottom: 1px solid var(--aps-line-soft); }.detail-heading p, .detail-heading h2 { margin: 0; }.detail-heading p { color: var(--aps-muted); font-size: var(--aps-text-sm); }.detail-heading h2 { margin-top: 5px; color: var(--aps-ink); font-size: var(--aps-text-xl); font-weight: 720; letter-spacing: -.025em; }.detail-section h3 { margin: 0 0 12px; color: var(--aps-ink); font-size: var(--aps-text-md); font-weight: 700; }.reason-detail { margin: 0; padding: 11px 13px; border-radius: var(--aps-radius-md); background: var(--aps-surface-soft); color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; white-space: pre-wrap; }.detail-section :deep(.app-timeline) { margin-top: 2px; }@media (max-width: 640px) { .refund-form-grid, .review-summary { grid-template-columns: 1fr; }.detail-heading { align-items: flex-start; flex-direction: column; } }
</style>
