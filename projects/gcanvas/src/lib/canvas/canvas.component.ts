import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CanvasData, CanvasChangeEvent } from '../models/canvas-data.model';
import { CanvasStateService } from '../services/canvas-state.service';
import { SelectionService } from '../services/selection.service';
import { ElementWrapperComponent } from '../elements/element-wrapper/element-wrapper.component';
import { FloatingToolbarComponent } from '../toolbar/floating-toolbar.component';
import { ELEMENT_REGISTRY_TOKEN } from '../tokens/element-registry.token';
import { TextElementComponent } from '../elements/text-element/text-element.component';
import { ImageElementComponent } from '../elements/image-element/image-element.component';

@Component({
  selector: 'gc-canvas',
  standalone: true,
  imports: [ElementWrapperComponent, FloatingToolbarComponent],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    CanvasStateService,
    SelectionService,
    {
      // Provide built-in element registry as a single flat array (no multi: true).
      // Plugin authors who need to extend must replace this provider entirely,
      // or add entries via a wrapper component that re-provides the token.
      provide: ELEMENT_REGISTRY_TOKEN,
      useValue: [
        { type: 'text', component: TextElementComponent },
        { type: 'image', component: ImageElementComponent },
      ],
    },
  ],
  host: { tabindex: '0' },
})
export class CanvasComponent {
  canvasData = input.required<CanvasData>();
  canvasChange = output<CanvasChangeEvent>();

  protected readonly canvasState = inject(CanvasStateService);
  private readonly selection = inject(SelectionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly elements = computed(() => this.canvasState.elements());
  readonly viewport = computed(() => this.canvasState.canvasData().viewport);

  constructor() {
    // effect() MUST be in the constructor (injection context required)
    // Syncs external canvasData input signal to the service on every change
    effect(() => {
      this.canvasState.loadSnapshot(this.canvasData());
    });

    // Wire change stream to output — uses takeUntilDestroyed for cleanup
    this.canvasState.changes$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => this.canvasChange.emit(event));
  }

  // --- Keyboard handlers ---

  @HostListener('keydown.escape')
  onEscape(): void {
    this.selection.deselect();
  }

  @HostListener('keydown.delete')
  @HostListener('keydown.backspace')
  onDelete(): void {
    // Guard: if a text editor is active, suppress delete to avoid removing
    // the element while the user is typing (backspace-in-text-edit-mode bug)
    if (this.selection.activeEditor() !== null) return;

    const id = this.selection.selectedId();
    if (id) {
      this.selection.deselect();
      this.canvasState.removeElement(id);
    }
  }

  @HostListener('keydown.control.z')
  onUndo(): void {
    this.canvasState.undo();
  }

  @HostListener('keydown.control.shift.z')
  @HostListener('keydown.control.y')
  onRedo(): void {
    this.canvasState.redo();
  }
}
