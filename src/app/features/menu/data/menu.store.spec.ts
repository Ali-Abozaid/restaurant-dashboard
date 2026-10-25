import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import type { MenuItem, MenuPage } from '../../../core/models';
import { DashboardStore } from '../../dashboard/data/dashboard.store';
import { MenuStore } from './menu.store';

const filters = { restaurants: [], branches: [], categories: [] };

function menuItem(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: 'item-1',
    name: 'Cheese Burger',
    restaurantId: 'rest-1',
    restaurantName: 'Nile Grill',
    branchId: 'branch-1',
    branchName: 'Maadi',
    category: 'Burgers',
    price: 10,
    availability: 'available',
    lastUpdated: '2026-10-25T00:00:00.000Z',
    ...overrides,
  };
}

function menuPage(items: MenuItem[]): MenuPage {
  return { items, total: items.length, page: 1, pageSize: 25 };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('MenuStore', () => {
  let store: MenuStore;
  let http: HttpTestingController;
  let dashboard: { load: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    dashboard = { load: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DashboardStore, useValue: dashboard },
        MenuStore,
      ],
    });
    store = TestBed.inject(MenuStore);
    http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/filters').flush(filters);
    TestBed.flushEffects();
  });

  afterEach(() => http.verify());

  async function nextItemsRequest() {
    await wait(350);
    return http.expectOne((call) => call.url === '/api/items');
  }

  it('replaces the edited row and asks the dashboard to reload', async () => {
    const original = menuItem();
    (await nextItemsRequest()).flush(menuPage([original]));

    store.saveItem(original.id, { price: 18, availability: 'unavailable' });
    expect(store.saving()).toBe(true);

    const patch = http.expectOne(`/api/items/${original.id}`);
    expect(patch.request.method).toBe('PATCH');
    patch.flush(menuItem({ price: 18, availability: 'unavailable' }));

    expect(store.saving()).toBe(false);
    expect(store.items()[0]?.price).toBe(18);
    expect(store.items()[0]?.availability).toBe('unavailable');
    expect(dashboard.load).toHaveBeenCalledTimes(1);
  });

  it('keeps the newer page when an older request resolves late', async () => {
    const older = await nextItemsRequest();

    store.setSearch('burger');
    TestBed.flushEffects();
    const newer = await nextItemsRequest();

    newer.flush(menuPage([menuItem({ id: 'item-new', name: 'burger special' })]));
    expect(store.items()[0]?.id).toBe('item-new');

    // switchMap already dropped the first call, so its body cannot replace the page.
    expect(older.cancelled).toBe(true);
    expect(() => older.flush(menuPage([menuItem({ id: 'item-old', name: 'old row' })]))).toThrow(
      /cancelled/i,
    );
    expect(store.items()[0]?.id).toBe('item-new');
  });

  it('keeps the previous page when a later request fails', async () => {
    const saved = menuPage([menuItem()]);
    (await nextItemsRequest()).flush(saved);
    expect(store.status()).toBe('success');

    store.reload();
    http.expectOne((call) => call.url === '/api/items').flush(
      { message: 'The menu service is down' },
      { status: 500, statusText: 'Server Error' },
    );

    expect(store.status()).toBe('error');
    expect(store.error()).toBe('The menu service is down');
    expect(store.page()).toEqual(saved);
  });
});
