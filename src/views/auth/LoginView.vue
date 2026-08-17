<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { AppButton } from "aps-design-pro";
import { AppCheckbox } from "aps-design-pro";
import { AppFormField } from "aps-design-pro";
import { AppInput } from "aps-design-pro";
import { useAuthStore } from "@/stores/auth";
import { useFeedbackStore } from "@/stores/feedback";
import type { LoginPayload } from "@/types/auth";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const feedbackStore = useFeedbackStore();

const form = reactive<LoginPayload>({
  account: "admin",
  password: "demo123",
  remember: true,
});
const accountError = ref("");
const passwordError = ref("");
const submitError = ref("");
const isSubmitting = ref(false);

/** 仅校验本地必填项；登录结果始终由统一服务层决定。 */
function validateForm(): boolean {
  accountError.value = form.account.trim() ? "" : "请输入账号。";
  passwordError.value = form.password ? "" : "请输入密码。";
  return !accountError.value && !passwordError.value;
}

/** 避免将登录后的跳转地址导向站外页面。 */
function getRedirectPath(): string {
  const redirect = route.query.redirect;
  const path = typeof redirect === "string" ? redirect : "/dashboard";
  return path.startsWith("/") && !path.startsWith("//") ? path : "/dashboard";
}

async function submitLogin(): Promise<void> {
  submitError.value = "";
  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;
  try {
    await authStore.login({ ...form, account: form.account.trim() });
    feedbackStore.show("已进入产品工作区。", "success");
    await router.replace(getRedirectPath());
  } catch (error) {
    submitError.value = error instanceof Error ? error.message : "暂时无法登录，请稍后重试。";
  } finally {
    isSubmitting.value = false;
  }
}

function showAccountHelp(label: string): void {
  feedbackStore.show(`${label}指引已发送至账户关联邮箱。`, "success");
}
</script>

<template>
  <main class="login-page">
    <section class="login-context" aria-label="产品工作区说明">
      <div class="context-header">
        <div class="brand-mark" aria-hidden="true"><span></span><span></span></div>
        <span>aps-design-pro</span>
      </div>

      <div class="context-main">
        <p class="context-kicker">欢迎回来</p>
        <h1>清晰管理，<br />从现在开始。</h1>
        <p>在安静、可追溯的工作区中，专注处理成员、权限与应用配置。</p>
      </div>

      <div class="context-window" aria-label="产品工作区预览">
        <div class="window-bar"><span class="window-title">产品工作区</span><span class="window-status"><i aria-hidden="true"></i>已同步</span></div>
        <div class="window-body">
          <aside class="window-navigation" aria-hidden="true"><span class="is-active"></span><span></span><span></span><span></span></aside>
          <div class="window-canvas" aria-hidden="true">
            <div class="canvas-heading"><span></span><small></small></div>
            <div class="canvas-metrics"><i></i><i></i><i></i></div>
            <div class="canvas-record"><span></span><span></span><span></span></div>
          </div>
        </div>
      </div>
    </section>

    <section class="login-panel" aria-labelledby="login-title">
      <div class="login-card">
        <div class="login-heading">
          <h2 id="login-title">登录工作区</h2>
          <p>使用你的账户进入产品工作区。</p>
        </div>

        <form class="login-form" novalidate @submit.prevent="submitLogin">
          <AppFormField label="账号" for="account" :error="accountError" required>
            <template #default="{ describedBy }"><AppInput id="account" v-model="form.account" :invalid="Boolean(accountError)" :described-by="describedBy" autocomplete="username" placeholder="请输入账号" @update:model-value="accountError = ''" /></template>
          </AppFormField>

          <AppFormField label="密码" for="password" :error="passwordError" required>
            <template #extra><button type="button" class="text-action" @click="showAccountHelp('密码重置')">忘记密码？</button></template>
            <template #default="{ describedBy }"><AppInput id="password" v-model="form.password" type="password" :invalid="Boolean(passwordError)" :described-by="describedBy" autocomplete="current-password" placeholder="请输入密码" @update:model-value="passwordError = ''" /></template>
          </AppFormField>

          <AppCheckbox v-model="form.remember" class="remember-control" label="在此设备上保持登录" />

          <p v-if="submitError" class="submit-error" role="alert">{{ submitError }}</p>
          <AppButton class="login-submit" type="submit" size="large" block :loading="isSubmitting">{{ isSubmitting ? "正在进入工作区…" : "登录" }}</AppButton>
        </form>

        <div class="demo-credentials"><strong>管理员账户</strong><span><code>admin</code><i>/</i><code>demo123</code></span></div>
        <p class="legal-note">登录即表示你已阅读并同意<a href="#agreement" @click.prevent="showAccountHelp('用户协议')">《用户协议》</a>与<a href="#privacy" @click.prevent="showAccountHelp('隐私说明')">《隐私说明》</a>。</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.login-page { display: grid; grid-template-columns: minmax(0, 7fr) minmax(380px, 3fr); min-height: 100vh; background: var(--aps-surface); }
.login-context { display: grid; min-width: 0; grid-template-rows: auto minmax(0, 1fr) auto; padding: clamp(34px, 5vw, 72px); background: var(--aps-canvas); }
.context-header { display: inline-flex; align-items: center; gap: 10px; color: var(--aps-ink); font-size: 15px; font-weight: var(--aps-font-weight-heading); letter-spacing: -0.03em; }
.brand-mark { display: grid; grid-template-columns: repeat(2, 7px); grid-template-rows: repeat(2, 7px); gap: 3px; width: 29px; height: 29px; place-content: center; border-radius: 9px; background: var(--aps-ink); }
.brand-mark span:first-child { grid-row: 1 / span 2; border-radius: 2px 2px 2px 5px; background: #ffffff; }
.brand-mark span:last-child { border-radius: 2px 5px 2px 2px; background: var(--aps-blue); }
.context-main { max-width: 500px; align-self: center; padding: 20px 0 34px; }
.context-kicker { margin: 0 0 14px; color: var(--aps-muted); font-size: 13px; font-weight: var(--aps-font-weight-primary); }
h1 { max-width: 470px; margin: 0; color: var(--aps-ink); font-size: clamp(30px, 2.5vw, 38px); font-weight: var(--aps-font-weight-heading); letter-spacing: -0.05em; line-height: 1.12; }
.context-main > p:last-child { max-width: 400px; margin: 18px 0 0; color: var(--aps-muted); font-size: 15px; line-height: 1.7; }
.context-window { max-width: 620px; overflow: hidden; border: 1px solid var(--aps-line-soft); border-radius: 16px; background: var(--aps-surface); box-shadow: 0 18px 34px rgba(29, 29, 31, 0.05); }
.window-bar { display: flex; min-height: 46px; align-items: center; justify-content: space-between; padding: 0 16px; border-bottom: 1px solid var(--aps-line-soft); color: var(--aps-muted); font-size: var(--aps-text-xs); }
.window-title { color: var(--aps-ink); font-weight: var(--aps-font-weight-strong); }.window-status { display: inline-flex; align-items: center; gap: 6px; }.window-status i { width: 6px; height: 6px; border-radius: 50%; background: var(--aps-green); }
.window-body { display: grid; grid-template-columns: 104px minmax(0, 1fr); min-height: 202px; }.window-navigation { display: grid; align-content: start; gap: 12px; padding: 20px 16px; border-right: 1px solid var(--aps-line-soft); background: var(--aps-surface-soft); }.window-navigation span { display: block; width: 100%; height: 8px; border-radius: 99px; background: rgba(29, 29, 31, 0.1); }.window-navigation span:nth-child(2) { width: 72%; }.window-navigation span:nth-child(3) { width: 82%; }.window-navigation span:nth-child(4) { width: 62%; }.window-navigation .is-active { background: var(--aps-blue); }
.window-canvas { display: grid; align-content: start; gap: 18px; padding: 24px; }.canvas-heading { display: flex; align-items: center; justify-content: space-between; }.canvas-heading span { width: 118px; height: 13px; border-radius: 5px; background: var(--aps-ink); }.canvas-heading small { width: 56px; height: 8px; border-radius: 99px; background: var(--aps-line-soft); }.canvas-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }.canvas-metrics i { display: block; height: 52px; border: 1px solid var(--aps-line-soft); border-radius: 10px; background: linear-gradient(to bottom, var(--aps-surface) 0 55%, var(--aps-surface-soft) 55% 100%); }.canvas-metrics i:first-child { border-color: rgba(0, 113, 227, 0.22); background: linear-gradient(to bottom, var(--aps-blue-soft) 0 55%, var(--aps-surface) 55% 100%); }.canvas-record { display: grid; gap: 9px; padding-top: 2px; border-top: 1px solid var(--aps-line-soft); }.canvas-record span { display: block; height: 7px; border-radius: 99px; background: var(--aps-surface-soft); }.canvas-record span:nth-child(2) { width: 84%; }.canvas-record span:nth-child(3) { width: 66%; }
.login-panel { display: grid; place-items: center; padding: 32px; border-left: 1px solid var(--aps-line-soft); }
.login-card { width: min(100%, 352px); }
.login-heading h2 { margin: 0; color: var(--aps-ink); font-size: 27px; font-weight: var(--aps-font-weight-heading); letter-spacing: -0.04em; line-height: 1.2; }
.login-heading p { margin: 9px 0 0; color: var(--aps-muted); font-size: 13px; }
.login-form { display: grid; gap: 12px; margin-top: 30px; }
.text-action { min-height: 24px; padding: 0; border: 0; background: transparent; color: var(--aps-blue); font-size: 12px; font-weight: var(--aps-font-weight-primary); }
.text-action:hover { color: var(--aps-blue-hover); text-decoration: underline; text-underline-offset: 3px; }
.submit-error { margin: 0; color: var(--aps-red); font-size: 12px; line-height: 1.45; }
.remember-control { width: fit-content; margin-top: 4px; }.login-submit { margin-top: 8px; }
.demo-credentials { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 24px; padding: 12px 13px; border: 1px solid var(--aps-line-soft); border-radius: 11px; background: var(--aps-surface-soft); color: var(--aps-muted); font-size: 12px; }
.demo-credentials strong { color: #3a3a3e; font-weight: var(--aps-font-weight-strong); }
.demo-credentials span { display: inline-flex; gap: 5px; }
code { color: var(--aps-ink); font-family: var(--aps-font); font-size: 12px; font-weight: var(--aps-font-weight-primary); }
i { color: var(--aps-faint); font-style: normal; }
.legal-note { margin: 16px 0 0; color: var(--aps-faint); font-size: 11px; line-height: 1.65; }
.legal-note a { color: var(--aps-muted); text-decoration: underline; text-underline-offset: 2px; }
@media (max-width: 800px) { .login-page { grid-template-columns: 1fr; } .login-context { display: none; } .login-panel { min-height: 100vh; border-left: 0; } }
@media (max-width: 440px) { .login-panel { padding: 24px; } .demo-credentials { align-items: flex-start; flex-direction: column; gap: 5px; } }
</style>
