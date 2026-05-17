import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { CanvasData } from '../models/canvas-data.model';
import { CanvasStateService } from '../services/canvas-state.service';
import { CanvasViewComponent } from '../canvas/canvas-view.component';
import { provideCanvas } from '../providers/provide-canvas';

@Component({
  selector: 'gc-breakpoint-canvas',
  standalone: true,
  imports: [CanvasViewComponent],
  templateUrl: './breakpoint-canvas.component.html',
  styleUrl: './breakpoint-canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: provideCanvas(),
})
export class BreakpointCanvasComponent {
  canvasData = input.required<CanvasData>();
  width      = input.required<number>();

  private readonly canvasState = inject(CanvasStateService);

  constructor() {
    effect(() => {
      this.canvasState.loadSnapshot(this.canvasData());
    });
  }
}
