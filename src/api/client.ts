import axios, { type AxiosRequestConfig } from "axios";
import { mockAdapter } from "./mock-adapter";
import { useNetworkStore } from "@/stores/network";
import type { ApiResponse } from "@/types/api";

const httpClient = axios.create({
  baseURL: "/api",
  timeout: 10_000,
  adapter: mockAdapter,
});

/** 统一写入本地会话令牌，真实后端可复用相同拦截逻辑。 */
httpClient.interceptors.request.use((config) => {
  useNetworkStore().beginRequest();
  const accessToken = sessionStorage.getItem("aps-access-token");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
}, (error: unknown) => {
  useNetworkStore().endRequest();
  return Promise.reject(error);
});

/** 无论请求成功或失败均回收计数，确保全局加载状态与实际网络状态一致。 */
httpClient.interceptors.response.use((response) => {
  useNetworkStore().endRequest();
  return response;
}, (error: unknown) => {
  useNetworkStore().endRequest();
  return Promise.reject(error);
});

/**
 * 服务层唯一请求入口：页面只获得 data，标准 code/message/timestamp 由此处统一处理。
 */
export async function request<TData>(config: AxiosRequestConfig): Promise<TData> {
  const response = await httpClient.request<ApiResponse<TData>>(config);
  const payload = response.data;

  if (payload.code !== 0) {
    throw new Error(payload.message || "请求未成功完成。");
  }

  return payload.data;
}
