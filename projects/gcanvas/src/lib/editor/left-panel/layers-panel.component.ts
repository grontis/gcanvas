import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { DragDropModule, CdkDragDrop, CdkDrag, moveItemInArray } from '@angular/cdk/drag-drop';
import { CanvasStateService } from '../../services/canvas-state.service';
import { SelectionService } from '../../services/selection.service';
import { CanvasElement } from '../../models/canvas-element.model';
import { elementLabel } from '../../elements/element-label.util';

@Component({
  selector: 'gc-layers-panel',
  standalone: true,
  imports: [DragDropModule],
  templateUrl: './layers-panel.component.html',
  styleUrl: './layers-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayersPanelComponent {
  private readonly canvasState = inject(CanvasStateService);
  protected readonly selection = inject(SelectionService);

  /** Sorted descending by zIndex (index 0 = topmost layer in UI) */
  readonly layers = computed(() =>
    [...this.canvasState.elements()].sort((a, b) => b.zIndex - a.zIndex)
  );

  // Reject foreign drags (palette tiles) that the CdkDropListGroup would
  // otherwise route here. Only layer rows (with no PaletteEntry-shape data)
  // are accepted.
  readonly layerOnlyPredicate = (item: CdkDrag<unknown>): boolean => {
    const data = item.data as { toolId?: unknown } | undefined;
    return data?.toolId === undefined;
  };

  labelOf(el: CanvasElement): string {
    return elementLabel(el);
  }

  onDrop(event: CdkDragDrop<CanvasElement[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const ordered = [...this.layers()];
    moveItemInArray(ordered, event.previousIndex, event.currentIndex);
    this.canvasState.reorderElements(ordered.map(e => e.id));
  }

  selectLayer(id: string): void {
    this.selection.select(id);
  }

  toggleLock(el: CanvasElement): void {
    this.canvasState.patchElement(el.id, { locked: !el.locked });
  }

  toggleVisible(el: CanvasElement): void {
    // undefined/true → false (hide); false → true (show)
    this.canvasState.patchElement(el.id, { visible: el.visible === false ? true : false });
  }
}
