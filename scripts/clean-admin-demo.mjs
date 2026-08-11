import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const argumentsSet = new Set(process.argv.slice(2));
const supportedArguments = new Set(["--apply", "--allow-dirty", "--dry-run"]);
const unknownArguments = [...argumentsSet].filter((argument) => !supportedArguments.has(argument));
const isApplyMode = argumentsSet.has("--apply");
const allowsDirtyWorktree = argumentsSet.has("--allow-dirty");

/**
 * 仅允许删除当前 demo 中已核实的业务实现目录，避免脚本接收任意路径导致误删。
 * 这些目录均会由下方 starterFiles 重建为最小开发骨架所需的结构。
 */
const removalTargets = [
  "src/api/mock-adapter.ts",
  "src/api/modules",
  "src/composables",
  "src/mock",
  "src/stores/app.ts",
  "src/stores/auth.ts",
  "src/stores/tabs.ts",
  "src/types/auth.ts",
  "src/types/dashboard.ts",
  "src/types/ecommerce.ts",
  "src/types/files.ts",
  "src/types/orders.ts",
  "src/types/system.ts",
  "src/views",
  "screenshots",
];

/** 清理后仍可直接启动的最小应用文件。所有业务接口、mock 与具体页面均不再保留。 */
const starterFiles = {
  ".env.example": `# 本地开发时替换为实际后端地址；留空时默认使用 /api。\nVITE_API_BASE_URL=/api\n`,
  "README.md": `# APS Design Pro 管理后台骨架\n\n这是由 demo 清理脚本生成的最小开发起点。项目只保留一个可直接打开的“经营总览”入口、应用外壳、统一请求客户端、请求/响应拦截器、全局网络状态与消息提示。\n\n## 本地运行\n\n\`\`\`bash\npnpm install\npnpm dev\n\`\`\`\n\n默认访问 \`/dashboard\`，无需依赖本地 mock 或登录接口。\n\n## 接入后端\n\n在 \`.env.local\` 中配置：\n\n\`\`\`bash\nVITE_API_BASE_URL=https://api.example.com\n\`\`\`\n\n统一请求入口是 \`src/api/client.ts\`。它会自动附带 \`aps-access-token\`，并按以下响应契约返回 \`data\`：\n\n\`\`\`ts\ninterface ApiResponse<T> {\n  code: number;\n  message: string;\n  data: T;\n  timestamp: number;\n}\n\`\`\`\n\n新增业务时，建议按以下顺序创建：\n\n1. 在 \`src/api/modules/\` 定义接口函数。\n2. 在 \`src/views/\` 创建页面。\n3. 在 \`src/config/navigation.ts\` 注册侧栏入口。\n4. 在 \`src/router/index.ts\` 注册路由。\n\n## 再次执行清理\n\n\`\`\`bash\npnpm scaffold:clean:preview  # 仅预览\npnpm scaffold:clean          # 真正清理\n\`\`\`\n\n正式清理默认要求 Git 工作区干净；确有需要时可执行 \`node scripts/clean-admin-demo.mjs --apply --allow-dirty\`。\n`,
  "src/App.vue": `<script setup lang="ts">\nimport { storeToRefs } from "pinia";\nimport { RouterView } from "vue-router";\nimport { AppConfigProvider, AppNetworkLoadingOverlay, AppToast } from "aps-design-pro";\nimport { useFeedbackStore } from "@/stores/feedback";\nimport { useNetworkStore } from "@/stores/network";\n\nconst feedbackStore = useFeedbackStore();\nconst networkStore = useNetworkStore();\nconst { messages } = storeToRefs(feedbackStore);\nconst { isLoading } = storeToRefs(networkStore);\n</script>\n\n<template>\n  <AppConfigProvider>\n    <RouterView />\n    <AppNetworkLoadingOverlay :loading="isLoading" />\n    <AppToast :items="messages" @action="feedbackStore.triggerAction" @close="feedbackStore.close" />\n  </AppConfigProvider>\n</template>\n`,
  "src/api/client.ts": `import axios, { type AxiosRequestConfig } from "axios";\nimport { useNetworkStore } from "@/stores/network";\nimport type { ApiResponse } from "@/types/api";\n\nconst accessTokenStorageKey = "aps-access-token";\nconst apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";\n\nconst httpClient = axios.create({\n  baseURL: apiBaseUrl,\n  timeout: 10_000,\n});\n\n/** 令牌在请求入口统一注入，新增业务接口无需重复处理鉴权头。 */\nhttpClient.interceptors.request.use((config) => {\n  useNetworkStore().beginRequest();\n  const accessToken = sessionStorage.getItem(accessTokenStorageKey);\n  if (accessToken) config.headers.Authorization = \`Bearer \${accessToken}\`;\n  return config;\n}, (error: unknown) => {\n  useNetworkStore().endRequest();\n  return Promise.reject(error);\n});\n\n/** 成功和失败请求都必须回收计数，避免全局加载遮罩一直停留。 */\nhttpClient.interceptors.response.use((response) => {\n  useNetworkStore().endRequest();\n  return response;\n}, (error: unknown) => {\n  useNetworkStore().endRequest();\n  return Promise.reject(error);\n});\n\n/**\n * 页面和接口模块唯一使用的请求入口。后端响应不符合统一契约时立即报错，\n * 防止错误数据在页面中被当成正常结果继续使用。\n */\nexport async function request<TData>(config: AxiosRequestConfig): Promise<TData> {\n  const response = await httpClient.request<ApiResponse<TData>>(config);\n  const payload = response.data;\n\n  if (!payload || typeof payload.code !== "number") {\n    throw new Error("接口响应不符合约定的 ApiResponse 结构。");\n  }\n\n  if (payload.code !== 0) {\n    throw new Error(payload.message || "请求未成功完成。");\n  }\n\n  return payload.data;\n}\n`,
  "src/api/modules/.gitkeep": "",
  "src/config/navigation.ts": `import type { IconName } from "aps-design-pro";\n\nexport interface StarterNavigationItem {\n  key: string;\n  label: string;\n  path: string;\n  icon: IconName;\n}\n\n/** 初始导航只有一个稳定入口，新增业务页面时在此显式注册。 */\nexport const starterNavigation: StarterNavigationItem[] = [\n  { key: "dashboard", label: "经营总览", path: "/dashboard", icon: "grid" },\n];\n`,
  "src/layouts/AppLayout.vue": `<script setup lang="ts">\nimport { computed } from "vue";\nimport { RouterLink, RouterView, useRoute } from "vue-router";\nimport { starterNavigation } from "@/config/navigation";\n\nconst route = useRoute();\nconst pageTitle = computed(() => String(route.meta.title ?? "经营总览"));\n</script>\n\n<template>\n  <div class="starter-shell">\n    <aside class="starter-sidebar" aria-label="主导航">\n      <RouterLink class="starter-brand" to="/dashboard">APS Design Pro</RouterLink>\n      <nav class="starter-navigation">\n        <RouterLink\n          v-for="item in starterNavigation"\n          :key="item.key"\n          :to="item.path"\n          class="starter-navigation-item"\n          active-class="is-active"\n        >\n          {{ item.label }}\n        </RouterLink>\n      </nav>\n    </aside>\n\n    <main class="starter-main">\n      <header class="starter-header">\n        <span>{{ pageTitle }}</span>\n        <small>开发骨架</small>\n      </header>\n      <RouterView />\n    </main>\n  </div>\n</template>\n\n<style scoped>\n.starter-shell { display: grid; min-height: 100vh; grid-template-columns: 220px minmax(0, 1fr); background: var(--aps-page-bg, #f6f8fb); }\n.starter-sidebar { display: flex; flex-direction: column; gap: 28px; padding: 24px 14px; border-right: 1px solid var(--aps-border, #e5eaf1); background: var(--aps-surface, #fff); }\n.starter-brand { padding: 0 10px; color: var(--aps-ink, #172033); font-size: 16px; font-weight: 720; letter-spacing: -.02em; text-decoration: none; }\n.starter-navigation { display: grid; gap: 4px; }.starter-navigation-item { padding: 9px 10px; border-radius: 8px; color: var(--aps-muted, #697386); font-size: 14px; text-decoration: none; }.starter-navigation-item:hover, .starter-navigation-item.is-active { background: var(--aps-blue-soft, #edf5ff); color: var(--aps-blue, #2468f2); font-weight: 650; }\n.starter-main { min-width: 0; }.starter-header { display: flex; align-items: center; justify-content: space-between; height: 64px; padding: 0 28px; border-bottom: 1px solid var(--aps-border, #e5eaf1); background: var(--aps-surface, #fff); color: var(--aps-ink, #172033); font-size: 15px; font-weight: 680; }.starter-header small { color: var(--aps-faint, #9099aa); font-size: 12px; font-weight: 500; }\n@media (max-width: 640px) { .starter-shell { grid-template-columns: 1fr; }.starter-sidebar { flex-direction: row; align-items: center; justify-content: space-between; padding: 14px 18px; }.starter-navigation { display: block; }.starter-navigation-item { display: block; }.starter-header { padding: 0 18px; } }\n</style>\n`,
  "src/router/index.ts": `import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";\nimport AppLayout from "@/layouts/AppLayout.vue";\n\nconst WorkbenchView = () => import("@/views/dashboard/WorkbenchView.vue");\n\nconst routes: RouteRecordRaw[] = [\n  {\n    path: "/",\n    component: AppLayout,\n    redirect: "/dashboard",\n    children: [\n      { path: "dashboard", name: "dashboard", component: WorkbenchView, meta: { title: "经营总览" } },\n    ],\n  },\n  { path: "/:pathMatch(.*)*", redirect: "/dashboard" },\n];\n\n/**\n * 骨架阶段默认不启用登录守卫，以便尚未接入后端时也能直接开发页面。\n * 接入认证后在此添加 beforeEach，并使用 client.ts 统一注入令牌即可。\n */\nconst router = createRouter({ history: createWebHistory(), routes });\n\nexport default router;\n`,
  "src/types/api.ts": `/** 后端统一响应结构，新增接口应通过 request<T> 只向页面返回 data。 */\nexport interface ApiResponse<TData> {\n  code: number;\n  message: string;\n  data: TData;\n  timestamp: number;\n}\n\n/** 列表接口统一使用分页载荷，避免页面直接依赖某个后端的字段命名。 */\nexport interface PageResult<TItem> {\n  list: TItem[];\n  total: number;\n  page: number;\n  pageSize: number;\n}\n\nexport type SortOrder = "asc" | "desc";\n`,
  "src/views/dashboard/WorkbenchView.vue": `<script setup lang="ts">\nimport { AppCard } from "aps-design-pro";\n</script>\n\n<template>\n  <section class="dashboard-page">\n    <AppCard as="section" padding="large">\n      <p class="dashboard-kicker">STARTER</p>\n      <h1>经营总览</h1>\n      <p class="dashboard-description">业务页面、数据模型和 mock 已清理完成。现在可以从接口模块、路由和导航开始构建你的管理后台。</p>\n    </AppCard>\n\n    <div class="dashboard-guide" aria-label="开始开发">\n      <AppCard as="article">\n        <h2>1. 定义接口</h2>\n        <p>在 <code>src/api/modules</code> 中创建资源接口函数，并复用统一的 <code>request</code> 方法。</p>\n      </AppCard>\n      <AppCard as="article">\n        <h2>2. 创建页面</h2>\n        <p>在 <code>src/views</code> 中按业务域新增页面组件，页面只负责展示和交互。</p>\n      </AppCard>\n      <AppCard as="article">\n        <h2>3. 注册入口</h2>\n        <p>在路由与导航配置中显式添加入口，避免菜单、权限和页面来源不一致。</p>\n      </AppCard>\n    </div>\n  </section>\n</template>\n\n<style scoped>\n.dashboard-page { display: grid; gap: 18px; padding: 28px; }.dashboard-kicker, h1, h2, p { margin: 0; }.dashboard-kicker { color: var(--aps-blue, #2468f2); font-size: 12px; font-weight: 760; letter-spacing: .08em; }.dashboard-page h1 { margin-top: 8px; color: var(--aps-ink, #172033); font-size: 28px; letter-spacing: -.04em; }.dashboard-description { max-width: 680px; margin-top: 10px; color: var(--aps-muted, #697386); font-size: 14px; line-height: 1.7; }.dashboard-guide { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }.dashboard-guide h2 { color: var(--aps-ink, #172033); font-size: 16px; }.dashboard-guide p { margin-top: 8px; color: var(--aps-muted, #697386); font-size: 14px; line-height: 1.7; }.dashboard-guide code { color: var(--aps-ink, #172033); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }@media (max-width: 860px) { .dashboard-guide { grid-template-columns: 1fr; } }@media (max-width: 640px) { .dashboard-page { padding: 18px; } }\n</style>\n`,
};

/**
 * 登录与认证属于后台基础设施而非业务页面。清理时重建它们，
 * 让项目接入 Node/Supabase 后无需从零补齐会话与路由保护。
 */
const authenticationStarterFiles = {
  ".env.example": `# 本地开发时替换为实际后端地址；留空时默认使用 /api。\nVITE_API_BASE_URL=/api\n# 开启后，除登录页外的路由必须持有 Node 服务签发的访问令牌。\nVITE_AUTH_REQUIRED=false\n`,
  "README.md": `# APS Design Pro 管理后台骨架\n\n这是由 demo 清理脚本生成的最小开发起点。项目保留登录页、单一“经营总览”入口、应用外壳、统一请求客户端、请求/响应拦截器、全局网络状态与消息提示。\n\n## 本地运行\n\n\`\`\`bash\npnpm install\npnpm dev\n\`\`\`\n\n默认访问 \`/dashboard\`，无需依赖本地 mock 或登录接口；\`/login\` 始终可访问，用于开发登录流程。\n\n## 接入后端\n\n在 \`.env.local\` 中配置：\n\n\`\`\`bash\nVITE_API_BASE_URL=https://api.example.com\nVITE_AUTH_REQUIRED=true\n\`\`\`\n\n统一请求入口是 \`src/api/client.ts\`。它会自动附带 \`aps-access-token\`，并按以下响应契约返回 \`data\`：\n\n\`\`\`ts\ninterface ApiResponse<T> {\n  code: number;\n  message: string;\n  data: T;\n  timestamp: number;\n}\n\`\`\`\n\n认证开启后，登录页会调用 \`POST /auth/login\`，并要求 Node 服务按统一响应体返回 \`{ accessToken }\`。前端只保存访问令牌；Supabase 的服务端密钥必须只由 Node 服务持有。\n\n新增业务时，建议按以下顺序创建：\n\n1. 在 \`src/api/modules/\` 定义接口函数。\n2. 在 \`src/views/\` 创建页面。\n3. 在 \`src/config/navigation.ts\` 注册侧栏入口。\n4. 在 \`src/router/index.ts\` 注册路由。\n\n## 再次执行清理\n\n\`\`\`bash\npnpm scaffold:clean:preview  # 仅预览\npnpm scaffold:clean          # 真正清理\n\`\`\`\n\n正式清理默认要求 Git 工作区干净；确有需要时可执行 \`node scripts/clean-admin-demo.mjs --apply --allow-dirty\`。\n`,
  "src/api/client.ts": `import axios, { type AxiosRequestConfig } from "axios";\nimport { useNetworkStore } from "@/stores/network";\nimport type { ApiResponse } from "@/types/api";\n\nconst accessTokenStorageKey = "aps-access-token";\nconst apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";\n\nconst httpClient = axios.create({\n  baseURL: apiBaseUrl,\n  timeout: 10_000,\n});\n\n/** 令牌在请求入口统一注入，新增业务接口无需重复处理鉴权头。 */\nhttpClient.interceptors.request.use((config) => {\n  useNetworkStore().beginRequest();\n  const accessToken = sessionStorage.getItem(accessTokenStorageKey) ?? localStorage.getItem(accessTokenStorageKey);\n  if (accessToken) config.headers.Authorization = \`Bearer \${accessToken}\`;\n  return config;\n}, (error: unknown) => {\n  useNetworkStore().endRequest();\n  return Promise.reject(error);\n});\n\n/** 成功和失败请求都必须回收计数，避免全局加载遮罩一直停留。 */\nhttpClient.interceptors.response.use((response) => {\n  useNetworkStore().endRequest();\n  return response;\n}, (error: unknown) => {\n  useNetworkStore().endRequest();\n  return Promise.reject(error);\n});\n\n/** 页面和接口模块唯一使用的请求入口，后端响应不符合统一契约时立即报错。 */\nexport async function request<TData>(config: AxiosRequestConfig): Promise<TData> {\n  const response = await httpClient.request<ApiResponse<TData>>(config);\n  const payload = response.data;\n\n  if (!payload || typeof payload.code !== "number") {\n    throw new Error("接口响应不符合约定的 ApiResponse 结构。");\n  }\n\n  if (payload.code !== 0) {\n    throw new Error(payload.message || "请求未成功完成。");\n  }\n\n  return payload.data;\n}\n`,
  "src/api/modules/auth.ts": `import { request } from "@/api/client";\nimport type { LoginPayload, LoginResult } from "@/types/auth";\n\n/** 认证接口由 Node 服务实现，前端不直接访问认证服务的管理密钥。 */\nexport function login(payload: LoginPayload): Promise<LoginResult> {\n  return request<LoginResult>({\n    url: "/auth/login",\n    method: "post",\n    data: payload,\n  });\n}\n`,
  "src/stores/auth.ts": `import { computed, ref } from "vue";\nimport { defineStore } from "pinia";\nimport { login as loginRequest } from "@/api/modules/auth";\nimport type { LoginPayload } from "@/types/auth";\n\nexport const ACCESS_TOKEN_STORAGE_KEY = "aps-access-token";\n\n/** 认证状态只管理令牌生命周期，用户资料与权限可在接入业务后按实际模型扩展。 */\nexport const useAuthStore = defineStore("auth", () => {\n  const accessToken = ref(readAccessToken());\n  const isAuthenticated = computed(() => Boolean(accessToken.value));\n\n  async function login(payload: LoginPayload): Promise<void> {\n    const result = await loginRequest(payload);\n    saveAccessToken(result.accessToken, payload.remember);\n    accessToken.value = result.accessToken;\n  }\n\n  function logout(): void {\n    accessToken.value = "";\n    sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);\n    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);\n  }\n\n  return { accessToken, isAuthenticated, login, logout };\n});\n\nfunction readAccessToken(): string {\n  return sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) ?? localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) ?? "";\n}\n\nfunction saveAccessToken(accessToken: string, remember: boolean): void {\n  sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);\n  if (remember) localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);\n  else localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);\n}\n`,
  "src/types/auth.ts": `/** 登录接口仅保留最小凭据载荷，具体登录方式可由后端扩展。 */\nexport interface LoginPayload {\n  account: string;\n  password: string;\n  remember: boolean;\n}\n\n/** Node 服务将任意认证提供方的响应归一为访问令牌，避免页面耦合 Supabase 字段。 */\nexport interface LoginResult {\n  accessToken: string;\n}\n`,
  "src/views/auth/LoginView.vue": `<script setup lang="ts">\nimport { computed, reactive, ref } from "vue";\nimport { useRoute, useRouter } from "vue-router";\nimport { AppButton } from "aps-design-pro";\nimport { useAuthStore } from "@/stores/auth";\n\nconst router = useRouter();\nconst route = useRoute();\nconst authStore = useAuthStore();\nconst isAuthenticationRequired = import.meta.env.VITE_AUTH_REQUIRED === "true";\nconst isSubmitting = ref(false);\nconst errorMessage = ref("");\nconst form = reactive({ account: "", password: "", remember: true });\nconst redirectPath = computed(() => {\n  const redirect = route.query.redirect;\n  return typeof redirect === "string" && redirect.startsWith("/") ? redirect : "/dashboard";\n});\n\n/** 未接入后端时保留登录页视觉与路由，提交后直接进入工作台以支持页面开发。 */\nasync function submitLogin(): Promise<void> {\n  errorMessage.value = "";\n  if (!isAuthenticationRequired) {\n    await router.replace(redirectPath.value);\n    return;\n  }\n\n  isSubmitting.value = true;\n  try {\n    await authStore.login({ ...form });\n    await router.replace(redirectPath.value);\n  } catch (error) {\n    errorMessage.value = error instanceof Error ? error.message : "登录失败，请稍后重试。";\n  } finally {\n    isSubmitting.value = false;\n  }\n}\n</script>\n\n<template>\n  <main class="login-page">\n    <section class="login-panel" aria-labelledby="login-title">\n      <p>APS DESIGN PRO</p>\n      <h1 id="login-title">{{ isAuthenticationRequired ? "登录管理后台" : "开发工作台" }}</h1>\n      <span>{{ isAuthenticationRequired ? "使用已接入的认证服务继续访问。" : "认证尚未启用，可直接进入经营总览开始开发。" }}</span>\n\n      <form class="login-form" @submit.prevent="submitLogin">\n        <template v-if="isAuthenticationRequired">\n          <label><span>账号</span><input v-model.trim="form.account" type="text" name="account" autocomplete="username" minlength="2" maxlength="120" required /></label>\n          <label><span>密码</span><input v-model="form.password" type="password" name="password" autocomplete="current-password" minlength="6" maxlength="256" required /></label>\n          <label class="login-remember"><input v-model="form.remember" type="checkbox" /> <span>在此设备保持登录</span></label>\n        </template>\n        <p v-if="errorMessage" class="login-error" role="alert">{{ errorMessage }}</p>\n        <AppButton class="login-submit" type="submit" :loading="isSubmitting">{{ isAuthenticationRequired ? "登录" : "进入经营总览" }}</AppButton>\n      </form>\n    </section>\n  </main>\n</template>\n\n<style scoped>\n.login-page { display: grid; min-height: 100vh; place-items: center; padding: 24px; background: radial-gradient(circle at top, #edf5ff 0, #f7f9fc 44%, #eef1f6 100%); }.login-panel { width: min(100%, 408px); padding: 38px; border: 1px solid rgba(210, 218, 230, .85); border-radius: 20px; background: rgba(255, 255, 255, .9); box-shadow: 0 24px 64px rgba(25, 44, 78, .1); }.login-panel > p, .login-panel h1, .login-panel > span { margin: 0; }.login-panel > p { color: var(--aps-blue, #2468f2); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; font-weight: 760; letter-spacing: .08em; }.login-panel h1 { margin-top: 14px; color: var(--aps-ink, #172033); font-size: 30px; letter-spacing: -.04em; }.login-panel > span { display: block; margin-top: 10px; color: var(--aps-muted, #697386); font-size: 14px; line-height: 1.7; }.login-form { display: grid; gap: 16px; margin-top: 28px; }.login-form label { display: grid; gap: 7px; color: var(--aps-ink, #172033); font-size: 13px; font-weight: 650; }.login-form input[type="text"], .login-form input[type="password"] { width: 100%; height: 38px; box-sizing: border-box; padding: 0 11px; border: 1px solid var(--aps-line, #d9dfe8); border-radius: 8px; background: var(--aps-surface, #fff); color: var(--aps-ink, #172033); font: inherit; font-weight: 400; outline: none; }.login-form input:focus { border-color: var(--aps-blue, #2468f2); box-shadow: 0 0 0 3px rgba(36, 104, 242, .14); }.login-form .login-remember { display: flex; align-items: center; gap: 7px; color: var(--aps-muted, #697386); font-weight: 500; }.login-remember input { width: 14px; height: 14px; margin: 0; }.login-error { margin: -4px 0 0; color: var(--aps-red, #d14343); font-size: 13px; line-height: 1.5; }.login-submit { width: 100%; margin-top: 4px; }@media (max-width: 480px) { .login-page { padding: 16px; }.login-panel { padding: 28px 24px; } }\n</style>\n`,
  "src/layouts/AppLayout.vue": `<script setup lang="ts">\nimport { computed } from "vue";\nimport { RouterLink, RouterView, useRoute, useRouter } from "vue-router";\nimport { starterNavigation } from "@/config/navigation";\nimport { useAuthStore } from "@/stores/auth";\n\nconst route = useRoute();\nconst router = useRouter();\nconst authStore = useAuthStore();\nconst pageTitle = computed(() => String(route.meta.title ?? "经营总览"));\nconst isAuthenticationRequired = import.meta.env.VITE_AUTH_REQUIRED === "true";\n\n/** 退出时同时清除会话与本地令牌，避免公共设备在刷新后仍可访问后台。 */\nasync function logout(): Promise<void> {\n  authStore.logout();\n  await router.replace("/login");\n}\n</script>\n\n<template>\n  <div class="starter-shell">\n    <aside class="starter-sidebar" aria-label="主导航">\n      <RouterLink class="starter-brand" to="/dashboard">APS Design Pro</RouterLink>\n      <nav class="starter-navigation">\n        <RouterLink v-for="item in starterNavigation" :key="item.key" :to="item.path" class="starter-navigation-item" active-class="is-active">\n          {{ item.label }}\n        </RouterLink>\n      </nav>\n    </aside>\n\n    <main class="starter-main">\n      <header class="starter-header">\n        <span>{{ pageTitle }}</span>\n        <div class="starter-header__actions">\n          <small>开发骨架</small>\n          <button v-if="isAuthenticationRequired" type="button" @click="logout">退出登录</button>\n        </div>\n      </header>\n      <RouterView />\n    </main>\n  </div>\n</template>\n\n<style scoped>\n.starter-shell { display: grid; min-height: 100vh; grid-template-columns: 220px minmax(0, 1fr); background: var(--aps-page-bg, #f6f8fb); }.starter-sidebar { display: flex; flex-direction: column; gap: 28px; padding: 24px 14px; border-right: 1px solid var(--aps-border, #e5eaf1); background: var(--aps-surface, #fff); }.starter-brand { padding: 0 10px; color: var(--aps-ink, #172033); font-size: 16px; font-weight: 720; letter-spacing: -.02em; text-decoration: none; }.starter-navigation { display: grid; gap: 4px; }.starter-navigation-item { padding: 9px 10px; border-radius: 8px; color: var(--aps-muted, #697386); font-size: 14px; text-decoration: none; }.starter-navigation-item:hover, .starter-navigation-item.is-active { background: var(--aps-blue-soft, #edf5ff); color: var(--aps-blue, #2468f2); font-weight: 650; }.starter-main { min-width: 0; }.starter-header { display: flex; align-items: center; justify-content: space-between; height: 64px; padding: 0 28px; border-bottom: 1px solid var(--aps-border, #e5eaf1); background: var(--aps-surface, #fff); color: var(--aps-ink, #172033); font-size: 15px; font-weight: 680; }.starter-header__actions { display: flex; align-items: center; gap: 12px; }.starter-header small { color: var(--aps-faint, #9099aa); font-size: 12px; font-weight: 500; }.starter-header button { padding: 5px 8px; border: 0; border-radius: 6px; background: var(--aps-surface-soft, #f1f4f8); color: var(--aps-muted, #697386); font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }.starter-header button:hover { color: var(--aps-ink, #172033); }@media (max-width: 640px) { .starter-shell { grid-template-columns: 1fr; }.starter-sidebar { flex-direction: row; align-items: center; justify-content: space-between; padding: 14px 18px; }.starter-navigation { display: block; }.starter-navigation-item { display: block; }.starter-header { padding: 0 18px; } }\n</style>\n`,
  "src/router/index.ts": `import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";\nimport AppLayout from "@/layouts/AppLayout.vue";\nimport { useAuthStore } from "@/stores/auth";\n\nconst LoginView = () => import("@/views/auth/LoginView.vue");\nconst WorkbenchView = () => import("@/views/dashboard/WorkbenchView.vue");\nconst isAuthenticationRequired = import.meta.env.VITE_AUTH_REQUIRED === "true";\n\ndeclare module "vue-router" {\n  interface RouteMeta {\n    title?: string;\n    public?: boolean;\n  }\n}\n\nconst routes: RouteRecordRaw[] = [\n  { path: "/login", name: "login", component: LoginView, meta: { title: "登录", public: true } },\n  {\n    path: "/",\n    component: AppLayout,\n    redirect: "/dashboard",\n    children: [\n      { path: "dashboard", name: "dashboard", component: WorkbenchView, meta: { title: "经营总览" } },\n    ],\n  },\n  { path: "/:pathMatch(.*)*", redirect: "/dashboard" },\n];\n\n/** 认证默认关闭，方便在尚未接入后端时直接开发页面；启用环境变量后统一保护业务路由。 */\nconst router = createRouter({ history: createWebHistory(), routes });\n\nrouter.beforeEach((to) => {\n  if (!isAuthenticationRequired || to.meta.public) return true;\n  const authStore = useAuthStore();\n  if (authStore.isAuthenticated) return true;\n  return { name: "login", query: { redirect: to.fullPath } };\n});\n\nexport default router;\n`,
};

Object.assign(starterFiles, authenticationStarterFiles);

function fail(message) {
  console.error(`[清理骨架] ${message}`);
  process.exitCode = 1;
}

function resolveProjectPath(relativePath) {
  const absolutePath = resolve(projectRoot, relativePath);
  const pathFromProject = relative(projectRoot, absolutePath);
  if (!pathFromProject || pathFromProject.startsWith("..") || isAbsolute(pathFromProject)) {
    throw new Error(`拒绝操作项目外路径：${relativePath}`);
  }
  return absolutePath;
}

function ensureDemoProject() {
  const packagePath = resolveProjectPath("package.json");
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  if (packageJson.name !== "aps-design-admin-demo") {
    throw new Error("当前目录不是 aps-design-admin-demo，已停止执行。");
  }
}

function hasDirtyGitWorktree() {
  try {
    return execFileSync("git", ["status", "--porcelain"], { cwd: projectRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim().length > 0;
  } catch {
    /** 非 Git 项目可直接运行，路径白名单仍会生效。 */
    return false;
  }
}

function printPlan() {
  console.info("[清理骨架] 将删除以下业务实现目录：");
  removalTargets.forEach((target) => console.info(`  - ${target}`));
  console.info("[清理骨架] 将重建登录与认证骨架、最小应用外壳、单一经营总览、统一请求客户端和导航配置。");
}

function removeTarget(relativePath) {
  const targetPath = resolveProjectPath(relativePath);
  if (existsSync(targetPath)) rmSync(targetPath, { recursive: true, force: true });
}

function writeStarterFile(relativePath, content) {
  const filePath = resolveProjectPath(relativePath);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf8");
}

if (unknownArguments.length > 0) {
  fail(`不支持的参数：${unknownArguments.join(" ")}`);
} else if (argumentsSet.has("--dry-run") && isApplyMode) {
  fail("--dry-run 与 --apply 不能同时使用。");
} else {
  try {
    ensureDemoProject();
    printPlan();

    if (!isApplyMode) {
      console.info("[清理骨架] 当前为预览模式。使用 --apply 后才会删除或覆盖文件。");
    } else if (hasDirtyGitWorktree() && !allowsDirtyWorktree) {
      fail("检测到未提交改动。请先提交或暂存；确认需要覆盖时使用 --apply --allow-dirty。");
    } else {
      removalTargets.forEach(removeTarget);
      Object.entries(starterFiles).forEach(([relativePath, content]) => writeStarterFile(relativePath, content));
      console.info("[清理骨架] 已生成最小开发骨架。请执行 pnpm build 验证结果。");
    }
  } catch (error) {
    fail(error instanceof Error ? error.message : "脚本执行失败。");
  }
}
