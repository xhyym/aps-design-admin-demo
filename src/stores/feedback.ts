import { ref } from "vue";
import { defineStore } from "pinia";

export type FeedbackTone = "success" | "error" | "info" | "warning";

export interface FeedbackMessage {
  id: string;
  message: string;
  tone: FeedbackTone;
  duration: number;
  closable: boolean;
  repeatCount: number;
  actionText?: string;
  onAction?: () => void;
  onClose?: () => void;
}

export interface FeedbackMessageOptions {
  duration?: number;
  closable?: boolean;
  grouping?: boolean;
  actionText?: string;
  onAction?: () => void;
  onClose?: () => void;
}

const MAXIMUM_MESSAGE_COUNT = 5;
const DEFAULT_MESSAGE_DURATION = 3200;

/** 全局消息队列只反馈真实操作结果，并限制并发数量避免遮挡当前任务。 */
export const useFeedbackStore = defineStore("feedback", () => {
  const messages = ref<FeedbackMessage[]>([]);
  const timers = new Map<string, number>();
  let sequence = 0;

  function scheduleClose(id: string, duration: number): void {
    const previousTimer = timers.get(id);
    if (previousTimer !== undefined) window.clearTimeout(previousTimer);
    timers.delete(id);
    if (duration > 0) timers.set(id, window.setTimeout(() => close(id), duration));
  }

  function show(message: string, tone: FeedbackTone = "info", options: FeedbackMessageOptions = {}): string {
    const normalizedMessage = message.trim();
    if (!normalizedMessage) return "";

    const duration = Math.max(0, Math.round(options.duration ?? DEFAULT_MESSAGE_DURATION));
    const groupedMessage = options.grouping
      ? messages.value.find((item) => item.message === normalizedMessage && item.tone === tone)
      : undefined;
    if (groupedMessage) {
      messages.value = messages.value.map((item) => item.id === groupedMessage.id
        ? { ...item, duration, repeatCount: item.repeatCount + 1 }
        : item);
      scheduleClose(groupedMessage.id, duration);
      return groupedMessage.id;
    }

    const id = `feedback-${Date.now()}-${sequence += 1}`;
    const feedbackMessage: FeedbackMessage = {
      id,
      message: normalizedMessage,
      tone,
      duration,
      closable: options.closable ?? true,
      repeatCount: 1,
      actionText: options.actionText?.trim() || undefined,
      onAction: options.onAction,
      onClose: options.onClose,
    };

    messages.value = [...messages.value, feedbackMessage];
    while (messages.value.length > MAXIMUM_MESSAGE_COUNT) {
      close(messages.value[0].id);
    }

    scheduleClose(id, duration);
    return id;
  }

  function close(id: string): void {
    const feedbackMessage = messages.value.find((item) => item.id === id);
    const timer = timers.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timers.delete(id);
    }
    messages.value = messages.value.filter((item) => item.id !== id);
    feedbackMessage?.onClose?.();
  }

  /** 消息内动作只处理页面提供的后续行为，执行后统一关闭，避免同一动作被重复触发。 */
  function triggerAction(id: string): void {
    const feedbackMessage = messages.value.find((item) => item.id === id);
    if (!feedbackMessage?.actionText) return;
    try {
      feedbackMessage.onAction?.();
    } finally {
      close(id);
    }
  }

  function clear(): void {
    messages.value.slice().forEach((item) => close(item.id));
  }

  function success(message: string, options?: FeedbackMessageOptions): string {
    return show(message, "success", options);
  }

  function info(message: string, options?: FeedbackMessageOptions): string {
    return show(message, "info", options);
  }

  function warning(message: string, options?: FeedbackMessageOptions): string {
    return show(message, "warning", options);
  }

  function error(message: string, options?: FeedbackMessageOptions): string {
    return show(message, "error", options);
  }

  return { messages, show, close, clear, triggerAction, success, info, warning, error };
});
