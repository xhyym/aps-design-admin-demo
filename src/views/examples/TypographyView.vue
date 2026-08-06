<script setup lang="ts">
import { computed, ref } from "vue";
import { AppText, type TextTone } from "aps-design-pro";
import { AppSegmented } from "aps-design-pro";
import { AppSwitch } from "aps-design-pro";
import { AppCard } from "aps-design-pro";
import type { ControlSize, SelectOption } from "aps-design-pro";

const activeTone = ref<TextTone>("default");
const activeSize = ref<ControlSize>("default");
const isItalic = ref(false);
const isSingleLineTruncated = ref(true);
const selectedLineClamp = ref("2");

const toneOptions: SelectOption[] = [
  { label: "默认", value: "default" },
  { label: "主色", value: "primary" },
  { label: "成功", value: "success" },
  { label: "警告", value: "warning" },
  { label: "错误", value: "danger" },
];
const sizeOptions: SelectOption[] = [
  { label: "小", value: "small" },
  { label: "默认", value: "default" },
  { label: "大", value: "large" },
];
const lineClampOptions: SelectOption[] = [
  { label: "两行", value: "2" },
  { label: "三行", value: "3" },
  { label: "四行", value: "4" },
];
const semanticTexts: Array<{ type: TextTone; label: string; description: string }> = [
  { type: "default", label: "默认信息", description: "用于正文、名称和普通说明。" },
  { type: "primary", label: "可操作信息", description: "用于可跳转、待处理或需要关注的内容。" },
  { type: "success", label: "成功状态", description: "用于完成、正常或通过校验的结果。" },
  { type: "warning", label: "注意事项", description: "用于可能影响后续操作的提醒。" },
  { type: "danger", label: "错误或风险", description: "用于失败、删除和需要立即处理的状态。" },
  { type: "info", label: "辅助说明", description: "用于时间、来源和不需要强调的补充信息。" },
];
const longSingleLineText = "2026 年第三季度计算机基础课程资源交付计划已更新，请相关负责人在本周五前完成资源清单确认。";
const longParagraph = "课程资源交付需要同时确认授权范围、内容版本与讲师档期。通过统一的文本省略规则，列表、卡片和详情摘要可以在有限空间中保持稳定布局，并让完整内容通过原生提示可被查看。";
const activeToneLabel = computed(() => toneOptions.find((option) => option.value === activeTone.value)?.label ?? "默认");
const resolvedLineClamp = computed(() => Number.parseInt(selectedLineClamp.value, 10));
</script>

<template>
  <section class="typography-view page-content page-stack" aria-label="文本排版组件示例">
    <AppCard as="section">
      <header class="showcase-heading">
        <div><h2>语义文本</h2><p>文本颜色只表达信息层级和状态，不用装饰性颜色替代内容优先级。</p></div>
        <AppText type="info" size="small">六种语义</AppText>
      </header>
      <div class="semantic-grid">
        <article v-for="item in semanticTexts" :key="item.type" class="semantic-item">
          <AppText :type="item.type" weight="semibold">{{ item.label }}</AppText>
          <AppText type="info" size="small">{{ item.description }}</AppText>
        </article>
      </div>
    </AppCard>

    <AppCard as="section">
      <header class="showcase-heading">
        <div><h2>字号与强调</h2><p>字号默认跟随全局偏好设置，也可以只在局部文本上明确覆盖。</p></div>
        <AppText type="info" size="small">当前：{{ activeToneLabel }}</AppText>
      </header>
      <div class="control-row">
        <div class="control-group"><span>色调</span><AppSegmented v-model="activeTone" :options="toneOptions" size="small" aria-label="选择文本色调" /></div>
        <div class="control-group"><span>字号</span><AppSegmented v-model="activeSize" :options="sizeOptions" size="small" aria-label="选择文本字号" /></div>
        <AppSwitch v-model="isItalic" label="斜体强调" />
      </div>
      <div class="text-preview" aria-live="polite">
        <AppText :type="activeTone" :size="activeSize" :italic="isItalic" weight="semibold">本周新增 18 套课程资源，待完成内容审核。</AppText>
        <AppText type="info" size="small">组件默认不会改变段落边距，布局间隔由所在容器负责。</AppText>
      </div>
    </AppCard>

    <AppCard as="section">
      <header class="showcase-heading">
        <div><h2>长文本省略</h2><p>单行省略适合表格与工具栏；多行截断适合卡片摘要。完整内容通过原生提示保留。</p></div>
        <AppSegmented v-model="selectedLineClamp" :options="lineClampOptions" size="small" aria-label="选择多行截断行数" />
      </header>
      <div class="truncate-grid">
        <article class="truncate-example">
          <div class="truncate-title"><strong>单行省略</strong><AppSwitch v-model="isSingleLineTruncated" :label="isSingleLineTruncated ? '已启用' : '已关闭'" size="small" /></div>
          <div class="single-line-preview"><AppText :truncated="isSingleLineTruncated" :title="longSingleLineText" weight="medium">{{ longSingleLineText }}</AppText></div>
        </article>
        <article class="truncate-example">
          <div class="truncate-title"><strong>多行截断</strong><AppText type="info" size="small">{{ resolvedLineClamp }} 行</AppText></div>
          <div class="multi-line-preview"><AppText :line-clamp="resolvedLineClamp" :title="longParagraph">{{ longParagraph }}</AppText></div>
        </article>
      </div>
    </AppCard>
  </section>
</template>

<style scoped>
.typography-view { max-width: 1120px; }.showcase-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 22px; }.showcase-heading h2, .showcase-heading p { margin: 0; }.showcase-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: 720; letter-spacing: -.02em; }.showcase-heading p { max-width: 64ch; margin-top: 7px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.semantic-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px; overflow: hidden; border: 1px solid var(--aps-line-soft); border-radius: 11px; background: var(--aps-line-soft); }.semantic-item { display: grid; min-height: 88px; align-content: center; gap: 5px; padding: 15px 17px; background: var(--aps-surface); }.control-row { display: flex; flex-wrap: wrap; align-items: end; gap: 18px 24px; }.control-group { display: grid; gap: 6px; }.control-group > span { color: var(--aps-faint); font-size: var(--aps-text-xs); font-weight: 650; }.text-preview { display: grid; gap: 6px; margin-top: 22px; padding: 18px; border: 1px solid var(--aps-line-soft); border-radius: 11px; background: var(--aps-surface-soft); }.truncate-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }.truncate-example { display: grid; min-width: 0; gap: 12px; padding: 15px; border: 1px solid var(--aps-line-soft); border-radius: 11px; }.truncate-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; }.truncate-title > strong { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: 680; }.single-line-preview, .multi-line-preview { min-width: 0; padding: 11px 12px; border-radius: 8px; background: var(--aps-surface-soft); }.single-line-preview { display: flex; }.multi-line-preview { min-height: 86px; }@media (max-width: 760px) { .showcase-heading { flex-direction: column; }.semantic-grid, .truncate-grid { grid-template-columns: 1fr; }.control-row { align-items: start; flex-direction: column; gap: 15px; } }
</style>
