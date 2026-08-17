<script setup lang="ts">
import { ref } from "vue";
import { AppButton, AppIcon } from "aps-design-pro";
import { AppAutocomplete } from "aps-design-pro";
import { AppInput } from "aps-design-pro";
import { AppTextarea } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import type { AutocompleteFetchContext, AutocompleteOption } from "aps-design-pro";

const password = ref("Course-2026!");
const projectCode = ref("APS-COURSE-001");
const note = ref("课程资源将在审核通过后同步到对应工作区。\n可继续补充授权范围、交付时间等说明。");
const resourceQuery = ref("");
const remoteResourceQuery = ref("");
const inputStatus = ref("尚未操作输入框。");
const remoteInputStatus = ref("输入课程名称即可加载匹配建议。");
const resourceOptions: AutocompleteOption[] = [
  { key: "resource-vue", label: "Vue 工程化课程", value: "Vue 工程化课程", description: "前端课程资源 · 42 节" },
  { key: "resource-react", label: "React 架构实战", value: "React 架构实战", description: "前端课程资源 · 36 节" },
  { key: "resource-java", label: "Java 服务端课程", value: "Java 服务端课程", description: "服务端课程资源 · 48 节" },
  { key: "resource-go", label: "Go 微服务实践", value: "Go 微服务实践", description: "服务端课程资源 · 28 节" },
];

function resetInputExamples(): void {
  password.value = "Course-2026!";
  projectCode.value = "APS-COURSE-001";
  note.value = "课程资源将在审核通过后同步到对应工作区。\n可继续补充授权范围、交付时间等说明。";
  resourceQuery.value = "";
  remoteResourceQuery.value = "";
  inputStatus.value = "已恢复示例内容。";
  remoteInputStatus.value = "输入课程名称即可加载匹配建议。";
}

function handleResourceQuery(keyword: string): void {
  inputStatus.value = keyword ? `正在匹配“${keyword}”相关课程。` : "可输入课程名称，或使用方向键选择建议。";
}

function handleResourceSelect(option: AutocompleteOption): void {
  inputStatus.value = `已选择“${option.label}”。`;
}

function waitForSuggestionResponse(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      signal.removeEventListener("abort", abortRequest);
      resolve();
    }, 360);
    const abortRequest = (): void => {
      window.clearTimeout(timer);
      signal.removeEventListener("abort", abortRequest);
      reject(new DOMException("联想请求已取消。", "AbortError"));
    };
    if (signal.aborted) {
      abortRequest();
      return;
    }
    signal.addEventListener("abort", abortRequest, { once: true });
  });
}

/** 异步建议只接收关键词和取消信号，后续接入接口时无需改动组件层。 */
async function fetchRemoteResourceSuggestions({ query, signal }: AutocompleteFetchContext): Promise<AutocompleteOption[]> {
  await waitForSuggestionResponse(signal);
  const keyword = query.trim().toLocaleLowerCase();
  if (!keyword) return resourceOptions.slice(0, 3);
  return resourceOptions.filter((option) => `${option.label} ${option.description ?? ""}`.toLocaleLowerCase().includes(keyword));
}

function handleRemoteResourceQuery(keyword: string): void {
  remoteInputStatus.value = keyword ? `正在检索“${keyword}”相关课程。` : "正在加载推荐课程。";
}

function handleRemoteResourceLoaded(options: AutocompleteOption[], keyword: string): void {
  remoteInputStatus.value = keyword ? `已加载 ${options.length} 条“${keyword}”相关建议。` : `已加载 ${options.length} 条推荐课程。`;
}

function handleRemoteResourceSelect(option: AutocompleteOption): void {
  remoteInputStatus.value = `已加载并选择“${option.label}”。`;
}
</script>

<template>
  <section class="input-features-view page-content page-stack" aria-label="输入能力组件示例">
    <AppCard as="section">
      <header class="showcase-heading">
        <div><h2>组合输入</h2><p>前后缀、清空、密码显隐和字符统计可同时使用；组件会合并操作区，不让业务页面判断互斥关系。</p></div>
        <AppButton variant="secondary" size="small" @click="resetInputExamples">恢复示例</AppButton>
      </header>
      <div class="input-demo-grid">
        <label class="input-demo-field">
          <span>课程资源访问密码</span>
          <AppInput v-model="password" type="password" show-password clearable autocomplete="current-password" aria-label="课程资源访问密码" @focus="inputStatus = '密码输入框已获取焦点。'" @blur="inputStatus = '密码输入框已失去焦点。'" @change="inputStatus = '密码内容已确认。'">
            <template #prefix><AppIcon name="lock" :size="16" /></template>
            <template #suffix><span class="input-suffix-copy">已加密</span></template>
          </AppInput>
        </label>
        <label class="input-demo-field">
          <span>项目编码</span>
          <AppInput v-model="projectCode" :max-length="24" show-word-limit clearable aria-label="项目编码" @focus="inputStatus = '项目编码输入框已获取焦点。'" @change="inputStatus = '项目编码已确认。'">
            <template #prefix><AppIcon name="grid" :size="16" /></template>
          </AppInput>
        </label>
      </div>
      <p class="input-status" aria-live="polite">{{ inputStatus }}</p>
    </AppCard>

    <AppCard as="section">
      <header class="showcase-heading"><div><h2>联想输入</h2><p>本地与异步建议共用同一个组件，均支持键盘上下选择、回车确认和清空；业务层只保存稳定的选择值。</p></div></header>
      <div class="autocomplete-demo-grid">
        <div class="autocomplete-demo"><strong>本地过滤</strong><AppAutocomplete v-model="resourceQuery" :options="resourceOptions" clearable placeholder="搜索课程资源" aria-label="搜索课程资源" @query="handleResourceQuery" @select="handleResourceSelect" /><p class="autocomplete-note">{{ resourceQuery || '尚未选择课程资源' }}</p></div>
        <div class="autocomplete-demo"><strong>异步建议</strong><AppAutocomplete v-model="remoteResourceQuery" :fetch-suggestions="fetchRemoteResourceSuggestions" :debounce="240" clearable placeholder="输入课程名称加载建议" aria-label="异步搜索课程资源" @query="handleRemoteResourceQuery" @fetch-success="handleRemoteResourceLoaded" @select="handleRemoteResourceSelect" /><p class="autocomplete-note">{{ remoteInputStatus }}</p></div>
      </div>
    </AppCard>

    <AppCard as="section">
      <header class="showcase-heading"><div><h2>自适应多行输入</h2><p>字数统计与最大长度保持一致；内容增长时高度自动扩展，到达设定行数后改为内部滚动。</p></div></header>
      <AppTextarea v-model="note" :autosize="{ minRows: 2, maxRows: 5 }" :max-length="120" show-word-limit placeholder="补充课程资源说明" aria-label="课程资源说明" @focus="inputStatus = '说明输入框已获取焦点。'" @change="inputStatus = '课程资源说明已确认。'" />
    </AppCard>
  </section>
</template>

<style scoped>
.input-features-view { max-width: 960px; }.showcase-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 22px; }.showcase-heading h2, .showcase-heading p { margin: 0; }.showcase-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: var(--aps-font-weight-heading); letter-spacing: -.02em; }.showcase-heading p { max-width: 64ch; margin-top: 7px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.input-demo-grid, .autocomplete-demo-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }.input-demo-field { display: grid; gap: 7px; color: var(--aps-muted); font-size: var(--aps-text-sm); font-weight: var(--aps-font-weight-primary); }.input-suffix-copy { color: var(--aps-faint); font-size: var(--aps-text-xs); white-space: nowrap; }.input-status, .autocomplete-note { min-height: 20px; margin: 14px 0 0; color: var(--aps-faint); font-size: var(--aps-text-xs); }.autocomplete-demo { display: grid; gap: 9px; min-width: 0; }.autocomplete-demo > strong { color: var(--aps-muted); font-size: var(--aps-text-sm); font-weight: var(--aps-font-weight-strong); }@media (max-width: 680px) { .showcase-heading { flex-direction: column; }.input-demo-grid, .autocomplete-demo-grid { grid-template-columns: 1fr; } }
</style>
