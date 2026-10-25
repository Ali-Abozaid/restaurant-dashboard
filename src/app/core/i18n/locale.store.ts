import { Injectable, computed, effect, signal } from '@angular/core';

import { translate, type Language } from './translations';

const storageKey = 'lang';

/** Arabic is right-to-left. English is left-to-right. API text is not translated. */
@Injectable({ providedIn: 'root' })
export class LocaleStore {
  readonly language = signal<Language>(readLanguage());
  readonly arabic = computed(() => this.language() === 'ar');
  readonly dateLocale = computed(() => (this.arabic() ? 'ar-EG' : 'en-US'));

  constructor() {
    effect(() => {
      const language = this.language();
      const root = document.documentElement;
      root.lang = language === 'ar' ? 'ar' : 'en';
      root.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.title = translate('app.documentTitle', language);
      localStorage.setItem(storageKey, language);
    });
  }

  toggle(): void {
    this.language.update((language) => (language === 'ar' ? 'en' : 'ar'));
  }
}

function readLanguage(): Language {
  const saved = localStorage.getItem(storageKey);
  return saved === 'en' ? 'en' : 'ar';
}
