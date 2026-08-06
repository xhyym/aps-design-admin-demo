<script setup lang="ts">
import { storeToRefs } from "pinia";
import { RouterView } from "vue-router";
import { AppConfigProvider, AppNetworkLoadingOverlay, AppToast } from "aps-design-pro";
import { useFeedbackStore } from "@/stores/feedback";
import { useNetworkStore } from "@/stores/network";

const feedbackStore = useFeedbackStore();
const networkStore = useNetworkStore();
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
