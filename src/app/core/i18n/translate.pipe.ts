import { ChangeDetectorRef, Pipe, PipeTransform, effect, inject } from '@angular/core';

import { LocaleStore } from './locale.store';
import { translate, type TranslationKey } from './translations';

@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly locale = inject(LocaleStore);
  private readonly changeDetector = inject(ChangeDetectorRef);

  constructor() {
    effect(() => {
      this.locale.language();
      this.changeDetector.markForCheck();
    });
  }

  transform(key: TranslationKey): string {
    return translate(key, this.locale.language());
  }
}
