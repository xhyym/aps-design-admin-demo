<script setup lang="ts">
import { storeToRefs } from "pinia";
import { RouterView } from "vue-router";
import { AppConfigProvider, AppNetworkLoadingOverlay, AppToast } from "aps-design-pro";
import { useFeedbackStore } from "@/stores/feedback";
import { useNetworkStore } from "@/stores/network";
import { useAppStore } from "@/stores/app";

const feedbackStore = useFeedbackStore();
const networkStore = useNetworkStore();

/**
 * 应用启动时即恢复本地外观偏好，避免登录页与工作台首次渲染出现主题闪烁。
 */
useAppStore();

const { messages } = storeToRefs(feedbackStore);
const { isLoading } = storeToRefs(networkStore);
</script>

<template>
  <AppConfigProvider>
    <RouterView />
    <AppNetworkLoadingOverlay :loading="isLoading" />
    <AppToast :items="messages" @action="feedbackStore.triggerAction" @close="feedbackStore.close" />
  </AppConfigProvider>
</template>
