<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppAlert, AppEmptyState, AppException, AppLoadingState, AppResult, AppResultPage, AppSkeleton, AppSkeletonItem, AppStatePanel } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import { AppConfirmDialog } from "aps-design-pro";
import { useFeedbackStore } from "@/stores/feedback";
import { useNetworkStore } from "@/stores/network";
import type { StatePanelType } from "aps-design-pro";

const retryState = ref<StatePanelType>("error");
const isRetrying = ref(false);
const isPermissionRequested = ref(false);
const permissionNotice = ref("可按工作区、角色和资源范围发起申请。");
const isConfirmOpen = ref(false);
const isConfirming = ref(false);
const confirmationNotice = ref("危险操作需要明确确认，并在提交期间锁定关闭与重复提交。");
const isAlertVisible = ref(true);
const alertActionNotice = ref("提示组件支持深浅效果、关闭文案与业务操作插槽。");
const emptyStateNotice = ref("可直接复用到列表、搜索和权限范围为空的区域。");
const resultNotice = ref("结果组件的操作由页面决定，组件只保持稳定的语义结构。");
const isNetworkDemoLoading = ref(false);
const isCustomSkeletonLoading = ref(true);
const networkDemoNotice = ref("全局加载层在请求持续超过短暂延迟后显示，避免快速请求造成闪烁。");
const feedbackStore = useFeedbackStore();
const networkStore = useNetworkStore();
let retryTimer: number | undefined;
let confirmationTimer: number | undefined;
let networkDemoTimer: number | undefined;

const retryActionText = computed(() => {
  if (retryState.value === "success") return "恢复示例";
  return isRetrying.value ? "正在重新加载" : "重新加载";
});

const retryDescription = computed(() => {
  if (retryState.value === "loading") return "正在重新读取当前工作区的数据，请稍候。";
  if (retryState.value === "success") return "数据已重新加载，当前列表可继续处理。";
  return "数据服务暂时不可用，保留上下文后可直接重新尝试。";
});

/** 重试分阶段展示按钮锁、加载和成功结果，便于业务页直接复用同一状态流。 */
function handleRetryAction(): void {
  if (retryState.value === "success") {
    resetRetryWorkflow();
    return;
  }
  if (isRetrying.value) return;

  isRetrying.value = true;
  window.clearTimeout(retryTimer);
  retryTimer = window.setTimeout(() => {
    retryState.value = "loading";
    retryTimer = window.setTimeout(() => {
      retryState.value = "success";
      isRetrying.value = false;
      retryTimer = undefined;
    }, 720);
  }, 280);
}

function resetRetryWorkflow(): void {
  window.clearTimeout(retryTimer);
  retryTimer = undefined;
  retryState.value = "error";
  isRetrying.value = false;
}

function requestPermission(): void {
  isPermissionRequested.value = true;
  permissionNotice.value = "申请已提交给工作区管理员，审批结果会同步到通知中心。";
}

function showMessage(tone: "success" | "info" | "warning" | "error"): void {
  const messages = {
    success: "工作区配置已保存。",
    info: "正在同步最近的资源变更。",
    warning: "还有 2 个字段需要完成校验。",
    error: "同步失败，请检查网络后重试。",
  };
  feedbackStore.show(messages[tone], tone);
}

function showPersistentMessage(): void {
  feedbackStore.warning("这是一个需要用户主动关闭的持久提示。", { duration: 0 });
}

function showGroupedMessage(): void {
  feedbackStore.success("课程资源同步任务正在排队。", { grouping: true });
}

function showActionMessage(): void {
  feedbackStore.info("课程导出文件已准备完成。", {
    duration: 0,
    actionText: "查看导出",
    onAction: () => {
      resultNotice.value = "已打开最近完成的课程导出记录。";
    },
  });
}

/** 确认完成后才关闭对话框，确保危险操作的反馈与提交状态一致。 */
function confirmClearFilters(): void {
  if (isConfirming.value) return;
  isConfirming.value = true;
  window.clearTimeout(confirmationTimer);
  confirmationTimer = window.setTimeout(() => {
    isConfirming.value = false;
    isConfirmOpen.value = false;
    confirmationNotice.value = "筛选条件已清除，列表将按默认范围重新加载。";
    confirmationTimer = undefined;
  }, 720);
}

function resetFeedbackDemo(): void {
  resetRetryWorkflow();
  isPermissionRequested.value = false;
  permissionNotice.value = "可按工作区、角色和资源范围发起申请。";
  isConfirmOpen.value = false;
  isConfirming.value = false;
  window.clearTimeout(confirmationTimer);
  confirmationTimer = undefined;
  confirmationNotice.value = "危险操作需要明确确认，并在提交期间锁定关闭与重复提交。";
  emptyStateNotice.value = "可直接复用到列表、搜索和权限范围为空的区域。";
  resultNotice.value = "结果组件的操作由页面决定，组件只保持稳定的语义结构。";
  resetNetworkLoading();
  isCustomSkeletonLoading.value = true;
  restoreAlert();
}

function dismissAlert(): void {
  isAlertVisible.value = false;
  alertActionNotice.value = "提示已忽略，可随时恢复。";
}

function restoreAlert(): void {
  isAlertVisible.value = true;
  alertActionNotice.value = "提示组件支持深浅效果、关闭文案与业务操作插槽。";
}

function viewAlertTask(): void {
  alertActionNotice.value = "已跳转到待处理任务列表。";
}

/** 示例通过网络计数器驱动根节点中的 AppNetworkLoadingOverlay，和真实请求路径完全一致。 */
function showNetworkLoading(): void {
  if (isNetworkDemoLoading.value) return;
  isNetworkDemoLoading.value = true;
  networkDemoNotice.value = "正在模拟请求，请观察全局加载蒙版。";
  networkStore.beginRequest();
  window.clearTimeout(networkDemoTimer);
  networkDemoTimer = window.setTimeout(() => {
    networkStore.endRequest();
    isNetworkDemoLoading.value = false;
    networkDemoNotice.value = "请求已完成，全局加载蒙版已按最短展示时长平滑关闭。";
    networkDemoTimer = undefined;
  }, 900);
}

function resetNetworkLoading(): void {
  window.clearTimeout(networkDemoTimer);
  networkDemoTimer = undefined;
  if (isNetworkDemoLoading.value) networkStore.endRequest();
  isNetworkDemoLoading.value = false;
  networkDemoNotice.value = "全局加载层在请求持续超过短暂延迟后显示，避免快速请求造成闪烁。";
}

onBeforeUnmount(() => {
  window.clearTimeout(retryTimer);
  window.clearTimeout(confirmationTimer);
  resetNetworkLoading();
});
</script>

<template>
  <section class="feedback-states-page page-content page-stack" aria-label="反馈状态组件示例">
    <header class="feedback-page-heading">
      <div>
        <h1>反馈状态</h1>
        <p>加载、空数据、异常、权限、成功与确认操作使用稳定的语义和交互规则；业务页只维护请求结果与下一步动作。</p>
      </div>
      <AppButton variant="secondary" leading-icon="refresh" @click="resetFeedbackDemo">恢复示例</AppButton>
    </header>

    <div class="feedback-state-grid">
      <AppCard as="article" padding="large" class="feedback-card workflow-card">
        <header class="feedback-card-heading">
          <div><h2>失败后的重试流</h2><p>点击重新加载后，按钮先进入提交锁，再切换为加载状态，成功后给出明确结果。</p></div>
          <span>{{ retryState === "success" ? "已完成" : isRetrying ? "处理中" : "待重试" }}</span>
        </header>
        <AppStatePanel
          data-testid="feedback-retry-panel"
          :data-state="retryState"
          :type="retryState"
          title="工作区数据同步"
          :description="retryDescription"
          :action-text="retryActionText"
          :action-loading="isRetrying"
          :action-disabled="isRetrying"
          @action="handleRetryAction"
        />
      </AppCard>

      <AppCard as="article" padding="large" class="feedback-card">
        <header class="feedback-card-heading"><div><h2>空数据</h2><p>请求成功但当前条件没有数据时，保留下一步筛选入口，不使用错误态代替。</p></div><span>查询结果</span></header>
        <AppStatePanel type="empty" title="没有匹配的课程资源" description="调整关键词、资源分类或创建时间后，再次查询即可查看结果。" />
      </AppCard>

      <AppCard as="article" padding="large" class="feedback-card">
        <header class="feedback-card-heading"><div><h2>权限受限</h2><p>没有资源访问范围时，清楚说明原因和后续动作，不暴露受限内容。</p></div><span>{{ isPermissionRequested ? "已提交" : "需授权" }}</span></header>
        <AppStatePanel type="permission" title="无法访问经营分析" :description="permissionNotice">
          <template #actions>
            <AppButton size="small" :disabled="isPermissionRequested" @click="requestPermission">{{ isPermissionRequested ? "申请已提交" : "申请访问权限" }}</AppButton>
          </template>
        </AppStatePanel>
      </AppCard>

      <AppCard as="article" padding="large" class="feedback-card">
        <header class="feedback-card-heading"><div><h2>确认与完成</h2><p>需要破坏性操作时，使用统一确认组件锁定重复提交；完成后在原上下文中反馈结果。</p></div><span>高风险操作</span></header>
        <AppStatePanel type="success" title="当前筛选已保存" :description="confirmationNotice">
          <template #actions>
            <AppButton variant="danger" size="small" @click="isConfirmOpen = true">清除筛选</AppButton>
          </template>
        </AppStatePanel>
      </AppCard>
    </div>

    <AppCard as="article" padding="large" class="feedback-card alert-card">
      <header class="feedback-card-heading"><div><h2>提示条</h2><p>提示可使用统一语义色和深浅效果；关闭、操作插槽和默认内容均不依赖业务页手写布局。</p></div><span>轻量反馈</span></header>
      <AppAlert v-if="isAlertVisible" tone="info" effect="dark" title="有 3 项任务等待处理" closable close-text="忽略" @close="dismissAlert">
        请在今天 18:00 前完成课程审核；未完成的任务会保留在待处理列表中。
        <template #action><AppButton size="small" variant="secondary" @click="viewAlertTask">查看任务</AppButton></template>
      </AppAlert>
      <AppButton v-else size="small" variant="secondary" @click="restoreAlert">恢复提示</AppButton>
      <p class="alert-action-notice" role="status">{{ alertActionNotice }}</p>
    </AppCard>

    <AppCard as="article" padding="large" class="feedback-card message-service-card">
      <header class="feedback-card-heading"><div><h2>全局消息队列</h2><p>消息服务支持成功、信息、警告、错误、手动关闭和多条堆叠；业务页只需调用统一 Store。</p></div><span>{{ feedbackStore.messages.length }} 条消息</span></header>
      <div class="message-service-actions">
        <AppButton size="small" @click="showMessage('success')">成功消息</AppButton>
        <AppButton size="small" variant="secondary" @click="showMessage('info')">信息消息</AppButton>
        <AppButton size="small" variant="secondary" @click="showMessage('warning')">警告消息</AppButton>
        <AppButton size="small" variant="danger" @click="showMessage('error')">错误消息</AppButton>
        <AppButton size="small" variant="ghost" @click="showPersistentMessage">持久消息</AppButton>
        <AppButton size="small" variant="ghost" @click="showGroupedMessage">合并重复消息</AppButton>
        <AppButton size="small" variant="ghost" @click="showActionMessage">带动作消息</AppButton>
        <AppButton size="small" variant="text" :disabled="feedbackStore.messages.length === 0" @click="feedbackStore.clear">清空消息</AppButton>
      </div>
    </AppCard>

    <section class="feedback-primitive-grid" aria-label="反馈基础组件案例">
      <AppCard as="article" padding="large" class="feedback-card primitive-card">
        <header class="feedback-card-heading"><div><h2>独立空状态</h2><p>适合不依赖数据表的内容区域，也能保留下一步动作。</p></div><span>AppEmptyState</span></header>
        <AppEmptyState title="尚未创建课程包" description="创建第一个课程包后，即可继续设置售卖范围和交付方式。" action-text="创建课程包" @action="emptyStateNotice = '已打开新建课程包面板。'" />
        <p class="primitive-notice" role="status">{{ emptyStateNotice }}</p>
      </AppCard>

      <AppCard as="article" padding="large" class="feedback-card primitive-card">
        <header class="feedback-card-heading"><div><h2>独立加载状态</h2><p>适用于局部模块的首屏读取，骨架内容无需业务页重复绘制。</p></div><span>AppLoadingState</span></header>
        <AppLoadingState title="正在读取课程交付记录" description="已保留当前页面布局，数据完成后会自动替换此区域。" :rows="4" />
      </AppCard>

      <AppCard as="article" padding="large" class="feedback-card primitive-card">
        <header class="feedback-card-heading"><div><h2>异常结果</h2><p>异常页只接收状态码和描述，回退动作始终由业务路由处理。</p></div><span>AppException</span></header>
        <AppException code="403" description="当前账号没有查看课程结算数据的权限。" @action="resultNotice = '已返回到允许访问的课程资源列表。'" />
      </AppCard>

      <AppCard as="article" padding="large" class="feedback-card primitive-card">
        <header class="feedback-card-heading"><div><h2>操作结果</h2><p>成功、警告、失败与系统状态共用结构，避免页面各自拼装结果页。</p></div><span>AppResult</span></header>
        <AppResult status="success" title="课程包已发布" description="课程访问范围已同步到当前工作区。" action-text="查看课程包" @action="resultNotice = '已定位到刚发布的课程包。'" />
        <p class="primitive-notice" role="status">{{ resultNotice }}</p>
      </AppCard>

      <AppCard as="article" padding="large" class="feedback-card primitive-card">
        <header class="feedback-card-heading"><div><h2>可插槽结果页</h2><p>当结果页需要多个后续动作时，使用插槽扩展而不是复制组件结构。</p></div><span>AppResultPage</span></header>
        <AppResultPage status="warning" title="课程包待审核" description="提交资料后，审核结果会通过通知中心发送。"><template #actions><AppButton size="small" @click="resultNotice = '已打开审核资料。'">补充资料</AppButton></template></AppResultPage>
      </AppCard>

      <AppCard as="article" padding="large" class="feedback-card primitive-card network-demo-card">
        <header class="feedback-card-heading"><div><h2>全局网络加载</h2><p>所有请求共用同一计数器；并发请求未结束前，蒙版不会被提前关闭。</p></div><span>AppNetworkLoadingOverlay</span></header>
        <AppButton :disabled="isNetworkDemoLoading" @click="showNetworkLoading">{{ isNetworkDemoLoading ? "请求处理中" : "模拟网络请求" }}</AppButton>
        <p class="primitive-notice" role="status">{{ networkDemoNotice }}</p>
      </AppCard>

      <AppCard as="article" padding="large" class="feedback-card primitive-card skeleton-item-card">
        <header class="feedback-card-heading"><div><h2>可组合骨架</h2><p>复杂内容区可用骨架子项表达真实版式，加载结束后由同一组件切换回业务内容。</p></div><span>AppSkeletonItem</span></header>
        <AppSkeleton :loading="isCustomSkeletonLoading" aria-label="课程概览加载中">
          <template #template>
            <div class="custom-skeleton-layout"><AppSkeletonItem variant="image" /><div class="custom-skeleton-copy"><AppSkeletonItem variant="title" /><AppSkeletonItem /><AppSkeletonItem width="74%" /><AppSkeletonItem variant="button" /></div></div>
          </template>
          <div class="loaded-skeleton-content"><strong>课程概览已加载</strong><p>已读取课程封面、章节与最近的交付数据。</p></div>
        </AppSkeleton>
        <AppButton size="small" variant="secondary" @click="isCustomSkeletonLoading = !isCustomSkeletonLoading">{{ isCustomSkeletonLoading ? "显示实际内容" : "恢复骨架内容" }}</AppButton>
      </AppCard>
    </section>

    <AppConfirmDialog
      v-model="isConfirmOpen"
      title="确认清除当前筛选吗？"
      description="此操作会恢复默认查询范围，已保存的筛选视图不会被删除。"
      confirm-text="确认清除"
      danger
      :is-submitting="isConfirming"
      @confirm="confirmClearFilters"
    />
  </section>
</template>

<style scoped>
.feedback-states-page { display: grid; min-height: 0; align-content: start; gap: var(--aps-page-stack-gap); }
.feedback-page-heading { display: flex; align-items: end; justify-content: space-between; gap: 24px; }
.feedback-page-heading h1, .feedback-page-heading p, .feedback-card-heading h2, .feedback-card-heading p { margin: 0; }
.feedback-page-heading h1 { color: var(--aps-ink); font-size: var(--aps-text-2xl); font-weight: var(--aps-font-weight-heading); letter-spacing: -.035em; }
.feedback-page-heading p { max-width: 760px; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }
.feedback-state-grid, .feedback-primitive-grid { display: grid; gap: var(--aps-page-stack-gap); }
.feedback-state-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.feedback-primitive-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.feedback-card { display: grid; min-width: 0; align-content: start; gap: 18px; }
.feedback-card-heading { display: flex; min-width: 0; align-items: start; justify-content: space-between; gap: 14px; }
.feedback-card-heading > div { min-width: 0; }
.feedback-card-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: var(--aps-font-weight-heading); }
.feedback-card-heading p { max-width: 520px; margin-top: 6px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }
.feedback-card-heading > span { flex: 0 0 auto; padding: 4px 8px; border-radius: 6px; background: var(--aps-surface-soft); color: var(--aps-faint); font-size: var(--aps-text-xs); font-weight: var(--aps-font-weight-primary); white-space: nowrap; }
.feedback-card :deep(.app-state-panel) { min-height: 190px; padding-right: 8px; padding-left: 8px; }
.feedback-card :deep(.state-actions) { align-self: center; }
.alert-card :deep(.app-alert) { align-items: center; }
.alert-card :deep(.alert-actions .app-button-control) { min-height: 28px; color: var(--aps-ink); }
.alert-action-notice, .primitive-notice { min-height: 20px; margin: 0; color: var(--aps-muted); font-size: var(--aps-text-sm); }
.message-service-card { gap: 20px; }
.message-service-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.primitive-card { gap: 14px; }
.primitive-card :deep(.app-empty-state), .primitive-card :deep(.app-loading-state) { min-height: 236px; padding: 24px; }
.primitive-card :deep(.app-result) { min-height: 236px; padding: 30px 18px; }
.primitive-card :deep(.app-result h1) { font-size: var(--aps-text-xl); }
.network-demo-card { grid-template-rows: auto auto 1fr; }
.network-demo-card > .app-button-control { justify-self: start; }
.skeleton-item-card { grid-template-rows: auto minmax(0, 1fr) auto; }.custom-skeleton-layout { display: grid; grid-template-columns: minmax(112px, .7fr) minmax(0, 1.3fr); gap: 14px; }.custom-skeleton-copy { display: grid; align-content: center; gap: 10px; }.loaded-skeleton-content { display: grid; min-height: 132px; align-content: center; gap: 6px; padding: 18px; border-radius: var(--aps-radius-card); background: var(--aps-surface-soft); }.loaded-skeleton-content strong { color: var(--aps-ink); font-size: var(--aps-text-base); font-weight: var(--aps-font-weight-heading); }.loaded-skeleton-content p { margin: 0; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }
@media (max-width: 1180px) { .feedback-primitive-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 900px) { .feedback-state-grid { grid-template-columns: 1fr; } }
@media (max-width: 640px) { .feedback-page-heading { align-items: start; flex-direction: column; gap: 14px; }.feedback-page-heading .app-button-control { width: 100%; }.feedback-card-heading > span { display: none; }.feedback-card :deep(.app-state-panel) { padding-right: 0; padding-left: 0; }.feedback-primitive-grid { grid-template-columns: 1fr; }.primitive-card :deep(.app-empty-state), .primitive-card :deep(.app-loading-state) { min-height: 208px; }.primitive-card :deep(.app-result) { min-height: 208px; padding-right: 12px; padding-left: 12px; }.custom-skeleton-layout { grid-template-columns: 1fr; }.primitive-card :deep(.app-skeleton-item.is-image) { height: 104px; }.alert-card :deep(.app-alert) { align-items: flex-start; flex-wrap: wrap; }.alert-card :deep(.alert-actions) { width: 100%; } }
</style>
