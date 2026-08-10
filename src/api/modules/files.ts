import { request } from "../client";
import type { UploadedFile } from "@/types/files";
import type { ImageAssetAdapter, UploadChunkCompleteOptions, UploadChunkPartOptions, UploadChunkPrepareOptions, UploadChunkService, UploadChunkSession } from "aps-design-pro";

/** 上传服务的传输参数由组件传入，接口层负责保持与后端一致的 FormData 协议。 */
export async function uploadFile(file: File, signal: AbortSignal, onProgress: (progress: number) => void): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append("file", file, file.name);
  onProgress(12);
  const result = await request<UploadedFile>({
    url: "/files/upload",
    method: "post",
    data: formData,
    signal,
    onUploadProgress: (event) => {
      if (event.total && event.total > 0) onProgress((event.loaded / event.total) * 100);
    },
  });
  onProgress(100);
  return result;
}

/**
 * 富文本、商品封面等图片入口共用同一文件服务契约。
 * 鉴权、租户标识与签名策略由 request 的拦截器及后端统一处理，页面无需感知存储实现。
 */
export const imageAssetAdapter: ImageAssetAdapter = {
  async uploadImage({ file, signal, onProgress }) {
    const uploadedFile = await uploadFile(file, signal, onProgress);
    if (!uploadedFile.id.trim() || !uploadedFile.url?.trim()) {
      throw new Error("图片服务未返回稳定资源地址，无法插入富文本内容。");
    }
    return { assetId: uploadedFile.id, url: uploadedFile.url };
  },
};

/**
 * 默认分片服务使用语义化会话接口；替换后端时仅需保留 prepare、uploadPart、complete 三个动作。
 * 服务端应按文件指纹和当前成员权限校验会话，避免仅依赖前端传入的元数据恢复文件。
 */
export const chunkUploadService: UploadChunkService = {
  async prepare(options: UploadChunkPrepareOptions) {
    return request<UploadChunkSession>({
      url: "/files/upload-sessions",
      method: "post",
      data: {
        fileKey: options.fileKey,
        fileName: options.file.name,
        fileSize: options.file.size,
        fileType: options.file.type,
        chunkSize: options.chunkSize,
        totalChunks: options.totalChunks,
      },
      signal: options.signal,
    });
  },
  async uploadPart(options: UploadChunkPartOptions): Promise<void> {
    const formData = new FormData();
    formData.append("chunk", options.chunk, options.file.name);
    formData.append("fileKey", options.fileKey);
    formData.append("chunkIndex", String(options.chunkIndex));
    formData.append("totalChunks", String(options.totalChunks));
    await request<void>({
      url: `/files/upload-sessions/${encodeURIComponent(options.sessionId)}/chunks/${options.chunkIndex}`,
      method: "post",
      data: formData,
      signal: options.signal,
      onUploadProgress: (event) => {
        if (event.total && event.total > 0) options.onProgress(event.loaded);
      },
    });
    options.onProgress(options.chunk.size);
  },
  async complete(options: UploadChunkCompleteOptions): Promise<UploadedFile> {
    return request<UploadedFile>({
      url: `/files/upload-sessions/${encodeURIComponent(options.sessionId)}/complete`,
      method: "post",
      data: {
        fileKey: options.fileKey,
        totalChunks: options.totalChunks,
      },
      signal: options.signal,
    });
  },
};
