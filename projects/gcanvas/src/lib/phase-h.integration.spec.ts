/**
 * Integration tests for Phase H — Command Palette, Library Modal, Alt Layouts, CSS Theming
 *
 * These tests verify end-to-end acceptance criteria at the component level,
 * covering cross-component flows that unit tests cannot fully exercise.
 *
 * Coverage:
 *   - Command palette keyboard flow (meta+K, ctrl+K, close, DOM render)
 *   - _isEditingText() guard: blocked when contenteditable/input focused
 *   - 8 default command IDs in filteredCommands() signal
 *   - Publish command end-to-end: openPublishModal$.next() → _publishOpen → DOM
 *   - Open Library command end-to-end: openLibraryModal$.next() → _libraryOpen → DOM → reset
 *   - Library modal DOM: tiles for 4 default entries, category nav, labels
 *   - Layout 'rail': class, left panel, rail div, no tab buttons, _leftCollapsed()
 *   - Layout 'unified-left': inspector once, inside left-panel, _showInspector(), _unifiedLeft()
 *   - CSS theming: --gc-accent non-empty, canonical default, inline override, all 7 tokens
 *   - Default layout is 'classic'
 */

import { TestBed, ComponentFixture } from '@angular/core/testing';

import { CanvasEditorComponent } from './editor/canvas-editor.component';
import { EditorChromeService } from './services/editor-chrome.service';
import { CommandPaletteService } from './services/command-palette.service';
import { COMMAND_REGISTRY_TOKEN } from './tokens/command-registry.token';
import { CanvasStateService } from './services/canvas-state.service';
import { SelectionService } from './services/selection.service';
import { SnapGuideService } from './services/snap-guide.service';
import { CanvasData } from './models/canvas-data.model';

const EMPTY_CANVAS: CanvasData = {
  version: 1,
  viewport: { width: 1200, height: 800 },
  elements: [],
};

// Helper to get a service from the component's own injector (not the test module root)
function fromComponentInjector<T>(fixture: ComponentFixture<CanvasEditorComponent>, token: any): T {
  return fixture.debugElement.injector.get(token) as T;
}

describe('Phase H Integration — CanvasEditorComponent', () => {
  let fixture: ComponentFixture<CanvasEditorComponent>;
  let component: CanvasEditorComponent;
  let el: HTMLElement;

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
    el = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('canvasData', EMPTY_CANVAS);
    document.body.appendChild(el);
    fixture.detectChanges();
  });

  afterEach(() => {
    if (el.parentNode) {
      document.body.removeChild(el);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Group 1: Command palette keyboard flow
  // ─────────────────────────────────────────────────────────────────────────

  describe('Command palette keyboard flow', () => {
    it('meta+K opens command palette overlay', () => {
      const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
      Object.defineProperty(event, 'target', { value: document.body });
      component.onCommandPaletteShortcut(event);
      fixture.detectChanges();
      expect(el.querySelector('.gc-cmd-backdrop')).toBeTruthy();
    });

    it('ctrl+K opens command palette overlay', () => {
      const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
      Object.defineProperty(event, 'target', { value: document.body });
      component.onCommandPaletteShortcut(event);
      fixture.detectChanges();
      expect(el.querySelector('.gc-cmd-backdrop')).toBeTruthy();
    });

    it('close() removes palette DOM', () => {
      component.commandPalette.open();
      fixture.detectChanges();
      expect(el.querySelector('.gc-cmd-backdrop')).toBeTruthy();
      component.commandPalette.close();
      fixture.detectChanges();
      expect(el.querySelector('.gc-cmd-backdrop')).toBeNull();
    });

    it('palette renders 8 items (all default commands)', () => {
      component.commandPalette.open();
      fixture.detectChanges();
      const items = el.querySelectorAll('.gc-cmd-item:not(.gc-cmd-item--empty)');
      expect(items.length).toBe(8);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Group 2: _isEditingText() guard
  // ─────────────────────────────────────────────────────────────────────────

  describe('_isEditingText() guard', () => {
    it('meta+K blocked when contenteditable div is the target', () => {
      const div = document.createElement('div');
      div.contentEditable = 'true';
      document.body.appendChild(div);
      const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
      Object.defineProperty(event, 'target', { value: div });
      component.onCommandPaletteShortcut(event);
      fixture.detectChanges();
      expect(el.querySelector('.gc-cmd-backdrop')).toBeNull();
      document.body.removeChild(div);
    });

    it('meta+K blocked when input element is the target', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
      Object.defineProperty(event, 'target', { value: input });
      component.onCommandPaletteShortcut(event);
      fixture.detectChanges();
      expect(el.querySelector('.gc-cmd-backdrop')).toBeNull();
      document.body.removeChild(input);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Group 3: 8 default command IDs
  // ─────────────────────────────────────────────────────────────────────────

  describe('Default command IDs', () => {
    it('filteredCommands() returns 8 default commands', () => {
      const palette = fromComponentInjector<CommandPaletteService>(fixture, CommandPaletteService);
      expect(palette.filteredCommands().length).toBe(8);
    });

    it('all expected command IDs present in filteredCommands()', () => {
      const palette = fromComponentInjector<CommandPaletteService>(fixture, CommandPaletteService);
      const ids = palette.filteredCommands().map(c => c.id);
      expect(ids).toContain('add-text');
      expect(ids).toContain('add-image');
      expect(ids).toContain('add-button');
      expect(ids).toContain('add-shape');
      expect(ids).toContain('undo');
      expect(ids).toContain('redo');
      expect(ids).toContain('open-library');
      expect(ids).toContain('publish');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Group 4: Publish command end-to-end
  // ─────────────────────────────────────────────────────────────────────────

  describe('Publish command end-to-end', () => {
    it('openPublishModal$.next() sets _publishOpen to true', () => {
      const chrome = fromComponentInjector<EditorChromeService>(fixture, EditorChromeService);
      chrome.openPublishModal$.next();
      fixture.detectChanges();
      expect(component._publishOpen()).toBe(true);
    });

    it('publish modal appears in DOM when _publishOpen is true', () => {
      const chrome = fromComponentInjector<EditorChromeService>(fixture, EditorChromeService);
      chrome.openPublishModal$.next();
      fixture.detectChanges();
      expect(el.querySelector('gc-publish-modal')).toBeTruthy();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Group 5: Open Library command end-to-end
  // ─────────────────────────────────────────────────────────────────────────

  describe('Open Library command end-to-end', () => {
    it('openLibraryModal$.next() sets _libraryOpen to true', () => {
      const chrome = fromComponentInjector<EditorChromeService>(fixture, EditorChromeService);
      chrome.openLibraryModal$.next();
      fixture.detectChanges();
      expect(component._libraryOpen()).toBe(true);
    });

    it('library modal appears in DOM when _libraryOpen is true', () => {
      const chrome = fromComponentInjector<EditorChromeService>(fixture, EditorChromeService);
      chrome.openLibraryModal$.next();
      fixture.detectChanges();
      expect(el.querySelector('.gc-lib-modal')).toBeTruthy();
    });

    it('onLibraryClosed() resets _libraryOpen to false', () => {
      const chrome = fromComponentInjector<EditorChromeService>(fixture, EditorChromeService);
      chrome.openLibraryModal$.next();
      fixture.detectChanges();
      component.onLibraryClosed();
      fixture.detectChanges();
      expect(component._libraryOpen()).toBe(false);
    });

    it('library modal removed from DOM after onLibraryClosed()', () => {
      const chrome = fromComponentInjector<EditorChromeService>(fixture, EditorChromeService);
      chrome.openLibraryModal$.next();
      fixture.detectChanges();
      component.onLibraryClosed();
      fixture.detectChanges();
      expect(el.querySelector('.gc-lib-modal')).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Group 6: Library modal DOM (4 default entries)
  // ─────────────────────────────────────────────────────────────────────────

  describe('Library modal DOM', () => {
    beforeEach(() => {
      component._libraryOpen.set(true);
      fixture.detectChanges();
    });

    it('renders tiles for all 4 default palette entries', () => {
      const tiles = el.querySelectorAll('.gc-lib-tile');
      expect(tiles.length).toBe(4);
    });

    it('category nav renders (at least 1 button beyond All)', () => {
      const navBtns = el.querySelectorAll('.gc-lib-nav__item');
      expect(navBtns.length).toBeGreaterThanOrEqual(2); // All + at least one category
    });

    it('tile labels include Text, Image, Button, Shape', () => {
      const labels = Array.from(el.querySelectorAll('.gc-lib-tile__label')).map(l => l.textContent?.trim());
      expect(labels).toContain('Text');
      expect(labels).toContain('Image');
      expect(labels).toContain('Button');
      expect(labels).toContain('Shape');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Group 7: Layout 'rail'
  // ─────────────────────────────────────────────────────────────────────────

  describe("Layout 'rail'", () => {
    beforeEach(() => {
      fixture.componentRef.setInput('layout', 'rail');
      fixture.detectChanges();
    });

    it('gc-layout--rail class present on host', () => {
      expect(el.classList.contains('gc-layout--rail')).toBe(true);
    });

    it('left panel is present in DOM', () => {
      expect(el.querySelector('gc-editor-left-panel')).toBeTruthy();
    });

    it('.gc-left-panel-rail is rendered inside left panel', () => {
      expect(el.querySelector('.gc-left-panel-rail')).toBeTruthy();
    });

    it('tab buttons are not rendered (panel collapsed)', () => {
      expect(el.querySelector('.gc-left-panel__tabs')).toBeNull();
    });

    it('_leftCollapsed() is true', () => {
      expect(component._leftCollapsed()).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Group 8: Layout 'unified-left'
  // ─────────────────────────────────────────────────────────────────────────

  describe("Layout 'unified-left'", () => {
    beforeEach(() => {
      fixture.componentRef.setInput('layout', 'unified-left');
      fixture.detectChanges();
    });

    it('gc-layout--unified-left class present on host', () => {
      expect(el.classList.contains('gc-layout--unified-left')).toBe(true);
    });

    it('gc-editor-inspector appears exactly once in DOM', () => {
      const inspectors = el.querySelectorAll('gc-editor-inspector');
      expect(inspectors.length).toBe(1);
    });

    it('the single gc-editor-inspector is inside gc-editor-left-panel', () => {
      const leftPanel = el.querySelector('gc-editor-left-panel');
      const inspector = leftPanel?.querySelector('gc-editor-inspector');
      expect(inspector).toBeTruthy();
    });

    it('_showInspector() is false (no standalone inspector)', () => {
      expect(component._showInspector()).toBe(false);
    });

    it('_unifiedLeft() is true', () => {
      expect(component._unifiedLeft()).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Group 9: CSS theming
  // ─────────────────────────────────────────────────────────────────────────

  describe('CSS theming', () => {
    it('--gc-accent is non-empty', () => {
      const val = getComputedStyle(el).getPropertyValue('--gc-accent').trim();
      expect(val).toBeTruthy();
    });

    it('--gc-accent defaults to #2563eb', () => {
      const val = getComputedStyle(el).getPropertyValue('--gc-accent').trim();
      expect(val).toBe('#2563eb');
    });

    it('inline style override for --gc-accent propagates', () => {
      el.style.setProperty('--gc-accent', 'hotpink');
      const val = getComputedStyle(el).getPropertyValue('--gc-accent').trim();
      expect(val).toBe('hotpink');
      el.style.removeProperty('--gc-accent');
    });

    it('all 7 --gc-* tokens are non-empty', () => {
      const tokens = [
        '--gc-accent', '--gc-accent-soft', '--gc-ink',
        '--gc-bg', '--gc-line', '--gc-muted', '--gc-bg-raised',
      ];
      const style = getComputedStyle(el);
      for (const token of tokens) {
        expect(style.getPropertyValue(token).trim()).withContext(`${token} should be non-empty`).toBeTruthy();
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Group 9.5: Chained flow — Command Palette → Library Modal → Close
  // ─────────────────────────────────────────────────────────────────────────

  describe('Integration: Library Modal via Command Palette chain', () => {
    it('opens library modal via command palette "Open Library" command, then closes', () => {
      // 1. Open command palette
      component.commandPalette.open();
      fixture.detectChanges();
      expect(el.querySelector('.gc-cmd-backdrop')).toBeTruthy('palette should be visible');

      // 2. Find and execute the "open-library" command
      const libraryCmd = component.commandPalette.filteredCommands()
        .find(c => c.id === 'open-library');
      expect(libraryCmd).toBeDefined();
      libraryCmd!.action();
      fixture.detectChanges();

      // 3. Library modal should appear
      expect(el.querySelector('.gc-lib-modal')).toBeTruthy('library modal should be visible');

      // 4. Close library modal
      const closeBtn = el.querySelector<HTMLButtonElement>('.gc-lib-close');
      closeBtn?.click();
      fixture.detectChanges();

      // 5. Library modal should be gone
      expect(el.querySelector('.gc-lib-modal')).toBeFalsy('library modal should be closed');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Group 10: Default layout
  // ─────────────────────────────────────────────────────────────────────────

  describe('Default layout', () => {
    it('default layout is classic — gc-layout--classic present', () => {
      expect(el.classList.contains('gc-layout--classic')).toBe(true);
    });

    it('default layout does not apply rail, canvas-first, or unified-left classes', () => {
      expect(el.classList.contains('gc-layout--rail')).toBe(false);
      expect(el.classList.contains('gc-layout--canvas-first')).toBe(false);
      expect(el.classList.contains('gc-layout--unified-left')).toBe(false);
    });
  });
});
