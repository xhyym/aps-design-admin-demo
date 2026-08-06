import { computed, ref } from "vue";
import { defineStore } from "pinia";

/** 集中记录未完成请求数量，确保并发请求结束前全局加载层不会提前关闭。 */
export const useNetworkStore = defineStore("network", () => {
  const pendingRequestCount = ref(0);
  const isLoading = computed(() => pendingRequestCount.value > 0);

  function beginRequest(): void {
    pendingRequestCount.value += 1;
  }

  function endRequest(): void {
    pendingRequestCount.value = Math.max(0, pendingRequestCount.value - 1);
  }

  return { isLoading, beginRequest, endRequest };
});
