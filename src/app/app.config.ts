import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch } from '@angular/common/http';
import localeArEg from '@angular/common/locales/ar-EG';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { provideRouter } from '@angular/router';

import { AppPaginatorIntl } from './core/i18n/arabic-paginator-intl';
import { routes } from './app.routes';

registerLocaleData(localeArEg);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    { provide: LOCALE_ID, useValue: 'ar-EG' },
    { provide: MatPaginatorIntl, useClass: AppPaginatorIntl },
  ],
};
