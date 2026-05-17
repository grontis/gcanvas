import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CanvasData, CanvasChangeEvent } from '../models/canvas-data.model';
import { CanvasStateService } from '../services/canvas-state.service';
import { CanvasViewComponent } from './canvas-view.component';
import { provideCanvas } from '../providers/provide-canvas';

@Component({
  selector: 'gc-canvas',
  standalone: true,
  imports: [CanvasViewComponent],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [...provideCanvas()],
})
export class CanvasComponent {
  canvasData = input.required<CanvasData>();
  canvasChange = output<CanvasChangeEvent>();

  private readonly canvasState = inject(CanvasStateService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // effect() MUST be in the constructor (injection context required)
    // Syncs external canvasData input signal to the service on every change
    effect(() => {
      this.canvasState.loadSnapshot(this.canvasData());
    });

    // Wire change stream to output — uses takeUntilDestroyed for cleanup
    this.canvasState.changes$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => this.canvasChange.emit(event));
  }
}
