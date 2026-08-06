import { computed, ref, type ComputedRef, type Ref } from "vue";
import type { PageResult, SortOrder } from "@/types/api";

/** 所有列表查询至少提供页码和每页条数，业务筛选字段由泛型扩展。 */
export interface TablePageQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface ReloadTableDataOptions {
  resetPage?: boolean;
}

interface UseTableDataSourceOptions<TItem, TQuery extends TablePageQuery> {
  initialQuery: TQuery;
  request: (query: TQuery) => Promise<PageResult<TItem>>;
}

interface UseTableDataSourceResult<TItem, TQuery extends TablePageQuery> {
  query: Ref<TQuery>;
  rows: Ref<TItem[]>;
  total: Ref<number>;
  isLoading: Ref<boolean>;
  errorMessage: Ref<string>;
  hasData: ComputedRef<boolean>;
  reload: (options?: ReloadTableDataOptions) => Promise<void>;
  updateQuery: (nextQuery: Partial<TQuery>, options?: ReloadTableDataOptions) => Promise<void>;
  replaceQuery: (nextQuery: TQuery, options?: ReloadTableDataOptions) => Promise<void>;
  setPage: (page: number) => Promise<void>;
  setPageSize: (pageSize: number) => Promise<void>;
  setSort: (sortBy: NonNullable<TQuery["sortBy"]>, sortOrder: SortOrder) => Promise<void>;
}

/**
 * 统一处理分页列表的请求状态、错误反馈与后发请求覆盖前发请求的并发边界。
 * 业务页面只维护筛选字段，不能自行复制 loading、total、分页和请求序号逻辑。
 */
export function useTableDataSource<TItem, TQuery extends TablePageQuery>(options: UseTableDataSourceOptions<TItem, TQuery>): UseTableDataSourceResult<TItem, TQuery> {
  const initialQuery = normalizeQuery(options.initialQuery);
  const query = ref<TQuery>({ ...initialQuery }) as Ref<TQuery>;
  const rows = ref<TItem[]>([]) as Ref<TItem[]>;
  const total = ref(0);
  const isLoading = ref(false);
  const errorMessage = ref("");
  const hasData = computed(() => rows.value.length > 0);
  let requestVersion = 0;

  async function reload(reloadOptions: ReloadTableDataOptions = {}): Promise<void> {
    if (reloadOptions.resetPage) query.value = { ...query.value, page: 1 };
    const currentRequestVersion = ++requestVersion;
    isLoading.value = true;
    errorMessage.value = "";

    try {
      const result = await options.request({ ...query.value });
      if (currentRequestVersion !== requestVersion) return;
      rows.value = result.list;
      total.value = result.total;
      query.value = {
        ...query.value,
        page: normalizePositiveNumber(result.page, query.value.page ?? initialQuery.page ?? 1),
        pageSize: normalizePositiveNumber(result.pageSize, query.value.pageSize ?? initialQuery.pageSize ?? 20),
      };
    } catch (error) {
      if (currentRequestVersion !== requestVersion) return;
      rows.value = [];
      total.value = 0;
      errorMessage.value = error instanceof Error ? error.message : "列表数据加载失败，请稍后重试。";
    } finally {
      if (currentRequestVersion === requestVersion) isLoading.value = false;
    }
  }

  async function updateQuery(nextQuery: Partial<TQuery>, reloadOptions: ReloadTableDataOptions = {}): Promise<void> {
    query.value = { ...query.value, ...nextQuery };
    await reload(reloadOptions);
  }

  async function replaceQuery(nextQuery: TQuery, reloadOptions: ReloadTableDataOptions = {}): Promise<void> {
    query.value = normalizeQuery(nextQuery);
    await reload(reloadOptions);
  }

  async function setPage(page: number): Promise<void> {
    await updateQuery({ page: normalizePositiveNumber(page, 1) } as Partial<TQuery>);
  }

  async function setPageSize(pageSize: number): Promise<void> {
    await updateQuery({ pageSize: normalizePositiveNumber(pageSize, initialQuery.pageSize ?? 20) } as Partial<TQuery>, { resetPage: true });
  }

  async function setSort(sortBy: NonNullable<TQuery["sortBy"]>, sortOrder: SortOrder): Promise<void> {
    await updateQuery({ sortBy, sortOrder } as Partial<TQuery>);
  }

  return { query, rows, total, isLoading, errorMessage, hasData, reload, updateQuery, replaceQuery, setPage, setPageSize, setSort };
}

function normalizeQuery<TQuery extends TablePageQuery>(query: TQuery): TQuery {
  return {
    ...query,
    page: normalizePositiveNumber(query.page, 1),
    pageSize: normalizePositiveNumber(query.pageSize, 20),
  };
}

function normalizePositiveNumber(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return fallback;
  return Math.floor(value);
}
