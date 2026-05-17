import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  Optional,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { CanvasData } from '../models/canvas-data.model';
import { CanvasStateService } from '../services/canvas-state.service';
import { TEMPLATE_REGISTRY_TOKEN, TemplateEntry } from '../tokens/template-registry.token';

@Component({
  selector: 'gc-template-picker',
  standalone: true,
  imports: [],
  templateUrl: './template-picker.component.html',
  styleUrl: './template-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatePickerComponent {
  enableTemplatePicker = input<boolean>(false);

  templateSelected = output<CanvasData>();

  private readonly canvasState = inject(CanvasStateService);

  constructor(
    @Inject(TEMPLATE_REGISTRY_TOKEN) @Optional()
    private readonly templates: TemplateEntry[] | null,
  ) {
    if (!this.templates) {
      this.templates = [];
    }
  }

  readonly templateList = computed(() => this.templates ?? []);

  selectTemplate(entry: TemplateEntry): void {
    this.templateSelected.emit(entry.data);
  }

  selectBlank(): void {
    this.templateSelected.emit({ ...this.canvasState.canvasData(), elements: [] });
  }
}
