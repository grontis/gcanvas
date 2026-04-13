import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'gc-floating-toolbar',
  standalone: true,
  imports: [],
  templateUrl: './floating-toolbar.component.html',
  styleUrl: './floating-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingToolbarComponent {}
