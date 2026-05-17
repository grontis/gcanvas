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
import { CdkDragEnd, CdkDragStart, DragDropModule, DragRef, Point } from '@angular/cdk/drag-drop';
import { CanvasElement, ElementPosition, ElementSize } from '../../models/canvas-element.model';
import { CanvasStateService } from '../../services/canvas-state.service';
import { SelectionService } from '../../services/selection.service';
import { SnapGuideService } from '../../services/snap-guide.service';
import { elementLabel } from '../element-label.util';
import {
  ELEMENT_REGISTRY_TOKEN,
  ElementRegistryEntry,
} from '../../tokens/element-registry.token';

const MIN_SIZE = 50;

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
  readonly = input<boolean>(false);

  private readonly canvasState = inject(CanvasStateService);
  private readonly selection = inject(SelectionService);
  private readonly snapGuide = inject(SnapGuideService);

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

  // --- Dimension pill ---
  readonly showDimPill = computed(() => this.previewSize() !== null);
  readonly dimPillText = computed(() => {
    const s = this.effectiveSize();
    return `${Math.round(s.width)} × ${Math.round(s.height)}`;
  });

  // --- Label badge ---
  readonly label = computed(() => elementLabel(this.element()));

  onSelect(): void {
    this.selection.select(this.element().id);
  }

  onDragStarted(event: CdkDragStart): void {
    this.onSelect();
  }

  /**
   * CDK constrainPosition callback — called on every pointermove during drag.
   *
   * CDK passes:
   *   point                  — the current pointer position in PAGE space
   *   dragRef                — the DragRef instance (getRootElement() returns the dragged element)
   *   dimensions             — DOMRect of the root element at drag start
   *   pickupPositionInElement — pointer offset within the element at pick-up (element-local coords)
   *
   * To compute the element's proposed canvas-local top-left:
   *   proposedElementTopLeft = point − canvasRect.origin − pickupPositionInElement
   */
  readonly constrainPosition = (
    point: Point,
    dragRef: DragRef,
    _dimensions: DOMRect,
    pickupPositionInElement: Point,
  ): Point => {
    const rootEl = dragRef.getRootElement();
    const canvasEl = rootEl.closest('.gc-canvas') as HTMLElement | null;
    if (!canvasEl) return point;
    const rect = canvasEl.getBoundingClientRect();
    const canvasSize = this.canvasState.canvasData().viewport;

    // Convert pointer page-space → element canvas-local proposed top-left
    const proposed: ElementPosition = {
      x: point.x - rect.left - pickupPositionInElement.x,
      y: point.y - rect.top  - pickupPositionInElement.y,
    };

    const el = this.element();
    const others = this.canvasState.elements().filter(e => e.id !== el.id);
    const snapped = this.snapGuide.computeSnap(proposed, el.size, others, canvasSize);

    // Return snapped pointer position in page space
    return {
      x: snapped.x + rect.left + pickupPositionInElement.x,
      y: snapped.y + rect.top  + pickupPositionInElement.y,
    };
  };

  onDragEnded(event: CdkDragEnd): void {
    const pos = event.source.getFreeDragPosition();
    this.snapGuide.clear();                          // 1. clear guides
    this.canvasState.moveElement(this.element().id, pos); // 2. commit position
    event.source.reset();                            // 3. reset CDK transform (prevents double-offset)
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
    const el = this.element();

    // Determine which axes this handle affects
    const movesE = handle.includes('e');
    const movesW = handle.includes('w');
    const movesN = handle.includes('n');
    const movesS = handle.includes('s');

    // Raw proposed deltas for width and height (before modifiers)
    let rawDw = 0;
    let rawDh = 0;
    if (movesE) rawDw += dx;
    if (movesW) rawDw -= dx;
    if (movesS) rawDh += dy;
    if (movesN) rawDh -= dy;

    // --- Shift: aspect-ratio lock ---
    // Active when Shift is held OR when the element has lockAspectRatio: true.
    const shouldLock = event.shiftKey || (el.lockAspectRatio ?? false);
    if (shouldLock && rawDw !== 0 && rawDh !== 0) {
      // Keep the original width:height ratio using the larger of the two deltas.
      const ratio = startSize.width / startSize.height;
      // Determine dominant axis: use whichever of rawDw/rawDh results in
      // the larger dimension change after applying the ratio.
      if (Math.abs(rawDw) >= Math.abs(rawDh) * ratio) {
        // Width is dominant — clamp height to match
        rawDh = rawDw / ratio;
      } else {
        // Height is dominant — clamp width to match
        rawDw = rawDh * ratio;
      }
    }
    // For single-axis handles (pure 'n','s','e','w') ratio lock has no effect
    // (can't lock ratio with only one free axis).

    // Compute new size
    let width  = Math.max(MIN_SIZE, startSize.width  + rawDw);
    let height = Math.max(MIN_SIZE, startSize.height + rawDh);

    // --- Alt: resize from center ---
    // Active when Alt is held. Each side moves by the same delta,
    // so the element grows/shrinks symmetrically around its center.
    let x = startPos.x;
    let y = startPos.y;
    if (event.altKey) {
      // Effective width/height increase is double (both sides move).
      // We recompute width/height from doubled deltas, then re-clamp.
      const doubledDw = rawDw * 2;
      const doubledDh = rawDh * 2;
      width  = Math.max(MIN_SIZE, startSize.width  + doubledDw);
      height = Math.max(MIN_SIZE, startSize.height + doubledDh);
      // Position adjusts to keep the center fixed.
      // Center is at startPos + startSize/2.
      // New x = center.x - newWidth/2
      x = startPos.x + startSize.width  / 2 - width  / 2;
      y = startPos.y + startSize.height / 2 - height / 2;
    } else {
      // Without Alt: only the handle-side position adjusts (west/north handles pull origin).
      if (movesW) x = startPos.x + (startSize.width  - width);
      if (movesN) y = startPos.y + (startSize.height - height);
    }

    const proposedPos:  ElementPosition = { x, y };
    const proposedSize: ElementSize     = { width, height };

    // Snap + commit preview (same as existing code)
    const canvasEl = (event.target as HTMLElement).closest('.gc-canvas') as HTMLElement | null;
    if (canvasEl) {
      const viewport = this.canvasState.canvasData().viewport;
      const others   = this.canvasState.elements().filter(e => e.id !== this.element().id);
      const snapped  = this.snapGuide.computeSnap(proposedPos, proposedSize, others, viewport);
      this.previewPosition.set(snapped);
      const dxSnap = snapped.x - startPos.x;
      const dySnap = snapped.y - startPos.y;
      let snappedWidth  = proposedSize.width;
      let snappedHeight = proposedSize.height;
      if (movesW) snappedWidth  = Math.max(MIN_SIZE, startSize.width  - dxSnap);
      if (movesN) snappedHeight = Math.max(MIN_SIZE, startSize.height - dySnap);
      this.previewSize.set({ width: snappedWidth, height: snappedHeight });
    } else {
      this.previewSize.set(proposedSize);
      this.previewPosition.set(proposedPos);
    }
  }

  onResizeEnd(event: PointerEvent): void {
    if (!this._resizing) return;
    this.snapGuide.clear(); // clear guides before commit
    const pos  = this.previewPosition();
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
