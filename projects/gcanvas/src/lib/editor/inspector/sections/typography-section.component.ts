import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CanvasStateService } from '../../../services/canvas-state.service';
import { SelectionService } from '../../../services/selection.service';
import { TextCanvasElement } from '../../../models/canvas-element.model';

export const SYSTEM_FONTS = [
  'system-ui',
  'sans-serif',
  'serif',
  'monospace',
  'Arial',
  'Georgia',
  'Courier New',
  'Verdana',
  'Times New Roman',
  'Trebuchet MS',
  'Impact',
] as const;

export type TextAlign = 'left' | 'center' | 'right' | 'justify';

@Component({
  selector: 'gc-typography-section',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './typography-section.component.html',
  styleUrl: './typography-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypographySectionComponent {
  element = input.required<TextCanvasElement>();

  private readonly canvasState = inject(CanvasStateService);
  private readonly selection   = inject(SelectionService);

  readonly systemFonts = SYSTEM_FONTS;
  readonly alignOptions: TextAlign[] = ['left', 'center', 'right', 'justify'];

  // --- Reads from element.styles (block defaults) ---
  readonly fontFamily    = computed(() => this.element().styles?.['font-family']     ?? '');
  readonly fontWeight    = computed(() => this.element().styles?.['font-weight']     ?? '');
  readonly fontSize      = computed(() => {
    const raw = this.element().styles?.['font-size'] ?? '';
    // Strip 'px' suffix so the <input type="number"> gets a plain number
    return raw.endsWith('px') ? raw.slice(0, -2) : raw;
  });
  readonly lineHeight    = computed(() => this.element().styles?.['line-height']     ?? '');
  readonly letterSpacing = computed(() => this.element().styles?.['letter-spacing']  ?? '');
  readonly color         = computed(() => this.element().styles?.['color']            ?? '#000000');
  readonly highlight     = computed(() => this.element().styles?.['background-color'] ?? '#ffffff');
  readonly textAlign     = computed(() => (this.element().styles?.['text-align'] ?? 'left') as TextAlign);

  // Active editor (null if not in text-edit mode)
  private readonly activeEditor = computed(() => this.selection.activeEditor());

  // --- Write helpers ---
  private patch(styles: Record<string, string>): void {
    this.canvasState.patchStyles(this.element().id, styles);
  }

  onFontFamilyChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.patch({ 'font-family': value });
    this.activeEditor()?.chain().focus().setFontFamily(value).run();
  }

  onFontWeightChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.patch({ 'font-weight': value });
    // TipTap StarterKit bold = weight 700; finer control would need a custom extension.
    // For now, only propagate bold toggle when value is exactly '700' or 'bold'.
    const ed = this.activeEditor();
    if (ed) {
      if (value === '700' || value === 'bold') {
        ed.chain().focus().setBold().run();
      } else {
        ed.chain().focus().unsetBold().run();
      }
    }
  }

  onFontSizeChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const num = parseInt(value, 10);
    if (isNaN(num) || num <= 0) return;
    const css = `${num}px`;
    this.patch({ 'font-size': css });
    this.activeEditor()?.chain().focus().setFontSize(css).run();
  }

  onLineHeightChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.patch({ 'line-height': value });
    // No direct TipTap command for line-height; style is on the wrapper element.
  }

  onLetterSpacingChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.patch({ 'letter-spacing': value });
    // No direct TipTap command; style is on the wrapper element.
  }

  onColorChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.patch({ 'color': value });
    this.activeEditor()?.chain().focus().setColor(value).run();
  }

  onHighlightChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.patch({ 'background-color': value });
    this.activeEditor()?.chain().focus().toggleHighlight({ color: value }).run();
  }

  onAlignChange(align: TextAlign): void {
    this.patch({ 'text-align': align });
    this.activeEditor()?.chain().focus().setTextAlign(align).run();
  }
}
