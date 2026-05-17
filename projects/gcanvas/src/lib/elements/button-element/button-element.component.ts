import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { GenericCanvasElement } from '../../models/canvas-element.model';

@Component({
  selector: 'gc-button-element',
  standalone: true,
  imports: [],
  templateUrl: './button-element.component.html',
  styleUrl: './button-element.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonElementComponent {
  element = input.required<GenericCanvasElement>();
}
