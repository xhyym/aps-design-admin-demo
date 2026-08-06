<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { AppButton, AppButtonGroup } from "aps-design-pro";
import { AppCheckTag, AppTag } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import { AppMessageBox, type MessageBoxMode } from "aps-design-pro";
import { useFeedbackStore } from "@/stores/feedback";

const feedbackStore = useFeedbackStore();
const isMessageBoxOpen = ref(false);
const messageBoxMode = ref<MessageBoxMode>("alert");
const promptValue = ref("");
const isSubmitting = ref(false);
const actionResult = ref("等待选择一个操作。");
const selectedFilters = ref({ available: true, archived: false, mine: false, warning: false });
let submitTimer: number | undefined;

/** 打开时重置输入和提交状态，防止前一次对话框的状态泄漏到下一次操作。 */
function openMessageBox(mode: MessageBoxMode): void {
  window.clearTimeout(submitTimer);
  messageBoxMode.value = mode;
  promptValue.value = "";
  isSubmitting.value = false;
  isMessageBoxOpen.value = true;
  actionResult.value = mode === "alert" ? "已打开提示消息。" : mode === "confirm" ? "已打开确认消息。" : "已打开输入消息。";
}

/** 输入消息框仅接受长度足够的可见名称，避免业务层接收到无意义值。 */
function validateWorkspaceName(value: string): string | void {
  if (value.trim().length < 2) return "请输入至少 2 个字符的工作区名称。";
}

/** 模拟提交锁定，验证消息框在异步提交期间不会被遮罩或 Esc 意外关闭。 */
function confirmMessageBox(value: string): void {
  if (isSubmitting.value) return;
  if (messageBoxMode.value === "alert") {
    isMessageBoxOpen.value = false;
    actionResult.value = "已阅读系统提示。";
    feedbackStore.info("系统提示已确认。", { duration: 2200 });
    return;
  }

  isSubmitting.value = true;
  window.clearTimeout(submitTimer);
  submitTimer = window.setTimeout(() => {
    const result = messageBoxMode.value === "prompt" ? `已创建工作区：${value.trim()}。` : "已确认归档当前课程草稿。";
    isSubmitting.value = false;
    isMessageBoxOpen.value = false;
    actionResult.value = result;
    feedbackStore.success(result, { duration: 2600 });
    submitTimer = undefined;
  }, 560);
}

function cancelMessageBox(): void {
  if (isSubmitting.value) return;
  actionResult.value = "已取消当前操作。";
}

/** 按钮组的业务结果通过统一状态呈现，避免示例只展示外观而无法验收点击行为。 */
function handleAction(action: string): void {
  actionResult.value = `已执行：${action}。`;
  feedbackStore.info(actionResult.value, { duration: 2000 });
}

onBeforeUnmount(() => window.clearTimeout(submitTimer));
</script>

<template>
  <section class="overlay-actions-page page-content page-stack" aria-label="消息框与动作组件示例">
    <header class="overlay-actions-heading">
      <div>
        <h1>消息框与动作</h1>
        <p>确认、输入和成组操作保持统一的提交锁定、键盘关闭和状态反馈，不由业务页面临时拼装。</p>
      </div>
      <AppTag label="可交互验收" tone="green" />
    </header>

    <div class="overlay-actions-grid">
      <AppCard as="article" padding="large" class="action-card">
        <header class="action-card-heading"><div><h2>消息框</h2><p>提示、确认和输入使用一个受控组件；遮罩、Esc、取消按钮会返回同一取消事件。</p></div><span>受控状态</span></header>
        <div class="message-box-actions">
          <AppButton data-testid="message-box-alert" @click="openMessageBox('alert')">打开提示</AppButton>
          <AppButton data-testid="message-box-confirm" variant="secondary" @click="openMessageBox('confirm')">打开确认</AppButton>
          <AppButton data-testid="message-box-prompt" variant="ghost" @click="openMessageBox('prompt')">输入名称</AppButton>
        </div>
        <p class="action-card-note">确认类型会模拟短暂提交。提交期间，关闭按钮、遮罩和取消按钮均会锁定。</p>
      </AppCard>

      <AppCard as="article" padding="large" class="action-card">
        <header class="action-card-heading"><div><h2>按钮组</h2><p>相邻操作共享边界；悬停和焦点态仍显示在最上层，避免视觉边框被遮盖。</p></div><span>成组操作</span></header>
        <div class="button-group-stack">
          <AppButtonGroup aria-label="课程草稿操作">
            <AppButton variant="secondary" leading-icon="edit" @click="handleAction('保存草稿')">保存</AppButton>
            <AppButton variant="secondary" leading-icon="refresh" @click="handleAction('重新载入草稿')">重置</AppButton>
            <AppButton variant="secondary" leading-icon="dots" @click="handleAction('打开更多草稿操作')">更多</AppButton>
          </AppButtonGroup>
          <AppButtonGroup :attached="false" aria-label="批量操作">
            <AppButton size="small" @click="handleAction('批量发布')">批量发布</AppButton>
            <AppButton size="small" variant="secondary" @click="handleAction('导出课程清单')">导出清单</AppButton>
          </AppButtonGroup>
        </div>
      </AppCard>
    </div>

    <AppCard as="article" padding="large" class="action-card check-tag-card">
      <header class="action-card-heading"><div><h2>可选标签</h2><p>标签以按钮语义表达选中状态，适用于多条件筛选、资源权限或批量分类，不与静态状态标签混用。</p></div><span>多选筛选</span></header>
      <div class="check-tag-list" aria-label="资源筛选条件">
        <AppCheckTag v-model="selectedFilters.available" label="可用资源" tone="blue" />
        <AppCheckTag v-model="selectedFilters.archived" label="已归档" tone="neutral" />
        <AppCheckTag v-model="selectedFilters.mine" label="我创建的" tone="green" />
        <AppCheckTag v-model="selectedFilters.warning" label="需要复核" tone="orange" />
        <AppCheckTag :model-value="true" label="固定条件" tone="red" disabled />
      </div>
      <output class="action-result" aria-live="polite" data-testid="overlay-action-result">{{ actionResult }}</output>
    </AppCard>

    <AppMessageBox
      v-model="isMessageBoxOpen"
      v-model:input-value="promptValue"
      :mode="messageBoxMode"
      :title="messageBoxMode === 'alert' ? '课程发布提示' : messageBoxMode === 'confirm' ? '确认归档草稿？' : '新建工作区'"
      :message="messageBoxMode === 'alert' ? '课程发布后会立即同步到学员可见范围。' : messageBoxMode === 'confirm' ? '归档后仍可在历史记录中恢复，当前编辑内容会停止自动保存。' : '请输入一个工作区名称，创建后可继续配置成员权限。'"
      :input-validator="messageBoxMode === 'prompt' ? validateWorkspaceName : undefined"
      input-placeholder="例如：华东课程运营"
      :confirm-text="messageBoxMode === 'alert' ? '知道了' : messageBoxMode === 'confirm' ? '确认归档' : '创建工作区'"
      :danger="messageBoxMode === 'confirm'"
      :is-submitting="isSubmitting"
      @confirm="confirmMessageBox"
      @cancel="cancelMessageBox"
    />
  </section>
</template>

<style scoped>
.overlay-actions-page { display: grid; min-height: 0; align-content: start; gap: var(--aps-page-stack-gap); }.overlay-actions-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; }.overlay-actions-heading h1, .overlay-actions-heading p, .action-card-heading h2, .action-card-heading p, .action-card-note { margin: 0; }.overlay-actions-heading h1 { color: var(--aps-ink); font-size: var(--aps-text-2xl); font-weight: 740; letter-spacing: -.035em; }.overlay-actions-heading p { max-width: 760px; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }.overlay-actions-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--aps-page-stack-gap); }.action-card { display: grid; min-width: 0; align-content: start; gap: 20px; }.action-card-heading { display: flex; min-width: 0; align-items: start; justify-content: space-between; gap: 16px; }.action-card-heading > div { min-width: 0; }.action-card-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: 720; }.action-card-heading p { max-width: 510px; margin-top: 6px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.action-card-heading > span { flex: 0 0 auto; padding: 4px 8px; border-radius: 6px; background: var(--aps-surface-soft); color: var(--aps-faint); font-size: var(--aps-text-xs); font-weight: 650; white-space: nowrap; }.message-box-actions, .button-group-stack, .check-tag-list { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }.button-group-stack { align-items: flex-start; flex-direction: column; }.action-card-note { color: var(--aps-faint); font-size: var(--aps-text-xs); line-height: 1.6; }.check-tag-card { gap: 18px; }.action-result { display: block; min-height: 44px; padding: 12px 14px; border: 1px solid var(--aps-line-soft); border-radius: 10px; background: var(--aps-surface-soft); color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.55; }@media (max-width: 820px) { .overlay-actions-grid { grid-template-columns: 1fr; } }@media (max-width: 600px) { .overlay-actions-heading { align-items: start; flex-direction: column; }.action-card-heading > span { display: none; }.message-box-actions :deep(.app-button-control) { width: 100%; }.button-group-stack :deep(.app-button-group) { max-width: 100%; overflow-x: auto; } }
</style>
