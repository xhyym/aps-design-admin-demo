<script setup lang="ts">
import { RouterLink } from "vue-router";
import { AppCard } from "aps-design-pro";
import { AppIcon } from "aps-design-pro";
</script>

<template>
  <section class="page-content"><AppCard as="section" padding="none" class="access-state"><span class="state-icon"><AppIcon name="shield" :size="25" /></span><p>访问受限</p><h1>你暂时没有查看此页面的权限。</h1><span>请联系工作区管理员确认你的角色与授权范围。</span><RouterLink class="state-link" to="/dashboard">返回工作台</RouterLink></AppCard></section>
</template>

<style scoped>
.access-state :deep(.card-content) { display: grid; min-height: 410px; justify-items: center; padding: 54px 24px; text-align: center; }.state-icon { display: grid; width: 48px; height: 48px; place-items: center; border-radius: 14px; background: var(--aps-orange-soft); color: var(--aps-orange); }.access-state p { margin: 21px 0 0; color: var(--aps-muted); font-size: var(--aps-text-sm); font-weight: 650; }.access-state h1 { max-width: 410px; margin: 8px 0 0; color: var(--aps-ink); font-size: 24px; font-weight: 720; letter-spacing: -0.04em; line-height: 1.25; }.access-state :deep(.card-content > span:last-of-type) { margin-top: 12px; color: var(--aps-muted); font-size: var(--aps-text-sm); }.state-link { display: inline-flex; min-height: var(--aps-control-height); align-items: center; justify-content: center; margin-top: 27px; padding: 0 14px; border-radius: var(--aps-radius-control); background: var(--aps-blue); color: #fff; font-size: var(--aps-text-base); font-weight: 680; }.state-link:hover { background: var(--aps-blue-hover); box-shadow: 0 7px 16px rgba(0, 113, 227, .2); }
</style>
