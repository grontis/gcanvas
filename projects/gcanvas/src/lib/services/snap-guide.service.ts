import { Injectable, signal } from '@angular/core';
import { CanvasElement, ElementPosition, ElementSize } from '../models/canvas-element.model';

export interface SnapGuide {
  axis: 'x' | 'y';       // x = vertical line, y = horizontal line
  value: number;          // canvas-local px coordinate
  edge: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
}

export interface SnapResult {
  x: number;  // snapped canvas-local x
  y: number;  // snapped canvas-local y
}

const SNAP_THRESHOLD = 4; // px

@Injectable()
export class SnapGuideService {
  /** Written by CanvasViewComponent's Alt keydown/keyup listeners. */
  readonly altHeld = signal(false);

  /** Set during drag/resize; cleared on gesture end. Read by the overlay. */
  readonly activeGuides = signal<SnapGuide[]>([]);

  /** Width-measurement pill value — set during drag/resize when guides are active. */
  readonly measurementWidth = signal<number | null>(null);

  clear(): void {
    this.activeGuides.set([]);
    this.measurementWidth.set(null);
  }

  /**
   * Given the dragged element's proposed position and its size, plus all other
   * canvas elements, compute the nearest snap and update activeGuides.
   *
   * Returns the snapped position in canvas-local coordinates.
   * If altHeld() is true, snap is skipped and the original position is returned.
   */
  computeSnap(
    proposed: ElementPosition,
    size: ElementSize,
    others: CanvasElement[],
    canvasSize: { width: number; height: number },
  ): ElementPosition {
    if (this.altHeld()) {
      this.clear();
      return proposed;
    }

    // Dragged element edges
    const dragRight = proposed.x + size.width;
    const dragCenterX = proposed.x + size.width / 2;
    const dragBottom = proposed.y + size.height;
    const dragCenterY = proposed.y + size.height / 2;

    // Build candidate guide values from canvas edges + other elements
    const xCandidates: Array<{ value: number; edge: SnapGuide['edge'] }> = [
      { value: 0,                 edge: 'left'  },
      { value: canvasSize.width,  edge: 'right' },
    ];
    const yCandidates: Array<{ value: number; edge: SnapGuide['edge'] }> = [
      { value: 0,                  edge: 'top'    },
      { value: canvasSize.height,  edge: 'bottom' },
    ];

    for (const el of others) {
      const r  = el.position.x + el.size.width;
      const b  = el.position.y + el.size.height;
      const cx = el.position.x + el.size.width  / 2;
      const cy = el.position.y + el.size.height / 2;
      xCandidates.push(
        { value: el.position.x, edge: 'left'   },
        { value: r,             edge: 'right'  },
        { value: cx,            edge: 'center' },
      );
      yCandidates.push(
        { value: el.position.y, edge: 'top'    },
        { value: b,             edge: 'bottom' },
        { value: cy,            edge: 'middle' },
      );
    }

    let snapX = proposed.x;
    let snapY = proposed.y;
    let bestDX = SNAP_THRESHOLD + 1;
    let bestDY = SNAP_THRESHOLD + 1;
    const xGuides: SnapGuide[] = [];
    const yGuides: SnapGuide[] = [];

    // Find closest X snap
    for (const c of xCandidates) {
      for (const [dragEdge, dragVal] of [
        ['left',   proposed.x  ] as [SnapGuide['edge'], number],
        ['right',  dragRight   ] as [SnapGuide['edge'], number],
        ['center', dragCenterX ] as [SnapGuide['edge'], number],
      ]) {
        const d = Math.abs(dragVal - c.value);
        if (d < bestDX) {
          bestDX = d;
          snapX = proposed.x + (c.value - dragVal);
          xGuides.length = 0;
          xGuides.push({ axis: 'x', value: c.value, edge: dragEdge });
        } else if (d === bestDX && bestDX <= SNAP_THRESHOLD) {
          xGuides.push({ axis: 'x', value: c.value, edge: dragEdge });
        }
      }
    }

    // Find closest Y snap
    for (const c of yCandidates) {
      for (const [dragEdge, dragVal] of [
        ['top',    proposed.y  ] as [SnapGuide['edge'], number],
        ['bottom', dragBottom  ] as [SnapGuide['edge'], number],
        ['middle', dragCenterY ] as [SnapGuide['edge'], number],
      ]) {
        const d = Math.abs(dragVal - c.value);
        if (d < bestDY) {
          bestDY = d;
          snapY = proposed.y + (c.value - dragVal);
          yGuides.length = 0;
          yGuides.push({ axis: 'y', value: c.value, edge: dragEdge });
        } else if (d === bestDY && bestDY <= SNAP_THRESHOLD) {
          yGuides.push({ axis: 'y', value: c.value, edge: dragEdge });
        }
      }
    }

    if (bestDX > SNAP_THRESHOLD) { snapX = proposed.x; }
    if (bestDY > SNAP_THRESHOLD) { snapY = proposed.y; }

    const finalGuides: SnapGuide[] = [
      ...(bestDX <= SNAP_THRESHOLD ? xGuides : []),
      ...(bestDY <= SNAP_THRESHOLD ? yGuides : []),
    ];
    this.activeGuides.set(finalGuides);

    // Width measurement pill: distance between leftmost and rightmost active x-guides
    const xGuideValues = finalGuides.filter(g => g.axis === 'x').map(g => g.value);
    if (xGuideValues.length >= 2) {
      const lo = Math.min(...xGuideValues);
      const hi = Math.max(...xGuideValues);
      this.measurementWidth.set(hi - lo);
    } else {
      this.measurementWidth.set(null);
    }

    return { x: snapX, y: snapY };
  }
}
