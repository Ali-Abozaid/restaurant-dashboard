import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { CategoryCount } from '../../../../core/models';

/** CSS bars for `MenuStats.byCategory`. The widest bar is the largest count. */
@Component({
  selector: 'app-category-chart',
  imports: [DecimalPipe],
  templateUrl: './category-chart.component.html',
  styleUrl: './category-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryChartComponent {
  readonly categories = input.required<CategoryCount[]>();

  protected readonly rows = computed(() => {
    const categories = this.categories();
    const largest = Math.max(1, ...categories.map((row) => row.count));
    return categories.map((row) => ({
      category: row.category,
      count: row.count,
      width: (row.count / largest) * 100,
    }));
  });
}
