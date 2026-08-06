<script setup lang="ts">
import { computed, ref } from "vue";
import { AppAvatar, AppAvatarGroup, AppBadge, AppButton, AppIconButton, type AvatarGroupItem } from "aps-design-pro";
import { AppSwitch } from "aps-design-pro";
import { AppCard } from "aps-design-pro";

const unreadCount = ref(3);
const displayAsDot = ref(false);
const hideBadge = ref(false);
const showZero = ref(false);
const avatarGroupMax = ref(3);
const badgeOffset = ref<[number, number]>([0, 0]);
const projectMembers: AvatarGroupItem[] = [
  { key: "lin", name: "林知远", initials: "林" },
  { key: "chen", name: "陈雨晨", initials: "陈" },
  { key: "wang", name: "王宇航", initials: "王" },
  { key: "zhao", name: "赵晴", initials: "赵" },
  { key: "liu", name: "刘维", initials: "刘" },
];

const visibleMessage = computed(() => hideBadge.value ? "徽标已隐藏。" : displayAsDot.value ? "当前使用圆点提示。" : unreadCount.value === 0 && !showZero.value ? "零值已按规则隐藏。" : `当前显示 ${unreadCount.value} 条未读消息。`);

function increaseUnreadCount(): void {
  unreadCount.value = Math.min(120, unreadCount.value + 1);
}

function clearUnreadCount(): void {
  unreadCount.value = 0;
}

function toggleBadgeOffset(): void {
  badgeOffset.value = badgeOffset.value[0] === 0 ? [6, -3] : [0, 0];
}

function toggleAvatarGroupMax(): void {
  avatarGroupMax.value = avatarGroupMax.value === 3 ? 0 : 3;
}
</script>

<template>
  <section class="badge-view page-content page-stack" aria-label="徽标组件示例">
    <AppCard as="section">
      <header class="showcase-heading">
        <div><h2>锚定内容</h2><p>徽标直接包裹头像、图标按钮或其他内容，自身处理定位，不再由业务页面手写绝对定位。</p></div>
        <AppButton variant="secondary" size="small" @click="toggleBadgeOffset">切换偏移</AppButton>
      </header>
      <div class="badge-anchor-grid">
        <article><AppBadge :value="unreadCount" :offset="badgeOffset" aria-label="林知远的未读通知"><AppAvatar name="林知远" size="large" /></AppBadge><strong>头像提醒</strong><span>偏移：{{ badgeOffset[0] }}, {{ badgeOffset[1] }}</span></article>
        <article><AppBadge :value="unreadCount" :max="99" tone="blue" aria-label="通知中心未读消息"><AppIconButton icon="bell" label="查看通知中心" /></AppBadge><strong>图标按钮</strong><span>超过 99 条自动显示 99+</span></article>
        <article><AppBadge dot tone="green" aria-label="交付服务在线"><span class="service-indicator">交付服务</span></AppBadge><strong>在线状态</strong><span>圆点适合弱提示状态</span></article>
      </div>
      <section class="avatar-group-demo" aria-label="头像组组件示例">
        <div><h3>成员头像组</h3><p>头像组统一处理重叠排列和溢出成员数量，业务页只提供成员数据与可见数量。</p></div>
        <AppAvatarGroup :items="projectMembers" :max="avatarGroupMax" aria-label="课程发布成员" />
        <AppButton size="small" variant="secondary" @click="toggleAvatarGroupMax">{{ avatarGroupMax === 3 ? "显示全部成员" : "收起为 3 人" }}</AppButton>
      </section>
    </AppCard>

    <AppCard as="section">
      <header class="showcase-heading">
        <div><h2>显示控制</h2><p>数字、圆点、零值与隐藏状态由组件统一处理，触发内容不需要了解徽标的渲染规则。</p></div>
        <span class="control-status" aria-live="polite">{{ visibleMessage }}</span>
      </header>
      <div class="badge-control-layout">
        <div class="badge-preview-box"><AppBadge :value="unreadCount" :dot="displayAsDot" :hidden="hideBadge" :show-zero="showZero" tone="red" aria-label="消息中心未读数量"><AppButton leading-icon="bell" variant="secondary">消息中心</AppButton></AppBadge></div>
        <div class="badge-controls">
          <AppSwitch v-model="displayAsDot" label="显示为圆点" />
          <AppSwitch v-model="hideBadge" label="隐藏徽标" />
          <AppSwitch v-model="showZero" label="零值时保留徽标" />
          <div class="control-actions"><AppButton size="small" @click="increaseUnreadCount">增加未读</AppButton><AppButton size="small" variant="secondary" @click="clearUnreadCount">清空未读</AppButton></div>
        </div>
      </div>
    </AppCard>
  </section>
</template>

<style scoped>
.badge-view { max-width: 1040px; }.showcase-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 22px; }.showcase-heading h2, .showcase-heading p, .avatar-group-demo h3, .avatar-group-demo p { margin: 0; }.showcase-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: 720; letter-spacing: -.02em; }.showcase-heading p { max-width: 62ch; margin-top: 7px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.badge-anchor-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px; overflow: hidden; border: 1px solid var(--aps-line-soft); border-radius: 12px; background: var(--aps-line-soft); }.badge-anchor-grid article { display: grid; min-height: 164px; align-content: center; justify-items: center; gap: 8px; padding: 18px; background: var(--aps-surface); text-align: center; }.badge-anchor-grid strong { margin-top: 5px; color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: 680; }.badge-anchor-grid article > span { color: var(--aps-faint); font-size: var(--aps-text-xs); }.service-indicator { display: inline-flex; min-height: 36px; align-items: center; padding: 0 12px; border: 1px solid var(--aps-line-soft); border-radius: 9px; background: var(--aps-surface-soft); color: var(--aps-muted); font-size: var(--aps-text-sm); }.avatar-group-demo { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 16px; margin-top: 16px; padding: 16px 18px; border: 1px solid var(--aps-line-soft); border-radius: 12px; background: var(--aps-surface-soft); }.avatar-group-demo h3 { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: 700; }.avatar-group-demo p { max-width: 560px; margin-top: 4px; color: var(--aps-muted); font-size: var(--aps-text-xs); line-height: 1.55; }.control-status { max-width: 180px; color: var(--aps-faint); font-size: var(--aps-text-xs); line-height: 1.5; text-align: right; }.badge-control-layout { display: grid; grid-template-columns: minmax(220px, .9fr) minmax(0, 1.1fr); gap: 16px; }.badge-preview-box { display: grid; min-height: 128px; place-items: center; border-radius: 12px; background: var(--aps-surface-soft); }.badge-controls { display: grid; align-content: center; justify-items: start; gap: 13px; }.control-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 3px; }@media (max-width: 720px) { .showcase-heading { flex-direction: column; }.avatar-group-demo { grid-template-columns: 1fr; justify-items: start; }.control-status { max-width: none; text-align: left; }.badge-anchor-grid, .badge-control-layout { grid-template-columns: 1fr; } }
</style>
