# @grontis/gcanvas

An Angular 19 no-code canvas editor library. Ships two embeddable surfaces:

- **`<gc-canvas>`** — the primitive. A bare canvas where users drag, resize, and rich-text-edit elements. No chrome, no panels.
- **`<gc-canvas-editor>`** — the full editor shell. Chrome bar, component palette, layers panel, inspector, floating toolbars, command palette, library/publish/template modals, responsive preview.

Both surfaces consume the same `CanvasData` model and emit the same `CanvasChangeEvent`. Pick the surface that fits your product; share state between them if you want.

## Features

**Element model**
- Text (TipTap rich text — bold, italic, underline, color, font family, size, alignment, highlight, link)
- Image (configurable `objectFit`, focal point)
- Button, Shape
- Drag, 8-handle resize, snap guides, undo/redo (50-step history)
- Plugin-friendly registry — bring your own element types via `ELEMENT_REGISTRY_TOKEN`

**Editor shell (`<gc-canvas-editor>`)**
- Top chrome (project name, breadcrumbs, save status, publish action)
- Left panel — component palette + layers, collapsible to icon rail
- Inspector — position/size, typography, image, effects, page sections
- Floating action toolbar (per-selection actions)
- Floating text toolbar (TipTap rich-text controls)
- Command palette (`⌘K` / `Ctrl+K`) with extensible command registry
- Library modal, template picker, publish modal with preflight checks
- Responsive preview across mobile/tablet/desktop breakpoints
- Four built-in layouts: `classic`, `rail`, `canvas-first`, `unified-left`
- Read-only mode for presenter/preview surfaces
- Accessible modals (`role="dialog"`, `aria-modal`, focus trap, focus return, `:focus-visible`)

**Architecture**
- Standalone components, signals-first, `ChangeDetectionStrategy.OnPush` throughout
- CSS custom properties for theming (`--gc-*` tokens)
- Storage-agnostic — accepts `CanvasData` input, emits `CanvasChangeEvent` on every change
- Tree-shakeable: import only what you use

## Installation

Add a `.npmrc` pointing `@grontis` to GitHub Packages:

```
@grontis:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

Then install the library and its peers:

```bash
npm install @grontis/gcanvas

npm install @angular/cdk \
  @tiptap/core @tiptap/starter-kit @tiptap/html \
  @tiptap/extension-text-style @tiptap/extension-color @tiptap/extension-underline \
  @tiptap/extension-font-family @tiptap/extension-highlight \
  @tiptap/extension-link @tiptap/extension-text-align \
  ngx-tiptap
```

Requires Angular 19+.

## Quick start — primitive `<gc-canvas>`

```typescript
import { CanvasComponent } from '@grontis/gcanvas';
import type { CanvasData, CanvasChangeEvent } from '@grontis/gcanvas';

@Component({
  imports: [CanvasComponent],
  template: `
    <gc-canvas
      [canvasData]="canvasData"
      (canvasChange)="onCanvasChange($event)"
    />
  `,
})
export class AppComponent {
  canvasData: CanvasData = {
    version: 1,
    viewport: { width: 1200, height: 800, backgroundColor: '#ffffff' },
    elements: [],
  };

  onCanvasChange(event: CanvasChangeEvent): void {
    this.canvasData = event.canvasData;
  }
}
```

## Quick start — full editor `<gc-canvas-editor>`

```typescript
import { CanvasEditorComponent } from '@grontis/gcanvas';
import type { CanvasData, CanvasChangeEvent, SaveStatus } from '@grontis/gcanvas';
import { signal } from '@angular/core';

@Component({
  imports: [CanvasEditorComponent],
  template: `
    <gc-canvas-editor
      [canvasData]="canvasData"
      [projectName]="'My Project'"
      [breadcrumbs]="['Workspace', 'My Project']"
      [saveStatus]="saveStatus()"
      [layout]="'classic'"
      (canvasChange)="onCanvasChange($event)"
      (publish)="onPublish()"
    />
  `,
})
export class AppComponent {
  canvasData: CanvasData = { /* ... */ };
  readonly saveStatus = signal<SaveStatus>('saved');

  onCanvasChange(e: CanvasChangeEvent) { this.canvasData = e.canvasData; }
  onPublish() { /* persist + publish */ }
}
```

The editor self-provides its services via `provideCanvas()` + `provideEditor()` at the component level. No root provider setup required for basic use.

## Layouts

Set `[layout]` on `<gc-canvas-editor>` to one of:

| Layout | Description |
|---|---|
| `classic` (default) | Left panel (248px) ︱ canvas ︱ inspector (296px) |
| `rail` | Icon rail (48px) ︱ canvas ︱ inspector — left panel collapsed |
| `canvas-first` | Canvas only; left panel and inspector hidden |
| `unified-left` | Combined left+inspector panel (320px) ︱ canvas |

## Theming

The editor exposes CSS custom properties on its host. Override at any ancestor:

```scss
gc-canvas-editor {
  --gc-accent:           #2563eb;
  --gc-accent-soft:      #eff6ff;
  --gc-ink:              #0b0d10;
  --gc-bg:               #ffffff;
  --gc-bg-raised:        #f3f4f6;
  --gc-line:             #e5e7eb;
  --gc-muted:            #6b7280;
  --gc-overlay-backdrop: rgba(0, 0, 0, 0.45);
  --gc-canvas-bg:        #f6f7f9;
  --gc-canvas-grid-color: #d1d5db;
}
```

All editor chrome, modals, inspector, floating toolbars, and snap-guide overlays consume these tokens.

## Extensibility

The editor surfaces five `InjectionToken<T[]>` extension points. Each defaults to a sensible array via `provideCanvas()` / `provideEditor()`; supply your own to replace.

| Token | Purpose |
|---|---|
| `ELEMENT_REGISTRY_TOKEN` | Register custom element types (renderer + identifier) |
| `COMPONENT_PALETTE_TOKEN` | Entries in the left-panel component palette |
| `TEMPLATE_REGISTRY_TOKEN` | Templates available in the template picker |
| `TIPTAP_EXTENSIONS_TOKEN` | TipTap extensions loaded by text elements |
| `COMMAND_REGISTRY_TOKEN` | Entries in the `⌘K` command palette |

Example — adding a custom command:

```typescript
import { COMMAND_REGISTRY_TOKEN, type CommandEntry } from '@grontis/gcanvas';

const myCommand: CommandEntry = {
  id: 'export-pdf',
  label: 'Export as PDF',
  category: 'publish',
  hotkey: '',
  action: () => exporter.exportPdf(),
};

@Component({
  imports: [CanvasEditorComponent],
  providers: [
    { provide: COMMAND_REGISTRY_TOKEN, useValue: [/* defaults */, myCommand] },
  ],
  /* ... */
})
```

The library also exports an `isSafeUrl()` utility for URL allow-list validation (blocks `javascript:`, `data:`, `vbscript:` schemes). The text-toolbar link action uses it internally; expose it to your own URL ingestion paths if needed.

## Accessibility

- Modals: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` on every dialog, `cdkTrapFocus` focus trap (Angular CDK A11yModule), focus restoration on close.
- Inspector form controls: paired with labels (implicit wrapping or `for`/`id`).
- Rail buttons: `aria-label` on icon-only controls.
- Keyboard focus: `:focus-visible` outlines on all interactive controls.
- Color contrast: muted-text token is calibrated for ≥4.5:1 contrast against the bg token.

## Keyboard shortcuts

| Key | Action |
|---|---|
| Click | Select element |
| Double-click | Enter text edit mode |
| Escape | Deselect / exit text edit / close modal |
| Delete / Backspace | Remove selected element |
| Ctrl+Z / ⌘Z | Undo |
| Ctrl+Shift+Z / Ctrl+Y / ⌘⇧Z | Redo |
| Ctrl+K / ⌘K | Open command palette |
| T / I / B / S | (from command palette) Add Text / Image / Button / Shape |

Command-palette hotkeys are extensible — configure on each `CommandEntry`.

## Development

```bash
# Terminal 1 — watch-build the library
ng build gcanvas --watch

# Terminal 2 — serve the demo app
ng serve demo
```

The demo imports `@grontis/gcanvas` via a `tsconfig.json` path alias to `dist/gcanvas`, so build the library at least once before serving the demo.

## Running tests

```bash
ng test gcanvas --no-watch --browsers=ChromeHeadless
```

Suite covers per-phase acceptance tests (`phase-*.spec.ts`), service unit tests, component unit tests, and integration tests (`phase-h.integration.spec.ts`, `review-fixes.integration.spec.ts`).

## Releasing

```bash
# Bump the version in projects/gcanvas/package.json, then:
git add projects/gcanvas/package.json
git commit -m "chore: bump version to x.y.z"
git tag vx.y.z
git push origin main --tags
```

`.github/workflows/publish.yml` triggers on `v*` tags, builds the library, and publishes `dist/gcanvas` to `https://npm.pkg.github.com`. Uses the built-in `GITHUB_TOKEN` — no manual secrets.
