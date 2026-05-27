import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { EditorChromeService } from '../../services/editor-chrome.service';
import { CanvasStateService } from '../../services/canvas-state.service';
import { SelectionService } from '../../services/selection.service';

@Component({
  selector: 'gc-editor-chrome-top',
  standalone: true,
  imports: [],
  templateUrl: './chrome-top.component.html',
  styleUrl: './chrome-top.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChromeTopComponent {
  publishClicked = output<void>();
  previewClicked = output<void>();

  enablePreview = input<boolean>(true);
  enablePublish = input<boolean>(true);

  private readonly chrome      = inject(EditorChromeService);
  private readonly canvasState = inject(CanvasStateService);
  private readonly selection   = inject(SelectionService);

  readonly projectName = computed(() => this.chrome.projectName());
  readonly breadcrumbs = computed(() => this.chrome.breadcrumbs());
  readonly saveStatus  = computed(() => this.chrome.saveStatus());
  readonly canUndo     = computed(() => this.canvasState.canUndo());
  readonly canRedo     = computed(() => this.canvasState.canRedo());

  readonly isEditingText = computed(() => this.selection.activeEditor() !== null);

  undo(): void { this.canvasState.undo(); }
  redo(): void { this.canvasState.redo(); }
}
