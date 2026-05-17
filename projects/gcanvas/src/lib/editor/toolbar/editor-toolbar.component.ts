import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ToolStateService, ToolId } from '../../services/tool-state.service';
import { BreakpointService, Breakpoint } from '../../services/breakpoint.service';
import { CanvasStateService } from '../../services/canvas-state.service';

@Component({
  selector: 'gc-editor-toolbar',
  standalone: true,
  imports: [],
  templateUrl: './editor-toolbar.component.html',
  styleUrl: './editor-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorToolbarComponent {
  private readonly toolState    = inject(ToolStateService);
  private readonly breakpoint   = inject(BreakpointService);
  private readonly canvasState  = inject(CanvasStateService);

  readonly activeTool        = computed(() => this.toolState.activeTool());
  readonly currentBreakpoint = computed(() => this.breakpoint.current());
  readonly viewport          = computed(() => this.canvasState.canvasData().viewport);

  setTool(tool: ToolId): void {
    this.toolState.setTool(tool);
  }

  setBreakpoint(bp: Breakpoint): void {
    this.breakpoint.set(bp);
  }
}
