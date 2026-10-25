import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Injector, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import type { MenuItem, SortField } from '../../../../core/models';
import { MenuStore } from '../../data/menu.store';
import { ItemEditDialogComponent } from '../item-edit-dialog/item-edit-dialog.component';

@Component({
  selector: 'app-menu-table',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatPaginatorModule, MatProgressBarModule],
  templateUrl: './menu-table.component.html',
  styleUrl: './menu-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuTableComponent {
  protected readonly store = inject(MenuStore);
  private readonly dialog = inject(MatDialog);
  private readonly injector = inject(Injector);
  protected readonly pageSizeOptions = [10, 25, 50, 100];

  protected sortMark(sortBy: SortField): string {
    const query = this.store.query();
    if (query.sortBy !== sortBy) {
      return '';
    }
    return query.sortOrder === 'asc' ? '↑' : '↓';
  }

  protected onPage(event: PageEvent): void {
    if (event.pageSize !== this.store.query().pageSize) {
      this.store.setPageSize(event.pageSize);
      return;
    }
    this.store.setPage(event.pageIndex + 1);
  }

  protected edit(item: MenuItem): void {
    this.store.openItem(item.id);
    this.dialog.open(ItemEditDialogComponent, {
      data: item,
      width: '28rem',
      injector: this.injector,
    });
  }
}
