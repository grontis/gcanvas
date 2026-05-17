import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  computed,
} from '@angular/core';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { COMPONENT_PALETTE_TOKEN, PaletteEntry } from '../../tokens/component-palette.token';
import { ToolStateService } from '../../services/tool-state.service';

@Component({
  selector: 'gc-component-palette',
  standalone: true,
  imports: [CdkDrag],
  templateUrl: './component-palette.component.html',
  styleUrl: './component-palette.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentPaletteComponent {
  readonly activeTool = computed(() => this.toolState.activeTool());

  constructor(
    @Inject(COMPONENT_PALETTE_TOKEN) readonly entries: PaletteEntry[],
    private readonly toolState: ToolStateService,
  ) {}

  setTool(entry: PaletteEntry): void {
    this.toolState.setTool(entry.toolId);
  }
}
