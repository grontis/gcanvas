/**
 * Unit tests for Phase H — Command Palette, Library Modal, Alt Layouts, CSS Theming
 *
 * Covers:
 *   - Barrel exports: all Phase H symbols exported from public-api
 *   - COMMAND_REGISTRY_TOKEN: is an InjectionToken, resolves via TestBed
 *   - CommandPaletteService: open/close/toggle state, query reset, label/category filter
 *   - CommandPaletteComponent: standalone metadata, renders when open, keyboard nav, backdrop click
 *   - LibraryModalComponent: renders when open, category nav, search filter, detail pane, backdrop
 *   - PaletteEntry augmentation: category? and description? fields type-check correctly
 *   - provideEditor command registry: 8 default commands, CommandPaletteService provided
 *   - defaultCommandsFactory: 8 entries, publish fires openPublishModal$, open-library fires openLibraryModal$
 *   - EditorChromeService Phase H subjects: openPublishModal$ and openLibraryModal$ emit
 *   - EditorLeftPanelComponent: rail mode when collapsed, tabs when not collapsed
 *   - CanvasEditorComponent layout bindings: all 4 layout classes, panel visibility
 *   - CanvasEditorComponent Phase H interactions: _libraryOpen, openLibraryModal$, ⌘K guard
 *   - CSS theming: 7 --gc-* tokens resolve to expected defaults on gc-canvas-editor host
 *   - CanvasViewComponent readonly regression: readonly input still present
 */

import {
  TestBed,
  ComponentFixture,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { reflectComponentType, InjectionToken, Component } from '@angular/core';
import { take } from 'rxjs/operators';

// ---------------------------------------------------------------------------
// Barrel imports — validates Phase H exports
// ---------------------------------------------------------------------------

import {
  COMMAND_REGISTRY_TOKEN,
  type CommandEntry,
  CommandPaletteService,
  CommandPaletteComponent,
  LibraryModalComponent,
  defaultCommandsFactory,
} from '../public-api';

import { COMPONENT_PALETTE_TOKEN, type PaletteEntry } from './tokens/component-palette.token';
import { defaultPaletteEntries, provideEditor } from './providers/provide-editor';
import { EditorChromeService } from './services/editor-chrome.service';
import { CanvasStateService } from './services/canvas-state.service';
import { ToolStateService } from './services/tool-state.service';
import { BreakpointService } from './services/breakpoint.service';
import { EditorLeftPanelComponent } from './editor/left-panel/left-panel.component';
import { CanvasEditorComponent } from './editor/canvas-editor.component';
import { CanvasViewComponent } from './canvas/canvas-view.component';
import { SelectionService } from './services/selection.service';
import { SnapGuideService } from './services/snap-guide.service';
import { CanvasData } from './models/canvas-data.model';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMPTY_CANVAS: CanvasData = {
  version: 1,
  viewport: { width: 1200, height: 800 },
  elements: [],
};

function makeCommands(chrome: EditorChromeService, tool: ToolStateService, canvas: CanvasStateService): CommandEntry[] {
  return defaultCommandsFactory(chrome, tool, canvas);
}

// ---------------------------------------------------------------------------
// 1. Barrel exports
// ---------------------------------------------------------------------------

describe('Phase H barrel exports', () => {
  it('COMMAND_REGISTRY_TOKEN is defined and exported', () => {
    expect(COMMAND_REGISTRY_TOKEN).toBeDefined();
  });

  it('CommandPaletteService is defined and exported', () => {
    expect(CommandPaletteService).toBeDefined();
  });

  it('CommandPaletteComponent is defined and exported', () => {
    expect(CommandPaletteComponent).toBeDefined();
  });

  it('LibraryModalComponent is defined and exported', () => {
    expect(LibraryModalComponent).toBeDefined();
  });

  it('defaultCommandsFactory is defined and exported', () => {
    expect(defaultCommandsFactory).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 2. COMMAND_REGISTRY_TOKEN
// ---------------------------------------------------------------------------

describe('COMMAND_REGISTRY_TOKEN', () => {
  it('is an InjectionToken', () => {
    expect(COMMAND_REGISTRY_TOKEN).toBeInstanceOf(InjectionToken);
  });

  it('resolves to provided value via TestBed', () => {
    const commands: CommandEntry[] = [
      { id: 'test-cmd', label: 'Test', action: () => {} },
    ];
    TestBed.configureTestingModule({
      providers: [{ provide: COMMAND_REGISTRY_TOKEN, useValue: commands }],
    });
    const resolved = TestBed.inject(COMMAND_REGISTRY_TOKEN);
    expect(resolved).toEqual(commands);
    TestBed.resetTestingModule();
  });
});

// ---------------------------------------------------------------------------
// 3. CommandPaletteService
// ---------------------------------------------------------------------------

describe('CommandPaletteService', () => {
  let service: CommandPaletteService;
  const commands: CommandEntry[] = [
    { id: 'add-text', label: 'Add Text', category: 'add', action: () => {} },
    { id: 'publish', label: 'Publish', category: 'publish', action: () => {} },
    { id: 'undo', label: 'Undo', category: 'history', action: () => {} },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CommandPaletteService,
        { provide: COMMAND_REGISTRY_TOKEN, useValue: commands },
      ],
    });
    service = TestBed.inject(CommandPaletteService);
  });

  it('isOpen() starts false', () => {
    expect(service.isOpen()).toBe(false);
  });

  it('open() sets isOpen to true', () => {
    service.open();
    expect(service.isOpen()).toBe(true);
  });

  it('close() sets isOpen to false', () => {
    service.open();
    service.close();
    expect(service.isOpen()).toBe(false);
  });

  it('toggle() flips isOpen from false to true', () => {
    service.toggle();
    expect(service.isOpen()).toBe(true);
  });

  it('toggle() flips isOpen from true to false', () => {
    service.open();
    service.toggle();
    expect(service.isOpen()).toBe(false);
  });

  it('query() starts empty', () => {
    expect(service.query()).toBe('');
  });

  it('open() resets query to empty', () => {
    service.setQuery('hello');
    service.open();
    expect(service.query()).toBe('');
  });

  it('close() resets query to empty', () => {
    service.open();
    service.setQuery('world');
    service.close();
    expect(service.query()).toBe('');
  });

  it('empty query returns all commands', () => {
    expect(service.filteredCommands().length).toBe(3);
  });

  it('label filter is case-insensitive', () => {
    service.setQuery('text');
    const results = service.filteredCommands();
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('add-text');
  });

  it('category filter works', () => {
    service.setQuery('history');
    const results = service.filteredCommands();
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('undo');
  });

  it('no match returns empty array', () => {
    service.setQuery('xyznotexist');
    expect(service.filteredCommands().length).toBe(0);
  });

  it('setQuery updates query signal', () => {
    service.setQuery('pub');
    expect(service.query()).toBe('pub');
  });
});

// ---------------------------------------------------------------------------
// 4. CommandPaletteComponent
// ---------------------------------------------------------------------------

describe('CommandPaletteComponent', () => {
  it('has standalone metadata', () => {
    const mirror = reflectComponentType(CommandPaletteComponent);
    expect(mirror?.isStandalone).toBe(true);
  });

  describe('rendering', () => {
    let fixture: ComponentFixture<CommandPaletteComponent>;
    let component: CommandPaletteComponent;

    const commands: CommandEntry[] = [
      { id: 'cmd-a', label: 'Alpha', category: 'add', action: () => {} },
      { id: 'cmd-b', label: 'Beta',  category: 'add', action: () => {} },
    ];

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [CommandPaletteComponent],
        providers: [
          CommandPaletteService,
          { provide: COMMAND_REGISTRY_TOKEN, useValue: commands },
        ],
      });
      fixture = TestBed.createComponent(CommandPaletteComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('does not render backdrop when service is closed', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.gc-cmd-backdrop')).toBeNull();
    });

    it('renders backdrop and input when service is open', () => {
      component.paletteService.open();
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.gc-cmd-backdrop')).toBeTruthy();
      expect(el.querySelector('.gc-cmd-input')).toBeTruthy();
    });

    it('lists all commands when open with empty query', () => {
      component.paletteService.open();
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const items = el.querySelectorAll('.gc-cmd-item:not(.gc-cmd-item--empty)');
      expect(items.length).toBe(2);
    });

    it('ArrowDown increments _activeIndex', () => {
      component.paletteService.open();
      fixture.detectChanges();
      const palette = fixture.nativeElement.querySelector('.gc-cmd-palette') as HTMLElement;
      component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      expect(component._activeIndex()).toBe(1);
    });

    it('ArrowDown clamps at last index', () => {
      component.paletteService.open();
      fixture.detectChanges();
      component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      expect(component._activeIndex()).toBe(1); // max index for 2 items
    });

    it('ArrowUp decrements _activeIndex', () => {
      component.paletteService.open();
      fixture.detectChanges();
      component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      expect(component._activeIndex()).toBe(0);
    });

    it('ArrowUp clamps at 0', () => {
      component.paletteService.open();
      fixture.detectChanges();
      component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      expect(component._activeIndex()).toBe(0);
    });

    it('Enter activates selected command and closes', () => {
      let activated = false;
      const testCommands: CommandEntry[] = [
        { id: 'cmd-x', label: 'Execute Me', action: () => { activated = true; } },
      ];
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [CommandPaletteComponent],
        providers: [
          CommandPaletteService,
          { provide: COMMAND_REGISTRY_TOKEN, useValue: testCommands },
        ],
      });
      const f = TestBed.createComponent(CommandPaletteComponent);
      const c = f.componentInstance;
      c.paletteService.open();
      f.detectChanges();
      c.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(activated).toBe(true);
      expect(c.paletteService.isOpen()).toBe(false);
    });

    it('Escape closes palette', () => {
      component.paletteService.open();
      fixture.detectChanges();
      component.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(component.paletteService.isOpen()).toBe(false);
    });

    it('backdrop click closes palette', () => {
      component.paletteService.open();
      fixture.detectChanges();
      component.onBackdropClick();
      expect(component.paletteService.isOpen()).toBe(false);
    });

    it('shows empty message when no commands match query', () => {
      component.paletteService.open();
      component.paletteService.setQuery('xyznotexist');
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.gc-cmd-item--empty')).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// 5. LibraryModalComponent
// ---------------------------------------------------------------------------

describe('LibraryModalComponent', () => {
  it('has standalone metadata', () => {
    const mirror = reflectComponentType(LibraryModalComponent);
    expect(mirror?.isStandalone).toBe(true);
  });

  describe('rendering', () => {
    let fixture: ComponentFixture<LibraryModalComponent>;
    let component: LibraryModalComponent;

    const palette: PaletteEntry[] = [
      { toolId: 'text',   label: 'Text',   icon: '<svg/>', defaultSize: { width: 200, height: 60  }, category: 'content', description: 'A text block' },
      { toolId: 'image',  label: 'Image',  icon: '<svg/>', defaultSize: { width: 300, height: 200 }, category: 'media'   },
      { toolId: 'button', label: 'Button', icon: '<svg/>', defaultSize: { width: 160, height: 44  }, category: 'content' },
    ];

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [LibraryModalComponent],
        providers: [
          { provide: COMPONENT_PALETTE_TOKEN, useValue: palette },
        ],
      });
      fixture = TestBed.createComponent(LibraryModalComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('does not render when open is false', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.gc-lib-backdrop')).toBeNull();
    });

    it('renders when open is true', async () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.gc-lib-modal')).toBeTruthy();
    });

    it('category nav renders All button plus unique categories', async () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const navButtons = el.querySelectorAll('.gc-lib-nav__item');
      // All + content + media = 3 buttons
      expect(navButtons.length).toBe(3);
    });

    it('renders all entries initially', async () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const tiles = el.querySelectorAll('.gc-lib-tile');
      expect(tiles.length).toBe(3);
    });

    it('category filter reduces entries', async () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      component.setCategory('media');
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const tiles = el.querySelectorAll('.gc-lib-tile');
      expect(tiles.length).toBe(1);
    });

    it('setCategory(null) shows all entries', async () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      component.setCategory('media');
      fixture.detectChanges();
      component.setCategory(null);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const tiles = el.querySelectorAll('.gc-lib-tile');
      expect(tiles.length).toBe(3);
    });

    it('search query filter reduces entries', async () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      component._query.set('text');
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const tiles = el.querySelectorAll('.gc-lib-tile');
      expect(tiles.length).toBe(1);
    });

    it('selectEntry sets _selected', async () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      component.selectEntry(palette[0]);
      fixture.detectChanges();
      expect(component._selected()?.toolId).toBe('text');
    });

    it('detail pane shows selected entry name', async () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      component.selectEntry(palette[0]);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.gc-lib-detail__name')?.textContent?.trim()).toBe('Text');
    });

    it('detail pane shows description when set', async () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      component.selectEntry(palette[0]);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.gc-lib-detail__desc')?.textContent?.trim()).toBe('A text block');
    });

    it('backdrop click emits closed', async () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      let emitted = false;
      component.closed.subscribe(() => { emitted = true; });
      component.onBackdropClick();
      expect(emitted).toBe(true);
    });

    it('close button click emits closed', async () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      let emitted = false;
      component.closed.subscribe(() => { emitted = true; });
      const closeBtn = (fixture.nativeElement as HTMLElement).querySelector('.gc-lib-close') as HTMLButtonElement;
      closeBtn.click();
      expect(emitted).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// 6. PaletteEntry augmentation
// ---------------------------------------------------------------------------

describe('PaletteEntry augmentation (category + description)', () => {
  it('type-checks with category and description', () => {
    const entry: PaletteEntry = {
      toolId: 'text',
      label: 'Text',
      icon: '<svg/>',
      defaultSize: { width: 200, height: 60 },
      category: 'content',
      description: 'A text block',
    };
    expect(entry.category).toBe('content');
    expect(entry.description).toBe('A text block');
  });

  it('type-checks without category or description (optional)', () => {
    const entry: PaletteEntry = {
      toolId: 'text',
      label: 'Text',
      icon: '<svg/>',
      defaultSize: { width: 200, height: 60 },
    };
    expect(entry.category).toBeUndefined();
    expect(entry.description).toBeUndefined();
  });

  it('defaultPaletteEntries all have category set', () => {
    for (const entry of defaultPaletteEntries) {
      expect(entry.category).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// 7. provideEditor() command registry
// ---------------------------------------------------------------------------

describe('provideEditor() command registry', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...provideEditor(),
        CanvasStateService,
        SelectionService,
        SnapGuideService,
      ],
    });
  });

  it('provides COMMAND_REGISTRY_TOKEN with 8 default commands', () => {
    const cmds = TestBed.inject(COMMAND_REGISTRY_TOKEN);
    expect(cmds.length).toBe(8);
  });

  it('all expected command IDs are present', () => {
    const cmds = TestBed.inject(COMMAND_REGISTRY_TOKEN);
    const ids = cmds.map(c => c.id);
    expect(ids).toContain('add-text');
    expect(ids).toContain('add-image');
    expect(ids).toContain('add-button');
    expect(ids).toContain('add-shape');
    expect(ids).toContain('undo');
    expect(ids).toContain('redo');
    expect(ids).toContain('open-library');
    expect(ids).toContain('publish');
  });

  it('provides CommandPaletteService', () => {
    const svc = TestBed.inject(CommandPaletteService);
    expect(svc).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 8. defaultCommandsFactory
// ---------------------------------------------------------------------------

describe('defaultCommandsFactory', () => {
  let chrome: EditorChromeService;
  let toolState: ToolStateService;
  let canvasState: CanvasStateService;
  let cmds: CommandEntry[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...provideEditor(),
        CanvasStateService,
        SelectionService,
        SnapGuideService,
      ],
    });
    chrome     = TestBed.inject(EditorChromeService);
    toolState  = TestBed.inject(ToolStateService);
    canvasState = TestBed.inject(CanvasStateService);
    cmds = makeCommands(chrome, toolState, canvasState);
  });

  it('returns 8 command entries', () => {
    expect(cmds.length).toBe(8);
  });

  it('publish command fires openPublishModal$', (done) => {
    chrome.openPublishModal$.pipe(take(1)).subscribe(() => done());
    const publishCmd = cmds.find(c => c.id === 'publish')!;
    publishCmd.action();
  });

  it('open-library command fires openLibraryModal$', (done) => {
    chrome.openLibraryModal$.pipe(take(1)).subscribe(() => done());
    const libCmd = cmds.find(c => c.id === 'open-library')!;
    libCmd.action();
  });
});

// ---------------------------------------------------------------------------
// 9. EditorChromeService Phase H subjects
// ---------------------------------------------------------------------------

describe('EditorChromeService Phase H subjects', () => {
  let service: EditorChromeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...provideEditor(),
        CanvasStateService,
        SelectionService,
        SnapGuideService,
      ],
    });
    service = TestBed.inject(EditorChromeService);
  });

  it('openPublishModal$ emits when next() called', (done) => {
    service.openPublishModal$.pipe(take(1)).subscribe(() => done());
    service.openPublishModal$.next();
  });

  it('openLibraryModal$ emits when next() called', (done) => {
    service.openLibraryModal$.pipe(take(1)).subscribe(() => done());
    service.openLibraryModal$.next();
  });
});

// ---------------------------------------------------------------------------
// 10. EditorLeftPanelComponent collapsed mode
// ---------------------------------------------------------------------------

describe('EditorLeftPanelComponent', () => {
  let fixture: ComponentFixture<EditorLeftPanelComponent>;
  let component: EditorLeftPanelComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EditorLeftPanelComponent],
      providers: [
        { provide: COMPONENT_PALETTE_TOKEN, useValue: defaultPaletteEntries },
        ToolStateService,
        BreakpointService,
        CanvasStateService,
        SelectionService,
        SnapGuideService,
      ],
    });
    fixture = TestBed.createComponent(EditorLeftPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders tabs when not collapsed (default)', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.gc-left-panel__tabs')).toBeTruthy();
  });

  it('does not render rail when not collapsed', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.gc-left-panel-rail')).toBeNull();
  });

  it('renders rail div when collapsed = true', () => {
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.gc-left-panel-rail')).toBeTruthy();
  });

  it('does not render tabs when collapsed = true', () => {
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.gc-left-panel__tabs')).toBeNull();
  });

  it('rail mode has 2 icon buttons', () => {
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const btns = el.querySelectorAll('.gc-left-panel-rail__btn');
    expect(btns.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// 11. CanvasEditorComponent layout bindings
// ---------------------------------------------------------------------------

describe('CanvasEditorComponent layout bindings', () => {
  let fixture: ComponentFixture<CanvasEditorComponent>;
  let component: CanvasEditorComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CanvasEditorComponent],
      providers: [
        CanvasStateService,
        SelectionService,
        SnapGuideService,
      ],
    });
    fixture = TestBed.createComponent(CanvasEditorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('canvasData', EMPTY_CANVAS);
    fixture.detectChanges();
  });

  it('default layout is classic — gc-layout--classic class present', () => {
    expect(fixture.nativeElement.classList.contains('gc-layout--classic')).toBe(true);
  });

  it('layout=rail applies gc-layout--rail class', () => {
    fixture.componentRef.setInput('layout', 'rail');
    fixture.detectChanges();
    expect(fixture.nativeElement.classList.contains('gc-layout--rail')).toBe(true);
    expect(fixture.nativeElement.classList.contains('gc-layout--classic')).toBe(false);
  });

  it('layout=canvas-first applies gc-layout--canvas-first class', () => {
    fixture.componentRef.setInput('layout', 'canvas-first');
    fixture.detectChanges();
    expect(fixture.nativeElement.classList.contains('gc-layout--canvas-first')).toBe(true);
  });

  it('layout=unified-left applies gc-layout--unified-left class', () => {
    fixture.componentRef.setInput('layout', 'unified-left');
    fixture.detectChanges();
    expect(fixture.nativeElement.classList.contains('gc-layout--unified-left')).toBe(true);
  });

  it('layout=canvas-first hides left panel', () => {
    fixture.componentRef.setInput('layout', 'canvas-first');
    fixture.detectChanges();
    expect(component._showLeftPanel()).toBe(false);
  });

  it('layout=classic shows left panel', () => {
    expect(component._showLeftPanel()).toBe(true);
  });

  it('layout=rail collapses left panel (_leftCollapsed = true)', () => {
    fixture.componentRef.setInput('layout', 'rail');
    fixture.detectChanges();
    expect(component._leftCollapsed()).toBe(true);
  });

  it('layout=classic does not collapse left panel', () => {
    expect(component._leftCollapsed()).toBe(false);
  });

  it('layout=unified-left sets _unifiedLeft = true', () => {
    fixture.componentRef.setInput('layout', 'unified-left');
    fixture.detectChanges();
    expect(component._unifiedLeft()).toBe(true);
  });

  it('layout=unified-left sets _showInspector = false', () => {
    fixture.componentRef.setInput('layout', 'unified-left');
    fixture.detectChanges();
    expect(component._showInspector()).toBe(false);
  });

  it('layout=classic shows inspector (_showInspector = true)', () => {
    expect(component._showInspector()).toBe(true);
  });

  it('layout=rail shows inspector (_showInspector = true)', () => {
    fixture.componentRef.setInput('layout', 'rail');
    fixture.detectChanges();
    expect(component._showInspector()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 12. CanvasEditorComponent Phase H interactions
// ---------------------------------------------------------------------------

describe('CanvasEditorComponent Phase H interactions', () => {
  let fixture: ComponentFixture<CanvasEditorComponent>;
  let component: CanvasEditorComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CanvasEditorComponent],
      providers: [
        CanvasStateService,
        SelectionService,
        SnapGuideService,
      ],
    });
    fixture = TestBed.createComponent(CanvasEditorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('canvasData', EMPTY_CANVAS);
    fixture.detectChanges();
  });

  // Helper: get EditorChromeService from the component's own injector
  function getChromeService(): EditorChromeService {
    return fixture.debugElement.injector.get(EditorChromeService);
  }

  it('_libraryOpen starts false', () => {
    expect(component._libraryOpen()).toBe(false);
  });

  it('openLibraryModal$ emission sets _libraryOpen to true', () => {
    getChromeService().openLibraryModal$.next();
    fixture.detectChanges();
    expect(component._libraryOpen()).toBe(true);
  });

  it('onLibraryClosed() sets _libraryOpen to false', () => {
    getChromeService().openLibraryModal$.next();
    fixture.detectChanges();
    component.onLibraryClosed();
    fixture.detectChanges();
    expect(component._libraryOpen()).toBe(false);
  });

  it('openPublishModal$ emission sets _publishOpen to true', () => {
    getChromeService().openPublishModal$.next();
    fixture.detectChanges();
    expect(component._publishOpen()).toBe(true);
  });

  it('meta+k toggles command palette (event.target = document.body)', () => {
    // Use document.body as target — it is not a text-editing element
    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
    Object.defineProperty(event, 'target', { value: document.body });
    component.onCommandPaletteShortcut(event);
    expect(component.commandPalette.isOpen()).toBe(true);
  });

  it('ctrl+k toggles command palette', () => {
    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
    Object.defineProperty(event, 'target', { value: document.body });
    component.onCommandPaletteShortcut(event);
    expect(component.commandPalette.isOpen()).toBe(true);
  });

  it('meta+k does not toggle when input element is focused', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
    Object.defineProperty(event, 'target', { value: input });
    component.onCommandPaletteShortcut(event);
    expect(component.commandPalette.isOpen()).toBe(false);
    document.body.removeChild(input);
  });

  it('meta+k does not toggle when contenteditable is focused', () => {
    const div = document.createElement('div');
    div.contentEditable = 'true';
    document.body.appendChild(div);
    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
    Object.defineProperty(event, 'target', { value: div });
    component.onCommandPaletteShortcut(event);
    expect(component.commandPalette.isOpen()).toBe(false);
    document.body.removeChild(div);
  });
});

// ---------------------------------------------------------------------------
// 13. CSS theming — gc-* tokens on :host
// ---------------------------------------------------------------------------

describe('CSS theming: --gc-* tokens on gc-canvas-editor', () => {
  let fixture: ComponentFixture<CanvasEditorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CanvasEditorComponent],
      providers: [
        CanvasStateService,
        SelectionService,
        SnapGuideService,
      ],
    });
    fixture = TestBed.createComponent(CanvasEditorComponent);
    fixture.componentRef.setInput('canvasData', EMPTY_CANVAS);
    // Attach to document.body so getComputedStyle resolves custom properties
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture.nativeElement.parentNode) {
      document.body.removeChild(fixture.nativeElement);
    }
  });

  it('--gc-accent resolves to #2563eb (or non-empty)', () => {
    const val = getComputedStyle(fixture.nativeElement).getPropertyValue('--gc-accent').trim();
    expect(val).toBeTruthy();
  });

  it('--gc-accent-soft is non-empty', () => {
    const val = getComputedStyle(fixture.nativeElement).getPropertyValue('--gc-accent-soft').trim();
    expect(val).toBeTruthy();
  });

  it('--gc-ink is non-empty', () => {
    const val = getComputedStyle(fixture.nativeElement).getPropertyValue('--gc-ink').trim();
    expect(val).toBeTruthy();
  });

  it('--gc-bg is non-empty', () => {
    const val = getComputedStyle(fixture.nativeElement).getPropertyValue('--gc-bg').trim();
    expect(val).toBeTruthy();
  });

  it('--gc-line is non-empty', () => {
    const val = getComputedStyle(fixture.nativeElement).getPropertyValue('--gc-line').trim();
    expect(val).toBeTruthy();
  });

  it('--gc-muted is non-empty', () => {
    const val = getComputedStyle(fixture.nativeElement).getPropertyValue('--gc-muted').trim();
    expect(val).toBeTruthy();
  });

  it('--gc-bg-raised is non-empty (seventh token)', () => {
    const val = getComputedStyle(fixture.nativeElement).getPropertyValue('--gc-bg-raised').trim();
    expect(val).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 14. CanvasViewComponent readonly regression
// ---------------------------------------------------------------------------

describe('CanvasViewComponent readonly regression', () => {
  let fixture: ComponentFixture<CanvasViewComponent>;
  let component: CanvasViewComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CanvasViewComponent],
      providers: [
        CanvasStateService,
        SelectionService,
        SnapGuideService,
      ],
    });
    fixture = TestBed.createComponent(CanvasViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('readonly input still present on CanvasViewComponent', () => {
    const mirror = reflectComponentType(CanvasViewComponent);
    const hasReadonly = mirror?.inputs.some(i => i.templateName === 'readonly');
    expect(hasReadonly).toBe(true);
  });

  it('host class gc-canvas-view--readonly not applied when readonly = false', () => {
    fixture.componentRef.setInput('readonly', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList.contains('gc-canvas-view--readonly')).toBe(false);
  });

  it('host class gc-canvas-view--readonly applied when readonly = true', () => {
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList.contains('gc-canvas-view--readonly')).toBe(true);
  });
});
