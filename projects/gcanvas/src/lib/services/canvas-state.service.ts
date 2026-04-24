import { Injectable, signal, computed, Signal } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { CanvasData, CanvasChangeEvent } from '../models/canvas-data.model';
import { CanvasElement, ElementPosition, ElementSize } from '../models/canvas-element.model';

const HISTORY_LIMIT = 50;
const MIN_SIZE = 50;

@Injectable()
export class CanvasStateService {
  // Internal writable signal
  private readonly _state = signal<CanvasData>({
    version: 1,
    viewport: { width: 1200, height: 800 },
    elements: [],
  });

  // Public readonly projection
  readonly canvasData: Signal<CanvasData> = this._state.asReadonly();

  // Derived signal: element array only
  readonly elements = computed(() => this._state().elements);

  // Undo/redo stacks (snapshots of CanvasData)
  // Tracked via length signals so computed() picks up mutations
  private _past: CanvasData[] = [];
  private _future: CanvasData[] = [];
  private readonly _pastLen = signal(0);
  private readonly _futureLen = signal(0);

  readonly canUndo = computed(() => this._pastLen() > 0);
  readonly canRedo = computed(() => this._futureLen() > 0);

  // Change stream
  private readonly _changes$ = new Subject<CanvasChangeEvent>();
  readonly changes$: Observable<CanvasChangeEvent> = this._changes$.asObservable();

  // --- Snapshot ---
  loadSnapshot(data: CanvasData): void {
    // Do not push to history when loading from external input
    this._past = [];
    this._future = [];
    this._pastLen.set(0);
    this._futureLen.set(0);
    this._state.set(data);
  }

  // --- Mutations (all push to history before mutating) ---

  moveElement(id: string, position: ElementPosition): void {
    this._pushHistory();
    this._mutateElement(id, el => ({ ...el, position }));
    this._emit({ changedElementIds: [id], changeType: 'move' });
  }

  resizeElement(id: string, position: ElementPosition, size: ElementSize): void {
    this._pushHistory();
    const safeSize: ElementSize = {
      width: Math.max(MIN_SIZE, size.width),
      height: Math.max(MIN_SIZE, size.height),
    };
    this._mutateElement(id, el => ({ ...el, position, size: safeSize }));
    this._emit({ changedElementIds: [id], changeType: 'resize' });
  }

  updateContent(id: string, content: unknown): void {
    this._pushHistory();
    this._mutateElement(id, el => ({ ...el, content } as CanvasElement));
    this._emit({ changedElementIds: [id], changeType: 'edit' });
  }

  addElement(element: CanvasElement): void {
    this._pushHistory();
    this._state.update(s => ({
      ...s,
      elements: [...s.elements, element],
    }));
    this._emit({ changedElementIds: [element.id], changeType: 'add' });
  }

  removeElement(id: string): void {
    this._pushHistory();
    this._state.update(s => ({
      ...s,
      elements: s.elements.filter(el => el.id !== id),
    }));
    this._emit({ changedElementIds: [id], changeType: 'remove' });
  }

  reorderElement(id: string, newZIndex: number): void {
    this._pushHistory();
    this._mutateElement(id, el => ({ ...el, zIndex: newZIndex }));
    this._emit({ changedElementIds: [id], changeType: 'reorder' });
  }

  // --- Undo/Redo ---

  undo(): void {
    if (this._past.length === 0) return;
    this._future.push(this._state());
    this._futureLen.set(this._future.length);
    const prev = this._past.pop()!;
    this._pastLen.set(this._past.length);
    this._state.set(prev);
    // No changedElementIds — full snapshot restore; 'viewport' used as sentinel
    this._emit({ changedElementIds: [], changeType: 'viewport' });
  }

  redo(): void {
    if (this._future.length === 0) return;
    this._past.push(this._state());
    this._pastLen.set(this._past.length);
    const next = this._future.pop()!;
    this._futureLen.set(this._future.length);
    this._state.set(next);
    this._emit({ changedElementIds: [], changeType: 'viewport' });
  }

  // --- Helpers ---

  private _pushHistory(): void {
    this._past.push(this._state());
    if (this._past.length > HISTORY_LIMIT) {
      this._past.shift();
    }
    this._pastLen.set(this._past.length);
    this._future = []; // any new mutation clears redo stack
    this._futureLen.set(0);
  }

  private _mutateElement(
    id: string,
    mutator: (el: CanvasElement) => CanvasElement,
  ): void {
    this._state.update(s => ({
      ...s,
      elements: s.elements.map(el => (el.id === id ? mutator(el) : el)),
    }));
  }

  private _emit(partial: Omit<CanvasChangeEvent, 'canvasData'>): void {
    this._changes$.next({ ...partial, canvasData: this._state() });
  }
}
