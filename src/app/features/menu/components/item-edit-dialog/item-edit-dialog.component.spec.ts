import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import type { MenuItem } from '../../../../core/models';
import { DashboardStore } from '../../../dashboard/data/dashboard.store';
import { MenuStore } from '../../data/menu.store';
import { ItemEditDialogComponent } from './item-edit-dialog.component';

const item: MenuItem = {
  id: 'item-1',
  name: 'Cheese Burger',
  restaurantId: 'rest-1',
  restaurantName: 'Nile Grill',
  branchId: 'branch-1',
  branchName: 'Maadi',
  category: 'Burgers',
  price: 10,
  availability: 'available',
  lastUpdated: '2026-10-25T00:00:00.000Z',
};

describe('ItemEditDialogComponent', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ItemEditDialogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DashboardStore, useValue: { load: vi.fn() } },
        MenuStore,
        { provide: MAT_DIALOG_DATA, useValue: item },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(MenuStore);
    http.expectOne('/api/filters').flush({ restaurants: [], branches: [], categories: [] });
    TestBed.flushEffects();
  });

  async function settleInitialPage(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    http.expectOne((call) => call.url === '/api/items').flush({
      items: [],
      total: 0,
      page: 1,
      pageSize: 25,
    });
  }

  afterEach(() => http.verify());

  it('does not call the API when the price is negative', async () => {
    await settleInitialPage();
    const fixture = TestBed.createComponent(ItemEditDialogComponent);
    const dialog = fixture.componentInstance as ItemEditDialogComponent & {
      save(): void;
      form: { controls: { price: { setValue(value: number): void } } };
    };

    dialog.form.controls.price.setValue(-1);
    fixture.detectChanges();

    const saveButton = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(saveButton.disabled).toBe(true);

    dialog.save();

    http.expectNone((call) => call.method === 'PATCH');
  });
});
