import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  Signal,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { TiptapEditorDirective } from 'ngx-tiptap';
import { Editor } from '@tiptap/core';
import { generateHTML } from '@tiptap/html';
import type { JSONContent } from '@tiptap/core';
import { TextCanvasElement } from '../../models/canvas-element.model';
import { CanvasStateService } from '../../services/canvas-state.service';
import { SelectionService } from '../../services/selection.service';
import {
  TIPTAP_EXTENSIONS_TOKEN,
  DEFAULT_TIPTAP_EXTENSIONS,
} from '../../tokens/tiptap-extensions.token';

const DEBOUNCE_MS = 300;

@Component({
  selector: 'gc-text-element',
  standalone: true,
  imports: [TiptapEditorDirective],
  templateUrl: './text-element.component.html',
  styleUrl: './text-element.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextElementComponent implements OnDestroy {
  element = input.required<TextCanvasElement>();

  // Services
  private readonly canvasState = inject(CanvasStateService);
  private readonly selection = inject(SelectionService);

  // Extensions — injected via token (optional) with fallback to the library defaults
  private readonly extensions =
    inject(TIPTAP_EXTENSIONS_TOKEN, { optional: true }) ?? DEFAULT_TIPTAP_EXTENSIONS;

  // Mode signal
  readonly editMode = signal(false);

  // TipTap Editor instance — null in DISPLAY mode
  editor: Editor | null = null;

  // Computed display HTML — derived from element signal
  readonly displayHtml: Signal<string> = computed(() =>
    generateHTML(this.element().content as JSONContent, this.extensions),
  );

  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;

  onDoubleClick(): void {
    if (this.editMode()) return;
    this.editMode.set(true);
    this.editor = new Editor({
      extensions: this.extensions,
      content: this.element().content as JSONContent,
      onUpdate: ({ editor }) => {
        if (this._debounceTimer) clearTimeout(this._debounceTimer);
        this._debounceTimer = setTimeout(() => {
          this.canvasState.updateContent(this.element().id, editor.getJSON());
        }, DEBOUNCE_MS);
      },
    });
    this.selection.activeEditor.set(this.editor);
  }

  onEditorFocusOut(event: FocusEvent): void {
    const wrapper = event.currentTarget as HTMLElement;
    if (!wrapper.contains(event.relatedTarget as Node)) {
      this.exitEdit();
    }
  }

  exitEdit(): void {
    if (!this.editMode()) return;
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
    this.editor?.destroy();
    this.editor = null;
    this.selection.activeEditor.set(null);
    this.editMode.set(false);
  }

  ngOnDestroy(): void {
    this.exitEdit();
  }
}
