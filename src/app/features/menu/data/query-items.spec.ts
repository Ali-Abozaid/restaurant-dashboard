import { queryItems } from '../../../../../server/item-query.mjs';

interface FixtureItem {
  id: string;
  name: string;
  restaurantId: string;
  restaurantName: string;
  branchId: string;
  branchName: string;
  category: string;
  price: number;
  availability: 'available';
  lastUpdated: string;
}

/**
 * 12 burgers inside the price range, then 18 salads outside it.
 * Page size 10 means page 2 is only the last two burgers.
 */
function fixtureItems(): FixtureItem[] {
  return Array.from({ length: 30 }, (_, index) => {
    const number = index + 1;
    const matches = number <= 12;
    const label = String(number).padStart(2, '0');
    return {
      id: `item-${label}`,
      name: matches ? `burger ${label}` : `salad ${label}`,
      restaurantId: 'rest-1',
      restaurantName: 'Nile Grill',
      branchId: 'branch-1',
      branchName: 'Maadi',
      category: matches ? 'Burgers' : 'Salads',
      price: matches ? 10 : 40,
      availability: 'available',
      lastUpdated: '2026-10-25T00:00:00.000Z',
    };
  });
}

describe('queryItems', () => {
  it('pages after filtering and reports the full filtered total', () => {
    const result = queryItems(
      fixtureItems(),
      {
        page: 2,
        pageSize: 10,
        search: 'burger',
        restaurantId: null,
        branchId: null,
        category: 'Burgers',
        availability: null,
        minPrice: 5,
        maxPrice: 20,
        sortBy: 'name',
        sortOrder: 'asc',
      },
      new Map(),
    );

    expect(result.total).toBe(12);
    expect(result.items.map((item) => item.id)).toEqual(['item-11', 'item-12']);
  });
});
