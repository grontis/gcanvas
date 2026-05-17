import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CanvasData } from '../models/canvas-data.model';
import { BreakpointCanvasComponent } from './breakpoint-canvas.component';

@Component({
  selector: 'gc-responsive-preview',
  standalone: true,
  imports: [BreakpointCanvasComponent],
  templateUrl: './responsive-preview.component.html',
  styleUrl: './responsive-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResponsivePreviewComponent {
  canvasData = input.required<CanvasData>();
}
