import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TextCanvasElement } from '../../models/canvas-element.model';

@Component({
  selector: 'gc-text-element',
  standalone: true,
  imports: [],
  templateUrl: './text-element.component.html',
  styleUrl: './text-element.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextElementComponent {
  element = input.required<TextCanvasElement>();
}
