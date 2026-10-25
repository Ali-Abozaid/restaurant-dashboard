/**
 * Counts and the average price use the full dataset, not one table page.
 *
 * @param {Array<{ availability: string, price: number, category: string }>} items
 */
export function buildStats(items) {
  const counts = new Map();
  let availableItems = 0;
  let priceTotal = 0;

  for (const item of items) {
    if (item.availability === 'available') {
      availableItems += 1;
    }
    priceTotal += item.price;
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }

  const totalItems = items.length;
  const byCategory = [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((left, right) => right.count - left.count || left.category.localeCompare(right.category));

  return {
    totalItems,
    availableItems,
    unavailableItems: totalItems - availableItems,
    averagePrice: totalItems === 0 ? 0 : roundMoney(priceTotal / totalItems),
    byCategory,
  };
}

/**
 * Dropdown values discovered from the loaded items.
 *
 * @param {Array<{
 *   restaurantId: string,
 *   restaurantName: string,
 *   branchId: string,
 *   branchName: string,
 *   category: string
 * }>} items
 */
export function buildFilterOptions(items) {
  const restaurants = new Map();
  const branches = new Map();
  const categories = new Set();

  for (const item of items) {
    restaurants.set(item.restaurantId, item.restaurantName);
    branches.set(item.branchId, {
      id: item.branchId,
      name: item.branchName,
      restaurantId: item.restaurantId,
    });
    categories.add(item.category);
  }

  return {
    restaurants: [...restaurants.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    branches: [...branches.values()].sort((left, right) => left.name.localeCompare(right.name)),
    categories: [...categories].sort((left, right) => left.localeCompare(right)),
  };
}

/**
 * @param {number} value
 */
function roundMoney(value) {
  // Four decimals: one edited price must move the average of 50,000 items.
  return Math.round(value * 10000) / 10000;
}
