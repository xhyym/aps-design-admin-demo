<script setup lang="ts">
import { storeToRefs } from "pinia";
import { RouterView } from "vue-router";
import { AppConfigProvider, AppNetworkLoadingOverlay, AppToast } from "aps-design-pro";
import { imageAssetAdapter } from "@/api/modules/files";
import { useFeedbackStore } from "@/stores/feedback";
import { useNetworkStore } from "@/stores/network";

const feedbackStore = useFeedbackStore();
const networkStore = useNetworkStore();
const { messages } = storeToRefs(feedbackStore);
const { isLoading } = storeToRefs(networkStore);
</script>

<template>
  <AppConfigProvider :image-asset-adapter="imageAssetAdapter">
    <RouterView />
    <AppNetworkLoadingOverlay :loading="isLoading" />
    <AppToast :items="messages" @action="feedbackStore.triggerAction" @close="feedbackStore.close" />
  </AppConfigProvider>
</template>

<style>
/* 演示项目在组件库新版本发布前先对齐同一套排版令牌，保证本地与线上展示一致。 */
:root {
  --aps-font: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
  --aps-font-weight-primary: 500;
  --aps-font-weight-strong: 600;
  --aps-font-weight-heading: 700;
}
</style>
