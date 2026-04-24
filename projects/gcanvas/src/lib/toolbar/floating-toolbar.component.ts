import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { SelectionService } from '../services/selection.service';
import { CanvasStateService } from '../services/canvas-state.service';

@Component({
  selector: 'gc-floating-toolbar',
  standalone: true,
  imports: [],
  templateUrl: './floating-toolbar.component.html',
  styleUrl: './floating-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingToolbarComponent {
  private readonly selection = inject(SelectionService);
  private readonly canvasState = inject(CanvasStateService);

  readonly editor = computed(() => this.selection.activeEditor());
  readonly isVisible = computed(() => this.editor() !== null);

  // Position computed from selected element's position + size
  // Toolbar appears directly above the selected element
  // Clamped so it stays visible when element is near the top edge
  readonly toolbarTop = computed(() => {
    const editorInstance = this.editor();
    if (!editorInstance) return '0px';
    const selectedId = this.selection.selectedId();
    const el = this.canvasState.elements().find(e => e.id === selectedId);
    if (!el) return '0px';
    return `${Math.max(4, el.position.y - 44)}px`;
  });

  readonly toolbarLeft = computed(() => {
    const editorInstance = this.editor();
    if (!editorInstance) return '0px';
    const selectedId = this.selection.selectedId();
    const el = this.canvasState.elements().find(e => e.id === selectedId);
    if (!el) return '0px';
    return `${el.position.x}px`;
  });

  bold(): void { this.editor()?.chain().focus().toggleBold().run(); }
  italic(): void { this.editor()?.chain().focus().toggleItalic().run(); }
  underline(): void { this.editor()?.chain().focus().toggleUnderline().run(); }

  setColor(color: string): void {
    this.editor()?.chain().focus().setColor(color).run();
  }
}
