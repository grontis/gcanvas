import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CanvasElement } from '../../models/canvas-element.model';

@Component({
  selector: 'gc-element-wrapper',
  standalone: true,
  imports: [],
  templateUrl: './element-wrapper.component.html',
  styleUrl: './element-wrapper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElementWrapperComponent {
  element = input.required<CanvasElement>();
}
