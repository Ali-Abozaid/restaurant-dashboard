import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import type { FilterOptions, ItemUpdate, MenuItem, MenuPage, MenuQuery } from '../models';
import { rethrowAsApiError } from './api-error';

@Injectable({ providedIn: 'root' })
export class MenuApiService {
  private readonly http = inject(HttpClient);

  query(query: MenuQuery): Observable<MenuPage> {
    return this.http
      .get<MenuPage>('/api/items', { params: toItemParams(query) })
      .pipe(rethrowAsApiError());
  }

  getById(id: string): Observable<MenuItem> {
    return this.http.get<MenuItem>(itemUrl(id)).pipe(rethrowAsApiError());
  }

  update(id: string, body: ItemUpdate): Observable<MenuItem> {
    return this.http.patch<MenuItem>(itemUrl(id), body).pipe(rethrowAsApiError());
  }

  getFilterOptions(): Observable<FilterOptions> {
    return this.http.get<FilterOptions>('/api/filters').pipe(rethrowAsApiError());
  }
}

/**
 * Always sends paging and sort. Null filters are omitted.
 * A blank search is omitted because it is not a constraint.
 */
function toItemParams(query: MenuQuery): HttpParams {
  let params = new HttpParams()
    .set('page', query.page)
    .set('pageSize', query.pageSize)
    .set('sortBy', query.sortBy)
    .set('sortOrder', query.sortOrder);

  const search = query.search.trim();
  if (search) {
    params = params.set('search', search);
  }

  const filters: [string, string | number | null][] = [
    ['restaurantId', query.restaurantId],
    ['branchId', query.branchId],
    ['category', query.category],
    ['availability', query.availability],
    ['minPrice', query.minPrice],
    ['maxPrice', query.maxPrice],
  ];

  for (const [name, value] of filters) {
    if (value !== null) {
      params = params.set(name, value);
    }
  }

  return params;
}

function itemUrl(id: string): string {
  return `/api/items/${encodeURIComponent(id)}`;
}
