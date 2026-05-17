import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CanvasStateService } from '../../../services/canvas-state.service';

@Component({
  selector: 'gc-page-section',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './page-section.component.html',
  styleUrl: './page-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageSectionComponent {
  private readonly canvasState = inject(CanvasStateService);

  readonly viewport = computed(() => this.canvasState.canvasData().viewport);
  readonly meta     = computed(() => this.canvasState.canvasData().meta ?? {});

  // Canvas section
  readonly bgColor  = computed(() => this.viewport().backgroundColor ?? '#ffffff');
  readonly maxWidth = computed(() => this.viewport().maxWidth ?? null);

  // Padding: normalize to { x, y } for display
  readonly paddingX = computed(() => {
    const p = this.viewport().padding;
    if (p == null) return null;
    return typeof p === 'number' ? p : p.x;
  });
  readonly paddingY = computed(() => {
    const p = this.viewport().padding;
    if (p == null) return null;
    return typeof p === 'number' ? p : p.y;
  });

  // Page name / slug
  readonly pageName = computed(() => this.meta().name ?? '');
  readonly pageSlug = computed(() => this.meta().slug ?? '');
  readonly seoTitle = computed(() => this.meta().seoTitle ?? '');
  readonly seoDesc  = computed(() => this.meta().seoDescription ?? '');

  onBgColorChange(value: string): void {
    this.canvasState.updateViewport({ backgroundColor: value });
  }

  onMaxWidthChange(value: number | null): void {
    this.canvasState.updateViewport({ maxWidth: value ?? undefined });
  }

  onPaddingXChange(value: number): void {
    if (isNaN(value)) return;
    const current = this.viewport().padding;
    const y = typeof current === 'number' ? current : (current?.y ?? 0);
    this.canvasState.updateViewport({ padding: { x: value, y } });
  }

  onPaddingYChange(value: number): void {
    if (isNaN(value)) return;
    const current = this.viewport().padding;
    const x = typeof current === 'number' ? current : (current?.x ?? 0);
    this.canvasState.updateViewport({ padding: { x, y: value } });
  }

  onNameChange(value: string): void {
    this.canvasState.updateMeta({ name: value });
  }

  onSlugChange(value: string): void {
    this.canvasState.updateMeta({ slug: value });
  }

  onSeoTitleChange(value: string): void {
    this.canvasState.updateMeta({ seoTitle: value });
  }

  onSeoDescChange(value: string): void {
    this.canvasState.updateMeta({ seoDescription: value });
  }
}
