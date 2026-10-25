import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import type { MenuStats } from '../models';
import { rethrowAsApiError } from './api-error';

@Injectable({ providedIn: 'root' })
export class StatsApiService {
  private readonly http = inject(HttpClient);

  getStats(): Observable<MenuStats> {
    return this.http.get<MenuStats>('/api/stats').pipe(rethrowAsApiError());
  }
}
