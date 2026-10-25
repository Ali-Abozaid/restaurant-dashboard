import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, switchMap, tap } from 'rxjs';

import { StatsApiService, errorMessage } from '../../../core/api';
import type { MenuStats, RequestStatus } from '../../../core/models';

/** Dashboard server state. The menu store calls `load()` after a successful edit. */
@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly statsApi = inject(StatsApiService);
  private readonly loadRequests = new Subject<void>();

  readonly stats = signal<MenuStats | null>(null);
  readonly status = signal<RequestStatus>('idle');
  readonly error = signal<string | null>(null);

  constructor() {
    this.loadRequests
      .pipe(
        switchMap(() => {
          this.status.set('loading');
          return this.statsApi.getStats().pipe(
            tap((stats) => {
              this.stats.set(stats);
              this.status.set('success');
              this.error.set(null);
            }),
            catchError((error: unknown) => {
              this.status.set('error');
              this.error.set(errorMessage(error));
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  load(): void {
    this.loadRequests.next();
  }
}
