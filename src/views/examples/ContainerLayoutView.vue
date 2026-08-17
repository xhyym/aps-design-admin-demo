<script setup lang="ts">
import { computed, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppSegmented } from "aps-design-pro";
import { AppContainer, AppContainerAside, AppContainerFooter, AppContainerHeader, AppContainerMain } from "aps-design-pro";
import type { SelectOption } from "aps-design-pro";

const layoutDirection = ref<"horizontal" | "vertical">("horizontal");
const isCollapsed = ref(false);
const activeSection = ref("概览");

const directionOptions: SelectOption[] = [
  { label: "横向双栏", value: "horizontal" },
  { label: "纵向分区", value: "vertical" },
];
const menuItems = ["概览", "待处理", "成员", "设置"];
const contentItems = Array.from({ length: 14 }, (_, index) => `第 ${index + 1} 条容器内容：主内容区域独立滚动，不影响固定的头部与底部操作区。`);
const mainDescription = computed(() => layoutDirection.value === "horizontal" ? "主内容区域与侧栏并排，适合工作台与配置页。" : "头部、内容与底部分区垂直排列，适合详情与流程页。");

/** 收起仅改变布局宽度，菜单文字由业务插槽按状态决定是否展示。 */
function toggleAside(): void {
  isCollapsed.value = !isCollapsed.value;
}
</script>

<template>
  <section class="container-layout-page page-content page-stack" aria-label="容器布局组件示例">
    <header class="container-layout-heading">
      <div><h1>容器布局</h1><p>容器、头部、侧栏、主内容和底部组成可嵌套的页面骨架；各区域保持独立的伸缩与滚动边界。</p></div>
      <AppSegmented v-model="layoutDirection" :options="directionOptions" aria-label="容器方向" />
    </header>

    <AppContainer class="container-demo-shell" :direction="layoutDirection" bordered fill aria-label="容器布局演示">
      <AppContainerHeader v-if="layoutDirection === 'vertical'" bordered class="demo-header">
        <div><strong>项目交付中心</strong><span>头部保持固定，不受主内容滚动影响</span></div>
        <AppButton size="small" variant="secondary">查看状态</AppButton>
      </AppContainerHeader>

      <AppContainer v-if="layoutDirection === 'vertical'" direction="horizontal" fill aria-label="纵向容器内容区">
        <AppContainerAside :collapsed="isCollapsed" bordered class="demo-aside">
          <button class="aside-toggle" type="button" :aria-label="isCollapsed ? '展开侧栏' : '收起侧栏'" @click="toggleAside">{{ isCollapsed ? '›' : '‹' }}</button>
          <nav class="aside-menu" aria-label="容器演示菜单"><button v-for="item in menuItems" :key="item" type="button" :aria-label="item" :class="{ 'is-active': activeSection === item }" @click="activeSection = item"><span>{{ item.slice(0, 1) }}</span><em v-if="!isCollapsed">{{ item }}</em></button></nav>
        </AppContainerAside>
        <AppContainerMain scrollable class="demo-main"><div class="main-copy"><strong>{{ activeSection }}</strong><p>{{ mainDescription }}</p></div><p v-for="item in contentItems" :key="item" class="scroll-item">{{ item }}</p></AppContainerMain>
      </AppContainer>

      <template v-else>
        <AppContainerAside :collapsed="isCollapsed" bordered class="demo-aside">
          <button class="aside-toggle" type="button" :aria-label="isCollapsed ? '展开侧栏' : '收起侧栏'" @click="toggleAside">{{ isCollapsed ? '›' : '‹' }}</button>
          <nav class="aside-menu" aria-label="容器演示菜单"><button v-for="item in menuItems" :key="item" type="button" :aria-label="item" :class="{ 'is-active': activeSection === item }" @click="activeSection = item"><span>{{ item.slice(0, 1) }}</span><em v-if="!isCollapsed">{{ item }}</em></button></nav>
        </AppContainerAside>
        <AppContainer direction="vertical" fill aria-label="横向容器主内容区">
          <AppContainerHeader bordered class="demo-header"><div><strong>项目交付中心</strong><span>头部保持固定，不受主内容滚动影响</span></div><AppButton size="small" variant="secondary">查看状态</AppButton></AppContainerHeader>
          <AppContainerMain scrollable class="demo-main"><div class="main-copy"><strong>{{ activeSection }}</strong><p>{{ mainDescription }}</p></div><p v-for="item in contentItems" :key="item" class="scroll-item">{{ item }}</p></AppContainerMain>
          <AppContainerFooter bordered class="demo-footer"><span>共 {{ contentItems.length }} 条内容</span><AppButton size="small">保存变更</AppButton></AppContainerFooter>
        </AppContainer>
      </template>

      <AppContainerFooter v-if="layoutDirection === 'vertical'" bordered class="demo-footer"><span>共 {{ contentItems.length }} 条内容</span><AppButton size="small">保存变更</AppButton></AppContainerFooter>
    </AppContainer>

    <p class="container-layout-note">验收重点：切换布局方向、收起侧栏、切换菜单项，以及在主内容区滚动时，固定区域不发生位移。</p>
  </section>
</template>

<style scoped>
.container-layout-page { display: grid; min-height: 0; align-content: start; gap: var(--aps-page-stack-gap); }.container-layout-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; }.container-layout-heading h1, .container-layout-heading p { margin: 0; }.container-layout-heading h1 { color: var(--aps-ink); font-size: var(--aps-text-2xl); font-weight: var(--aps-font-weight-heading); letter-spacing: -.035em; }.container-layout-heading p { max-width: 760px; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }.container-demo-shell { height: 520px; }.demo-header { justify-content: space-between; }.demo-header > div { display: grid; gap: 3px; }.demo-header strong { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: var(--aps-font-weight-heading); }.demo-header span, .demo-footer span { color: var(--aps-faint); font-size: var(--aps-text-xs); }.demo-aside { position: relative; padding: 12px 8px; }.aside-toggle { display: grid; width: 32px; height: 32px; margin: 0 4px 12px auto; place-items: center; padding: 0; border: 1px solid var(--aps-line-soft); border-radius: 8px; background: var(--aps-surface); color: var(--aps-muted); font-size: 20px; line-height: 1; }.aside-toggle:hover { border-color: var(--aps-line); color: var(--aps-blue); }.aside-menu { display: grid; gap: 4px; }.aside-menu button { display: flex; width: 100%; min-width: 0; align-items: center; gap: 10px; padding: 9px 10px; border: 0; border-radius: 8px; background: transparent; color: var(--aps-muted); text-align: left; }.aside-menu button:hover { background: rgba(0, 113, 227, .06); color: var(--aps-blue); }.aside-menu button.is-active { background: var(--aps-blue-soft); color: var(--aps-blue); font-weight: var(--aps-font-weight-strong); }.aside-menu span { display: grid; width: 20px; height: 20px; flex: 0 0 auto; place-items: center; border-radius: 6px; background: currentColor; color: var(--aps-surface); font-size: 10px; font-style: normal; font-weight: var(--aps-font-weight-heading); }.aside-menu em { overflow: hidden; font-size: var(--aps-text-sm); font-style: normal; text-overflow: ellipsis; white-space: nowrap; }.demo-main { background: var(--aps-surface); }.main-copy { display: grid; gap: 5px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--aps-line-soft); }.main-copy strong { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: var(--aps-font-weight-heading); }.main-copy p { margin: 0; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.55; }.scroll-item { margin: 0; padding: 12px 0; border-bottom: 1px solid var(--aps-line-soft); color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.5; }.demo-footer { justify-content: space-between; }.container-layout-note { margin: 0; color: var(--aps-faint); font-size: var(--aps-text-xs); line-height: 1.6; }@media (max-width: 700px) { .container-layout-heading { align-items: start; flex-direction: column; }.container-demo-shell { height: 640px; }.demo-aside { min-height: 168px; }.aside-toggle { margin-bottom: 8px; }.aside-menu { grid-template-columns: repeat(2, minmax(0, 1fr)); }.aside-menu em { display: block; } }
</style>
