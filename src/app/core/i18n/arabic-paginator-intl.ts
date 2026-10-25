import { Injectable, effect, inject } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

import { LocaleStore } from './locale.store';
import { translate } from './translations';

/** Paginator labels follow the selected language. Page numbers stay Western digits. */
@Injectable()
export class AppPaginatorIntl extends MatPaginatorIntl {
  private readonly locale = inject(LocaleStore);

  constructor() {
    super();
    effect(() => {
      const language = this.locale.language();
      this.itemsPerPageLabel = translate('paginator.perPage', language);
      this.nextPageLabel = translate('paginator.next', language);
      this.previousPageLabel = translate('paginator.previous', language);
      this.firstPageLabel = translate('paginator.first', language);
      this.lastPageLabel = translate('paginator.last', language);
      this.changes.next();
    });
  }

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    const language = this.locale.language();
    const ofLabel = translate('paginator.of', language);
    if (length === 0 || pageSize === 0) {
      return `0 ${ofLabel} ${length}`;
    }
    const start = page * pageSize;
    const end = Math.min(start + pageSize, length);
    return `${start + 1} – ${end} ${ofLabel} ${length}`;
  };
}
