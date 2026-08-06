<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { AppButton, AppButtonMore } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import { AppBackToTop } from "aps-design-pro";
import { AppCommandPalette, AppContextMenu, AppPopover, AppScreenLock, AppTooltip } from "aps-design-pro";
import type { ContextMenuItem } from "aps-design-pro";
import type { CommandPaletteItem } from "aps-design-pro";
import type { DropdownItem } from "aps-design-pro";

const isContextMenuOpen = ref(false);
const isClickTooltipOpen = ref(false);
const selectedContextAction = ref("尚未选择操作");
const tooltipStatus = ref("提示尚未打开");
const scrollContainer = ref<HTMLElement | null>(null);
const scrollTop = ref(0);
const isCommandPaletteOpen = ref(false);
const isScreenLocked = ref(false);
const isPositionedPopoverOpen = ref(false);
const isScreenUnlocking = ref(false);
const commandResult = ref("尚未执行快捷命令");
const screenLockResult = ref("锁屏验证由业务服务处理，组件不保存或比较密码。");
const moreActionResult = ref("尚未选择更多操作");
let screenUnlockTimer: number | undefined;
const contextMenuItems: ContextMenuItem[] = [
  { key: "rename", label: "重命名资源", icon: "edit" },
  { key: "reload", label: "重新加载", icon: "refresh" },
  { key: "delete", label: "移入回收站", icon: "trash", danger: true, divided: true },
];
const utilityNotes = Array.from({ length: 18 }, (_, index) => `第 ${index + 1} 条内容：实际业务页可以将回到顶部绑定到表格、详情或抽屉内部的滚动容器。`);
const commandItems: CommandPaletteItem[] = [
  { key: "create-course", title: "新建课程包", description: "创建新的课程资源交付项", icon: "plus" },
  { key: "open-orders", title: "查看订单", description: "进入订单管理并保留当前筛选", icon: "grid" },
  { key: "open-preferences", title: "打开偏好设置", description: "调整页面显示与工作区习惯", icon: "settings" },
];
const moreActionItems: DropdownItem[] = [
  { key: "duplicate", label: "复制课程链接", icon: "edit" },
  { key: "export", label: "导出课程清单", icon: "download" },
  { key: "archive", label: "归档课程资源", icon: "trash", danger: true, divided: true },
];

/** 将稳定的菜单 key 转换为当前业务页可展示的操作结果。 */
function handleContextAction(key: string): void {
  const item = contextMenuItems.find((entry) => entry.key === key);
  selectedContextAction.value = item ? `已选择：${item.label}` : "未识别的操作";
}

/** 只同步示例容器的位置，组件本身仍独立计算显示阈值。 */
function handleContainerScroll(event: Event): void {
  scrollTop.value = (event.currentTarget as HTMLElement).scrollTop;
}

/** 提示可由业务页受控，状态事件只用于同步界面反馈。 */
function updateTooltipStatus(visible: boolean): void {
  tooltipStatus.value = visible ? "点击提示已打开，可再次点击或按 Esc 关闭。" : "点击提示已关闭。";
}

/** 快捷命令只上报稳定的命令定义，实际路由跳转或业务请求由页面承接。 */
function handleCommandSelect(item: CommandPaletteItem): void {
  commandResult.value = `已执行：${item.title}。`;
}

/** 解锁请求由页面交给认证服务；示例只展示受控提交和成功后的关闭时机。 */
function handleScreenUnlock(): void {
  if (isScreenUnlocking.value) return;
  isScreenUnlocking.value = true;
  screenLockResult.value = "正在校验身份，请稍候。";
  window.clearTimeout(screenUnlockTimer);
  screenUnlockTimer = window.setTimeout(() => {
    isScreenUnlocking.value = false;
    isScreenLocked.value = false;
    screenLockResult.value = "身份校验通过，工作区已恢复。";
    screenUnlockTimer = undefined;
  }, 560);
}

function handleMoreAction(key: string): void {
  const item = moreActionItems.find((entry) => entry.key === key);
  moreActionResult.value = item ? `已选择：${item.label}。` : "未识别的更多操作。";
}

onBeforeUnmount(() => window.clearTimeout(screenUnlockTimer));
</script>

<template>
  <section class="overlay-utilities-page page-content page-stack" aria-label="浮层与辅助组件案例">
    <header class="overlay-utilities-heading">
      <div>
        <h1>浮层与辅助</h1>
        <p>右键操作、提示说明与回到顶部都应在真实滚动容器和键盘路径中保持可预期，不依赖页面临时样式。</p>
      </div>
    </header>

    <div class="utility-grid">
      <AppCard as="article" padding="large" content-overflow="visible" class="utility-card">
        <header class="utility-card-heading"><div><h2>上下文菜单</h2><p>右键目标、键盘菜单键或 Shift + F10 均可打开；操作完成后自动收起。</p></div><span>右键与键盘</span></header>
        <AppContextMenu v-model="isContextMenuOpen" trigger-mode="contextmenu" :items="contextMenuItems" menu-label="资源操作" @select="handleContextAction">
          <template #trigger="{ open }">
            <button class="context-target" type="button" aria-haspopup="menu" :aria-expanded="open" data-testid="context-menu-target">
              <span class="context-target-icon" aria-hidden="true">⌘</span>
              <span><strong>课程资源包</strong><small>右键或按菜单键打开操作</small></span>
            </button>
          </template>
        </AppContextMenu>
        <output class="utility-result" aria-live="polite">{{ selectedContextAction }}</output>
      </AppCard>

      <AppCard as="article" padding="large" content-overflow="visible" class="utility-card">
        <header class="utility-card-heading"><div><h2>提示</h2><p>说明不会被面板裁切；上下左右均可定位，空间不足时会自动翻转，并支持由业务页受控显示。</p></div><span>视口定位</span></header>
        <div class="tooltip-actions">
          <AppTooltip text="重新读取当前筛选结果，不会清空已填写的查询条件。">
            <AppButton variant="secondary" leading-icon="refresh" data-testid="tooltip-top-trigger">悬停或聚焦</AppButton>
          </AppTooltip>
          <AppTooltip placement="bottom" text="关闭后可从页面右上角的偏好设置再次打开。">
            <AppButton variant="ghost" leading-icon="settings" data-testid="tooltip-bottom-trigger">下方提示</AppButton>
          </AppTooltip>
          <AppTooltip v-model="isClickTooltipOpen" placement="right" trigger="click" :show-after="80" text="点击触发时，业务页可以通过 v-model 主动关闭或打开提示。" @visible-change="updateTooltipStatus">
            <AppButton variant="ghost" leading-icon="warning" data-testid="tooltip-click-trigger">点击提示</AppButton>
          </AppTooltip>
        </div>
        <p class="utility-caption">{{ tooltipStatus }} 提示只补充当前控件的目的，按钮名称和关键操作不依赖提示才能理解。</p>
      </AppCard>
    </div>

    <div class="utility-grid">
      <AppCard as="article" padding="large" class="utility-card">
        <header class="utility-card-heading"><div><h2>命令面板</h2><p>复杂后台将高频动作集中到键盘可达的面板中，输入后支持筛选、方向键和回车确认。</p></div><span>快捷操作</span></header>
        <AppButton leading-icon="search" data-testid="command-palette-trigger" @click="isCommandPaletteOpen = true">打开命令面板</AppButton>
        <output class="utility-result" aria-live="polite">{{ commandResult }}</output>
      </AppCard>

      <AppCard as="article" padding="large" class="utility-card">
        <header class="utility-card-heading"><div><h2>屏幕锁定</h2><p>组件仅收集密码和维持锁屏状态；身份验证必须由业务认证服务处理，密码不会作为组件属性保存。</p></div><span>受控验证</span></header>
        <AppButton variant="secondary" leading-icon="lock" data-testid="screen-lock-trigger" @click="isScreenLocked = true">锁定工作区</AppButton>
        <output class="utility-result" aria-live="polite">{{ screenLockResult }}</output>
      </AppCard>

      <AppCard as="article" padding="large" content-overflow="visible" class="utility-card">
        <header class="utility-card-heading"><div><h2>信息浮层</h2><p>浮层可选择十二种方位与偏移量，空间不足时自动翻转，并始终保持在视口范围内。</p></div><span>right-start</span></header>
        <AppPopover v-model="isPositionedPopoverOpen" placement="right-start" :offset="12" label="浮层定位说明">
          <template #trigger="{ open, toggle }"><AppButton variant="secondary" leading-icon="panel" :aria-expanded="open" data-testid="positioned-popover-trigger" @click="toggle">查看定位说明</AppButton></template>
          <section class="positioned-popover-copy" aria-label="浮层定位内容"><strong>右侧起点对齐</strong><p>空间不足时自动翻转到左侧，12px 间距保持不变。</p></section>
        </AppPopover>
        <output class="utility-result" aria-live="polite">{{ isPositionedPopoverOpen ? "浮层已打开，可点击外部或按 Esc 关闭。" : "当前使用右侧起点对齐与 12px 偏移。" }}</output>
      </AppCard>

      <AppCard as="article" padding="large" content-overflow="visible" class="utility-card">
        <header class="utility-card-heading"><div><h2>更多操作</h2><p>将低频动作收纳为可键盘导航的下拉菜单，危险操作保持独立的语义色和分隔边界。</p></div><span>动作收纳</span></header>
        <AppButtonMore :items="moreActionItems" label="课程操作" @select="handleMoreAction" />
        <output class="utility-result" aria-live="polite">{{ moreActionResult }}</output>
      </AppCard>
    </div>

    <AppCard as="article" padding="large" class="utility-card back-to-top-card">
      <header class="utility-card-heading"><div><h2>回到顶部</h2><p>传入滚动容器后按该容器的位置展示，不会错误监听浏览器窗口；按钮始终返回容器起点。</p></div><span>{{ Math.round(scrollTop) }} px</span></header>
      <div ref="scrollContainer" class="back-to-top-scroll-area" tabindex="0" aria-label="回到顶部滚动容器" data-testid="back-to-top-scroll-area" @scroll="handleContainerScroll">
        <p v-for="note in utilityNotes" :key="note">{{ note }}</p>
      </div>
      <AppBackToTop :target="scrollContainer" :threshold="72" label="回到示例顶部" />
    </AppCard>

    <AppCommandPalette v-model="isCommandPaletteOpen" :items="commandItems" @select="handleCommandSelect" />
    <AppScreenLock v-model="isScreenLocked" user-name="陈映月 · 课程运营" :is-unlocking="isScreenUnlocking" @unlock="handleScreenUnlock" />
  </section>
</template>

<style scoped>
.overlay-utilities-page { display: grid; min-height: 0; align-content: start; gap: var(--aps-page-stack-gap); }.overlay-utilities-heading h1, .overlay-utilities-heading p, .utility-card-heading h2, .utility-card-heading p, .utility-caption, .positioned-popover-copy p { margin: 0; }.overlay-utilities-heading h1 { color: var(--aps-ink); font-size: var(--aps-text-2xl); font-weight: 740; letter-spacing: -.035em; }.overlay-utilities-heading p { max-width: 760px; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }.utility-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--aps-page-stack-gap); }.utility-card { display: grid; min-width: 0; align-content: start; gap: 22px; }.utility-card-heading { display: flex; min-width: 0; align-items: start; justify-content: space-between; gap: 16px; }.utility-card-heading > div { min-width: 0; }.utility-card-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: 720; }.utility-card-heading p { margin-top: 6px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.utility-card-heading > span { flex: 0 0 auto; padding: 4px 8px; border-radius: 6px; background: var(--aps-surface-soft); color: var(--aps-faint); font-size: var(--aps-text-xs); font-weight: 650; white-space: nowrap; }.context-target { display: grid; width: 100%; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 12px; padding: 15px; border: 1px solid var(--aps-line-soft); border-radius: 12px; background: var(--aps-surface-soft); color: var(--aps-ink); font: inherit; text-align: left; transition: border-color 160ms ease, background-color 160ms ease; }.context-target:hover, .context-target:focus-visible { border-color: var(--aps-blue); background: var(--aps-blue-soft); outline: none; }.context-target-icon { display: grid; width: 32px; height: 32px; place-items: center; border: 1px solid var(--aps-line); border-radius: 9px; background: var(--aps-surface); color: var(--aps-blue); font-size: var(--aps-text-sm); font-weight: 720; }.context-target strong, .context-target small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.context-target strong { font-size: var(--aps-text-sm); font-weight: 700; }.context-target small { margin-top: 3px; color: var(--aps-faint); font-size: var(--aps-text-xs); }.utility-result { min-height: 20px; padding-top: 14px; border-top: 1px solid var(--aps-line-soft); color: var(--aps-muted); font-size: var(--aps-text-sm); }.tooltip-actions { display: flex; flex-wrap: wrap; gap: 10px; }.utility-caption { color: var(--aps-faint); font-size: var(--aps-text-xs); line-height: 1.6; }.positioned-popover-copy { display: grid; width: min(220px, calc(100vw - 48px)); gap: 5px; padding: 14px; }.positioned-popover-copy strong { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: 700; }.positioned-popover-copy p { color: var(--aps-muted); font-size: var(--aps-text-xs); line-height: 1.6; }.back-to-top-scroll-area { height: 224px; overflow: auto; border: 1px solid var(--aps-line-soft); border-radius: 12px; overscroll-behavior: contain; }.back-to-top-scroll-area:focus-visible { outline: 2px solid var(--aps-blue); outline-offset: 2px; }.back-to-top-scroll-area p { margin: 0; padding: 13px 15px; border-bottom: 1px solid var(--aps-line-soft); color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.55; }.back-to-top-scroll-area p:nth-child(even) { background: var(--aps-surface-soft); }.back-to-top-scroll-area p:last-child { border-bottom: 0; }@media (max-width: 820px) { .utility-grid { grid-template-columns: 1fr; } }@media (max-width: 600px) { .utility-card-heading > span { display: none; }.tooltip-actions :deep(.app-button-control) { width: 100%; } }
</style>
