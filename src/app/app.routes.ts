import { Routes } from '@angular/router';

import { MenuStore } from './features/menu/data/menu.store';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard-page.component').then(
        (m) => m.DashboardPageComponent,
      ),
  },
  {
    path: 'menu',
    loadComponent: () =>
      import('./features/menu/pages/menu-page.component').then((m) => m.MenuPageComponent),
    providers: [MenuStore],
  },
];
