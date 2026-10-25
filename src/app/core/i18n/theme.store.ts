import { Injectable, computed, effect, signal } from '@angular/core';

import type { TranslationKey } from './translations';

export type ThemeMode = 'light' | 'dark';

const storageKey = 'theme';

/** Light is the cream paper. Dark keeps the same ink-and-rule idea on a deep green. */
@Injectable({ providedIn: 'root' })
export class ThemeStore {
  readonly mode = signal<ThemeMode>(readTheme());
  readonly dark = computed(() => this.mode() === 'dark');
  readonly labelKey = computed((): TranslationKey => (this.dark() ? 'theme.light' : 'theme.dark'));

  constructor() {
    effect(() => {
      const mode = this.mode();
      document.documentElement.dataset['theme'] = mode;
      document.documentElement.style.colorScheme = mode;
      localStorage.setItem(storageKey, mode);
    });
  }

  toggle(): void {
    this.mode.update((mode) => (mode === 'dark' ? 'light' : 'dark'));
  }
}

function readTheme(): ThemeMode {
  const saved = localStorage.getItem(storageKey);
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
