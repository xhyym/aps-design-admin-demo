<script setup lang="ts">
import { computed, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppInputOTP } from "aps-design-pro";
import { AppMention, type MentionOption } from "aps-design-pro";
import { AppTimeSelect } from "aps-design-pro";
import { AppSplitter } from "aps-design-pro";

const otpValue = ref("");
const appointmentTime = ref("09:30");
const mentionValue = ref("请 @ 相关成员确认本周课程资源的发布排期。");
const splitterSize = ref(46);
const otpStatus = ref("等待输入 6 位设备验证码");
const mentionStatus = ref("输入 @ 后可用方向键选择成员");
const splitterStatus = computed(() => "左侧区域占 " + splitterSize.value.toFixed(0) + "%");

const mentionOptions: MentionOption[] = [
  { value: "lin-zhiyuan", label: "林知远", description: "系统管理员" },
  { value: "chen-yu", label: "陈雨", description: "内容运营" },
  { value: "wang-ning", label: "王宁", description: "课程平台主管" },
  { value: "zhou-yi", label: "周逸", description: "视觉设计师", disabled: true },
];

function handleOtpComplete(value: string): void {
  otpStatus.value = "验证码 " + value + " 已完整输入，可提交验证。";
}

function handleTimeChange(value: string): void {
  otpStatus.value = value ? "已将预约开始时间更新为 " + value + "。" : "已清除预约开始时间。";
}

function handleMentionSelect(option: MentionOption): void {
  mentionStatus.value = "已提及 " + option.label + "，光标保留在成员名后方。";
}

function resetExamples(): void {
  otpValue.value = "";
  appointmentTime.value = "09:30";
  mentionValue.value = "请 @ 相关成员确认本周课程资源的发布排期。";
  splitterSize.value = 46;
  otpStatus.value = "等待输入 6 位设备验证码";
  mentionStatus.value = "输入 @ 后可用方向键选择成员";
}
</script>

<template>
  <section class="advanced-controls-page page-content page-stack" aria-label="高级输入与布局组件示例">
    <header class="advanced-controls-heading">
      <div>
        <h1>高级输入与布局</h1>
        <p>验证码、可选时段、成员提及和可调整分栏覆盖录入过程中的高频交互；所有状态都保持可访问且可由业务层接管。</p>
      </div>
      <AppButton variant="secondary" leading-icon="refresh" @click="resetExamples">恢复示例</AppButton>
    </header>

    <div class="advanced-controls-grid">
      <article class="advanced-control-card">
        <header class="advanced-card-heading">
          <div><h2>验证码输入</h2><p>支持自动聚焦、整段粘贴、删除回退和方向键移动；输入完成后触发完整值事件。</p></div>
          <span>AppInputOTP</span>
        </header>
        <div class="control-demo-stack">
          <AppInputOTP v-model="otpValue" aria-label="设备验证码" @complete="handleOtpComplete" />
          <div class="otp-actions"><AppButton size="small" variant="ghost" :disabled="!otpValue" @click="otpValue = ''">清空验证码</AppButton><output>{{ otpValue ? "当前值：" + otpValue : "尚未输入" }}</output></div>
          <output class="interaction-status" aria-live="polite">{{ otpStatus }}</output>
        </div>
      </article>

      <article class="advanced-control-card">
        <header class="advanced-card-heading">
          <div><h2>时间选择</h2><p>用于固定时段选择，可限制可选范围和步长；面板会自动避让可视区域边界。</p></div>
          <span>AppTimeSelect</span>
        </header>
        <div class="control-demo-stack">
          <AppTimeSelect v-model="appointmentTime" start="08:00" end="20:00" :step="30" min-time="09:00" max-time="18:30" clearable aria-label="预约开始时间" @change="handleTimeChange" />
          <dl class="control-definition"><div><dt>可选范围</dt><dd>09:00 — 18:30</dd></div><div><dt>时间步长</dt><dd>30 分钟</dd></div></dl>
          <output class="interaction-status" aria-live="polite">{{ appointmentTime ? "当前预约：" + appointmentTime : "暂未选择时间" }}</output>
        </div>
      </article>
    </div>

    <div class="advanced-controls-grid">
      <article class="advanced-control-card mention-card">
        <header class="advanced-card-heading">
          <div><h2>成员提及</h2><p>在独立词起始处输入 @ 触发建议；支持筛选、键盘选择、禁用项和选中后光标定位。</p></div>
          <span>AppMention</span>
        </header>
        <div class="control-demo-stack">
          <AppMention v-model="mentionValue" :options="mentionOptions" aria-label="任务协作说明" @select="handleMentionSelect" />
          <output class="interaction-status" aria-live="polite">{{ mentionStatus }}</output>
        </div>
      </article>

      <article class="advanced-control-card splitter-card">
        <header class="advanced-card-heading">
          <div><h2>可调整分栏</h2><p>拖动中间分隔条，或聚焦后使用方向键、Shift 加速、Home 与 End 调整布局比例。</p></div>
          <span>AppSplitter</span>
        </header>
        <AppSplitter v-model="splitterSize" aria-label="内容区域分栏比例" first-panel-label="资源目录" second-panel-label="资源详情">
          <template #first>
            <div class="split-panel-content"><strong>资源目录</strong><span>课程素材</span><span class="is-selected">组件能力清单</span><span>发布审核</span></div>
          </template>
          <template #second>
            <div class="split-panel-content"><strong>组件能力清单</strong><p>左侧目录宽度可由每位成员按使用习惯调整，后续可接入个人偏好持久化。</p><output>{{ splitterStatus }}</output></div>
          </template>
        </AppSplitter>
      </article>
    </div>
  </section>
</template>

<style scoped>
.advanced-controls-page { display: grid; min-height: 0; align-content: start; gap: var(--aps-page-stack-gap); }.advanced-controls-heading { display: flex; align-items: end; justify-content: space-between; gap: 28px; }.advanced-controls-heading h1, .advanced-controls-heading p, .advanced-card-heading h2, .advanced-card-heading p { margin: 0; }.advanced-controls-heading h1 { color: var(--aps-ink); font-size: var(--aps-text-2xl); font-weight: 740; letter-spacing: -.035em; }.advanced-controls-heading p { max-width: 760px; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }.advanced-controls-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--aps-page-stack-gap); }.advanced-control-card { display: grid; min-width: 0; align-content: start; gap: 22px; padding: var(--aps-card-padding); border: 1px solid var(--aps-line-soft); border-radius: var(--aps-radius-card); background: var(--aps-surface); }.advanced-card-heading { display: flex; align-items: start; justify-content: space-between; gap: 16px; }.advanced-card-heading > div { min-width: 0; }.advanced-card-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: 720; }.advanced-card-heading p { margin-top: 7px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.advanced-card-heading > span { flex: 0 0 auto; padding: 4px 8px; border-radius: 6px; background: var(--aps-surface-soft); color: var(--aps-faint); font-size: var(--aps-text-xs); font-weight: 650; }.control-demo-stack { display: grid; gap: 14px; }.otp-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; }.otp-actions output, .interaction-status { color: var(--aps-muted); font-size: var(--aps-text-xs); line-height: 1.55; }.interaction-status { display: block; padding-top: 12px; border-top: 1px solid var(--aps-line-soft); }.control-definition { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 0; }.control-definition div { min-width: 0; padding: 10px 11px; border-radius: 9px; background: var(--aps-surface-soft); }.control-definition dt { color: var(--aps-faint); font-size: var(--aps-text-xs); }.control-definition dd { margin: 4px 0 0; overflow: hidden; color: var(--aps-muted); font-size: var(--aps-text-sm); font-variant-numeric: tabular-nums; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }.splitter-card { gap: 18px; }.split-panel-content { display: grid; align-content: start; gap: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.55; }.split-panel-content strong { color: var(--aps-ink); font-size: var(--aps-text-sm); }.split-panel-content span { padding: 6px 7px; border-radius: 6px; }.split-panel-content span.is-selected { background: var(--aps-blue-soft); color: var(--aps-blue); font-weight: 680; }.split-panel-content p { margin: 0; }.split-panel-content output { margin-top: 6px; color: var(--aps-blue); font-size: var(--aps-text-xs); font-variant-numeric: tabular-nums; font-weight: 700; }@media (max-width: 980px) { .advanced-controls-grid { grid-template-columns: 1fr; }.advanced-controls-heading { align-items: start; flex-direction: column; gap: 14px; }.advanced-controls-heading .app-button-control { width: 100%; } }@media (max-width: 560px) { .advanced-card-heading > span { display: none; }.control-definition { grid-template-columns: 1fr; }.otp-actions { align-items: start; flex-direction: column; }.advanced-control-card { padding: 18px; } }
</style>
