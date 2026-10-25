import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { CategoryChartComponent } from '../components/category-chart/category-chart.component';
import { DashboardStore } from '../data/dashboard.store';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
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
