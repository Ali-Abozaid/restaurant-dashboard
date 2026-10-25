import { readFileSync, renameSync, writeFileSync } from 'node:fs';

const AVAILABILITY = new Set(['available', 'unavailable']);

/**
 * Loads the generated dataset once and keeps that array as the source of truth.
 * Updates change the same objects, then the JSON file is replaced.
 *
 * @param {string} filePath
 */
export function createItemStore(filePath) {
  const items = readDataset(filePath);
  const byId = new Map(items.map((item) => [item.id, item]));
  const branchRestaurantIds = new Map(items.map((item) => [item.branchId, item.restaurantId]));

  return {
    items,
    branchRestaurantIds,
    /**
     * @param {string} id
     */
    findById(id) {
      return byId.get(id) ?? null;
    },
    /**
     * @param {string} id
     * @param {{ price?: number, availability?: 'available' | 'unavailable' }} patch
     */
    update(id, patch) {
      const item = byId.get(id);
      if (!item) {
        return null;
      }
      if (patch.price !== undefined) {
        item.price = patch.price;
      }
      if (patch.availability !== undefined) {
        item.availability = patch.availability;
      }
      item.lastUpdated = new Date().toISOString();
      saveDataset(filePath, items);
      return item;
    },
  };
}

/**
 * Accepts `{ price?, availability? }`.
 * An omitted price is allowed when availability is sent.
 * A present price must be a number greater than or equal to 0.
 *
 * @param {unknown} body
 * @returns {{ patch: { price?: number, availability?: 'available' | 'unavailable' }, error?: undefined } | { patch?: undefined, error: string }}
 */
export function parseItemPatch(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Body must be an object' };
  }

  const record = /** @type {Record<string, unknown>} */ (body);
  const hasPrice = Object.prototype.hasOwnProperty.call(record, 'price');
  const hasAvailability = Object.prototype.hasOwnProperty.call(record, 'availability');
  if (!hasPrice && !hasAvailability) {
    return { error: 'Provide a price, an availability, or both' };
  }

  /** @type {{ price?: number, availability?: 'available' | 'unavailable' }} */
  const patch = {};

  if (hasPrice) {
    const price = readPrice(record['price']);
    if (price.error) {
      return { error: price.error };
    }
    patch.price = price.value;
  }

  if (hasAvailability) {
    if (!AVAILABILITY.has(/** @type {string} */ (record['availability']))) {
      return { error: 'Availability must be available or unavailable' };
    }
    patch.availability = /** @type {'available' | 'unavailable'} */ (record['availability']);
  }

  return { patch };
}

/**
 * @param {string} filePath
 */
function readDataset(filePath) {
  let raw;
  try {
    raw = readFileSync(filePath, 'utf8');
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      throw new Error('Missing server/data/menu-items.json. Run npm run generate:data first.');
    }
    throw error;
  }

  const items = JSON.parse(raw);
  if (!Array.isArray(items)) {
    throw new Error('server/data/menu-items.json must contain an array');
  }
  return items;
}

/**
 * @param {string} filePath
 * @param {unknown[]} items
 */
function saveDataset(filePath, items) {
  const temporaryPath = `${filePath}.tmp`;
  writeFileSync(temporaryPath, JSON.stringify(items));
  renameSync(temporaryPath, filePath);
}

/**
 * @param {unknown} value
 * @returns {{ value: number, error?: undefined } | { value?: undefined, error: string }}
 */
function readPrice(value) {
  if (value === undefined || value === null) {
    return { error: 'Price is missing' };
  }
  if (typeof value === 'string' && value.trim() === '') {
    return { error: 'Price is missing' };
  }
  if (typeof value !== 'number' && typeof value !== 'string') {
    return { error: 'Price must be a number' };
  }
  const price = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(price)) {
    return { error: 'Price must be a number' };
  }
  if (price < 0) {
    return { error: 'Price must be greater than or equal to 0' };
  }
  return { value: Math.round(price * 100) / 100 };
}
