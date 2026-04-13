import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CanvasData } from '../models/canvas-data.model';
import { CanvasChangeEvent } from '../models/canvas-data.model';
import { CanvasStateService } from '../services/canvas-state.service';
import { SelectionService } from '../services/selection.service';

@Component({
  selector: 'gc-canvas',
  standalone: true,
  imports: [],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CanvasStateService, SelectionService],
  host: { tabindex: '0' },
})
export class CanvasComponent {
  canvasData = input.required<CanvasData>();
  canvasChange = output<CanvasChangeEvent>();
}
