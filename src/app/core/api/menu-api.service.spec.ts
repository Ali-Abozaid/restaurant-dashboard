import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { initialMenuQuery } from '../../features/menu/data/menu.store';
import { MenuApiService } from './menu-api.service';

describe('MenuApiService query params', () => {
  let service: MenuApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MenuApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends search, category, price range, and page 2 together', () => {
    service
      .query({
        ...initialMenuQuery,
        search: 'burger',
        category: 'Burgers',
        minPrice: 5,
        maxPrice: 20,
        page: 2,
      })
      .subscribe();

    const req = http.expectOne((call) => call.url === '/api/items');
    const url = req.request.urlWithParams;

    expect(url).toContain('search=burger');
    expect(url).toContain('category=Burgers');
    expect(url).toContain('minPrice=5');
    expect(url).toContain('maxPrice=20');
    expect(url).toContain('page=2');

    req.flush({ items: [], total: 0, page: 2, pageSize: 25 });
  });
});
