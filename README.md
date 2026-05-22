# @grontis/gcanvas

An Angular 19 no-code canvas editor library. Ships two embeddable surfaces:

- **`<gc-canvas>`** — the primitive. A bare canvas where users drag, resize, and rich-text-edit elements. No chrome, no panels.
- **`<gc-canvas-editor>`** — the full editor shell. Chrome bar, component palette, layers panel, inspector, floating toolbars, command palette, library/publish/template modals, responsive preview.

Both surfaces consume the same `CanvasData` model and emit the same `CanvasChangeEvent`. The full editor additionally serializes the canvas to a complete HTML document on publish. Pick the surface that fits your product; share state between them if you want.

> **Looking for the consumer guide?** The full install/usage documentation lives in [`projects/gcanvas/README.md`](projects/gcanvas/README.md) — that's the file npm consumers see on the package page. This root README is the contributor view.
>
> **Releasing?** See [`PUBLISHING.md`](PUBLISHING.md) for the maintainer release flow.

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
- Library modal, template picker, publish modal with pre-flight checks
- Responsive preview across mobile/tablet/desktop breakpoints — each breakpoint rendered in a sandboxed iframe of the serialized output
- Four built-in layouts: `classic`, `rail`, `canvas-first`, `unified-left`
- Read-only mode for presenter/preview surfaces
- Accessible modals (`role="dialog"`, `aria-modal`, focus trap, focus return, `:focus-visible`)

**Publish / HTML export pipeline**
- `<gc-canvas-editor>` emits a `PublishPayload` on `(publish)` with `html`, `css`, optional `js`, and a ready-to-ship `fullDocument` (`<!DOCTYPE html>` … `</html>`)
- `CanvasSerializer` service and pure `serializeCanvas()` / `toHtmlDocument()` helpers for headless export
- Per-element-type serializers registered through `ELEMENT_SERIALIZER_TOKEN`
- `IMAGE_RESOLVER_TOKEN` rewrites image `src` values at export time (CDN swap, URL signing)
- Pre-flight checks: missing alt text, missing SEO title, missing SEO description

**Architecture**
- Standalone components, signals-first, `ChangeDetectionStrategy.OnPush` throughout
- CSS custom properties for theming (`--gc-*` tokens — part of the public API)
- Storage-agnostic — accepts `CanvasData` input, emits `CanvasChangeEvent` on every change
- Tree-shakeable: import only what you use

## Installation

The package is on **GitHub Packages**, not npmjs.org. Add a `.npmrc` at your project root that scopes `@grontis` to it:

```
@grontis:registry=https://npm.pkg.github.com
```

Then add a token (with `read:packages`) to your **user-level** `~/.npmrc`:

```
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

Install the library and its peers:

```bash
npm install @grontis/gcanvas

npm install @angular/cdk \
  @tiptap/core @tiptap/starter-kit @tiptap/html \
  @tiptap/extension-text-style @tiptap/extension-color @tiptap/extension-underline \
  @tiptap/extension-font-family @tiptap/extension-highlight \
  @tiptap/extension-link @tiptap/extension-text-align \
  ngx-tiptap
```

Requires Angular 19+. Full install and auth notes (including CI) live in [`projects/gcanvas/README.md`](projects/gcanvas/README.md#install).

## Quick start — primitive `<gc-canvas>`

```typescript
import { CanvasComponent } from '@grontis/gcanvas';
import type { CanvasData, CanvasChangeEvent } from '@grontis/gcanvas';

@Component({
  imports: [CanvasComponent],
  template: `
    <gc-canvas
      [canvasData]="canvasData"
      (canvasChange)="onCanvasChange($event)" />
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
import type {
  CanvasData, CanvasChangeEvent, SaveStatus, PublishPayload,
} from '@grontis/gcanvas';
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
      (publish)="onPublish($event)" />
  `,
})
export class AppComponent {
  canvasData: CanvasData = { /* ... */ };
  readonly saveStatus = signal<SaveStatus>('saved');

  onCanvasChange(e: CanvasChangeEvent) { this.canvasData = e.canvasData; }
  onPublish(payload: PublishPayload) {
    // payload.fullDocument is a complete <!DOCTYPE html> string.
    persistToHost(payload.fullDocument);
  }
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

The library surfaces seven `InjectionToken<T[]>` extension points. Each defaults to a sensible value via `provideCanvas()` / `provideEditor()`; supply your own to replace.

| Token | Purpose |
|---|---|
| `ELEMENT_REGISTRY_TOKEN` | Component used to render each element `type` |
| `ELEMENT_SERIALIZER_TOKEN` | HTML/CSS/JS emitted on export per element `type` |
| `IMAGE_RESOLVER_TOKEN` | Rewrites image `src` values at export time |
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

## Publish / HTML export

`<gc-canvas-editor>`'s `(publish)` emits a `PublishPayload`:

```typescript
interface PublishPayload {
  canvasData: CanvasData;
  html: string;          // body markup
  css: string;           // collected styles
  js?: string;           // collected scripts (often absent)
  fullDocument: string;  // complete <!DOCTYPE html> document, ready to ship
  meta: CanvasData['meta'];
}
```

Headless usage (no editor mounted):

```typescript
import { Component, inject } from '@angular/core';
import { CanvasSerializer, provideCanvas } from '@grontis/gcanvas';

@Component({
  template: '',
  providers: [provideCanvas()],
})
export class Exporter {
  private readonly serializer = inject(CanvasSerializer);
  export(data: CanvasData) {
    return this.serializer.serialize(data).fullDocument;
  }
}
```

Pure-function form (no DI):

```typescript
import { serializeCanvas, toHtmlDocument } from '@grontis/gcanvas';
const html = toHtmlDocument(serializeCanvas(data, serializers, ctx), data.meta);
```

See [`projects/gcanvas/README.md#publishing-and-html-export`](projects/gcanvas/README.md#publishing-and-html-export) for the full export reference.

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

Suite covers per-phase acceptance tests (`phase-*.spec.ts`), service unit tests, component unit tests, and integration tests (`phase-h.integration.spec.ts`, `review-fixes.integration.spec.ts`, `publish-export.integration.spec.ts`).

## Releasing

Releases are tag-driven — pushing a `v*` tag triggers `.github/workflows/publish.yml`, which builds `dist/gcanvas` and publishes it to GitHub Packages with the workflow's built-in `GITHUB_TOKEN`.

```bash
# Bump the version in projects/gcanvas/package.json, then:
git add projects/gcanvas/package.json
git commit -m "chore: release vX.Y.Z"
git tag vX.Y.Z
git push origin main --tags
```

Full release flow — pre-release checklist, versioning rules, manual-publish fallback, troubleshooting — lives in [`PUBLISHING.md`](PUBLISHING.md).

## License

[MIT](LICENSE) © grontis
