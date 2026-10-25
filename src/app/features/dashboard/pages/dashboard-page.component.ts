import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { CategoryChartComponent } from '../components/category-chart/category-chart.component';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { DashboardStore } from '../data/dashboard.store';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    DecimalPipe,
    MatButtonModule,
    MatProgressBarModule,
    TranslatePipe,
    CategoryChartComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {
  protected readonly store = inject(DashboardStore);

  constructor() {
    this.store.load();
  }
}
