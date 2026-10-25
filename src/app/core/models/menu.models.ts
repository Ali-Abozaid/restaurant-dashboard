export type Availability = 'available' | 'unavailable';

export type SortField = 'name' | 'price' | 'lastUpdated';

export type SortOrder = 'asc' | 'desc';

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

/** One menu row. `lastUpdated` is an ISO-8601 timestamp. */
export interface MenuItem {
  id: string;
  name: string;
  restaurantId: string;
  restaurantName: string;
  branchId: string;
  branchName: string;
  category: string;
  price: number;
  availability: Availability;
  lastUpdated: string;
}

/**
 * UI state for the menu explorer.
 * Null filter fields mean "no constraint".
 */
export interface MenuQuery {
  page: number;
  pageSize: number;
  search: string;
  restaurantId: string | null;
  branchId: string | null;
  category: string | null;
  availability: Availability | null;
  minPrice: number | null;
  maxPrice: number | null;
  sortBy: SortField;
  sortOrder: SortOrder;
}

/** Server state: one page of menu items after filtering and sorting. */
export interface MenuPage {
  items: MenuItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CategoryCount {
  category: string;
  count: number;
}

/** Server state: aggregates over the full dataset, not the current page. */
export interface MenuStats {
  totalItems: number;
  availableItems: number;
  unavailableItems: number;
  averagePrice: number;
  byCategory: CategoryCount[];
}
