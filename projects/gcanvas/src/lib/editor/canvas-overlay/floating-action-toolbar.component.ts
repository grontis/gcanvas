import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
} from '@angular/core';
import { SelectionService } from '../../services/selection.service';
import { CanvasStateService } from '../../services/canvas-state.service';
import { ImageCanvasElement } from '../../models/canvas-element.model';

// Approximate toolbar width (px) — used for left-centering clamp
const TOOLBAR_WIDTH = 200;

@Component({
  selector: 'gc-floating-action-toolbar',
  standalone: true,
  imports: [],
  templateUrl: './floating-action-toolbar.component.html',
  styleUrl: './floating-action-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingActionToolbarComponent {
  @ViewChild('filePicker') filePicker?: ElementRef<HTMLInputElement>;

  private readonly selection   = inject(SelectionService);
  private readonly canvasState = inject(CanvasStateService);

  private readonly selectedEl = computed(() => {
    const id = this.selection.selectedId();
    if (!id) return null;
    return this.canvasState.elements().find(e => e.id === id) ?? null;
  });

  readonly isVisible = computed(
    () => this.selectedEl() !== null && this.selection.activeEditor() === null,
  );

  readonly isImage = computed(() => this.selectedEl()?.type === 'image');

  // Position: above the element, clamped to canvas bounds.
  // Toolbar appears 44px above the element's top edge, minimum 4px from canvas top.
  readonly toolbarTop = computed(() => {
    const el = this.selectedEl();
    if (!el) return '0px';
    return `${Math.max(4, el.position.y - 44)}px`;
  });

  readonly toolbarLeft = computed(() => {
    const el = this.selectedEl();
    if (!el) return '0px';
    const canvasWidth = this.canvasState.canvasData().viewport.width;
    // Center the toolbar over the element
    const idealLeft = el.position.x + el.size.width / 2 - TOOLBAR_WIDTH / 2;
    // Clamp: keep toolbar within [0, canvasWidth - TOOLBAR_WIDTH]
    const clamped = Math.max(0, Math.min(idealLeft, canvasWidth - TOOLBAR_WIDTH));
    return `${clamped}px`;
  });

  triggerReplace(): void {
    this.filePicker?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;
    const el = this.selectedEl();
    if (!el) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.canvasState.patchElement(el.id, { src: reader.result as string });
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  onCrop(): void {
    // Crop is a Phase E stub
    console.log('Crop: not yet implemented');
  }

  onDelete(): void {
    const id = this.selectedEl()?.id;
    if (!id) return;
    this.selection.deselect();
    this.canvasState.removeElement(id);
  }

  onDuplicate(): void {
    const el = this.selectedEl();
    if (!el) return;
    const newEl = {
      ...el,
      id: crypto.randomUUID(),
      position: { x: el.position.x + 20, y: el.position.y + 20 },
      zIndex: el.zIndex + 1,
    };
    this.canvasState.addElement(newEl as any);
  }
}
