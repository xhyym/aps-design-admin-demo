import type { AxiosAdapter, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import dashboardResponse from "@/mock/dashboard.json";
import loginResponse from "@/mock/login.json";
import menusResponse from "@/mock/menus.json";
import ordersResponse from "@/mock/orders.json";
import rolesResponse from "@/mock/roles.json";
import usersResponse from "@/mock/users.json";
import type { ApiResponse, PageResult } from "@/types/api";
import type { LoginResult } from "@/types/auth";
import type { DashboardData } from "@/types/dashboard";
import type { UploadedFile } from "@/types/files";
import type { ExportTask, UploadChunkSession } from "aps-design-pro";
import type { OrderExportQuery, SalesOrder } from "@/types/orders";
import type { SystemMenu, SystemMenuInput, SystemRole, SystemRoleInput, SystemUser, SystemUserInput, UserStatus } from "@/types/system";

type AdapterData = LoginResult | DashboardData | PageResult<SystemUser> | PageResult<SystemRole> | PageResult<SystemMenu> | PageResult<SalesOrder> | SystemUser | SystemRole | SystemMenu | SalesOrder | SalesOrder[] | ExportTask | ExportTask[] | UploadChunkSession | UploadedFile | null;
type AdapterResponse = ApiResponse<AdapterData>;
type CollectionKey = "users" | "roles" | "menus";
type UserStatusPayload = { ids: string[]; status: UserStatus };

const RESPONSE_DELAY = 180;
const ORDER_EXPORT_TASK_STORAGE_PREFIX = "aps:order-export-tasks:v1";
const ORDER_EXPORT_TASK_COMPLETE_DELAY = 1_800;
const CHUNK_UPLOAD_SESSION_STORAGE_PREFIX = "aps:chunk-upload-sessions:v1";
const CHUNK_UPLOAD_SESSION_TTL = 24 * 60 * 60 * 1_000;
const STORAGE_KEYS: Record<CollectionKey, string> = {
  users: "aps-data-users",
  roles: "aps-data-roles",
  menus: "aps-data-menus",
};

const database = {
  users: readCollection<SystemUser>(STORAGE_KEYS.users, (usersResponse as ApiResponse<PageResult<SystemUser>>).data.list),
  roles: readCollection<SystemRole>(STORAGE_KEYS.roles, (rolesResponse as ApiResponse<PageResult<SystemRole>>).data.list),
  menus: readCollection<SystemMenu>(STORAGE_KEYS.menus, (menusResponse as ApiResponse<PageResult<SystemMenu>>).data.list),
};
const orders = cloneData((ordersResponse as ApiResponse<SalesOrder[]>).data);

interface StoredOrderExportTask {
  task: ExportTask;
  query: OrderExportQuery;
  startedAt: number;
}

interface StoredOrderExportTaskValue {
  task?: Partial<ExportTask>;
  query?: OrderExportQuery;
  startedAt?: number;
}

interface ChunkUploadSessionPayload {
  fileKey: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  chunkSize: number;
  totalChunks: number;
}

interface ChunkUploadCompletePayload {
  fileKey: string;
  totalChunks: number;
}

interface StoredChunkUploadSession extends ChunkUploadSessionPayload {
  id: string;
  uploadedChunkIndexes: number[];
  completed: boolean;
  fileId?: string;
  updatedAt: number;
}

/** 将业务返回转换为 Axios 响应，页面与后续真实服务保持同一调用方式。 */
function createAxiosResponse<TData>(config: AxiosRequestConfig, data: ApiResponse<TData>): AxiosResponse<ApiResponse<TData>> {
  return {
    config: config as InternalAxiosRequestConfig,
    data,
    headers: {},
    status: 200,
    statusText: "OK",
  };
}

function createSuccessResponse<TData>(data: TData, message: string): ApiResponse<TData> {
  return { code: 0, message, data, timestamp: Date.now() };
}

function createErrorResponse(message: string, code = 400): AdapterResponse {
  return { code, message, data: null, timestamp: Date.now() };
}

function cloneData<TData>(data: TData): TData {
  return structuredClone(data);
}

/** 启动时从会话存储恢复集合，首次进入时使用内置初始数据。 */
function readCollection<TItem>(storageKey: string, fallback: TItem[]): TItem[] {
  const storedValue = sessionStorage.getItem(storageKey);
  if (!storedValue) {
    return cloneData(fallback);
  }

  try {
    const parsedValue = JSON.parse(storedValue) as TItem[];
    return Array.isArray(parsedValue) ? parsedValue : cloneData(fallback);
  } catch {
    sessionStorage.removeItem(storageKey);
    return cloneData(fallback);
  }
}

function persistCollection<TItem>(key: CollectionKey, collection: TItem[]): void {
  sessionStorage.setItem(STORAGE_KEYS[key], JSON.stringify(collection));
}

function getRequestData<TData>(config: AxiosRequestConfig): TData {
  if (typeof config.data === "string") {
    return JSON.parse(config.data) as TData;
  }
  return config.data as TData;
}

function getUploadedFile(config: AxiosRequestConfig): File | null {
  if (!(config.data instanceof FormData)) return null;
  const file = config.data.get("file");
  return file instanceof File ? file : null;
}

function getPositiveNumber(value: string | number | undefined, fallback: number): number {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? Math.floor(parsedValue) : fallback;
}

/** 列表接口统一执行关键字、排序与分页，确保页面切换到真实接口后无需调整交互逻辑。 */
function createPageResponse<TItem extends object>(
  source: TItem[],
  config: AxiosRequestConfig,
  fields: Array<keyof TItem>,
  message: string,
  applyFilters?: (items: TItem[], requestConfig: AxiosRequestConfig) => TItem[],
): ApiResponse<PageResult<TItem>> {
  const keyword = String(config.params?.keyword ?? "").trim().toLowerCase();
  const sortBy = String(config.params?.sortBy ?? "");
  const sortOrder = config.params?.sortOrder === "asc" ? "asc" : "desc";
  const page = getPositiveNumber(config.params?.page as string | number | undefined, 1);
  const pageSize = getPositiveNumber(config.params?.pageSize as string | number | undefined, 8);
  let items = cloneData(source);

  if (keyword) {
    items = items.filter((item) => fields.some((field) => String(item[field] ?? "").toLowerCase().includes(keyword)));
  }

  if (applyFilters) items = applyFilters(items, config);

  const sortableField = fields.find((field) => String(field) === sortBy);
  if (sortableField) {
    items.sort((left, right) => {
      const leftValue = String(left[sortableField] ?? "");
      const rightValue = String(right[sortableField] ?? "");
      const comparedValue = leftValue.localeCompare(rightValue, "zh-Hans-CN", { numeric: true });
      return sortOrder === "asc" ? comparedValue : -comparedValue;
    });
  }

  const total = items.length;
  const startIndex = (page - 1) * pageSize;
  return createSuccessResponse({ list: items.slice(startIndex, startIndex + pageSize), total, page, pageSize }, message);
}

/** 角色与状态由接口筛选，页面只提交筛选条件，不在当前页数据上二次过滤。 */
function filterUsers(items: SystemUser[], config: AxiosRequestConfig): SystemUser[] {
  const role = String(config.params?.role ?? "");
  const status = String(config.params?.status ?? "");
  return items.filter((item) => (!role || item.role === role) && (!status || item.status === status));
}

/** 订单状态与来源是服务端筛选条件，避免业务页在已分页的数据上再次截断。 */
function filterOrders(items: SalesOrder[], config: AxiosRequestConfig): SalesOrder[] {
  return filterOrdersByQuery(items, config.params as OrderExportQuery);
}

/** 导出与列表复用同一组筛选字段，避免生成文件与当前查询结果不一致。 */
function filterOrdersByQuery(items: SalesOrder[], query: OrderExportQuery = {}): SalesOrder[] {
  const status = query.status ?? "";
  const channel = query.channel ?? "";
  return items.filter((item) => (!status || item.status === status) && (!channel || item.channel === channel));
}

function getOrderExportRows(query: OrderExportQuery): SalesOrder[] {
  const keyword = query.keyword?.trim().toLowerCase() ?? "";
  const sortableFields = ["orderNo", "customerName", "productSummary", "channel", "status", "createdAt", "amount"] as const;
  let result = filterOrdersByQuery(cloneData(orders), query);
  if (keyword) result = result.filter((item) => sortableFields.some((field) => String(item[field]).toLowerCase().includes(keyword)));
  if (query.sortBy) {
    const direction = query.sortOrder === "asc" ? 1 : -1;
    result.sort((left, right) => String(left[query.sortBy as "createdAt" | "amount"]).localeCompare(String(right[query.sortBy as "createdAt" | "amount"]), "zh-Hans-CN", { numeric: true }) * direction);
  }
  return result;
}

/** 开发期任务状态写入本地持久化，作用域遵循当前登录租户和成员，生产环境由服务端会话替代。 */
function createOrderExportTask(query: OrderExportQuery): ExportTask {
  const startedAt = Date.now();
  const task: ExportTask = {
    id: createId("order-export"),
    title: "订单列表导出",
    status: "queued",
    progress: 0,
    createdAt: formatExportTaskTime(startedAt),
    filename: `订单导出-${new Date(startedAt).toISOString().slice(0, 10)}.csv`,
    downloadable: false,
  };
  const records = readOrderExportTaskRecords();
  records.unshift({ task, query: normalizeOrderExportQuery(query), startedAt });
  persistOrderExportTaskRecords(records);
  return cloneData(task);
}

function listOrderExportTasks(): ExportTask[] {
  return synchronizeOrderExportTaskRecords().map((record) => cloneData(record.task));
}

function retryOrderExportTask(id: string): ExportTask | null {
  const records = synchronizeOrderExportTaskRecords();
  const taskIndex = records.findIndex((record) => record.task.id === id);
  if (taskIndex < 0) return null;

  const startedAt = Date.now();
  const currentTask = records[taskIndex].task;
  records[taskIndex] = {
    ...records[taskIndex],
    startedAt,
    task: {
      ...currentTask,
      status: "queued",
      progress: 0,
      createdAt: formatExportTaskTime(startedAt),
      completedAt: undefined,
      errorMessage: undefined,
      downloadable: false,
      downloadUrl: undefined,
    },
  };
  persistOrderExportTaskRecords(records);
  return cloneData(records[taskIndex].task);
}

function removeOrderExportTask(id: string): boolean {
  const records = synchronizeOrderExportTaskRecords();
  const nextRecords = records.filter((record) => record.task.id !== id);
  if (nextRecords.length === records.length) return false;
  persistOrderExportTaskRecords(nextRecords);
  return true;
}

function getOrderExportDownload(id: string): SalesOrder[] | null {
  const record = synchronizeOrderExportTaskRecords().find((item) => item.task.id === id);
  if (!record || record.task.status !== "succeeded" || !record.task.downloadable) return null;
  return getOrderExportRows(record.query);
}

/** 查询时按实际经过时间推进异步状态，刷新页面后仍可恢复未完成任务。 */
function synchronizeOrderExportTaskRecords(): StoredOrderExportTask[] {
  const records = readOrderExportTaskRecords();
  const timestamp = Date.now();
  const nextRecords = records.map((record) => advanceOrderExportTask(record, timestamp));
  if (JSON.stringify(nextRecords) !== JSON.stringify(records)) persistOrderExportTaskRecords(nextRecords);
  return nextRecords;
}

function advanceOrderExportTask(record: StoredOrderExportTask, timestamp: number): StoredOrderExportTask {
  if (record.task.status !== "queued" && record.task.status !== "processing") return record;
  const elapsedTime = Math.max(0, timestamp - record.startedAt);
  if (elapsedTime >= ORDER_EXPORT_TASK_COMPLETE_DELAY) {
    return {
      ...record,
      task: {
        ...record.task,
        status: "succeeded",
        progress: 100,
        completedAt: formatExportTaskTime(timestamp),
        downloadable: true,
      },
    };
  }
  const progress = Math.min(96, Math.max(12, Math.round((elapsedTime / ORDER_EXPORT_TASK_COMPLETE_DELAY) * 100)));
  return { ...record, task: { ...record.task, status: "processing", progress } };
}

function readOrderExportTaskRecords(): StoredOrderExportTask[] {
  const storage = getBrowserLocalStorage();
  if (!storage) return [];
  try {
    const rawValue = storage.getItem(createOrderExportTaskStorageKey());
    if (!rawValue) return [];
    const values = JSON.parse(rawValue) as StoredOrderExportTaskValue[];
    if (!Array.isArray(values)) return [];
    return values.filter(isStoredOrderExportTask).map((value) => ({ task: { ...value.task }, query: { ...value.query }, startedAt: value.startedAt }));
  } catch {
    return [];
  }
}

function persistOrderExportTaskRecords(records: StoredOrderExportTask[]): void {
  const storage = getBrowserLocalStorage();
  if (!storage) return;
  storage.setItem(createOrderExportTaskStorageKey(), JSON.stringify(records));
}

function createOrderExportTaskStorageKey(): string {
  const profileScope = getCurrentProfileScope();
  return [ORDER_EXPORT_TASK_STORAGE_PREFIX, profileScope.tenantId, profileScope.userId].map((part) => encodeURIComponent(part)).join(":");
}

function getCurrentProfileScope(): { tenantId: string; userId: string } {
  const rawProfile = sessionStorage.getItem("aps-user-profile");
  if (!rawProfile) return { tenantId: "workspace-default", userId: "anonymous" };
  try {
    const profile = JSON.parse(rawProfile) as { tenantId?: string; id?: string };
    return {
      tenantId: profile.tenantId?.trim() || "workspace-default",
      userId: profile.id?.trim() || "anonymous",
    };
  } catch {
    return { tenantId: "workspace-default", userId: "anonymous" };
  }
}

function getBrowserLocalStorage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

/** 分片会话按当前租户与成员隔离；刷新后需重新选择同一文件，服务端再返回已完成分片。 */
function createChunkUploadSession(payload: ChunkUploadSessionPayload): UploadChunkSession {
  const timestamp = Date.now();
  const records = readChunkUploadSessions().filter((record) => timestamp - record.updatedAt <= CHUNK_UPLOAD_SESSION_TTL);
  const resumableRecord = records.find((record) => !record.completed
    && record.fileKey === payload.fileKey
    && record.fileSize === payload.fileSize
    && record.totalChunks === payload.totalChunks
    && record.chunkSize === payload.chunkSize);
  if (resumableRecord) {
    resumableRecord.updatedAt = timestamp;
    persistChunkUploadSessions(records);
    return toChunkUploadSession(resumableRecord);
  }

  const record: StoredChunkUploadSession = {
    ...payload,
    id: createId("upload-session"),
    uploadedChunkIndexes: [],
    completed: false,
    updatedAt: timestamp,
  };
  records.unshift(record);
  persistChunkUploadSessions(records);
  return toChunkUploadSession(record);
}

/** 同一分片重复提交保持幂等，便于网络超时后的安全重试。 */
function saveChunkUploadPart(sessionId: string, fileKey: string, chunkIndex: number, totalChunks: number): UploadChunkSession | null {
  const records = readChunkUploadSessions();
  const record = records.find((item) => item.id === sessionId);
  if (!record || record.completed || record.fileKey !== fileKey || record.totalChunks !== totalChunks || chunkIndex < 0 || chunkIndex >= totalChunks) return null;
  if (!record.uploadedChunkIndexes.includes(chunkIndex)) record.uploadedChunkIndexes.push(chunkIndex);
  record.uploadedChunkIndexes.sort((left, right) => left - right);
  record.updatedAt = Date.now();
  persistChunkUploadSessions(records);
  return toChunkUploadSession(record);
}

function completeChunkUploadSession(sessionId: string, payload: ChunkUploadCompletePayload): UploadedFile | null | undefined {
  const records = readChunkUploadSessions();
  const record = records.find((item) => item.id === sessionId);
  if (!record || record.fileKey !== payload.fileKey || record.totalChunks !== payload.totalChunks) return null;
  if (record.uploadedChunkIndexes.length !== record.totalChunks) return undefined;
  record.completed = true;
  record.fileId ??= createId("file");
  record.updatedAt = Date.now();
  persistChunkUploadSessions(records);
  return { id: record.fileId };
}

function readChunkUploadSessions(): StoredChunkUploadSession[] {
  const storage = getBrowserLocalStorage();
  if (!storage) return [];
  try {
    const rawValue = storage.getItem(createChunkUploadSessionStorageKey());
    if (!rawValue) return [];
    const values = JSON.parse(rawValue) as StoredChunkUploadSession[];
    return Array.isArray(values) ? values.filter(isStoredChunkUploadSession) : [];
  } catch {
    return [];
  }
}

function persistChunkUploadSessions(records: StoredChunkUploadSession[]): void {
  const storage = getBrowserLocalStorage();
  if (!storage) return;
  storage.setItem(createChunkUploadSessionStorageKey(), JSON.stringify(records));
}

function createChunkUploadSessionStorageKey(): string {
  const profileScope = getCurrentProfileScope();
  return [CHUNK_UPLOAD_SESSION_STORAGE_PREFIX, profileScope.tenantId, profileScope.userId].map((part) => encodeURIComponent(part)).join(":");
}

function toChunkUploadSession(record: StoredChunkUploadSession): UploadChunkSession {
  return { id: record.id, uploadedChunkIndexes: [...record.uploadedChunkIndexes] };
}

function isChunkUploadSessionPayload<TValue extends Partial<ChunkUploadSessionPayload>>(value: TValue): value is TValue & ChunkUploadSessionPayload {
  return typeof value.fileKey === "string"
    && value.fileKey.length > 0
    && value.fileKey.length <= 512
    && typeof value.fileName === "string"
    && value.fileName.length > 0
    && value.fileName.length <= 255
    && typeof value.fileSize === "number"
    && Number.isFinite(value.fileSize)
    && value.fileSize >= 0
    && typeof value.fileType === "string"
    && typeof value.chunkSize === "number"
    && Number.isInteger(value.chunkSize)
    && value.chunkSize >= 256 * 1024
    && typeof value.totalChunks === "number"
    && Number.isInteger(value.totalChunks)
    && value.totalChunks >= 1
    && value.totalChunks <= 10_000;
}

function isStoredChunkUploadSession(value: Partial<StoredChunkUploadSession>): value is StoredChunkUploadSession {
  return typeof value.id === "string"
    && value.id.length > 0
    && isChunkUploadSessionPayload(value)
    && Array.isArray(value.uploadedChunkIndexes)
    && value.uploadedChunkIndexes.every((index) => Number.isInteger(index) && index >= 0 && index < value.totalChunks)
    && typeof value.completed === "boolean"
    && (value.fileId === undefined || typeof value.fileId === "string")
    && typeof value.updatedAt === "number"
    && Number.isFinite(value.updatedAt);
}

function getFormDataValue(config: AxiosRequestConfig, key: string): string | undefined {
  if (!(config.data instanceof FormData)) return undefined;
  const value = config.data.get(key);
  return typeof value === "string" ? value : undefined;
}

function hasUploadedChunk(config: AxiosRequestConfig): boolean {
  return config.data instanceof FormData && config.data.get("chunk") instanceof Blob;
}

function normalizeOrderExportQuery(query: OrderExportQuery): OrderExportQuery {
  return {
    ...(query.keyword?.trim() ? { keyword: query.keyword.trim() } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.channel?.trim() ? { channel: query.channel.trim() } : {}),
    ...(query.sortBy ? { sortBy: query.sortBy } : {}),
    ...(query.sortOrder ? { sortOrder: query.sortOrder } : {}),
  };
}

function formatExportTaskTime(timestamp: number): string {
  return new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(timestamp));
}

function isStoredOrderExportTask(value: StoredOrderExportTaskValue): value is { task: ExportTask; query: OrderExportQuery; startedAt: number } {
  const task = value.task;
  return Boolean(task)
    && typeof task?.id === "string"
    && task.id.length > 0
    && typeof task.title === "string"
    && task.title.length > 0
    && isExportTaskStatus(task.status)
    && typeof task.createdAt === "string"
    && task.createdAt.length > 0
    && isOrderExportQuery(value.query)
    && typeof value.startedAt === "number"
    && Number.isFinite(value.startedAt);
}

function isExportTaskStatus(value: ExportTask["status"] | undefined): value is ExportTask["status"] {
  return value === "queued" || value === "processing" || value === "succeeded" || value === "failed";
}

function isOrderExportQuery(value: OrderExportQuery | undefined): value is OrderExportQuery {
  if (!value) return false;
  return (value.keyword === undefined || typeof value.keyword === "string")
    && (value.status === undefined || value.status === "pending_payment" || value.status === "paid" || value.status === "fulfilling" || value.status === "shipped" || value.status === "completed" || value.status === "cancelled")
    && (value.channel === undefined || typeof value.channel === "string")
    && (value.sortBy === undefined || value.sortBy === "createdAt" || value.sortBy === "amount")
    && (value.sortOrder === undefined || value.sortOrder === "asc" || value.sortOrder === "desc");
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getCurrentTimeLabel(): string {
  return "刚刚";
}

function saveUser(user: SystemUser): void {
  const index = database.users.findIndex((item) => item.id === user.id);
  if (index >= 0) {
    database.users.splice(index, 1, user);
  } else {
    database.users.unshift(user);
  }
  persistCollection("users", database.users);
}

function saveRole(role: SystemRole): void {
  const index = database.roles.findIndex((item) => item.id === role.id);
  if (index >= 0) {
    database.roles.splice(index, 1, role);
  } else {
    database.roles.unshift(role);
  }
  persistCollection("roles", database.roles);
}

function saveMenu(menu: SystemMenu): void {
  const index = database.menus.findIndex((item) => item.id === menu.id);
  if (index >= 0) {
    database.menus.splice(index, 1, menu);
  } else {
    database.menus.push(menu);
  }
  database.menus.sort((left, right) => left.sortOrder - right.sortOrder);
  persistCollection("menus", database.menus);
}

function removeCollectionItem<TItem extends { id: string }>(key: CollectionKey, collection: TItem[], id: string): boolean {
  const index = collection.findIndex((item) => item.id === id);
  if (index < 0) {
    return false;
  }
  collection.splice(index, 1);
  persistCollection(key, collection);
  return true;
}

/** 本地接口适配器用于开发期数据联调，保留真实服务的响应语义和错误分支。 */
export const mockAdapter: AxiosAdapter = async (config) => {
  await new Promise((resolve) => window.setTimeout(resolve, RESPONSE_DELAY));

  const method = (config.method ?? "get").toLowerCase();
  const requestKey = `${method} ${config.url}`;
  let response: AdapterResponse;

  switch (requestKey) {
    case "post /auth/login":
      response = createSuccessResponse(cloneData((loginResponse as ApiResponse<LoginResult>).data), "登录成功");
      break;
    case "get /dashboard/workbench":
      response = createSuccessResponse(cloneData((dashboardResponse as ApiResponse<DashboardData>).data), "获取工作台数据成功");
      break;
    case "post /files/upload": {
      const file = getUploadedFile(config);
      response = file
        ? createSuccessResponse({ id: createId("file") }, "文件上传成功")
        : createErrorResponse("未找到需要上传的文件。");
      break;
    }
    case "post /files/upload-sessions": {
      const payload = getRequestData<Partial<ChunkUploadSessionPayload>>(config);
      response = isChunkUploadSessionPayload(payload)
        ? createSuccessResponse(createChunkUploadSession(payload), "上传会话已准备就绪")
        : createErrorResponse("上传会话参数不完整或格式无效。");
      break;
    }
    case "get /system/users":
      response = createPageResponse(database.users, config, ["name", "account", "department", "role", "status"], "获取用户列表成功", filterUsers);
      break;
    case "post /system/users": {
      const payload = getRequestData<SystemUserInput>(config);
      if (database.users.some((item) => item.account === payload.account)) {
        response = createErrorResponse("账号已存在，请使用其他账号。", 409);
        break;
      }
      const user: SystemUser = { id: createId("user"), ...payload, lastActiveAt: "从未登录" };
      saveUser(user);
      response = createSuccessResponse(user, "新增用户成功");
      break;
    }
    case "put /system/users": {
      const payload = getRequestData<Partial<SystemUserInput> & Pick<SystemUser, "id">>(config);
      const currentUser = database.users.find((item) => item.id === payload.id);
      if (!currentUser) {
        response = createErrorResponse("未找到要更新的用户。", 404);
        break;
      }
      const user = { ...currentUser, ...payload, lastActiveAt: getCurrentTimeLabel() };
      saveUser(user);
      response = createSuccessResponse(user, "更新用户成功");
      break;
    }
    case "patch /system/users/status": {
      const payload = getRequestData<UserStatusPayload>(config);
      database.users.forEach((user, index) => {
        if (payload.ids.includes(user.id)) {
          database.users[index] = { ...user, status: payload.status, lastActiveAt: getCurrentTimeLabel() };
        }
      });
      persistCollection("users", database.users);
      response = createSuccessResponse(null, "更新用户状态成功");
      break;
    }
    case "delete /system/users": {
      const payload = getRequestData<Pick<SystemUser, "id">>(config);
      response = removeCollectionItem("users", database.users, payload.id) ? createSuccessResponse(null, "移除用户成功") : createErrorResponse("未找到要移除的用户。", 404);
      break;
    }
    case "get /system/roles":
      response = createPageResponse(database.roles, config, ["name", "code", "description"], "获取角色列表成功");
      break;
    case "post /system/roles": {
      const payload = getRequestData<SystemRoleInput>(config);
      if (database.roles.some((item) => item.code === payload.code)) {
        response = createErrorResponse("角色编码已存在，请使用其他编码。", 409);
        break;
      }
      const role: SystemRole = { id: createId("role"), ...payload, memberCount: 0, updatedAt: getCurrentTimeLabel() };
      saveRole(role);
      response = createSuccessResponse(role, "新增角色成功");
      break;
    }
    case "put /system/roles": {
      const payload = getRequestData<Partial<SystemRoleInput> & Pick<SystemRole, "id">>(config);
      const currentRole = database.roles.find((item) => item.id === payload.id);
      if (!currentRole) {
        response = createErrorResponse("未找到要更新的角色。", 404);
        break;
      }
      const role = { ...currentRole, ...payload, updatedAt: getCurrentTimeLabel() };
      saveRole(role);
      response = createSuccessResponse(role, "更新角色成功");
      break;
    }
    case "delete /system/roles": {
      const payload = getRequestData<Pick<SystemRole, "id">>(config);
      response = removeCollectionItem("roles", database.roles, payload.id) ? createSuccessResponse(null, "删除角色成功") : createErrorResponse("未找到要删除的角色。", 404);
      break;
    }
    case "get /system/menus":
      response = createPageResponse(database.menus, config, ["name", "path", "permission", "status"], "获取菜单列表成功");
      break;
    case "get /business/orders":
      response = createPageResponse(orders, config, ["orderNo", "customerName", "productSummary", "channel", "status", "createdAt", "amount"], "获取订单列表成功", filterOrders);
      break;
    case "get /business/orders/export":
      response = createSuccessResponse(getOrderExportRows(config.params as OrderExportQuery), "导出订单数据成功");
      break;
    case "post /business/orders/export-tasks": {
      const query = getRequestData<OrderExportQuery>(config);
      response = createSuccessResponse(createOrderExportTask(query), "已创建订单导出任务");
      break;
    }
    case "get /business/orders/export-tasks":
      response = createSuccessResponse(listOrderExportTasks(), "获取订单导出任务成功");
      break;
    case "post /system/menus": {
      const payload = getRequestData<SystemMenuInput>(config);
      if (database.menus.some((item) => item.path === payload.path)) {
        response = createErrorResponse("访问路径已存在，请使用其他路径。", 409);
        break;
      }
      const menu: SystemMenu = { id: createId("menu"), ...payload, updatedAt: getCurrentTimeLabel() };
      saveMenu(menu);
      response = createSuccessResponse(menu, "新增菜单成功");
      break;
    }
    case "put /system/menus": {
      const payload = getRequestData<Partial<SystemMenuInput> & Pick<SystemMenu, "id">>(config);
      const currentMenu = database.menus.find((item) => item.id === payload.id);
      if (!currentMenu) {
        response = createErrorResponse("未找到要更新的菜单。", 404);
        break;
      }
      const menu = { ...currentMenu, ...payload, updatedAt: getCurrentTimeLabel() };
      saveMenu(menu);
      response = createSuccessResponse(menu, "更新菜单成功");
      break;
    }
    case "delete /system/menus": {
      const payload = getRequestData<Pick<SystemMenu, "id">>(config);
      response = removeCollectionItem("menus", database.menus, payload.id) ? createSuccessResponse(null, "删除菜单成功") : createErrorResponse("未找到要删除的菜单。", 404);
      break;
    }
    default: {
      const chunkUploadPartMatch = method === "post" ? config.url?.match(/^\/files\/upload-sessions\/([^/]+)\/chunks\/(\d+)$/) : null;
      const chunkUploadCompleteMatch = method === "post" ? config.url?.match(/^\/files\/upload-sessions\/([^/]+)\/complete$/) : null;
      const orderExportTaskDownloadMatch = method === "get" ? config.url?.match(/^\/business\/orders\/export-tasks\/([^/]+)\/download$/) : null;
      const orderExportTaskRetryMatch = method === "post" ? config.url?.match(/^\/business\/orders\/export-tasks\/([^/]+)\/retry$/) : null;
      const orderExportTaskRemoveMatch = method === "delete" ? config.url?.match(/^\/business\/orders\/export-tasks\/([^/]+)$/) : null;
      const orderIdMatch = method === "get" ? config.url?.match(/^\/business\/orders\/([^/]+)$/) : null;
      if (chunkUploadPartMatch) {
        const fileKey = getFormDataValue(config, "fileKey");
        const totalChunks = Number(getFormDataValue(config, "totalChunks"));
        const chunkIndex = Number(getFormDataValue(config, "chunkIndex"));
        const session = fileKey && Number.isInteger(totalChunks) && Number.isInteger(chunkIndex) && hasUploadedChunk(config)
          ? saveChunkUploadPart(decodeURIComponent(chunkUploadPartMatch[1]), fileKey, chunkIndex, totalChunks)
          : null;
        response = session ? createSuccessResponse(null, "分片上传成功") : createErrorResponse("分片上传会话无效或已结束。", 409);
      } else if (chunkUploadCompleteMatch) {
        const payload = getRequestData<Partial<ChunkUploadCompletePayload>>(config);
        const completedFile = typeof payload.fileKey === "string" && payload.fileKey.length > 0 && Number.isInteger(payload.totalChunks)
          ? completeChunkUploadSession(decodeURIComponent(chunkUploadCompleteMatch[1]), payload as ChunkUploadCompletePayload)
          : null;
        response = completedFile === undefined
          ? createErrorResponse("仍有分片未上传完成。", 409)
          : completedFile
            ? createSuccessResponse(completedFile, "分片文件已合并完成")
            : createErrorResponse("上传会话不存在或不匹配。", 404);
      } else if (orderExportTaskDownloadMatch) {
        const rows = getOrderExportDownload(decodeURIComponent(orderExportTaskDownloadMatch[1]));
        response = rows ? createSuccessResponse(rows, "获取订单导出文件成功") : createErrorResponse("导出文件暂不可用，请稍后重试。", 409);
      } else if (orderExportTaskRetryMatch) {
        const task = retryOrderExportTask(decodeURIComponent(orderExportTaskRetryMatch[1]));
        response = task ? createSuccessResponse(task, "订单导出任务已重新提交") : createErrorResponse("未找到需要重试的导出任务。", 404);
      } else if (orderExportTaskRemoveMatch) {
        response = removeOrderExportTask(decodeURIComponent(orderExportTaskRemoveMatch[1]))
          ? createSuccessResponse(null, "订单导出任务已移除")
          : createErrorResponse("未找到需要移除的导出任务。", 404);
      } else if (orderIdMatch) {
        const order = orders.find((item) => item.id === decodeURIComponent(orderIdMatch[1]));
        response = order ? createSuccessResponse(cloneData(order), "获取订单详情成功") : createErrorResponse("未找到对应的订单。", 404);
      } else {
        response = createErrorResponse("请求的资源不存在。", 404);
      }
    }
  }

  return createAxiosResponse(config, response);
};
