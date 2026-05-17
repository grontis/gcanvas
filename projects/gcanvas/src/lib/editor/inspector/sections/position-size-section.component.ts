import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CanvasStateService } from '../../../services/canvas-state.service';
import { CanvasElement } from '../../../models/canvas-element.model';

@Component({
  selector: 'gc-position-size-section',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './position-size-section.component.html',
  styleUrl: './position-size-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionSizeSectionComponent {
  element = input.required<CanvasElement>();

  private readonly canvasState = inject(CanvasStateService);

  // Computed intermediates for template (avoids redundant method calls)
  readonly x = computed(() => this.element().position.x);
  readonly y = computed(() => this.element().position.y);
  readonly w = computed(() => this.element().size.width);
  readonly h = computed(() => this.element().size.height);

  onPositionChange(axis: 'x' | 'y', value: number): void {
    if (isNaN(value)) return;
    const el = this.element();
    const newPos = axis === 'x'
      ? { x: value, y: el.position.y }
      : { x: el.position.x, y: value };
    this.canvasState.moveElement(el.id, newPos);
  }

  onSizeChange(dim: 'w' | 'h', value: number): void {
    if (isNaN(value)) return;
    const el = this.element();
    const newSize = dim === 'w'
      ? { width: value, height: el.size.height }
      : { width: el.size.width, height: value };
    this.canvasState.resizeElement(el.id, el.position, newSize);
  }
}
