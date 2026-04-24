import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { CdkDrag, CdkDragEnd, DragDropModule } from '@angular/cdk/drag-drop';
import { CanvasElement, ElementPosition, ElementSize } from '../../models/canvas-element.model';
import { CanvasStateService } from '../../services/canvas-state.service';
import { SelectionService } from '../../services/selection.service';
import {
  ELEMENT_REGISTRY_TOKEN,
  ElementRegistryEntry,
} from '../../tokens/element-registry.token';

interface ResizeState {
  handle: string; // 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'
  startX: number;
  startY: number;
  startPos: ElementPosition;
  startSize: ElementSize;
  pointerId: number;
}

@Component({
  selector: 'gc-element-wrapper',
  standalone: true,
  imports: [DragDropModule, NgComponentOutlet],
  templateUrl: './element-wrapper.component.html',
  styleUrl: './element-wrapper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElementWrapperComponent {
  element = input.required<CanvasElement>();

  private readonly canvasState = inject(CanvasStateService);
  private readonly selection = inject(SelectionService);

  constructor(@Inject(ELEMENT_REGISTRY_TOKEN) private readonly registry: ElementRegistryEntry[]) {}

  readonly isSelected = computed(
    () => this.selection.selectedId() === this.element().id,
  );

  // Resolved component class for NgComponentOutlet
  readonly elementComponent = computed(() => {
    const type = this.element().type;
    return this.registry.find(e => e.type === type)?.component ?? null;
  });

  // NgComponentOutlet inputs — key must match the input() name in child component
  readonly outletInputs = computed(() => ({ element: this.element() }));

  // Drag position binding for CDK — uses live element position from state
  readonly dragPosition = computed(() => this.element().position);

  // --- Local resize preview state ---
  // During an active resize gesture, these hold the live preview values.
  // Only committed to the service on pointerup to avoid flooding history.
  readonly previewSize = signal<ElementSize | null>(null);
  readonly previewPosition = signal<ElementPosition | null>(null);

  // Effective size/position for template bindings (preview during resize, state otherwise)
  readonly effectiveSize = computed(
    () => this.previewSize() ?? this.element().size,
  );
  readonly effectivePosition = computed(
    () => this.previewPosition() ?? this.element().position,
  );

  onSelect(): void {
    this.selection.select(this.element().id);
  }

  onDragEnded(event: CdkDragEnd): void {
    const pos = event.source.getFreeDragPosition();
    this.canvasState.moveElement(this.element().id, pos);
    event.source.reset(); // CRITICAL — prevents double-offset on re-render
  }

  // --- Resize handle logic ---

  private _resizing: ResizeState | null = null;

  onResizeStart(event: PointerEvent, handle: string): void {
    event.stopPropagation(); // prevent CDK drag from starting
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    const el = this.element();
    this._resizing = {
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startPos: { ...el.position },
      startSize: { ...el.size },
      pointerId: event.pointerId,
    };
    // Initialize preview signals with current values
    this.previewSize.set({ ...el.size });
    this.previewPosition.set({ ...el.position });
  }

  onResizeMove(event: PointerEvent): void {
    if (!this._resizing) return;
    const dx = event.clientX - this._resizing.startX;
    const dy = event.clientY - this._resizing.startY;
    const { handle, startPos, startSize } = this._resizing;

    let { x, y } = startPos;
    let { width, height } = startSize;

    // East/West affects width (and x for west)
    if (handle.includes('e')) width += dx;
    if (handle.includes('w')) { width -= dx; x += dx; }

    // North/South affects height (and y for north)
    if (handle.includes('s')) height += dy;
    if (handle.includes('n')) { height -= dy; y += dy; }

    // Update local preview signals only — no service call here to avoid history pollution
    const MIN_SIZE = 50;
    this.previewSize.set({
      width: Math.max(MIN_SIZE, width),
      height: Math.max(MIN_SIZE, height),
    });
    this.previewPosition.set({ x, y });
  }

  onResizeEnd(event: PointerEvent): void {
    if (!this._resizing) return;
    const pos = this.previewPosition();
    const size = this.previewSize();
    if (pos && size) {
      // Single service call on commit — one history entry for the whole gesture
      this.canvasState.resizeElement(this.element().id, pos, size);
    }
    // Clear preview — element signal from state takes over
    this.previewSize.set(null);
    this.previewPosition.set(null);
    this._resizing = null;
  }
}
