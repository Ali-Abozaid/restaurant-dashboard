/**
 * @typedef {'available' | 'unavailable'} Availability
 * @typedef {'name' | 'price' | 'lastUpdated'} SortField
 * @typedef {'asc' | 'desc'} SortOrder
 * @typedef {{
 *   id: string,
 *   name: string,
 *   restaurantId: string,
 *   restaurantName: string,
 *   branchId: string,
 *   branchName: string,
 *   category: string,
 *   price: number,
 *   availability: Availability,
 *   lastUpdated: string
 * }} MenuItem
 * @typedef {{
 *   page: number,
 *   pageSize: number,
 *   search: string,
 *   restaurantId: string | null,
 *   branchId: string | null,
 *   category: string | null,
 *   availability: Availability | null,
 *   minPrice: number | null,
 *   maxPrice: number | null,
 *   sortBy: SortField,
 *   sortOrder: SortOrder
 * }} ItemQuery
 */

const SORT_FIELDS = new Set(['name', 'price', 'lastUpdated']);
const SORT_ORDERS = new Set(['asc', 'desc']);
const AVAILABILITY = new Set(['available', 'unavailable']);
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export class HttpError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} message
   */
  constructor(statusCode, message) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

/**
 * Reads the menu table query string.
 * Empty filters stay null so they are not applied.
 *
 * @param {Record<string, unknown>} query
 * @returns {ItemQuery}
 */
export function parseItemQuery(query) {
  const page = readPositiveInt(query['page'], 1, 'page');
  const pageSize = readPositiveInt(query['pageSize'], DEFAULT_PAGE_SIZE, 'pageSize');
  if (pageSize > MAX_PAGE_SIZE) {
    throw new HttpError(400, `pageSize cannot be greater than ${MAX_PAGE_SIZE}`);
  }

  const sortBy = readString(query['sortBy']) || 'name';
  const sortOrder = readString(query['sortOrder']) || 'asc';
  if (!SORT_FIELDS.has(sortBy)) {
    throw new HttpError(400, 'sortBy must be name, price, or lastUpdated');
  }
  if (!SORT_ORDERS.has(sortOrder)) {
    throw new HttpError(400, 'sortOrder must be asc or desc');
  }

  const availability = readOptionalString(query['availability']);
  if (availability && !AVAILABILITY.has(availability)) {
    throw new HttpError(400, 'availability must be available or unavailable');
  }

  return {
    page,
    pageSize,
    search: readString(query['search']).toLowerCase(),
    restaurantId: readOptionalString(query['restaurantId']),
    branchId: readOptionalString(query['branchId']),
    category: readOptionalString(query['category']),
    availability,
    minPrice: readOptionalNumber(query['minPrice'], 'minPrice'),
    maxPrice: readOptionalNumber(query['maxPrice'], 'maxPrice'),
    sortBy,
    sortOrder,
  };
}

/**
 * Filters, sorts, then slices one page.
 * `items` is not reordered. A branch that does not belong to the selected
 * restaurant is ignored, and the restaurant filter still applies.
 *
 * @param {MenuItem[]} items
 * @param {ItemQuery} query
 * @param {Map<string, string>} branchRestaurantIds
 */
export function queryItems(items, query, branchRestaurantIds) {
  const branchId = matchingBranchId(query, branchRestaurantIds);
  const filtered = items.filter((item) => matches(item, query, branchId));
  filtered.sort(compareItems(query.sortBy, query.sortOrder));

  const start = (query.page - 1) * query.pageSize;
  return {
    items: filtered.slice(start, start + query.pageSize),
    total: filtered.length,
    page: query.page,
    pageSize: query.pageSize,
  };
}

/**
 * @param {ItemQuery} query
 * @param {Map<string, string>} branchRestaurantIds
 */
function matchingBranchId(query, branchRestaurantIds) {
  if (!query.branchId) {
    return null;
  }
  if (!query.restaurantId) {
    return query.branchId;
  }
  return branchRestaurantIds.get(query.branchId) === query.restaurantId ? query.branchId : null;
}

/**
 * @param {MenuItem} item
 * @param {ItemQuery} query
 * @param {string | null} branchId
 */
function matches(item, query, branchId) {
  if (query.search && !item.name.toLowerCase().includes(query.search)) {
    return false;
  }
  if (query.restaurantId && item.restaurantId !== query.restaurantId) {
    return false;
  }
  if (branchId && item.branchId !== branchId) {
    return false;
  }
  if (query.category && item.category !== query.category) {
    return false;
  }
  if (query.availability && item.availability !== query.availability) {
    return false;
  }
  if (query.minPrice !== null && item.price < query.minPrice) {
    return false;
  }
  if (query.maxPrice !== null && item.price > query.maxPrice) {
    return false;
  }
  return true;
}

/**
 * @param {SortField} sortBy
 * @param {SortOrder} sortOrder
 */
function compareItems(sortBy, sortOrder) {
  const direction = sortOrder === 'asc' ? 1 : -1;
  if (sortBy === 'price') {
    return (left, right) => (left.price - right.price) * direction;
  }
  const field = sortBy === 'name' ? 'name' : 'lastUpdated';
  return (left, right) => left[field].localeCompare(right[field]) * direction;
}

/**
 * @param {unknown} value
 */
function readString(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === 'string' ? raw.trim() : '';
}

/**
 * @param {unknown} value
 */
function readOptionalString(value) {
  const text = readString(value);
  return text ? text : null;
}

/**
 * @param {unknown} value
 * @param {number} fallback
 * @param {string} label
 */
function readPositiveInt(value, fallback, label) {
  const text = readString(value);
  if (!text) {
    return fallback;
  }
  const parsed = Number(text);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new HttpError(400, `${label} must be a positive integer`);
  }
  return parsed;
}

/**
 * @param {unknown} value
 * @param {string} label
 */
function readOptionalNumber(value, label) {
  const text = readString(value);
  if (!text) {
    return null;
  }
  const parsed = Number(text);
  if (!Number.isFinite(parsed)) {
    throw new HttpError(400, `${label} must be a number`);
  }
  return parsed;
}
