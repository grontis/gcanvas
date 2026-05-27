import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { provideCanvas } from '../providers/provide-canvas';
import { provideEditor } from '../providers/provide-editor';
import { CanvasStateService } from '../services/canvas-state.service';
import { EditorChromeService, SaveStatus } from '../services/editor-chrome.service';
import { ToolStateService } from '../services/tool-state.service';
import { CommandPaletteService } from '../services/command-palette.service';
import { CanvasViewComponent } from '../canvas/canvas-view.component';
import { ChromeTopComponent } from './chrome/chrome-top.component';
import { InspectorComponent } from './inspector/inspector.component';
import { EditorToolbarComponent } from './toolbar/editor-toolbar.component';
import { EditorLeftPanelComponent } from './left-panel/left-panel.component';
import { CommandPaletteComponent } from './command-palette/command-palette.component';
import { LibraryModalComponent } from './library-modal/library-modal.component';
import { COMPONENT_PALETTE_TOKEN, PaletteEntry } from '../tokens/component-palette.token';
import { CanvasData, CanvasChangeEvent } from '../models/canvas-data.model';
import { CanvasElement } from '../models/canvas-element.model';
import { PublishPayload } from '../models/publish-payload.model';
import { PublishModalComponent } from '../publish/publish-modal.component';
import { TemplatePickerComponent } from '../templates/template-picker.component';
import { CanvasSerializer } from '../serialize/canvas-serializer.service';

@Component({
  selector: 'gc-canvas-editor',
  standalone: true,
  imports: [
    CanvasViewComponent,
    ChromeTopComponent,
    InspectorComponent,
    EditorToolbarComponent,
    EditorLeftPanelComponent,
    CdkDropList,
    CdkDrag,
    PublishModalComponent,
    TemplatePickerComponent,
    CommandPaletteComponent,
    LibraryModalComponent,
  ],
  templateUrl: './canvas-editor.component.html',
  styleUrl: './canvas-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [...provideCanvas(), ...provideEditor()],
  // CdkDropListGroup auto-connects every CdkDropList inside the editor (palette,
  // layers panel, canvas drop zone) so a drag from one routes to another. Each
  // list's `cdkDropListEnterPredicate` controls what it accepts.
  hostDirectives: [CdkDropListGroup],
  host: {
    '[class.gc-layout--classic]':      "layout() === 'classic'",
    '[class.gc-layout--rail]':         "layout() === 'rail'",
    '[class.gc-layout--canvas-first]': "layout() === 'canvas-first'",
    '[class.gc-layout--unified-left]': "layout() === 'unified-left'",
  },
})
export class CanvasEditorComponent {
  // --- Public API (same shape as CanvasComponent for parity) ---
  canvasData   = input.required<CanvasData>();
  canvasChange = output<CanvasChangeEvent>();

  // --- Chrome metadata inputs ---
  projectName  = input<string>('Untitled');
  breadcrumbs  = input<string[]>([]);
  saveStatus   = input<SaveStatus>('saved');

  // --- Phase G inputs ---
  publishUrl           = input<string>('');
  enableTemplatePicker = input<boolean>(false);

  // --- Chrome action toggles ---
  enablePreview = input<boolean>(true);
  enablePublish = input<boolean>(true);

  // --- Phase H inputs ---
  /**
   * Controls the editor chrome layout.
   *
   * - `'classic'`      Three columns: left panel (248px) | canvas | inspector (296px).
   * - `'rail'`         Three columns: icon rail (48px) | canvas | inspector. Left panel collapsed to icon-only.
   * - `'canvas-first'` Full-width canvas only; left panel and inspector hidden.
   * - `'unified-left'` Two columns: combined left+inspector panel (320px) | canvas. Inspector projected into left panel.
   *
   * Planned but not yet implemented: `'inspector-only'` (canvas + inspector, no left panel),
   * `'no-chrome'` (canvas only, including chrome rows removed — requires row-level grid changes).
   */
  layout = input<'classic' | 'rail' | 'canvas-first' | 'unified-left'>('classic');

  // --- Phase G/Review: readonly passthrough ---
  readonly = input<boolean>(false);

  // --- Action outputs ---
  publish = output<PublishPayload>();
  preview = output<'mobile' | 'tablet' | 'desktop' | 'all'>();

  // --- ViewChild ---
  @ViewChild('canvasWrap') canvasWrapRef!: ElementRef<HTMLElement>;

  // --- Injected services ---
  private readonly canvasState       = inject(CanvasStateService);
  private readonly chromeService     = inject(EditorChromeService);
  private readonly toolState         = inject(ToolStateService);
  private readonly destroyRef        = inject(DestroyRef);
  private readonly palette           = inject(COMPONENT_PALETTE_TOKEN);
  private readonly canvasSerializer  = inject(CanvasSerializer);
  readonly commandPalette            = inject(CommandPaletteService);

  // --- Internal state ---
  readonly _publishOpen = signal(false);
  readonly _libraryOpen = signal(false);

  // --- Phase H layout computed signals ---
  readonly _showLeftPanel  = computed(() => this.layout() !== 'canvas-first');
  readonly _showInspector  = computed(() => this.layout() === 'classic' || this.layout() === 'rail');
  readonly _leftCollapsed  = computed(() => this.layout() === 'rail');
  readonly _unifiedLeft    = computed(() => this.layout() === 'unified-left');

  // --- Computed ---
  readonly elements = computed(() => this.canvasState.elements());

  // --- CDK drop predicate ---
  readonly paletteDropPredicate = (item: CdkDrag<PaletteEntry>): boolean => {
    return item.data?.toolId !== undefined;
  };

  constructor() {
    // Sync canvasData input → service (same pattern as CanvasComponent)
    effect(() => {
      this.canvasState.loadSnapshot(this.canvasData());
    });

    // Sync chrome metadata inputs → EditorChromeService signals via effect().
    effect(() => {
      this.chromeService.setProjectName(this.projectName());
    });

    effect(() => {
      this.chromeService.setBreadcrumbs(this.breadcrumbs());
    });

    effect(() => {
      this.chromeService.setSaveStatus(this.saveStatus());
    });

    effect(() => {
      this.chromeService.setPublishEnabled(this.enablePublish());
    });

    // Wire change stream to output
    this.canvasState.changes$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => this.canvasChange.emit(event));

    // Phase H: Subscribe to EditorChromeService subjects for Publish and Library commands
    this.chromeService.openPublishModal$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.openPublishModal());

    this.chromeService.openLibraryModal$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this._libraryOpen.set(true));
  }

  // --- Keyboard shortcut guard ---
  private _isEditingText(event: KeyboardEvent): boolean {
    const el = event.target as HTMLElement | null;
    if (!el) return false;
    return (
      el.tagName === 'INPUT' ||
      el.tagName === 'TEXTAREA' ||
      el.isContentEditable
    );
  }

  @HostListener('keydown.t', ['$event'])
  onToolText(event: KeyboardEvent): void {
    if (this._isEditingText(event)) return;
    this.toolState.setTool('text');
  }

  @HostListener('keydown.i', ['$event'])
  onToolImage(event: KeyboardEvent): void {
    if (this._isEditingText(event)) return;
    this.toolState.setTool('image');
  }

  @HostListener('keydown.b', ['$event'])
  onToolButton(event: KeyboardEvent): void {
    if (this._isEditingText(event)) return;
    this.toolState.setTool('button');
  }

  @HostListener('keydown.s', ['$event'])
  onToolShape(event: KeyboardEvent): void {
    if (this._isEditingText(event)) return;
    this.toolState.setTool('shape');
  }

  // --- Phase H: ⌘K / Ctrl+K command palette shortcut ---
  @HostListener('document:keydown.meta.k', ['$event'])
  @HostListener('document:keydown.control.k', ['$event'])
  onCommandPaletteShortcut(event: KeyboardEvent): void {
    if (this._isEditingText(event)) return;
    event.preventDefault();
    this.commandPalette.toggle();
  }

  // --- Palette drop handler ---
  onPaletteDrop(event: CdkDragDrop<PaletteEntry[]>): void {
    const entry: PaletteEntry = event.item.data;
    if (!entry?.toolId) return;

    const wrapEl = this.canvasWrapRef.nativeElement;
    const wrapRect = wrapEl.getBoundingClientRect();
    const viewport = this.canvasState.canvasData().viewport;

    const dropPoint = (event as any).dropPoint as { x: number; y: number } | undefined;
    const clientX = dropPoint?.x ?? (event.event as PointerEvent).clientX;
    const clientY = dropPoint?.y ?? (event.event as PointerEvent).clientY;

    const canvasEl = wrapEl.querySelector('.gc-canvas') as HTMLElement | null;
    let canvasX: number;
    let canvasY: number;

    if (canvasEl) {
      const canvasRect = canvasEl.getBoundingClientRect();
      canvasX = clientX - canvasRect.left;
      canvasY = clientY - canvasRect.top;
    } else {
      // Fallback: subtract wrap padding only
      canvasX = clientX - wrapRect.left - 32;
      canvasY = clientY - wrapRect.top - 32;
    }

    // Center the element on the drop point
    const { width, height } = entry.defaultSize;
    const x = Math.max(0, Math.min(viewport.width  - width,  canvasX - width  / 2));
    const y = Math.max(0, Math.min(viewport.height - height, canvasY - height / 2));

    const element = this._makeElement(entry.toolId, { x, y }, entry.defaultSize);
    this.canvasState.addElement(element);
    this.toolState.resetToSelect();
  }

  // --- Click-to-add handler ---
  onCanvasWrapClick(event: MouseEvent): void {
    const tool = this.toolState.activeTool();
    if (tool === 'select') return;

    const entry = this.palette.find(e => e.toolId === tool);
    const defaultSize = entry?.defaultSize ?? { width: 200, height: 80 };
    const viewport = this.canvasState.canvasData().viewport;

    // Place at center of the artboard
    const x = Math.round((viewport.width  - defaultSize.width)  / 2);
    const y = Math.round((viewport.height - defaultSize.height) / 2);

    const element = this._makeElement(tool, { x, y }, defaultSize);
    this.canvasState.addElement(element);
    this.toolState.resetToSelect();
  }

  // --- Phase G methods ---
  openPublishModal(): void {
    if (!this.enablePublish()) return;
    this._publishOpen.set(true);
  }

  onPublishConfirmed(): void {
    this._publishOpen.set(false);
    const payload = this.canvasSerializer.serialize(this.canvasState.canvasData());
    this.publish.emit(payload);
  }

  onPublishClosed(): void {
    this._publishOpen.set(false);
  }

  onPreviewClicked(): void {
    this.preview.emit('all');
  }

  onTemplateSelected(data: CanvasData): void {
    this.canvasState.loadSnapshot(data);
  }

  // --- Phase H methods ---
  onLibraryClosed(): void {
    this._libraryOpen.set(false);
  }

  // --- Element factory ---
  private _makeElement(
    toolId: string,
    position: { x: number; y: number },
    size: { width: number; height: number },
  ): CanvasElement {
    const id = `${toolId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const zIndex = this.canvasState.elements().length + 1;

    if (toolId === 'text') {
      return {
        id, type: 'text', position, size, zIndex,
        content: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Text' }] }],
        },
      };
    }
    if (toolId === 'image') {
      return { id, type: 'image', position, size, zIndex, src: '', alt: '' };
    }
    // button and shape are GenericCanvasElement
    return { id, type: toolId, position, size, zIndex };
  }
}
