<script setup lang="ts">
import { ref } from "vue";
import { AppAvatar, AppBadge, AppButton } from "aps-design-pro";
import { AppTag } from "aps-design-pro";
import { AppSkeleton } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import { AppSteps } from "aps-design-pro";
import type { StepItem } from "aps-design-pro";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: "在线" | "忙碌" | "离线";
}

const teamMembers: TeamMember[] = [
  { id: "member-1", name: "林知远", role: "产品负责人", status: "在线" },
  { id: "member-2", name: "周一然", role: "交付经理", status: "忙碌" },
  { id: "member-3", name: "陈书言", role: "数据分析师", status: "离线" },
];
const activeTags = ref(["待处理", "重要", "本周完成"]);
const isPreviewLoading = ref(true);
const activeStep = ref(1);
const stepMessage = ref("正在完善资料");
const avatarEventMessage = ref("等待图片资源加载");
const avatarDemoImage = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="96" viewBox="0 0 160 96"><rect width="160" height="96" fill="#e8edf5"/><circle cx="80" cy="42" r="25" fill="#7085a2"/><path d="M38 96c7-23 23-34 42-34s35 11 42 34" fill="#526883"/></svg>')}`;
const avatarBrokenImage = "data:image/svg+xml;base64,图片加载失败";
const onboardingSteps: StepItem[] = [
  { key: "account", title: "创建账户", description: "基础信息", status: "success" },
  { key: "profile", title: "完善资料", description: "联系与偏好" },
  { key: "review", title: "提交审核", description: "预计 1 个工作日" },
  { key: "complete", title: "开始使用", description: "进入工作区" },
];
const orderSteps: StepItem[] = [
  { key: "created", title: "已创建", description: "08:40", status: "success" },
  { key: "confirmed", title: "已确认", description: "09:15", status: "success" },
  { key: "delivery", title: "配送中", description: "预计 15:20", status: "process" },
  { key: "finished", title: "已完成", description: "等待签收" },
];

function removeTag(tag: string): void {
  activeTags.value = activeTags.value.filter((item) => item !== tag);
}

function handleStepChange(index: number, item: StepItem): void {
  activeStep.value = index;
  stepMessage.value = `当前步骤：${item.title}`;
}

/** 头像事件状态用于演示资源加载成功和失败后的业务接入方式。 */
function updateAvatarEventMessage(message: string): void {
  avatarEventMessage.value = message;
}
</script>

<template>
  <div class="display-workflow-view page-content">
    <section class="showcase-grid two-columns">
      <AppCard as="article">
        <div class="showcase-heading"><div><h2>头像与在线状态</h2><p>图片加载失败时回退为图标或名称缩写，不让业务列表出现破图或空白占位。</p></div><span>成员展示</span></div>
        <ul class="member-list">
          <li v-for="member in teamMembers" :key="member.id">
            <span class="avatar-status" :class="`is-${member.status}`"><AppAvatar :name="member.name" /><i aria-hidden="true" /></span>
            <div><strong>{{ member.name }}</strong><small>{{ member.role }}</small></div>
            <AppTag :tone="member.status === '在线' ? 'green' : member.status === '忙碌' ? 'orange' : 'neutral'" size="small" :label="member.status" />
          </li>
        </ul>
        <div class="avatar-variants" aria-label="头像尺寸示例"><AppAvatar name="林知远" size="small" /><AppAvatar name="周一然" /><AppAvatar name="陈书言" size="large" shape="square" /><AppBadge :value="3" aria-label="林知远有 3 条未读通知"><AppAvatar name="林知远" /></AppBadge></div>
        <div class="avatar-media-examples">
          <div><AppAvatar :src="avatarDemoImage" :src-set="avatarDemoImage" sizes="48px" alt="产品团队成员照片" size="large" fit="cover" @load="updateAvatarEventMessage('图片头像已完成加载')" @error="updateAvatarEventMessage('图片头像加载失败')" /><span>图片与响应式来源</span></div>
          <div><AppAvatar :src="avatarBrokenImage" icon="user" aria-label="无头像的用户" size="large" @error="updateAvatarEventMessage('失败图片已回退到图标')" /><span>失败图标回退</span></div>
          <div><AppAvatar :src="avatarDemoImage" name="contain" size="large" shape="square" fit="contain" alt="完整展示的成员照片" /><span><code>contain</code> 适配</span></div>
        </div>
        <p class="avatar-event-status" role="status">{{ avatarEventMessage }}</p>
      </AppCard>

      <AppCard as="article">
        <div class="showcase-heading"><div><h2>标签与轻量状态</h2><p>标签提供统一色调、尺寸、描边与关闭动作，业务页面无需手写状态样式。</p></div><span>数据标记</span></div>
        <div class="tag-row"><AppTag label="默认" /><AppTag label="处理中" tone="blue" /><AppTag label="已完成" tone="green" variant="outline" /><AppTag label="待确认" tone="orange" variant="solid" /><AppTag label="已驳回" tone="red" /></div>
        <div class="editable-tags"><strong>当前筛选</strong><div><AppTag v-for="tag in activeTags" :key="tag" :label="tag" tone="blue" closable @close="removeTag(tag)" /><span v-if="activeTags.length === 0" class="empty-tags">没有保留的筛选标签</span></div></div>
      </AppCard>
    </section>

    <section class="showcase-grid two-columns">
      <AppCard as="article">
        <div class="showcase-heading"><div><h2>骨架屏</h2><p>加载状态保留真实内容的结构和节奏，数据返回后自然切换为可读内容。</p></div><span>加载反馈</span></div>
        <AppSkeleton :loading="isPreviewLoading" avatar :rows="3" aria-label="成员资料加载中">
          <article class="member-preview"><AppAvatar name="林知远" size="large" /><div><strong>林知远</strong><p>产品负责人 · 最近活跃于 3 分钟前</p><AppTag label="可协作" tone="green" size="small" /></div></article>
        </AppSkeleton>
        <AppButton variant="secondary" size="small" @click="isPreviewLoading = !isPreviewLoading">{{ isPreviewLoading ? '查看加载完成态' : '恢复加载态' }}</AppButton>
      </AppCard>

      <AppCard as="article">
        <div class="showcase-heading"><div><h2>可点击步骤条</h2><p>用于注册、审批等可回看的线性任务；方向键也可在未禁用步骤间切换。</p></div><span>{{ stepMessage }}</span></div>
        <AppSteps v-model="activeStep" :items="onboardingSteps" clickable @change="handleStepChange" />
      </AppCard>
    </section>

    <AppCard as="section">
      <div class="showcase-heading"><div><h2>纵向业务流程</h2><p>订单状态、审批链路和操作日志等长内容使用纵向步骤，避免在窄屏中压缩文案。</p></div><span>流程展示</span></div>
      <AppSteps :items="orderSteps" direction="vertical" />
    </AppCard>
  </div>
</template>

<style scoped>
.display-workflow-view { display: grid; gap: 28px; }.showcase-grid { display: grid; gap: 28px; }.showcase-grid.two-columns { grid-template-columns: repeat(2, minmax(0, 1fr)); }.showcase-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 22px; }.showcase-heading h2, .showcase-heading p { margin: 0; }.showcase-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: var(--aps-font-weight-heading); }.showcase-heading p { max-width: 44ch; margin-top: 7px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.showcase-heading > span { flex: 0 0 auto; max-width: 160px; overflow: hidden; padding: 4px 8px; border-radius: 6px; background: var(--aps-surface-soft); color: var(--aps-faint); font-size: var(--aps-text-xs); font-weight: var(--aps-font-weight-primary); text-overflow: ellipsis; white-space: nowrap; }.member-list { display: grid; gap: 14px; margin: 0; padding: 0; list-style: none; }.member-list li { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 11px; }.member-list strong, .member-list small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.member-list strong { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: var(--aps-font-weight-strong); }.member-list small { margin-top: 2px; color: var(--aps-faint); font-size: var(--aps-text-xs); }.avatar-status { position: relative; }.avatar-status i { position: absolute; right: -1px; bottom: -1px; width: 10px; height: 10px; border: 2px solid var(--aps-surface); border-radius: 50%; background: var(--aps-faint); }.avatar-status.is-在线 i { background: var(--aps-green); }.avatar-status.is-忙碌 i { background: var(--aps-orange); }.avatar-variants { display: flex; align-items: center; gap: 10px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--aps-line-soft); }.avatar-media-examples { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }.avatar-media-examples > div { display: grid; min-width: 0; justify-items: center; gap: 7px; padding: 10px 6px; border: 1px solid var(--aps-line-soft); border-radius: 10px; background: var(--aps-surface-soft); text-align: center; }.avatar-media-examples span { color: var(--aps-muted); font-size: var(--aps-text-xs); line-height: 1.35; }.avatar-media-examples code { font-family: inherit; font-weight: var(--aps-font-weight-heading); }.avatar-event-status { min-height: 18px; margin: 12px 0 0; color: var(--aps-faint); font-size: var(--aps-text-xs); }.tag-row, .editable-tags > div { display: flex; flex-wrap: wrap; gap: 8px; }.editable-tags { display: grid; gap: 10px; margin-top: 22px; padding-top: 16px; border-top: 1px solid var(--aps-line-soft); }.editable-tags > strong { color: var(--aps-muted); font-size: var(--aps-text-sm); font-weight: var(--aps-font-weight-strong); }.empty-tags { color: var(--aps-faint); font-size: var(--aps-text-sm); }.member-preview { display: flex; align-items: center; gap: 13px; min-height: 74px; }.member-preview > div { display: grid; gap: 5px; }.member-preview strong { color: var(--aps-ink); font-size: var(--aps-text-base); }.member-preview p { margin: 0; color: var(--aps-muted); font-size: var(--aps-text-sm); }.member-preview :deep(.app-tag) { width: fit-content; }.app-card-control :deep(.app-button-control) { margin-top: 18px; }@media (max-width: 900px) { .showcase-grid.two-columns { grid-template-columns: 1fr; } }.showcase-heading { flex-direction: column; }.showcase-heading > span { max-width: none; }.avatar-media-examples { grid-template-columns: 1fr; justify-items: start; }.avatar-media-examples > div { grid-template-columns: auto minmax(0, 1fr); justify-items: start; align-items: center; text-align: left; }
</style>
