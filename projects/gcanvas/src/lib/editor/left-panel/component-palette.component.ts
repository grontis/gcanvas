import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  computed,
} from '@angular/core';
import { CdkDrag, CdkDragEnd, CdkDragPreview, CdkDropList } from '@angular/cdk/drag-drop';
import { COMPONENT_PALETTE_TOKEN, PaletteEntry } from '../../tokens/component-palette.token';
import { ToolStateService } from '../../services/tool-state.service';

@Component({
  selector: 'gc-component-palette',
  standalone: true,
  imports: [CdkDrag, CdkDragPreview, CdkDropList],
  templateUrl: './component-palette.component.html',
  styleUrl: './component-palette.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentPaletteComponent {
  readonly activeTool = computed(() => this.toolState.activeTool());

  // Palette is a sortingDisabled CdkDropList so its tiles route to the canvas
  // via CdkDropListGroup (on the editor host). It must not accept incoming
  // drags from other lists (layers panel, etc.).
  readonly rejectAllPredicate = (): boolean => false;

  constructor(
    @Inject(COMPONENT_PALETTE_TOKEN) readonly entries: PaletteEntry[],
    private readonly toolState: ToolStateService,
  ) {}

  setTool(entry: PaletteEntry): void {
    this.toolState.setTool(entry.toolId);
  }

  // Safety net: even with cdkDropList managing the tile, ensure no residual
  // transform remains after a drop that landed outside any accepting list.
  onTileDragEnded(event: CdkDragEnd): void {
    event.source.reset();
  }
}
