<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { AppButton } from "aps-design-pro";
import { AppBasicBanner, AppCardBanner, AppFestivalTextScroll, AppFireworksEffect, AppImage, AppImageCard, AppCarousel, AppTextScroll, AppTimelineCard, type CarouselDirection, type CarouselItem, type CarouselPublicApi } from "aps-design-pro";
import { AppScrollbar, AppSpace } from "aps-design-pro";
import type { TimelineItem } from "aps-design-pro";

const activeCarouselIndex = ref(0);
const carouselDirection = ref<CarouselDirection>("horizontal");
const carouselReference = ref<CarouselPublicApi | null>(null);
const imageLoadState = ref("等待加载");
const scrollSummary = ref("滚动容器尚未滚动");
const isFireworksVisible = ref(false);
let fireworksTimer: number | undefined;

const carouselItems: CarouselItem[] = [
  { key: "mountain", src: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1400&q=85", alt: "湖边山谷与晨雾", title: "内容型轮播", description: "支持键盘、触摸、自动播放和指示器切换。" },
  { key: "coast", src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85", alt: "海岸线与蓝色海水", title: "统一图片底座", description: "轮播项复用 AppImage 的加载与错误状态。" },
  { key: "architecture", src: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1400&q=85", alt: "现代建筑细节", title: "可扩展插槽", description: "业务可以替换整张幻灯片，不受默认结构限制。" },
];

const longNotes = Array.from({ length: 18 }, (_, index) => `第 ${index + 1} 条滚动内容：AppScrollbar 只负责容器行为，业务内容与数据状态由页面控制。`);
const contentTimelineItems: TimelineItem[] = [
  { key: "draft", title: "已保存草稿", description: "内容在当前工作区内协作编辑", timestamp: "09:20", state: "success" },
  { key: "review", title: "等待审核", description: "审核人会收到待处理通知", timestamp: "10:05", state: "processing" },
  { key: "publish", title: "发布到资源中心", description: "发布后同步检索索引与访问范围", timestamp: "待执行" },
];

function handleImageLoad(): void {
  imageLoadState.value = "图片加载完成";
}

function handleImageError(): void {
  imageLoadState.value = "主图加载失败，已展示备用图或错误态";
}

function handleScroll(position: { top: number; left: number }): void {
  scrollSummary.value = `垂直 ${Math.round(position.top)}px · 横向 ${Math.round(position.left)}px`;
}

function toggleCarouselDirection(): void {
  carouselDirection.value = carouselDirection.value === "horizontal" ? "vertical" : "horizontal";
}

/** 动画结束后主动卸载粒子节点，连续触发不会积累不可见的页面元素。 */
function triggerFireworks(): void {
  window.clearTimeout(fireworksTimer);
  isFireworksVisible.value = false;
  window.requestAnimationFrame(() => {
    isFireworksVisible.value = true;
    fireworksTimer = window.setTimeout(() => {
      isFireworksVisible.value = false;
      fireworksTimer = undefined;
    }, 1120);
  });
}

onBeforeUnmount(() => window.clearTimeout(fireworksTimer));
</script>

<template>
  <section class="content-media-page page-content page-stack" aria-label="内容与媒体组件案例">
    <header class="content-media-intro">
      <div><h1>内容与媒体</h1><p>图片、轮播和滚动容器是官网、工作台与内容管理页面的共同底座，本案例集中展示它们的状态和可接入方式。</p></div>
      <AppButton variant="secondary" leading-icon="refresh" @click="activeCarouselIndex = 0">恢复轮播起点</AppButton>
    </header>

    <div class="content-media-grid">
      <article class="media-card">
        <header class="media-card-heading"><div><h2>图片状态</h2><p>懒加载、预览、备用图片和错误状态由同一组件统一处理。</p></div><span>{{ imageLoadState }}</span></header>
        <div class="image-demo-grid">
          <AppImage src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=85" alt="城市夜景" :preview="true" @load="handleImageLoad" @error="handleImageError"><template #caption>点击图片可打开大图预览</template></AppImage>
          <AppImage src="https://invalid.example.com/image-not-found.jpg" fallback-src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=85" alt="备用工作区图片" fit="contain" @load="handleImageLoad" @error="handleImageError" />
          <AppImage src="https://invalid.example.com/image-without-fallback.jpg" alt="错误状态图片" @error="handleImageError"><template #error>资源不可用，请重新上传</template></AppImage>
        </div>
      </article>

      <article class="media-card carousel-card">
        <header class="media-card-heading"><div><h2>轮播</h2><p>支持自动播放、暂停、横纵方向键、对应手势与可由业务页调用的公开控制方法。</p></div><span>{{ activeCarouselIndex + 1 }} / {{ carouselItems.length }}</span></header>
        <div class="carousel-demo-controls"><AppButton size="small" variant="secondary" @click="carouselReference?.prev()">上一张</AppButton><AppButton size="small" variant="secondary" @click="carouselReference?.next()">下一张</AppButton><AppButton size="small" variant="ghost" @click="toggleCarouselDirection">切换为{{ carouselDirection === 'horizontal' ? '纵向' : '横向' }}</AppButton></div>
        <AppCarousel ref="carouselReference" v-model="activeCarouselIndex" :items="carouselItems" :direction="carouselDirection" autoplay :interval="4200" aria-label="内容媒体轮播案例" />
      </article>
    </div>

    <article class="media-card scrollbar-card">
      <header class="media-card-heading"><div><h2>滚动容器</h2><p>滚动条属于内容容器，不会撑开外层卡片；通过模板引用可以统一回到顶部或定位到底部。</p></div><span>{{ scrollSummary }}</span></header>
      <AppScrollbar height="220px" aria-label="滚动容器案例" @scroll="handleScroll"><div class="scroll-notes"><p v-for="note in longNotes" :key="note">{{ note }}</p></div></AppScrollbar>
      <AppSpace :size="12" />
      <p class="media-note">组件案例覆盖：加载态、备用图、错误态、预览焦点回收、自动轮播、键盘与触摸导航、滚动位置事件。</p>
    </article>

    <section class="content-media-grid">
      <article class="media-card">
        <header class="media-card-heading"><div><h2>横幅与运营内容</h2><p>轻量提示、图文横幅和移动文字均提供独立组件，页面只传递内容与后续动作。</p></div><span>内容编排</span></header>
        <div class="banner-stack">
          <AppBasicBanner title="课程资料已整理完成" description="可继续邀请协作成员确认发布范围。" icon="check" tone="green"><template #actions><AppButton size="small" variant="secondary" @click="triggerFireworks">完成发布</AppButton></template></AppBasicBanner>
          <AppCardBanner title="新课上线准备" description="封面、资源和访问权限会在发布前统一检查。" image="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=85" />
        </div>
      </article>

      <article class="media-card">
        <header class="media-card-heading"><div><h2>图文卡片</h2><p>课程、文章和资源等可点击内容使用同一张图卡，保留简洁的标题与描述层级。</p></div><span>资源列表</span></header>
        <div class="content-image-card-grid">
          <AppImageCard title="Vue 工程化路径" description="从构建、规范到性能优化的完整实践。" src="https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=85" alt="代码编辑器" />
          <AppImageCard title="数据分析实战" description="以业务问题为入口，构建可复用的数据看板。" src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=85" alt="数据图表屏幕" />
        </div>
      </article>
    </section>

    <section class="content-media-grid">
      <article class="media-card marquee-card">
        <header class="media-card-heading"><div><h2>动态文字</h2><p>常规滚动与节日包装都复用同一个文本滚动底座，悬停时可暂停阅读。</p></div><span>轻量动效</span></header>
        <div class="marquee-stack"><AppTextScroll text="课程资源中心将在今晚 20:00 完成内容索引更新" :speed="22" /><AppFestivalTextScroll text="夏季学习计划已开启，完成首个任务即可解锁专属资料" :speed="19" /></div>
      </article>

      <article class="media-card timeline-card">
        <header class="media-card-heading"><div><h2>内容发布流程</h2><p>时间线卡片把标题、描述、操作区和业务步骤封装在一起，适合详情侧栏与工作台。</p></div><span>流程卡片</span></header>
        <AppTimelineCard title="课程发布记录" description="当前发布链路" :items="contentTimelineItems"><template #actions><AppButton size="small" variant="text">查看详情</AppButton></template></AppTimelineCard>
      </article>
    </section>
    <AppFireworksEffect :show="isFireworksVisible" :count="24" />
  </section>
</template>

<style scoped>
.content-media-page { display: grid; min-height: 0; align-content: start; gap: var(--aps-page-stack-gap); }.content-media-intro { display: flex; align-items: end; justify-content: space-between; gap: 24px; }.content-media-intro h1, .content-media-intro p { margin: 0; }.content-media-intro h1 { color: var(--aps-ink); font-size: var(--aps-text-2xl); font-weight: var(--aps-font-weight-heading); letter-spacing: -.035em; }.content-media-intro p { max-width: 720px; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }.content-media-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--aps-page-stack-gap); }.media-card { display: grid; min-width: 0; align-content: start; gap: 22px; padding: var(--aps-card-padding); border: 1px solid var(--aps-line-soft); border-radius: var(--aps-radius-card); background: var(--aps-surface); }.media-card-heading { display: flex; align-items: start; justify-content: space-between; gap: 16px; }.media-card-heading h2, .media-card-heading p { margin: 0; }.media-card-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-lg); font-weight: var(--aps-font-weight-heading); }.media-card-heading p { margin-top: 6px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }.media-card-heading > span { flex: 0 0 auto; color: var(--aps-faint); font-size: var(--aps-text-xs); font-weight: var(--aps-font-weight-primary); }.image-demo-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }.image-demo-grid :deep(.app-image) { min-height: 120px; }.carousel-demo-controls { display: flex; flex-wrap: wrap; gap: 8px; }.carousel-card :deep(.app-carousel) { min-height: 270px; }.scroll-notes { display: grid; gap: 0; }.scroll-notes p { margin: 0; padding: 12px 14px; border-bottom: 1px solid var(--aps-line-soft); color: var(--aps-muted); font-size: var(--aps-text-sm); }.scroll-notes p:nth-child(even) { background: var(--aps-surface-soft); }.media-note { margin: 0; color: var(--aps-faint); font-size: var(--aps-text-xs); }.banner-stack, .marquee-stack { display: grid; gap: 12px; }.content-image-card-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }.marquee-stack { overflow: hidden; padding: 14px; border: 1px solid var(--aps-line-soft); border-radius: 11px; background: var(--aps-surface-soft); color: var(--aps-muted); font-size: var(--aps-text-sm); }.timeline-card :deep(.app-card-control) { box-shadow: none; }
@media (max-width: 900px) { .content-media-grid { grid-template-columns: 1fr; }.content-media-intro { align-items: flex-start; flex-direction: column; gap: 14px; }.content-media-intro .app-button-control { width: 100%; } }
@media (max-width: 620px) { .image-demo-grid { grid-template-columns: 1fr; }.image-demo-grid :deep(.app-image) { min-height: 180px; }.media-card-heading { gap: 10px; }.media-card-heading > span { display: none; } }
</style>
