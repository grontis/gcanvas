import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { SelectionService } from '../../services/selection.service';
import { CanvasStateService } from '../../services/canvas-state.service';
import { PositionSizeSectionComponent } from './sections/position-size-section.component';
import { PageSectionComponent } from './sections/page-section.component';
import { ImageSectionComponent } from './sections/image-section.component';
import { EffectsSectionComponent } from './sections/effects-section.component';
import { TypographySectionComponent } from './sections/typography-section.component';
import { ImageCanvasElement, TextCanvasElement } from '../../models/canvas-element.model';

@Component({
  selector: 'gc-editor-inspector',
  standalone: true,
  imports: [
    PositionSizeSectionComponent,
    PageSectionComponent,
    ImageSectionComponent,
    EffectsSectionComponent,
    TypographySectionComponent,
  ],
  templateUrl: './inspector.component.html',
  styleUrl: './inspector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InspectorComponent {
  private readonly selection   = inject(SelectionService);
  private readonly canvasState = inject(CanvasStateService);

  readonly selectedId = computed(() => this.selection.selectedId());

  readonly selectedElement = computed(() => {
    const id = this.selectedId();
    if (!id) return null;
    return this.canvasState.elements().find(el => el.id === id) ?? null;
  });

  readonly elementTypeLabel = computed(() => {
    const el = this.selectedElement();
    if (!el) return 'Root';
    return el.type.charAt(0).toUpperCase() + el.type.slice(1);
  });

  readonly panelTitle = computed(() =>
    this.selectedId() ? 'Inspector' : 'Page'
  );

  readonly selectedImageElement = computed(() => {
    const el = this.selectedElement();
    return el?.type === 'image' ? (el as ImageCanvasElement) : null;
  });

  readonly selectedTextElement = computed(() => {
    const el = this.selectedElement();
    return el?.type === 'text' ? (el as TextCanvasElement) : null;
  });
}
