<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { AppButton } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import { AppDescriptions } from "aps-design-pro";
import { AppDrawer } from "aps-design-pro";
import { AppFormField } from "aps-design-pro";
import { AppIcon } from "aps-design-pro";
import { AppInput } from "aps-design-pro";
import { useAuthStore } from "@/stores/auth";
import { useFeedbackStore } from "@/stores/feedback";
import type { DescriptionItem } from "aps-design-pro";

const authStore = useAuthStore();
const feedbackStore = useFeedbackStore();
const isPasswordDrawerOpen = ref(false);
const profileForm = reactive({ name: "", title: "" });
const passwordForm = reactive({ currentPassword: "", nextPassword: "", confirmPassword: "" });
const passwordError = ref("");
const currentProfile = computed(() => authStore.profile);
const profileDescriptions = computed<DescriptionItem[]>(() => [
  { label: "账号 ID", value: currentProfile.value?.id ?? "—" },
  { label: "当前角色", value: currentProfile.value?.roles.join("、") ?? "—" },
  { label: "工作区", value: "产品工作区" },
]);

watch(currentProfile, (profile) => {
  profileForm.name = profile?.name ?? "";
  profileForm.title = profile?.title ?? "";
}, { immediate: true });

function saveProfile(): void {
  const name = profileForm.name.trim();
  const title = profileForm.title.trim();
  if (!name || !title) {
    feedbackStore.show("请完整填写姓名和职位信息。", "error");
    return;
  }

  authStore.updateProfile({ name, title, initials: name.slice(0, 1) });
  feedbackStore.show("个人资料已保存。", "success");
}

function closePasswordDrawer(): void {
  isPasswordDrawerOpen.value = false;
  passwordError.value = "";
  passwordForm.currentPassword = "";
  passwordForm.nextPassword = "";
  passwordForm.confirmPassword = "";
}

/** 密码修改保留完整校验与反馈路径，后续可将提交逻辑替换为认证服务接口。 */
function savePassword(): void {
  passwordError.value = "";
  if (!passwordForm.currentPassword || !passwordForm.nextPassword || !passwordForm.confirmPassword) {
    passwordError.value = "请完整填写密码信息。";
    return;
  }
  if (passwordForm.nextPassword.length < 8) {
    passwordError.value = "新密码至少需要 8 个字符。";
    return;
  }
  if (passwordForm.nextPassword !== passwordForm.confirmPassword) {
    passwordError.value = "两次输入的新密码不一致。";
    return;
  }
  closePasswordDrawer();
  feedbackStore.show("登录密码已更新。", "success");
}
</script>

<template>
  <section class="page-content page-stack">
    <div class="profile-grid">
      <AppCard as="section" class="account-card"><span class="large-avatar">{{ currentProfile?.initials }}</span><div><h2>{{ currentProfile?.name }}</h2><p>{{ currentProfile?.title }}</p></div><AppDescriptions :items="profileDescriptions" :columns="1" /></AppCard>
      <AppCard as="section" class="form-card"><header><div><h2>基础资料</h2><p>更新后会在顶部账户菜单中同步显示。</p></div></header><form class="profile-form" @submit.prevent="saveProfile"><AppFormField label="姓名" for="profile-name" required><AppInput id="profile-name" v-model="profileForm.name" autocomplete="name" /></AppFormField><AppFormField label="职位" for="profile-title" required><AppInput id="profile-title" v-model="profileForm.title" /></AppFormField><footer><AppButton type="submit">保存资料</AppButton></footer></form></AppCard>
    </div>
    <AppCard as="section" class="security-card"><div class="security-icon"><AppIcon name="lock" :size="20" /></div><div><h2>登录安全</h2><p>定期更新密码，并妥善保管你的账户信息。</p></div><AppButton variant="secondary" @click="isPasswordDrawerOpen = true">修改密码</AppButton></AppCard>
    <AppDrawer :model-value="isPasswordDrawerOpen" title="修改密码" description="新密码至少需要 8 个字符。" @update:model-value="closePasswordDrawer"><form class="password-form" @submit.prevent="savePassword"><AppFormField label="当前密码" for="current-password" required><AppInput id="current-password" v-model="passwordForm.currentPassword" type="password" autocomplete="current-password" /></AppFormField><AppFormField label="新密码" for="next-password" required><AppInput id="next-password" v-model="passwordForm.nextPassword" type="password" autocomplete="new-password" /></AppFormField><AppFormField label="确认新密码" for="confirm-password" :error="passwordError" required><AppInput id="confirm-password" v-model="passwordForm.confirmPassword" type="password" autocomplete="new-password" :invalid="Boolean(passwordError)" /></AppFormField><AppButton class="password-submit" type="submit" block>更新密码</AppButton></form></AppDrawer>
  </section>
</template>

<style scoped>
.profile-grid { display: grid; grid-template-columns: minmax(280px, .8fr) minmax(0, 1.2fr); gap: 20px; }.account-card :deep(.card-content) { display: flex; flex-direction: column; align-items: flex-start; }.large-avatar { display: grid; width: 58px; height: 58px; place-items: center; border-radius: 18px; background: var(--aps-dark); color: var(--aps-surface); font-size: 22px; font-weight: var(--aps-font-weight-heading); }.account-card h2 { margin: 16px 0 0; color: var(--aps-ink); font-size: 20px; font-weight: var(--aps-font-weight-heading); letter-spacing: -.03em; }.account-card p { margin: 4px 0 0; color: var(--aps-muted); font-size: var(--aps-text-sm); }.account-card :deep(.app-descriptions) { width: 100%; margin-top: 25px; }.form-card header h2, .form-card header p { margin: 0; }.form-card header h2, .security-card h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: var(--aps-font-weight-heading); letter-spacing: -.02em; }.form-card header p, .security-card p { margin: 5px 0 0; color: var(--aps-muted); font-size: var(--aps-text-sm); }.profile-form { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 12px; margin-top: 23px; }.profile-form footer { grid-column: 1 / -1; margin-top: 4px; }.security-card :deep(.card-content) { display: flex; align-items: center; gap: 13px; }.security-icon { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 12px; background: var(--aps-blue-soft); color: var(--aps-blue); }.security-card :deep(.card-content > div:nth-child(2)) { flex: 1; }.password-form { display: grid; gap: var(--aps-form-gap); }.password-submit { margin-top: 4px; }@media (max-width: 760px) { .profile-grid { grid-template-columns: 1fr; }.profile-form { grid-template-columns: 1fr; }.security-card :deep(.card-content) { align-items: flex-start; flex-wrap: wrap; }.security-card :deep(.app-button-control) { margin-left: 55px; } }
</style>
