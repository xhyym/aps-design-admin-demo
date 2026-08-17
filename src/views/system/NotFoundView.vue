<script setup lang="ts">
import { RouterLink } from "vue-router";
import { AppCard } from "aps-design-pro";
import { AppIcon } from "aps-design-pro";
</script>

<template>
  <main class="not-found-page"><AppCard as="section" padding="none" class="not-found-card"><span class="state-icon"><AppIcon name="warning" :size="25" /></span><p>404</p><h1>这个页面不存在，或已被移动。</h1><span>请返回工作台继续处理当前任务。</span><RouterLink class="state-link" to="/dashboard">返回工作台</RouterLink></AppCard></main>
</template>

<style scoped>
.not-found-page { display: grid; min-height: 100vh; place-items: center; padding: 24px; background: var(--aps-canvas); }.not-found-card { width: min(100%, 540px); }.not-found-card :deep(.card-content) { display: grid; justify-items: center; padding: 54px 24px; text-align: center; }.state-icon { display: grid; width: 48px; height: 48px; place-items: center; border-radius: 14px; background: var(--aps-surface-soft); color: var(--aps-muted); }.not-found-card p { margin: 21px 0 0; color: var(--aps-muted); font-size: var(--aps-text-sm); font-weight: var(--aps-font-weight-heading); }.not-found-card h1 { max-width: 390px; margin: 8px 0 0; color: var(--aps-ink); font-size: 24px; font-weight: var(--aps-font-weight-heading); letter-spacing: -0.04em; line-height: 1.25; }.not-found-card :deep(.card-content > span:last-of-type) { margin-top: 12px; color: var(--aps-muted); font-size: var(--aps-text-sm); }.state-link { display: inline-flex; min-height: var(--aps-control-height); align-items: center; justify-content: center; margin-top: 27px; padding: 0 14px; border-radius: var(--aps-radius-control); background: var(--aps-blue); color: #fff; font-size: var(--aps-text-base); font-weight: var(--aps-font-weight-strong); }.state-link:hover { background: var(--aps-blue-hover); box-shadow: 0 7px 16px rgba(0, 113, 227, .2); }
</style>
