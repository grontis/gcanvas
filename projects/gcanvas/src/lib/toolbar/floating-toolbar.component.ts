import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectionService } from '../services/selection.service';
import { CanvasStateService } from '../services/canvas-state.service';

@Component({
  selector: 'gc-floating-toolbar',
  standalone: true,
  imports: [FormsModule],
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

  // Heading dropdown — '' means paragraph (no heading)
  readonly headingLevel = signal<'' | '1' | '2' | '3' | '4' | '5' | '6'>('');

  // Font size input — reflects active editor state, empty string = not set
  readonly fontSize = signal('');

  // Link popover
  readonly showLinkPopover = signal(false);
  linkUrl = '';

  // --- Existing methods ---
  bold(): void   { this.editor()?.chain().focus().toggleBold().run(); }
  italic(): void { this.editor()?.chain().focus().toggleItalic().run(); }
  underline(): void { this.editor()?.chain().focus().toggleUnderline().run(); }

  setColor(color: string): void {
    this.editor()?.chain().focus().setColor(color).run();
  }

  // --- New methods ---
  setHeading(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const ed = this.editor();
    if (!ed) return;
    if (value === '') {
      ed.chain().focus().setParagraph().run();
    } else {
      // Heading level must be typed as 1|2|3|4|5|6 — literal union, not number
      ed.chain().focus().toggleHeading({ level: Number(value) as 1 | 2 | 3 | 4 | 5 | 6 }).run();
    }
  }

  setFontSize(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const ed = this.editor();
    if (!ed) return;
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      ed.chain().focus().setFontSize(`${num}px`).run();
    } else {
      ed.chain().focus().unsetFontSize().run();
    }
  }

  toggleBulletList(): void {
    this.editor()?.chain().focus().toggleBulletList().run();
  }

  toggleOrderedList(): void {
    this.editor()?.chain().focus().toggleOrderedList().run();
  }

  setAlign(align: 'left' | 'center' | 'right' | 'justify'): void {
    this.editor()?.chain().focus().setTextAlign(align).run();
  }

  openLinkPopover(): void {
    const ed = this.editor();
    if (!ed) return;
    // Pre-fill with current link href if cursor is on a link
    this.linkUrl = ed.getAttributes('link')['href'] ?? '';
    this.showLinkPopover.set(true);
  }

  applyLink(): void {
    const ed = this.editor();
    if (!ed) return;
    const href = this.linkUrl.trim();
    if (href) {
      if (/^(javascript|data|vbscript):/i.test(href)) {
        this.showLinkPopover.set(false);
        this.linkUrl = '';
        return;
      }
      ed.chain().focus().setLink({ href }).run();
    } else {
      ed.chain().focus().unsetLink().run();
    }
    this.showLinkPopover.set(false);
    this.linkUrl = '';
  }

  cancelLink(): void {
    this.showLinkPopover.set(false);
    this.linkUrl = '';
  }
}
