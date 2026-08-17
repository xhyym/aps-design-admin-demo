<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  AppAlert,
  AppAutocomplete,
  AppButton,
  AppCard,
  AppCascader,
  AppConfirmDialog,
  AppDescriptions,
  AppEditableTable,
  AppFormField,
  AppIconButton,
  AppImageCropper,
  AppImageViewer,
  AppInput,
  AppInputTag,
  AppNumberInput,
  AppRichTextEditor,
  AppSelect,
  AppStatusTag,
  AppSteps,
  AppTableBatchEditor,
  AppTableToolbar,
  AppUpload,
} from "aps-design-pro";
import { createProduct, getProduct, getProductCategoryTree, updateProduct } from "@/api/modules/ecommerce";
import { imageAssetAdapter } from "@/api/modules/files";
import { useFeedbackStore } from "@/stores/feedback";
import type {
  AutocompleteOption,
  CascaderOption,
  DataTableBatchEditField,
  DataTableBatchEditPayload,
  DataTableColumn,
  DataTableEditContext,
  DataTableEditorValue,
  DescriptionItem,
  ImageViewerItem,
  SelectOption,
  StepItem,
  UploadFileItem,
  UploadRequestOptions,
  UploadRequestResult,
} from "aps-design-pro";
import type { CropResult } from "aps-design-pro";
import type {
  ProductDetail,
  ProductCategoryTreeNode,
  ProductMedia,
  ProductSaveInput,
  ProductSku,
  ProductSkuStatus,
  ProductStatus,
} from "@/types/ecommerce";

interface ProductEditorProps {
  mode: "create" | "edit";
  productId?: string;
  /** 嵌入商品弹窗时隐藏独立页面标题，由弹窗负责内容滚动和底部操作区。 */
  embedded?: boolean;
}

interface ProductEditorState {
  activeStep: number;
  isLoading: boolean;
  isSaving: boolean;
}

const props = defineProps<ProductEditorProps>();
const emit = defineEmits<{
  close: [];
  saved: [{ isPublishing: boolean }];
  "state-change": [state: ProductEditorState];
}>();

const route = useRoute();
const router = useRouter();
const feedbackStore = useFeedbackStore();

const PRODUCT_STEP_ITEMS: StepItem[] = [
  { key: "basic", title: "基础信息", description: "名称、分类与价格策略" },
  { key: "media", title: "商品素材与详情", description: "主图、轮播图与商品描述" },
  { key: "sku", title: "SKU 与库存", description: "规格组合、售价与可售库存" },
  { key: "confirm", title: "发布确认", description: "发布前完整性检查" },
];
const BRAND_OPTIONS: AutocompleteOption[] = [
  { key: "north-coast", label: "North Coast Coffee", value: "North Coast Coffee", description: "精品咖啡" },
  { key: "bean-lab", label: "Bean Lab", value: "Bean Lab", description: "咖啡器具" },
  { key: "daily-roast", label: "Daily Roast", value: "Daily Roast", description: "日常咖啡" },
  { key: "morrow", label: "Morrow Studio", value: "Morrow Studio", description: "生活方式" },
];
const PRODUCT_STATUS_OPTIONS: SelectOption[] = [
  { label: "在售", value: "on_sale" },
  { label: "草稿", value: "draft" },
  { label: "已归档", value: "archived" },
];
const COVER_TONE_OPTIONS: SelectOption[] = [
  { label: "蓝色", value: "blue" },
  { label: "暖橙", value: "orange" },
  { label: "紫灰", value: "purple" },
  { label: "深绿", value: "green" },
  { label: "石墨", value: "graphite" },
];
const SKU_STATUS_OPTIONS: SelectOption[] = [
  { label: "启用", value: "enabled" },
  { label: "停用", value: "disabled" },
];
const SKU_TABLE_COLUMNS: DataTableColumn<ProductSku>[] = [
  { key: "specValues", label: "规格组合", defaultWidth: 210, minWidth: 160, maxWidth: 360 },
  { key: "sku", label: "SKU 编码", defaultWidth: 172, minWidth: 148, maxWidth: 270, editable: true, editor: { type: "text", placeholder: "输入 SKU 编码" } },
  { key: "barcode", label: "商品条码", defaultWidth: 170, minWidth: 148, maxWidth: 270, editable: true, editor: { type: "text", placeholder: "选填条码" } },
  { key: "price", label: "售价", defaultWidth: 126, minWidth: 108, maxWidth: 180, align: "right", editable: true, editor: { type: "number", min: 0, step: 0.01 } },
  { key: "stock", label: "库存", defaultWidth: 112, minWidth: 96, maxWidth: 160, align: "right", editable: true, editor: { type: "number", min: 0, step: 1 } },
  { key: "status", label: "状态", defaultWidth: 108, minWidth: 92, maxWidth: 148, editable: true, editor: { type: "select", options: SKU_STATUS_OPTIONS } },
];
const SKU_BATCH_FIELDS: DataTableBatchEditField<ProductSku>[] = [
  { key: "price", label: "SKU 售价", editor: { type: "number", min: 0, step: 0.01 } },
  { key: "status", label: "SKU 状态", editor: { type: "select", options: SKU_STATUS_OPTIONS } },
];

const activeStep = ref(0);
const isLoading = ref(false);
const isSaving = ref(false);
const saveError = ref("");
const categoryOptions = ref<CascaderOption[]>([]);
const imageFiles = ref<UploadFileItem[]>([]);
const selectedSkuKeys = ref<Array<string | number>>([]);
const skuDeleteTarget = ref<ProductSku | null>(null);
const isImageViewerOpen = ref(false);
const activeImageIndex = ref(0);
const cropSource = ref("");
const cropMediaId = ref("");
const draft = ref<ProductSaveInput>(createEmptyProduct());

const isCreateMode = computed(() => props.mode === "create");
const editorTitle = computed(() => isCreateMode.value ? "新建商品" : "编辑商品");
const imageViewerItems = computed<ImageViewerItem[]>(() => draft.value.media.map((media) => ({ src: media.url, alt: media.alt, title: media.alt || draft.value.name || "商品图片" })));
const currentValidationErrors = computed(() => getValidationErrors(activeStep.value));
const productSummary = computed<DescriptionItem[]>(() => [
  { key: "name", label: "商品名称", value: draft.value.name || "未填写" },
  { key: "category", label: "所属分类", value: draft.value.category || "未选择" },
  { key: "brand", label: "品牌", value: draft.value.brand || "未填写" },
  { key: "status", label: "商品状态", value: getProductStatusLabel(draft.value.status) },
  { key: "media", label: "商品素材", value: `${draft.value.media.length} 张` },
  { key: "sku", label: "SKU 数量", value: `${draft.value.skus.length} 个` },
  { key: "enabledSku", label: "可发布 SKU", value: `${draft.value.skus.filter((item) => item.status === "enabled").length} 个` },
  { key: "price", label: "起售价", value: getStartingPriceLabel() },
]);

watch([activeStep, isLoading, isSaving], ([nextActiveStep, nextIsLoading, nextIsSaving]) => {
  emit("state-change", { activeStep: nextActiveStep, isLoading: nextIsLoading, isSaving: nextIsSaving });
}, { immediate: true });

/** 新建草稿始终带默认 SKU，草稿保存与后续规格组合均有稳定的编辑基座。 */
function createEmptyProduct(): ProductSaveInput {
  return {
    name: "",
    category: "",
    categoryPath: [],
    brand: "",
    highlights: [],
    status: "draft",
    coverTone: "blue",
    media: [],
    description: "",
    specifications: [{ id: createLocalId("spec"), name: "规格", values: ["默认规格"] }],
    skus: [{ id: createLocalId("sku"), specValues: ["默认规格"], sku: "PRODUCT-DEFAULT-01", barcode: "", price: 0, stock: 0, status: "enabled" }],
  };
}

function createLocalId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function cloneProductForForm(product: ProductDetail): ProductSaveInput {
  return {
    name: product.name,
    category: product.category,
    categoryPath: [...product.categoryPath],
    brand: product.brand,
    highlights: [...product.highlights],
    status: product.status,
    coverTone: product.coverTone,
    media: product.media.map((item) => ({ ...item })),
    description: product.description,
    specifications: product.specifications.map((item) => ({ ...item, values: [...item.values] })),
    skus: product.skus.map((item) => ({ ...item, specValues: [...item.specValues] })),
  };
}

function createUploadFile(media: ProductMedia): UploadFileItem {
  return {
    uid: media.id,
    name: media.alt || "商品图片",
    size: 0,
    type: "image/*",
    status: "success",
    progress: 100,
    url: media.url,
  };
}

function getProductStatusLabel(status: ProductStatus): string {
  return PRODUCT_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? "草稿";
}

function getSkuStatusLabel(status: ProductSkuStatus): string {
  return status === "enabled" ? "启用" : "停用";
}

function getStartingPriceLabel(): string {
  const enabledSkus = draft.value.skus.filter((item) => item.status === "enabled");
  if (!enabledSkus.length) return "未配置";
  return formatCurrency(Math.min(...enabledSkus.map((item) => item.price)));
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", minimumFractionDigits: 2 }).format(amount);
}

/** 商品编辑器与商品列表共用分类服务返回的结构，避免分类维护后级联选择仍显示旧数据。 */
function toCascaderOption(category: ProductCategoryTreeNode): CascaderOption {
  return {
    label: category.status === "disabled" ? `${category.name}（已停用）` : category.name,
    value: category.code,
    disabled: category.code !== "all-products" && category.status === "disabled",
    children: category.children.map(toCascaderOption),
    leaf: category.children.length === 0,
  };
}

async function loadCategoryOptions(): Promise<void> {
  const categoryTree = await getProductCategoryTree();
  categoryOptions.value = [toCascaderOption(categoryTree)];
}

function getCategoryLabel(path: string[]): string {
  let currentOptions = categoryOptions.value;
  const labels: string[] = [];
  path.forEach((value) => {
    const option = currentOptions.find((item) => item.value === value);
    if (!option) return;
    labels.push(option.label);
    currentOptions = option.children ?? [];
  });
  return labels.at(-1) ?? "";
}

function syncCategory(): void {
  draft.value.category = getCategoryLabel(draft.value.categoryPath);
}

/** 上传队列只转换可预览图片，上传尚未完成时继续保留 blob URL 供当前编辑会话查看。 */
function syncMediaFromFiles(files: UploadFileItem[]): void {
  const previousByUrl = new Map(draft.value.media.map((item) => [item.url, item]));
  draft.value.media = files
    .filter((file) => file.type.startsWith("image/") && Boolean(file.url) && file.status !== "error" && file.status !== "aborted")
    .map((file, index) => {
      const existing = previousByUrl.get(file.url ?? "");
      return {
        id: existing?.id ?? file.uid ?? createLocalId("media"),
        url: file.url ?? "",
        alt: existing?.alt || `${draft.value.name.trim() || "商品"}图片 ${index + 1}`,
      };
    });
}

async function uploadProductImage({ file, signal, onProgress }: UploadRequestOptions): Promise<UploadRequestResult> {
  const uploadedImage = await imageAssetAdapter.uploadImage({ file, signal, onProgress });
  /** 商品封面和富文本复用同一资产适配器，确保鉴权、签名和资源地址策略始终一致。 */
  return { url: uploadedImage.url };
}

function handleImageChange(_file: UploadFileItem, files: UploadFileItem[]): void {
  syncMediaFromFiles(files);
}

function previewImage(file: UploadFileItem): void {
  const index = draft.value.media.findIndex((item) => item.url === file.url);
  if (index < 0) return;
  activeImageIndex.value = index;
  isImageViewerOpen.value = true;
}

function startCropping(): void {
  const media = draft.value.media[activeImageIndex.value] ?? draft.value.media[0];
  if (!media) {
    feedbackStore.show("请先上传至少一张商品图片。", "warning");
    return;
  }
  cropSource.value = media.url;
  cropMediaId.value = media.id;
}

/** 裁剪完成后替换当前素材，保留媒体 id 使编辑页中的引用与顺序保持稳定。 */
function handleCrop(result: CropResult): void {
  const mediaIndex = draft.value.media.findIndex((item) => item.id === cropMediaId.value);
  if (mediaIndex < 0) return;
  const currentMedia = draft.value.media[mediaIndex];
  const nextMedia = { ...currentMedia, url: result.dataUrl };
  draft.value.media.splice(mediaIndex, 1, nextMedia);
  imageFiles.value = imageFiles.value.map((file) => file.uid === currentMedia.id ? { ...file, url: result.dataUrl, status: "success", progress: 100 } : file);
  cropSource.value = "";
  feedbackStore.show(`已替换第 ${mediaIndex + 1} 张商品图片。`, "success");
}

function handleCropError(message: string): void {
  feedbackStore.show(message, "error");
}

function addSpecification(): void {
  if (draft.value.specifications.length >= 3) {
    feedbackStore.show("当前商品最多支持 3 个规格维度。", "warning");
    return;
  }
  draft.value.specifications.push({ id: createLocalId("spec"), name: "", values: [] });
}

function removeSpecification(specificationId: string): void {
  if (draft.value.specifications.length <= 1) {
    feedbackStore.show("至少保留一个规格维度，用于生成 SKU。", "warning");
    return;
  }
  draft.value.specifications = draft.value.specifications.filter((item) => item.id !== specificationId);
  regenerateSkus();
}

/** 规格变化时按组合键保留已填写的 SKU 数据，仅新增缺失组合，避免改价或库存被误清空。 */
function regenerateSkus(): void {
  const validSpecifications = draft.value.specifications
    .map((item) => ({ ...item, name: item.name.trim(), values: item.values.map((value) => value.trim()).filter(Boolean) }))
    .filter((item) => item.name && item.values.length);
  if (!validSpecifications.length) return;

  const combinations = validSpecifications.reduce<string[][]>((result, specification) => result.flatMap((current) => specification.values.map((value) => [...current, value])), [[]]);
  if (combinations.length > 80) {
    feedbackStore.show("SKU 组合超过 80 条，请减少规格值后再生成。", "warning");
    return;
  }
  const existingSkuMap = new Map(draft.value.skus.map((sku) => [sku.specValues.join("\u0001"), sku]));
  draft.value.skus = combinations.map((specValues, index) => {
    const existingSku = existingSkuMap.get(specValues.join("\u0001"));
    return existingSku ? { ...existingSku, specValues: [...specValues] } : {
      id: createLocalId("sku"),
      specValues,
      sku: createSuggestedSku(specValues, index),
      barcode: "",
      price: draft.value.skus[0]?.price ?? 0,
      stock: 0,
      status: "enabled" as const,
    };
  });
  selectedSkuKeys.value = [];
}

function createSuggestedSku(specValues: string[], index: number): string {
  const productKey = (draft.value.name || "PRODUCT").trim().toLocaleUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "PRODUCT";
  const specificationKey = specValues.map((item) => item.slice(0, 3).toLocaleUpperCase()).join("-") || "DEFAULT";
  return `${productKey}-${specificationKey}-${String(index + 1).padStart(2, "0")}`;
}

/** 支持无规格商品和临时补货场景直接新增 SKU，保存时仍由商品聚合接口统一提交。 */
function addSku(): void {
  if (draft.value.skus.length >= 80) {
    feedbackStore.show("当前商品最多支持 80 个 SKU。", "warning");
    return;
  }
  const nextIndex = draft.value.skus.length;
  draft.value.skus.push({
    id: createLocalId("sku"),
    specValues: [`自定义规格 ${nextIndex + 1}`],
    sku: createSuggestedSku(["CUSTOM"], nextIndex),
    barcode: "",
    price: draft.value.skus[0]?.price ?? 0,
    stock: 0,
    status: "enabled",
  });
}

/** SKU 删除先在当前草稿中确认，商品至少保留一条 SKU 以维持库存模型完整。 */
function confirmRemoveSku(): void {
  const target = skuDeleteTarget.value;
  if (!target) return;
  if (draft.value.skus.length <= 1) {
    feedbackStore.show("商品至少需要保留一个 SKU。", "warning");
    skuDeleteTarget.value = null;
    return;
  }
  draft.value.skus = draft.value.skus.filter((sku) => sku.id !== target.id);
  selectedSkuKeys.value = selectedSkuKeys.value.filter((key) => key !== target.id);
  skuDeleteTarget.value = null;
  feedbackStore.show(`SKU“${target.sku}”已从当前草稿移除。`, "success");
}

function validateSkuCell(context: DataTableEditContext<ProductSku>, value: DataTableEditorValue): string | void {
  if (context.column.key === "sku") {
    const code = String(value ?? "").trim();
    if (!code) return "SKU 编码不能为空。";
    if (draft.value.skus.some((sku) => sku.id !== context.row.id && sku.sku.trim().toLocaleUpperCase() === code.toLocaleUpperCase())) return "SKU 编码不能重复。";
  }
  if ((context.column.key === "price" || context.column.key === "stock") && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) return "请输入大于或等于 0 的数值。";
  return undefined;
}

function saveSkuCell(context: DataTableEditContext<ProductSku>, value: DataTableEditorValue): void {
  const sku = draft.value.skus.find((item) => item.id === context.row.id);
  if (!sku) return;
  if (context.column.key === "sku" || context.column.key === "barcode") sku[context.column.key] = String(value ?? "").trim();
  if (context.column.key === "price") sku.price = Number(value);
  if (context.column.key === "stock") sku.stock = Math.max(0, Math.floor(Number(value)));
  if (context.column.key === "status" && (value === "enabled" || value === "disabled")) sku.status = value;
}

async function batchUpdateSkus(payload: DataTableBatchEditPayload<ProductSku>): Promise<void> {
  const selectedIds = new Set(payload.rowKeys.map(String));
  if (!selectedIds.size) throw new Error("请先选择需要修改的 SKU。");
  draft.value.skus.forEach((sku) => {
    if (!selectedIds.has(sku.id)) return;
    if (payload.field.key === "price" && typeof payload.value === "number" && payload.value >= 0) sku.price = Number(payload.value.toFixed(2));
    if (payload.field.key === "status" && (payload.value === "enabled" || payload.value === "disabled")) sku.status = payload.value;
  });
}

function handleSkuBatchSuccess(payload: DataTableBatchEditPayload<ProductSku>): void {
  selectedSkuKeys.value = [];
  feedbackStore.show(`已批量更新 ${payload.rowKeys.length} 个 SKU 的${payload.field.label}。`, "success");
}

function handleSkuBatchError(_payload: DataTableBatchEditPayload<ProductSku> | null, message: string): void {
  feedbackStore.show(message, "error");
}

function getValidationErrors(step: number): string[] {
  const errors: string[] = [];
  if (step === 0 || step === 3) {
    if (draft.value.name.trim().length < 2) errors.push("商品名称至少需要 2 个字符。");
    if (!draft.value.category.trim() || !draft.value.categoryPath.length) errors.push("请选择商品分类。");
    if (!draft.value.brand.trim()) errors.push("请填写或选择商品品牌。");
  }
  if (step === 1 || step === 3) {
    if (!draft.value.media.length) errors.push("至少上传一张商品主图后才可发布。");
  }
  if (step === 2 || step === 3) {
    const enabledSkus = draft.value.skus.filter((item) => item.status === "enabled");
    if (!enabledSkus.length) errors.push("至少需要一个启用中的 SKU。");
    draft.value.skus.forEach((sku, index) => {
      if (!sku.sku.trim()) errors.push(`第 ${index + 1} 个 SKU 缺少编码。`);
      if (!Number.isFinite(sku.price) || sku.price < 0) errors.push(`第 ${index + 1} 个 SKU 售价无效。`);
      if (!Number.isFinite(sku.stock) || sku.stock < 0) errors.push(`第 ${index + 1} 个 SKU 库存无效。`);
    });
    const normalizedSkuCodes = draft.value.skus.map((sku) => sku.sku.trim().toLocaleUpperCase()).filter(Boolean);
    if (new Set(normalizedSkuCodes).size !== normalizedSkuCodes.length) errors.push("SKU 编码不能重复。");
  }
  return [...new Set(errors)];
}

function goToStep(nextStep: number): void {
  if (nextStep > activeStep.value) {
    const errors = getValidationErrors(activeStep.value);
    if (errors.length) {
      feedbackStore.show(errors[0], "warning");
      return;
    }
  }
  activeStep.value = Math.max(0, Math.min(nextStep, PRODUCT_STEP_ITEMS.length - 1));
}

function goToPreviousStep(): void {
  goToStep(activeStep.value - 1);
}

function goToNextStep(): void {
  goToStep(activeStep.value + 1);
}

async function saveDraft(): Promise<void> {
  await persistProduct(false);
}

async function publishProduct(): Promise<void> {
  const errors = getValidationErrors(3);
  if (errors.length) {
    saveError.value = errors[0];
    feedbackStore.show("发布前校验未通过，请补齐商品资料。", "warning");
    return;
  }
  await persistProduct(true);
}

/** 发布和草稿使用相同服务契约，正式发布额外执行完整性校验，避免不完整数据进入列表。 */
async function persistProduct(isPublishing: boolean): Promise<void> {
  if (isSaving.value) return;
  saveError.value = "";
  isSaving.value = true;
  try {
    if (isCreateMode.value) await createProduct(draft.value);
    else if (props.productId) await updateProduct(props.productId, draft.value);
    else throw new Error("未找到需要编辑的商品标识。");
    feedbackStore.show(isPublishing ? "商品已发布并同步到列表。" : "商品草稿已保存。", "success");
    emit("saved", { isPublishing });
    if (isPublishing && !props.embedded) await router.push({ path: "/products/catalog", query: route.query });
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : "保存商品失败，请稍后重试。";
    feedbackStore.show(saveError.value, "error");
  } finally {
    isSaving.value = false;
  }
}

async function loadProduct(): Promise<void> {
  if (isCreateMode.value) return;
  if (!props.productId) {
    saveError.value = "缺少商品标识，无法加载编辑数据。";
    return;
  }
  try {
    const product = await getProduct(props.productId);
    draft.value = cloneProductForForm(product);
    imageFiles.value = product.media.map(createUploadFile);
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : "加载商品详情失败，请稍后重试。";
  }
}

async function initializeEditor(): Promise<void> {
  isLoading.value = true;
  saveError.value = "";
  try {
    await loadCategoryOptions();
    await loadProduct();
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : "商品分类加载失败，请稍后重试。";
  } finally {
    isLoading.value = false;
  }
}

function returnToCatalog(): void {
  if (props.embedded) {
    emit("close");
    return;
  }
  void router.push({ path: "/products/catalog", query: route.query });
}

/** 弹窗 footer 由父级承载，编辑器只暴露确定的流程动作，避免父子重复维护状态。 */
defineExpose({
  cancel: returnToCatalog,
  goToPreviousStep,
  goToNextStep,
  saveDraft,
  publishProduct,
});

watch(imageFiles, (files) => {
  syncMediaFromFiles(files);
}, { deep: true });

onMounted(() => {
  void initializeEditor();
});
</script>

<template>
  <section class="page-content product-editor-page" :class="{ 'embedded-product-editor': embedded }" :aria-label="editorTitle">
    <header v-if="!embedded" class="editor-header">
      <div class="editor-heading">
        <button class="back-link" type="button" @click="returnToCatalog">商品与 SKU</button>
        <h1>{{ editorTitle }}</h1>
        <p>在同一份草稿中完成商品内容、素材与 SKU 配置；发布后将保留列表筛选与页码。</p>
      </div>
      <AppButton variant="secondary" leading-icon="arrow-left" @click="returnToCatalog">返回列表</AppButton>
    </header>

    <AppCard as="section" padding="large" class="steps-card">
      <AppSteps :model-value="activeStep" :items="PRODUCT_STEP_ITEMS" clickable aria-label="商品编辑步骤" @change="goToStep" />
    </AppCard>

    <AppAlert v-if="saveError" tone="danger" title="商品未保存" :description="saveError" closable @close="saveError = ''" />
    <AppAlert v-else-if="currentValidationErrors.length" tone="warning" title="当前步骤仍有待补充内容" :description="currentValidationErrors[0]" />

    <AppCard v-if="isLoading" as="section" padding="large" class="editor-loading-card">
      <strong>正在加载商品详情…</strong>
      <span>商品草稿与素材信息准备完成后即可继续编辑。</span>
    </AppCard>

    <template v-else>
      <AppCard v-if="activeStep === 0" as="section" padding="large" class="editor-card">
        <header class="section-heading"><div><h2>基础信息</h2><p>先建立商品的检索、归属和售卖基础，后续素材与 SKU 会共享这份信息。</p></div><span>01 / 04</span></header>
        <div class="form-grid">
          <AppFormField label="商品名称" for="product-name" required :error="draft.name.trim().length > 0 && draft.name.trim().length < 2 ? '至少输入 2 个字符' : ''"><AppInput id="product-name" v-model="draft.name" placeholder="例如：手冲咖啡入门套装" clearable :max-length="60" show-word-limit /></AppFormField>
          <AppFormField label="商品分类" for="product-category" required :error="draft.categoryPath.length ? '' : '请选择商品分类'"><AppCascader id="product-category" v-model="draft.categoryPath" :options="categoryOptions" clearable filterable aria-label="选择商品分类" @change="syncCategory" /></AppFormField>
          <AppFormField label="商品品牌" for="product-brand" required :error="draft.brand.trim() ? '' : '请选择或填写品牌'"><AppAutocomplete id="product-brand" v-model="draft.brand" :options="BRAND_OPTIONS" clearable placeholder="选择已有品牌，或直接输入" /></AppFormField>
          <AppFormField label="商品状态" for="product-status"><AppSelect id="product-status" v-model="draft.status" :options="PRODUCT_STATUS_OPTIONS" aria-label="选择商品状态" /></AppFormField>
          <AppFormField label="卖点标签" for="product-highlights" description="用于列表与商品页的快速说明，最多 8 个。" class="form-span-two"><AppInputTag id="product-highlights" v-model="draft.highlights" :max="8" :max-length="16" add-on-blur placeholder="输入卖点后按回车" /></AppFormField>
          <AppFormField label="起售价参考" for="product-reference-price" description="实际成交价由 SKU 售价决定。"><AppNumberInput id="product-reference-price" :model-value="draft.skus[0]?.price ?? 0" :min="0" :step="0.01" aria-label="设置默认 SKU 售价" @update:model-value="draft.skus[0] && (draft.skus[0].price = $event)" /></AppFormField>
          <AppFormField label="封面色调" for="product-cover-tone" description="用于商品卡片与列表的视觉标识。"><AppSelect id="product-cover-tone" v-model="draft.coverTone" :options="COVER_TONE_OPTIONS" aria-label="选择商品封面色调" /></AppFormField>
        </div>
      </AppCard>

      <AppCard v-else-if="activeStep === 1" as="section" padding="large" class="editor-card">
        <header class="section-heading"><div><h2>商品素材与详情</h2><p>图片将在当前编辑会话内即时预览；接入正式文件服务后可直接返回稳定资源地址。</p></div><span>02 / 04</span></header>
        <div class="media-workspace">
          <section class="media-panel"><div class="subsection-heading"><div><h3>主图与轮播图</h3><p>第一张图片将作为商品列表缩略图。</p></div><AppButton variant="secondary" size="small" leading-icon="edit" :disabled="!draft.media.length" @click="startCropping">裁剪当前图</AppButton></div><AppUpload v-model="imageFiles" accept="image/*" list-type="picture-card" :limit="8" :max-size="10 * 1024 * 1024" :request="uploadProductImage" upload-text="上传商品图片" @change="handleImageChange" @preview="previewImage" /><p class="media-hint">建议上传 1:1 或 4:3 图片，单张不超过 10 MB。</p></section>
          <section class="media-panel crop-panel"><div class="subsection-heading"><div><h3>图片裁剪</h3><p>选择当前素材后可裁剪为方形封面。</p></div><AppIconButton v-if="cropSource" icon="close" label="关闭图片裁剪" size="small" @click="cropSource = ''" /></div><AppImageCropper v-if="cropSource" v-model="cropSource" aspect="1 / 1" :output-width="1200" @crop="handleCrop" @error="handleCropError" /><div v-else class="crop-placeholder"><strong>等待选择素材</strong><span>上传图片后，在预览器中选择一张，再开始裁剪。</span></div></section>
        </div>
        <section class="detail-editor"><div class="subsection-heading"><div><h3>商品详情</h3><p>描述支持基础文字强调与列表，避免未经处理的外部 HTML 进入商品展示页。</p></div></div><AppRichTextEditor v-model="draft.description" placeholder="介绍商品特点、使用方式与售后说明" :min-height="220" /></section>
      </AppCard>

      <AppCard v-else-if="activeStep === 2" as="section" padding="large" class="editor-card sku-editor-card">
        <header class="section-heading"><div><h2>SKU 与库存</h2><p>维护规格组合后可直接在单元格中调整价格、库存和售卖状态。</p></div><span>03 / 04</span></header>
        <AppAlert tone="info" title="SKU 生成规则" description="修改规格名称或值后点击“生成 SKU 组合”。系统会保留相同组合已经填写的价格、库存与条码。" />
        <section class="specifications-panel"><header class="subsection-heading"><div><h3>规格配置</h3><p>最多 3 个规格维度，组合总数不超过 80 条。</p></div><div class="specification-actions"><AppButton variant="secondary" size="small" leading-icon="plus" @click="addSpecification">添加规格</AppButton><AppButton size="small" leading-icon="refresh" @click="regenerateSkus">生成 SKU 组合</AppButton></div></header><div class="specification-list"><article v-for="(specification, index) in draft.specifications" :key="specification.id" class="specification-row"><span class="specification-index">{{ String(index + 1).padStart(2, '0') }}</span><AppInput v-model="specification.name" placeholder="规格名称，例如：容量" aria-label="输入规格名称" /><AppInputTag v-model="specification.values" :max="10" :max-length="20" add-on-blur placeholder="输入规格值后按回车" aria-label="输入规格值" /><AppIconButton icon="close" :label="`移除规格 ${index + 1}`" size="small" @click="removeSpecification(specification.id)" /></article></div></section>
        <section class="sku-table-panel"><AppTableToolbar :selected-count="selectedSkuKeys.length"><AppButton variant="secondary" size="small" leading-icon="plus" @click="addSku">新增 SKU</AppButton><template #bulk><AppTableBatchEditor :selected-keys="selectedSkuKeys" :fields="SKU_BATCH_FIELDS" :request="batchUpdateSkus" @success="handleSkuBatchSuccess" @error="handleSkuBatchError" /><AppIconButton icon="close" label="取消选择 SKU" size="small" @click="selectedSkuKeys = []" /></template></AppTableToolbar><AppEditableTable :rows="draft.skus" :columns="SKU_TABLE_COLUMNS" row-key="id" selectable :selected-keys="selectedSkuKeys" show-index resizable striped show-column-dividers action-label="操作" :edit-trigger="'click'" :validator="validateSkuCell" @update:selected-keys="selectedSkuKeys = $event" @edit-save="saveSkuCell"><template #display-specValues="{ row }"><span class="sku-spec-values">{{ row.specValues.join(' / ') || '默认规格' }}</span></template><template #display-price="{ row }"><strong class="sku-number">{{ formatCurrency(row.price) }}</strong></template><template #display-stock="{ row }"><strong class="sku-number" :class="{ 'is-low-stock': row.stock < 10 }">{{ row.stock }}</strong></template><template #display-status="{ row }"><AppStatusTag :tone="row.status === 'enabled' ? 'success' : 'neutral'" :label="getSkuStatusLabel(row.status)" /></template><template #actions="{ row }"><AppIconButton icon="trash" label="删除 SKU" size="small" variant="danger" @click="skuDeleteTarget = row" /></template></AppEditableTable></section>
      </AppCard>

      <AppCard v-else as="section" padding="large" class="editor-card confirm-card">
        <header class="section-heading"><div><h2>发布确认</h2><p>发布前再次确认商品信息、素材和可售 SKU 是否完整。</p></div><span>04 / 04</span></header>
        <AppAlert v-if="getValidationErrors(3).length" tone="warning" title="暂不满足发布条件" :description="getValidationErrors(3)[0]" />
        <AppAlert v-else tone="success" title="商品可以发布" description="主图、基础信息与可售 SKU 已齐全，发布后会立即出现在商品列表中。" />
        <AppDescriptions title="商品发布摘要" :items="productSummary" :columns="4" direction="vertical" border />
        <div class="publish-preview"><div class="preview-cover" :class="`is-${draft.coverTone}`"><img v-if="draft.media[0]?.url" :src="draft.media[0].url" :alt="draft.media[0].alt" /><span v-else>{{ draft.name.slice(0, 1) || '商' }}</span></div><div><strong>{{ draft.name || '未命名商品' }}</strong><p>{{ draft.highlights.join(' · ') || '商品卖点将在这里展示' }}</p><span>{{ draft.category || '未选择分类' }} · {{ getStartingPriceLabel() }}</span></div></div>
      </AppCard>
    </template>

    <footer v-if="!embedded" class="editor-footer"><div><AppButton v-if="activeStep > 0" variant="secondary" leading-icon="arrow-left" :disabled="isSaving" @click="goToPreviousStep">上一步</AppButton></div><div class="footer-actions"><AppButton variant="secondary" :loading="isSaving && activeStep !== 3" :disabled="isSaving" @click="saveDraft">保存草稿</AppButton><AppButton v-if="activeStep < PRODUCT_STEP_ITEMS.length - 1" :disabled="isSaving || isLoading" trailing-icon="chevron-right" @click="goToNextStep">下一步</AppButton><AppButton v-else :loading="isSaving" :disabled="isLoading" leading-icon="check" @click="publishProduct">校验并发布</AppButton></div></footer>

    <AppImageViewer v-model="isImageViewerOpen" v-model:active-index="activeImageIndex" :items="imageViewerItems" aria-label="商品图片预览" />
    <AppConfirmDialog :model-value="Boolean(skuDeleteTarget)" title="确认移除 SKU？" :description="`SKU“${skuDeleteTarget?.sku ?? ''}”将在保存商品后永久删除。`" confirm-text="确认移除" danger @update:model-value="skuDeleteTarget = null" @confirm="confirmRemoveSku" />
  </section>
</template>

<style scoped>
.product-editor-page { display: grid; min-height: 0; align-content: start; gap: var(--aps-page-stack-gap); padding-bottom: 28px; }
.embedded-product-editor { min-height: 0; gap: 18px; padding: 20px 24px 24px; }
.embedded-product-editor :deep(.app-card-control) { border: 0; border-radius: 0; box-shadow: none; background: transparent; }
.embedded-product-editor :deep(.app-card-control .card-content) { padding: 0; }
.embedded-product-editor .steps-card, .embedded-product-editor .editor-card { gap: 18px; }
.editor-header, .section-heading, .subsection-heading, .editor-footer, .specification-actions, .footer-actions { display: flex; min-width: 0; align-items: center; justify-content: space-between; gap: 18px; }
.editor-header { align-items: flex-end; }
.editor-heading { min-width: 0; }
.back-link { padding: 0; border: 0; background: transparent; color: var(--aps-blue); font: inherit; font-size: var(--aps-text-sm); font-weight: var(--aps-font-weight-primary); cursor: pointer; }
.back-link:hover { color: color-mix(in srgb, var(--aps-blue) 75%, var(--aps-ink)); }
.editor-heading h1, .editor-heading p, .section-heading h2, .section-heading p, .subsection-heading h3, .subsection-heading p, .media-hint { margin: 0; }
.editor-heading h1 { margin-top: 8px; color: var(--aps-ink); font-size: var(--aps-text-2xl); font-weight: var(--aps-font-weight-heading); letter-spacing: -.035em; }
.editor-heading p { max-width: 760px; margin-top: 8px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.65; }
.steps-card, .editor-card { display: grid; align-content: start; gap: 24px; }
.editor-loading-card { display: grid; min-height: 180px; place-content: center; gap: 7px; text-align: center; }
.editor-loading-card strong { color: var(--aps-ink); font-size: var(--aps-text-base); }
.editor-loading-card span { color: var(--aps-muted); font-size: var(--aps-text-sm); }
.section-heading { align-items: flex-start; }
.section-heading > div, .subsection-heading > div { min-width: 0; }
.section-heading h2 { color: var(--aps-ink); font-size: var(--aps-text-xl); font-weight: var(--aps-font-weight-heading); letter-spacing: -.02em; }
.section-heading p, .subsection-heading p { margin-top: 6px; color: var(--aps-muted); font-size: var(--aps-text-sm); line-height: 1.6; }
.section-heading > span { flex: 0 0 auto; padding: 4px 8px; border-radius: var(--aps-radius-sm); background: var(--aps-surface-soft); color: var(--aps-faint); font-size: var(--aps-text-xs); font-weight: var(--aps-font-weight-heading); }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; gap: 22px 24px; }
.form-span-two { grid-column: span 2; }
.media-workspace { display: grid; grid-template-columns: minmax(0, 1.12fr) minmax(320px, .88fr); gap: 24px; align-items: stretch; }
.media-panel, .detail-editor, .specifications-panel, .sku-table-panel { display: grid; min-width: 0; align-content: start; gap: 16px; }
.media-panel, .specifications-panel { padding: 18px; border: 1px solid var(--aps-line-soft); border-radius: var(--aps-radius-card); background: var(--aps-surface); }
.subsection-heading { align-items: flex-start; }
.subsection-heading h3 { color: var(--aps-ink); font-size: var(--aps-text-base); font-weight: var(--aps-font-weight-heading); }
.media-hint { color: var(--aps-faint); font-size: var(--aps-text-xs); line-height: 1.5; }
.crop-panel { grid-template-rows: auto minmax(224px, 1fr); }
.crop-placeholder { display: grid; min-height: 224px; place-content: center; gap: 7px; padding: 24px; border: 1px dashed var(--aps-line); border-radius: var(--aps-radius-control); background: var(--aps-surface-soft); color: var(--aps-muted); text-align: center; }
.crop-placeholder strong { color: var(--aps-ink); font-size: var(--aps-text-sm); }
.crop-placeholder span { max-width: 26ch; font-size: var(--aps-text-sm); line-height: 1.5; }
.detail-editor { padding-top: 6px; }
.sku-editor-card { gap: 20px; }
.specification-actions, .footer-actions { flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
.specification-list { display: grid; gap: 10px; }
.specification-row { display: grid; grid-template-columns: 30px minmax(130px, .32fr) minmax(0, .68fr) auto; align-items: center; gap: 10px; }
.specification-index { color: var(--aps-faint); font-size: var(--aps-text-xs); font-variant-numeric: tabular-nums; font-weight: var(--aps-font-weight-heading); text-align: center; }
.sku-table-panel { overflow: hidden; border: 1px solid var(--aps-line-soft); border-radius: var(--aps-radius-card); }
.sku-spec-values { color: var(--aps-ink); font-size: var(--aps-text-sm); font-weight: var(--aps-font-weight-primary); }
.sku-number { color: var(--aps-ink); font-variant-numeric: tabular-nums; }
.sku-number.is-low-stock { color: var(--aps-orange); }
.confirm-card { max-width: 1040px; }
.publish-preview { display: flex; min-width: 0; align-items: center; gap: 14px; padding: 16px; border: 1px solid var(--aps-line-soft); border-radius: var(--aps-radius-card); background: var(--aps-surface-soft); }
.preview-cover { display: grid; width: 64px; height: 64px; flex: 0 0 64px; place-items: center; overflow: hidden; border-radius: var(--aps-radius-control); color: #fff; font-size: var(--aps-text-xl); font-weight: var(--aps-font-weight-heading); }
.preview-cover img { width: 100%; height: 100%; object-fit: cover; }
.preview-cover.is-blue { background: #426b9e; }.preview-cover.is-orange { background: #c2743c; }.preview-cover.is-purple { background: #846ba4; }.preview-cover.is-green { background: #438b77; }.preview-cover.is-graphite { background: #4a5663; }
.publish-preview > div:last-child { min-width: 0; }.publish-preview strong, .publish-preview p, .publish-preview span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.publish-preview strong { color: var(--aps-ink); font-size: var(--aps-text-base); font-weight: var(--aps-font-weight-heading); }.publish-preview p { margin: 4px 0 0; color: var(--aps-muted); font-size: var(--aps-text-sm); }.publish-preview span { margin-top: 5px; color: var(--aps-faint); font-size: var(--aps-text-xs); }
.editor-footer { position: sticky; z-index: 4; bottom: 0; padding: 14px 0 2px; border-top: 1px solid var(--aps-line-soft); background: color-mix(in srgb, var(--aps-surface) 94%, transparent); backdrop-filter: blur(12px); }
/* 商品编辑是宽内容工作流，使用已有 AppDialog 承载时扩大对话框并把滚动交给编辑区。 */
:global(.app-dialog.is-wide:has(.embedded-product-editor)) { display: flex; width: min(96vw, 1120px); max-height: 100%; flex-direction: column; }
:global(.app-dialog.is-wide:has(.embedded-product-editor) .dialog-body) { min-height: 0; max-height: none; flex: 1 1 auto; overflow: auto; padding: 0; overscroll-behavior: contain; }
:global(.app-dialog.is-wide:has(.embedded-product-editor) .dialog-footer) { flex: 0 0 auto; padding: 14px 24px 16px; }
/* 已发布版本尚未提供无标题栏属性时，保留可访问标题并仅压缩其视觉占位。 */
:global(.app-dialog.is-wide:has(.embedded-product-editor) .dialog-header) { min-height: 0; justify-content: flex-end; padding: 8px 12px 0; }
:global(.app-dialog.is-wide:has(.embedded-product-editor) .dialog-heading) { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
:deep(.steps-card .step-copy) { position: relative; z-index: 1; width: fit-content; max-width: 100%; justify-self: start; padding-right: 6px; background: var(--aps-surface); }
@media (min-width: 760px) {
  .embedded-product-editor .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .embedded-product-editor .form-span-two { grid-column: span 2; }
  .embedded-product-editor .media-workspace { grid-template-columns: minmax(0, 1.12fr) minmax(320px, .88fr); }
}
@media (max-width: 960px) { .media-workspace { grid-template-columns: 1fr; }.crop-panel { grid-template-rows: auto auto; }.form-grid { grid-template-columns: 1fr; }.form-span-two { grid-column: span 1; } }
@media (max-width: 680px) { .editor-header { align-items: flex-start; flex-direction: column; }.editor-header > .app-button-control { width: 100%; }.steps-card :deep(.app-steps) { grid-auto-flow: row; grid-template-columns: 1fr; }.steps-card :deep(.step-item:not(:last-child)::after) { top: 33px; bottom: -18px; left: 14px; width: 1px; height: auto; }.specification-row { grid-template-columns: 26px minmax(0, 1fr) auto; }.specification-row > :nth-child(3) { grid-column: 2 / -1; }.editor-footer { align-items: stretch; flex-direction: column; }.footer-actions { justify-content: stretch; }.footer-actions :deep(.app-button-control), .editor-footer > div:first-child :deep(.app-button-control) { flex: 1 1 auto; } }
</style>
