import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import type { MenuItem } from '../../../../core/models';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { MenuStore } from '../../data/menu.store';

@Component({
  selector: 'app-item-edit-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './item-edit-dialog.component.html',
  styleUrl: './item-edit-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemEditDialogComponent {
  protected readonly store = inject(MenuStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ItemEditDialogComponent>);
  protected readonly item = inject<MenuItem>(MAT_DIALOG_DATA);
  private readonly submitted = signal(false);

  protected readonly form = this.formBuilder.group({
    price: this.formBuilder.control<number | null>(this.item.price, {
      validators: [Validators.required, Validators.min(0)],
    }),
    availability: this.formBuilder.nonNullable.control(this.item.availability, {
      validators: [Validators.required],
    }),
  });

  constructor() {
    effect(() => {
      const saving = this.store.saving();
      const saveError = this.store.saveError();
      if (this.submitted() && !saving && !saveError) {
        this.dialogRef.close();
      }
    });
  }

  protected save(): void {
    if (this.form.invalid || this.store.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const price = this.form.controls.price.value;
    if (price === null) {
      return;
    }

    this.submitted.set(true);
    this.store.saveItem(this.item.id, {
      price,
      availability: this.form.controls.availability.value,
    });
  }
}
