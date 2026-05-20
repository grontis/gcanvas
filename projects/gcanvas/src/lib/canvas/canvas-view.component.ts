import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  input,
} from '@angular/core';
import { CDK_DROP_LIST } from '@angular/cdk/drag-drop';
import { CanvasStateService } from '../services/canvas-state.service';
import { SelectionService } from '../services/selection.service';
import { SnapGuideService } from '../services/snap-guide.service';
import { ElementWrapperComponent } from '../elements/element-wrapper/element-wrapper.component';
import { FloatingToolbarComponent } from '../toolbar/floating-toolbar.component';
import { SnapGuidesOverlayComponent } from './snap-guides-overlay.component';
import { FloatingActionToolbarComponent } from './overlays/floating-action-toolbar.component';

@Component({
  selector: 'gc-canvas-view',
  standalone: true,
  imports: [ElementWrapperComponent, FloatingToolbarComponent, SnapGuidesOverlayComponent, FloatingActionToolbarComponent],
  templateUrl: './canvas-view.component.html',
  styleUrl: './canvas-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The parent .gc-canvas-wrap is a CdkDropList (palette drop target). Shadow
  // CDK_DROP_LIST here with `null` so descendant cdkDrag instances (the
  // element-wrappers) don't get adopted as list items — they need to remain
  // standalone free drags so `cdkDragFreeDragPosition` actually applies.
  providers: [{ provide: CDK_DROP_LIST, useValue: null }],
  host: {
    tabindex: '0',
    '[class.gc-canvas-view--readonly]': 'readonly()',
  },
})
export class CanvasViewComponent {
  readonly readonly = input<boolean>(false);

  protected readonly canvasState = inject(CanvasStateService);
  private readonly selection = inject(SelectionService);
  protected readonly snapGuide = inject(SnapGuideService);

  readonly elements = computed(() => this.canvasState.elements());
  readonly viewport = computed(() => this.canvasState.canvasData().viewport);

  @HostListener('keydown.escape')
  onEscape(): void {
    if (this.readonly()) return;
    this.selection.deselect();
  }

  @HostListener('keydown.delete')
  @HostListener('keydown.backspace')
  onDelete(): void {
    if (this.readonly()) return;
    // Guard: if a text editor is active, suppress delete to avoid removing
    // the element while the user is typing (backspace-in-text-edit-mode bug)
    if (this.selection.activeEditor() !== null) return;

    const id = this.selection.selectedId();
    if (id) {
      this.selection.deselect();
      this.canvasState.removeElement(id);
    }
  }

  @HostListener('keydown.control.z')
  onUndo(): void {
    if (this.readonly()) return;
    this.canvasState.undo();
  }

  @HostListener('keydown.control.shift.z')
  @HostListener('keydown.control.y')
  onRedo(): void {
    if (this.readonly()) return;
    this.canvasState.redo();
  }

  @HostListener('document:keydown.alt')
  onAltDown(): void {
    if (this.readonly()) return;
    this.snapGuide.altHeld.set(true);
  }

  @HostListener('document:keyup.alt')
  onAltUp(): void {
    if (this.readonly()) return;
    this.snapGuide.altHeld.set(false);
  }
}
