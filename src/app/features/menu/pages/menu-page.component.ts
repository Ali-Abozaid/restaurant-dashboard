import { ChangeDetectionStrategy, Component } from '@angular/core';

import { MenuFiltersComponent } from '../components/menu-filters/menu-filters.component';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { MenuTableComponent } from '../components/menu-table/menu-table.component';

@Component({
  selector: 'app-menu-page',
  imports: [TranslatePipe, MenuFiltersComponent, MenuTableComponent],
  templateUrl: './menu-page.component.html',
  styleUrl: './menu-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPageComponent {}
