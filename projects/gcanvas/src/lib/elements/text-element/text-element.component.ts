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
import { StarterKit } from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Underline } from '@tiptap/extension-underline';
import { generateHTML } from '@tiptap/html';
import type { JSONContent } from '@tiptap/core';
import { TextCanvasElement } from '../../models/canvas-element.model';
import { CanvasStateService } from '../../services/canvas-state.service';
import { SelectionService } from '../../services/selection.service';

const TIPTAP_EXTENSIONS = [StarterKit, TextStyle, Color, Underline];
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

  // Mode signal
  readonly editMode = signal(false);

  // TipTap Editor instance — null in DISPLAY mode
  editor: Editor | null = null;

  // Computed display HTML — derived from element signal
  readonly displayHtml: Signal<string> = computed(() =>
    generateHTML(this.element().content as JSONContent, TIPTAP_EXTENSIONS),
  );

  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;

  onDoubleClick(): void {
    if (this.editMode()) return;
    this.editMode.set(true);
    this.editor = new Editor({
      extensions: TIPTAP_EXTENSIONS,
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
