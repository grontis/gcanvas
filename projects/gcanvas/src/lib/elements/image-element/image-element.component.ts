import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ImageCanvasElement } from '../../models/canvas-element.model';

@Component({
  selector: 'gc-image-element',
  standalone: true,
  imports: [],
  templateUrl: './image-element.component.html',
  styleUrl: './image-element.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageElementComponent {
  element = input.required<ImageCanvasElement>();
}
