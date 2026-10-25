import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  EMPTY,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  merge,
  switchMap,
  take,
  tap,
} from 'rxjs';

import { ApiError, MenuApiService, errorMessage } from '../../../core/api';
import type {
  FilterOptions,
  ItemUpdate,
  MenuItem,
  MenuPage,
  MenuQuery,
  RequestStatus,
  SortField,
} from '../../../core/models';
import { DashboardStore } from '../../dashboard/data/dashboard.store';

/** Same limits as the API: the first page is 25 rows, and a page cannot exceed 100. */
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export const initialMenuQuery: MenuQuery = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  search: '',
  restaurantId: null,
  branchId: null,
  category: null,
  availability: null,
  minPrice: null,
  maxPrice: null,
  sortBy: 'name',
  sortOrder: 'asc',
};

export type MenuFilterPatch = Partial<
  Pick<MenuQuery, 'restaurantId' | 'branchId' | 'category' | 'availability' | 'minPrice' | 'maxPrice'>
>;

@Injectable()
export class MenuStore {
  private readonly menuApi = inject(MenuApiService);
  private readonly dashboardStore = inject(DashboardStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reloads = new Subject<MenuQuery>();

  readonly query = signal<MenuQuery>(initialMenuQuery);
  readonly page = signal<MenuPage | null>(null);
  readonly status = signal<RequestStatus>('idle');
  readonly error = signal<string | null>(null);
  readonly filterOptions = signal<FilterOptions | null>(null);
  readonly selected = signal<MenuItem | null>(null);
  readonly saving = signal(false);
  /** Validation message for the open edit. A 400 does not change the table status. */
  readonly saveError = signal<string | null>(null);

  readonly items = computed(() => this.page()?.items ?? []);
  readonly total = computed(() => this.page()?.total ?? 0);
  readonly branches = computed(() => {
    const options = this.filterOptions();
    if (!options) {
      return [];
    }
    const restaurantId = this.query().restaurantId;
    if (!restaurantId) {
      return options.branches;
    }
    return options.branches.filter((branch) => branch.restaurantId === restaurantId);
  });

  constructor() {
    // Debounce typing, skip an unchanged query, and let the newest request win.
    merge(
      toObservable(this.query).pipe(debounceTime(300), distinctUntilChanged(sameQuery)),
      this.reloads,
    )
      .pipe(
        switchMap((query) => this.fetchPage(query)),
        takeUntilDestroyed(),
      )
      .subscribe();

    // Dropdown values are loaded once. Later keystrokes only change the query.
    this.loadFilterOptions();
  }

  setSearch(value: string): void {
    this.query.update((query) => ({ ...query, search: value, page: 1 }));
  }

  setFilter(patch: MenuFilterPatch): void {
    this.query.update((query) => {
      const next = { ...query, ...patch, page: 1 };
      if (this.branchIsInvalid(next.restaurantId, next.branchId)) {
        next.branchId = null;
      }
      return next;
    });
  }

  setSort(sortBy: SortField): void {
    this.query.update((query) => ({
      ...query,
      sortBy,
      sortOrder: query.sortBy === sortBy && query.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  }

  setPage(page: number): void {
    this.query.update((query) => ({ ...query, page }));
  }

  setPageSize(pageSize: number): void {
    const nextSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(pageSize)));
    this.query.update((query) => ({ ...query, pageSize: nextSize, page: 1 }));
  }

  /** Runs the current query again. Used by the table error banner. */
  reload(): void {
    this.reloads.next(this.query());
  }

  loadFilterOptions(): void {
    this.menuApi
      .getFilterOptions()
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (options) => this.filterOptions.set(options),
        error: (error: unknown) => this.error.set(errorMessage(error)),
      });
  }

  openItem(id: string): void {
    this.saveError.set(null);
    this.menuApi
      .getById(id)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (item) => this.selected.set(item),
        error: (error: unknown) => this.error.set(errorMessage(error)),
      });
  }

  saveItem(id: string, patch: ItemUpdate): void {
    this.saving.set(true);
    this.saveError.set(null);
    this.menuApi
      .update(id, patch)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.saving.set(false);
          this.page.update((current) => replaceItem(current, updated));
          this.selected.set(updated);
          this.dashboardStore.load();
        },
        error: (error: unknown) => {
          this.saving.set(false);
          if (error instanceof ApiError && error.status === 400) {
            this.saveError.set(error.message);
            return;
          }
          this.error.set(errorMessage(error));
        },
      });
  }

  private fetchPage(query: MenuQuery) {
    this.status.set('loading');
    return this.menuApi.query(query).pipe(
      tap((result) => {
        this.page.set(result);
        this.status.set('success');
        this.error.set(null);
      }),
      catchError((error: unknown) => {
        this.status.set('error');
        this.error.set(errorMessage(error));
        return EMPTY;
      }),
    );
  }

  private branchIsInvalid(restaurantId: string | null, branchId: string | null): boolean {
    if (!restaurantId || !branchId || !this.filterOptions()) {
      return false;
    }
    return !this.filterOptions()?.branches.some(
      (branch) => branch.id === branchId && branch.restaurantId === restaurantId,
    );
  }
}

function sameQuery(left: MenuQuery, right: MenuQuery): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function replaceItem(current: MenuPage | null, updated: MenuItem): MenuPage | null {
  if (!current) {
    return current;
  }
  return {
    ...current,
    items: current.items.map((item) => (item.id === updated.id ? updated : item)),
  };
}
