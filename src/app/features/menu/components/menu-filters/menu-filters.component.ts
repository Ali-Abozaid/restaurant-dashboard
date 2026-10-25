import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import type { Availability } from '../../../../core/models';
import { MenuStore } from '../../data/menu.store';

interface MenuFilterFormValue {
  search: string;
  restaurantId: string;
  branchId: string;
  category: string;
  availability: '' | Availability;
  minPrice: number | null;
  maxPrice: number | null;
}

@Component({
  selector: 'app-menu-filters',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './menu-filters.component.html',
  styleUrl: './menu-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuFiltersComponent {
  protected readonly store = inject(MenuStore);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly form = this.formBuilder.nonNullable.group({
    search: '',
    restaurantId: '',
    branchId: '',
    category: '',
    availability: '' as '' | Availability,
    minPrice: this.formBuilder.control<number | null>(null),
    maxPrice: this.formBuilder.control<number | null>(null),
  });

  constructor() {
    effect(() => {
      const branchId = this.store.query().branchId ?? '';
      if (this.form.controls.branchId.value !== branchId) {
        this.form.controls.branchId.setValue(branchId, { emitEvent: false });
      }
    });

    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.publish(this.form.getRawValue());
    });
  }

  private publish(value: MenuFilterFormValue): void {
    this.store.setSearch(value.search.trim());
    this.store.setFilter({
      restaurantId: value.restaurantId || null,
      branchId: value.branchId || null,
      category: value.category || null,
      availability: value.availability || null,
      minPrice: toNullableNumber(value.minPrice),
      maxPrice: toNullableNumber(value.maxPrice),
    });
  }
}

function toNullableNumber(value: number | null): number | null {
  if (value === null || Number.isNaN(value)) {
    return null;
  }
  return value;
}
