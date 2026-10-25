import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-menu-page',
  templateUrl: './menu-page.component.html',
  styleUrl: './menu-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPageComponent {}
