import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { GenericCanvasElement } from '../../models/canvas-element.model';

@Component({
  selector: 'gc-shape-element',
  standalone: true,
  imports: [],
  templateUrl: './shape-element.component.html',
  styleUrl: './shape-element.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShapeElementComponent {
  element = input.required<GenericCanvasElement>();
}
