# @grontis/gcanvas

An Angular 19 no-code canvas editor library. Two embeddable surfaces share the
same data contract:

- **`<gc-canvas>`** — the primitive. Bare canvas where users drag, resize, and
  rich-text-edit elements. No chrome, no panels.
- **`<gc-canvas-editor>`** — the full editor shell. Top chrome, component palette,
  layers panel, inspector, floating toolbars, command palette, library/template
  pickers, publish modal with pre-flight checks, responsive preview.

Both surfaces consume `CanvasData` and emit `CanvasChangeEvent`. Pick the
surface that fits your product; share state between them if you want.

---

## Table of contents

- [Install](#install)
- [Quick start — primitive](#quick-start--primitive-gc-canvas)
- [Quick start — full editor](#quick-start--full-editor-gc-canvas-editor)
- [The `CanvasData` model](#the-canvasdata-model)
- [Publishing and HTML export](#publishing-and-html-export)
- [Layouts](#layouts)
- [Theming](#theming)
- [Extension points](#extension-points)
- [Read-only mode](#read-only-mode)
- [Accessibility](#accessibility)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Public API exports](#public-api-exports)

---

## Install

The package is hosted on **GitHub Packages**, not npmjs.org. You need two
things:

### 1. Tell npm where to find the `@grontis` scope

Create or edit `.npmrc` at the root of your project:

```
@grontis:registry=https://npm.pkg.github.com
```

### 2. Authenticate

GitHub Packages requires authentication even for public packages. Put your
token in your **user-level** `~/.npmrc` (never commit it):

```
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

Create a [fine-grained PAT](https://github.com/settings/tokens) with the
`read:packages` scope.

For CI, set `NODE_AUTH_TOKEN` in the environment and rely on
`actions/setup-node` to write the registry config:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    registry-url: 'https://npm.pkg.github.com'
    scope: '@grontis'
- run: npm ci
  env:
    NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 3. Install the library and its peer dependencies

```bash
npm install @grontis/gcanvas

npm install @angular/cdk \
  @tiptap/core @tiptap/starter-kit @tiptap/html \
  @tiptap/extension-text-style @tiptap/extension-color @tiptap/extension-underline \
  @tiptap/extension-font-family @tiptap/extension-highlight \
  @tiptap/extension-link @tiptap/extension-text-align \
  ngx-tiptap
```

**Requirements**

| | |
|---|---|
| Angular | `>=19.0.0` |
| Angular CDK | `>=19.0.0` |
| TipTap | `>=2.0.0` |
| ngx-tiptap | `>=9.0.0` |
| Node (build-time) | `>=20` |

The library ships only `tslib` as a runtime dep — everything else is a peer.

---

## Quick start — primitive `<gc-canvas>`

```typescript
import { Component } from '@angular/core';
import { CanvasComponent } from '@grontis/gcanvas';
import type { CanvasData, CanvasChangeEvent } from '@grontis/gcanvas';

@Component({
  selector: 'app-root',
  standalone: true,
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

`<gc-canvas>` calls `provideCanvas()` on itself, so no app-level providers are
required for basic usage.

---

## Quick start — full editor `<gc-canvas-editor>`

```typescript
import { Component, signal } from '@angular/core';
import { CanvasEditorComponent } from '@grontis/gcanvas';
import type {
  CanvasData, CanvasChangeEvent, SaveStatus, PublishPayload,
} from '@grontis/gcanvas';

@Component({
  selector: 'app-root',
  standalone: true,
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
  canvasData: CanvasData = {
    version: 1,
    viewport: { width: 1200, height: 800, backgroundColor: '#fafafa' },
    elements: [],
    meta: { name: 'Home', slug: '/' },
  };

  readonly saveStatus = signal<SaveStatus>('saved');

  onCanvasChange(event: CanvasChangeEvent): void {
    this.canvasData = event.canvasData;
    this.saveStatus.set('saving');
    // Replace with real persistence.
    setTimeout(() => this.saveStatus.set('saved'), 1200);
  }

  onPublish(payload: PublishPayload): void {
    // `payload.fullDocument` is a complete <!DOCTYPE html> string.
    // Persist it, ship it to a static host, anything you like.
    console.log(payload.fullDocument);
  }
}
```

The editor self-provides every service it needs via `provideCanvas()` +
`provideEditor()` at the component level. No app-level provider setup required.

---

## The `CanvasData` model

A canvas is fully described by a serializable `CanvasData` value:

```typescript
interface CanvasData {
  version: number;                 // schema version — start at 1
  viewport: {
    width: number;                 // px — fixed-size artboard
    height: number;                // px
    backgroundColor?: string;
    maxWidth?: number;
    padding?: number | { x: number; y: number };
  };
  elements: CanvasElement[];       // discriminated union by `type`
  meta?: {
    name?: string;
    slug?: string;
    seoTitle?: string;
    seoDescription?: string;       // surfaced in publish pre-flight checks
  };
}
```

Built-in element types: `'text'`, `'image'`, `'button'`, `'shape'`. Each
extends a common shape (id, position, size, zIndex, visible, locked, styles)
plus type-specific fields. Plugin element types use `GenericCanvasElement`.

Every change emits a `CanvasChangeEvent`:

```typescript
interface CanvasChangeEvent {
  canvasData: CanvasData;
  changedElementIds: string[];     // empty for viewport-only changes
  changeType: 'move' | 'resize' | 'edit' | 'add' | 'remove' | 'reorder' | 'viewport';
}
```

Persist `canvasData` to your backend on `(canvasChange)`. The library is
storage-agnostic — it holds no IO and never reaches outside the editor.

---

## Publishing and HTML export

`<gc-canvas-editor>`'s `(publish)` output emits a **`PublishPayload`** built by
the library's serializer:

```typescript
interface PublishPayload {
  canvasData: CanvasData;
  html: string;          // serialized canvas markup (just the body content)
  css: string;           // collected styles
  js?: string;           // collected scripts (often absent)
  fullDocument: string;  // complete <!DOCTYPE html> document — ready to ship
  meta: CanvasData['meta'];
}
```

You can also produce a payload programmatically by injecting `CanvasSerializer`:

```typescript
import { Component, inject } from '@angular/core';
import { CanvasSerializer, provideCanvas } from '@grontis/gcanvas';
import type { CanvasData } from '@grontis/gcanvas';

@Component({
  selector: 'app-headless-export',
  standalone: true,
  template: '',
  providers: [provideCanvas()],
})
export class HeadlessExport {
  private readonly serializer = inject(CanvasSerializer);

  export(canvasData: CanvasData): string {
    return this.serializer.serialize(canvasData).fullDocument;
  }
}
```

Or use the pure functions directly, no Angular injection required:

```typescript
import { serializeCanvas, toHtmlDocument } from '@grontis/gcanvas';

const { html, css, js, head } = serializeCanvas(canvasData, mySerializers, ctx);
const fullDoc = toHtmlDocument({ html, css, js, head }, canvasData.meta);
```

### Customizing the export

Two injection tokens control export output:

- **`ELEMENT_SERIALIZER_TOKEN`** — array of `{ type, serialize }` entries.
  Override or extend the defaults to change how an element type is rendered.
  Last matching entry wins (Angular multi-provider order).
- **`IMAGE_RESOLVER_TOKEN`** — `(src, element) => string`. Useful for rewriting
  `src` values at export time (e.g. swap a CDN host, sign URLs).

```typescript
import {
  ELEMENT_SERIALIZER_TOKEN, IMAGE_RESOLVER_TOKEN,
  type ElementSerializerEntry,
} from '@grontis/gcanvas';

const myImageSerializer: ElementSerializerEntry = {
  type: 'image',
  serialize: (el, ctx) => ({
    html: `<img loading="lazy" src="${ctx.resolveImage((el as any).src, el as any)}" />`,
  }),
};

@Component({
  providers: [
    { provide: ELEMENT_SERIALIZER_TOKEN, useValue: [/* defaults */, myImageSerializer] },
    { provide: IMAGE_RESOLVER_TOKEN, useValue: (src) => src.replace('://cdn.dev/', '://cdn.prod/') },
  ],
})
```

### Publish modal pre-flight checks

The built-in publish modal runs three checks against `canvasData` before
enabling the **Publish now** button:

| Check | Severity | Trigger |
|---|---|---|
| `missing-alt` | warning | Image element with no `alt` |
| `missing-seo-title` | warning | `meta.seoTitle` unset |
| `missing-seo-desc` | warning | `meta.seoDescription` unset |

Warnings don't block publish; only `severity: 'error'` results do. Compose
your own checks via `runPreflightChecks(canvasData)` (or the individual
`checkImageAlt` / `checkSeoTitle` / `checkSeoDescription` helpers) if you
need to surface them elsewhere.

### Responsive preview

The editor includes a **`ResponsivePreviewComponent`** that renders the
serialized HTML in three sandboxed iframes (375 / 768 / 1280 px) so you can
verify each breakpoint visually. The `BreakpointIframeComponent` is exported
in case you want to roll your own preview UI.

---

## Layouts

Set `[layout]` on `<gc-canvas-editor>` to one of:

| Layout | Description |
|---|---|
| `classic` (default) | Left panel (248px) ︱ canvas ︱ inspector (296px) |
| `rail` | Icon rail (48px) ︱ canvas ︱ inspector — left panel collapsed |
| `canvas-first` | Canvas only; left panel and inspector hidden |
| `unified-left` | Combined left+inspector panel (320px) ︱ canvas |

Layouts are applied via CSS grid on the host; no JS rearrangement.

---

## Theming

The editor exposes CSS custom properties on its host. Override at any
ancestor:

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

Every editor surface — chrome, modals, inspector, floating toolbars,
snap-guide overlays — consumes these tokens. Token names are part of the
public API and follow SemVer.

---

## Extension points

Six `InjectionToken<T[]>` extension points cover the editor's pluggable
surfaces. Each has a sensible default supplied by `provideCanvas()` or
`provideEditor()`; supply your own to replace.

| Token | Purpose | Default |
|---|---|---|
| `ELEMENT_REGISTRY_TOKEN` | Component used to render each element `type` | text/image/button/shape components |
| `ELEMENT_SERIALIZER_TOKEN` | HTML/CSS/JS emitted on export per element `type` | matching serializers for built-ins |
| `IMAGE_RESOLVER_TOKEN` | Rewrites image `src` values at export time | identity (`src => src`) |
| `COMPONENT_PALETTE_TOKEN` | Entries in the left-panel component palette | `defaultPaletteEntries` |
| `TEMPLATE_REGISTRY_TOKEN` | Templates listed in the template picker | `[]` |
| `TIPTAP_EXTENSIONS_TOKEN` | TipTap extensions loaded into text elements | `DEFAULT_TIPTAP_EXTENSIONS` |
| `COMMAND_REGISTRY_TOKEN` | Entries in the `⌘K` command palette | `defaultCommandsFactory(...)` |

### Example — adding a custom command

```typescript
import { COMMAND_REGISTRY_TOKEN, type CommandEntry } from '@grontis/gcanvas';

const exportPdf: CommandEntry = {
  id: 'export-pdf',
  label: 'Export as PDF',
  category: 'publish',
  hotkey: '',
  action: () => myPdfExporter.run(),
};

@Component({
  imports: [CanvasEditorComponent],
  providers: [
    { provide: COMMAND_REGISTRY_TOKEN, useValue: [/* spread defaults if you want them */, exportPdf] },
  ],
  /* ... */
})
```

### Example — adding a custom element type

```typescript
import {
  ELEMENT_REGISTRY_TOKEN, ELEMENT_SERIALIZER_TOKEN,
  COMPONENT_PALETTE_TOKEN,
} from '@grontis/gcanvas';
import { VideoElementComponent } from './video-element.component';
import { serializeVideoElement } from './video-element.serializer';

@Component({
  providers: [
    { provide: ELEMENT_REGISTRY_TOKEN, useValue: [
      { type: 'video', component: VideoElementComponent },
    ]},
    { provide: ELEMENT_SERIALIZER_TOKEN, useValue: [
      { type: 'video', serialize: serializeVideoElement },
    ]},
    { provide: COMPONENT_PALETTE_TOKEN, useValue: [
      { toolId: 'video', label: 'Video', icon: '<svg…>',
        defaultSize: { width: 400, height: 225 }, category: 'media' },
    ]},
  ],
})
```

> The library exports an `isSafeUrl()` utility for URL allow-list validation
> (blocks `javascript:`, `data:`, `vbscript:` schemes). The text-toolbar link
> action uses it internally; reuse it in your own URL ingestion paths.

---

## Read-only mode

Set `[readonly]="true"` on `<gc-canvas-editor>` to disable selection, drag,
resize, text editing, and all chrome actions. The editor still renders the
canvas and inspector for inspection-only flows (presenter view, comment
threads, preview surfaces).

---

## Accessibility

- **Modals** — `role="dialog"`, `aria-modal="true"`, `aria-labelledby` on each
  dialog. Focus is trapped with Angular CDK's `cdkTrapFocus` and restored to
  the trigger on close.
- **Form controls** — every inspector control is paired with a label
  (implicit wrapping or `for`/`id`).
- **Icon-only buttons** — every rail or floating-toolbar button has an
  `aria-label`.
- **Focus visibility** — `:focus-visible` outlines on every interactive
  control. Theme tokens are calibrated so muted text meets ≥4.5:1 contrast
  against the bg token.

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| Click | Select element |
| Double-click | Enter text edit mode |
| Escape | Deselect / exit text edit / close modal |
| Delete / Backspace | Remove selected element |
| Ctrl+Z / ⌘Z | Undo (50-step history) |
| Ctrl+Shift+Z / Ctrl+Y / ⌘⇧Z | Redo |
| Ctrl+K / ⌘K | Open command palette |
| T / I / B / S | (in command palette) Add Text / Image / Button / Shape |

Command palette hotkeys are extensible — set `hotkey` on each `CommandEntry`.

---

## Public API exports

A quick reference for the symbols you'll reach for most. See
[`public-api.ts`](https://github.com/grontis/gcanvas/blob/main/projects/gcanvas/src/public-api.ts)
for the complete list.

**Components**

`CanvasComponent` · `CanvasEditorComponent` · `CanvasViewComponent` ·
`ResponsivePreviewComponent` · `BreakpointCanvasComponent` ·
`BreakpointIframeComponent` · `PublishModalComponent` ·
`TemplatePickerComponent` · `CommandPaletteComponent` ·
`LibraryModalComponent`

**Providers**

`provideCanvas()` · `provideEditor()` · `defaultPaletteEntries` ·
`defaultCommandsFactory()` · `DEFAULT_TIPTAP_EXTENSIONS`

**Tokens**

`ELEMENT_REGISTRY_TOKEN` · `ELEMENT_SERIALIZER_TOKEN` · `IMAGE_RESOLVER_TOKEN` ·
`COMPONENT_PALETTE_TOKEN` · `TEMPLATE_REGISTRY_TOKEN` ·
`TIPTAP_EXTENSIONS_TOKEN` · `COMMAND_REGISTRY_TOKEN`

**Services**

`CanvasStateService` · `SelectionService` · `ToolStateService` ·
`BreakpointService` · `EditorChromeService` · `SnapGuideService` ·
`CommandPaletteService` · `CanvasSerializer`

**Models / types**

`CanvasData` · `CanvasViewport` · `CanvasChangeEvent` · `CanvasElement` ·
`TextCanvasElement` · `ImageCanvasElement` · `GenericCanvasElement` ·
`PublishPayload` · `SaveStatus` · `Breakpoint` · `ToolId` · `PaletteEntry` ·
`CommandEntry` · `TemplateEntry` · `ElementSerializerEntry` ·
`SerializerContext` · `SerializedFragment` · `ImageResolver` ·
`PreflightResult`

**Utilities**

`serializeCanvas()` · `toHtmlDocument()` · `runPreflightChecks()` ·
`checkImageAlt()` · `checkSeoTitle()` · `checkSeoDescription()` ·
`elementLabel()` · `isSafeUrl()` · `SHADOW_PRESETS` · `SYSTEM_FONTS` ·
`FOCAL_POINT_POSITIONS`

---

## Links

- **Repository:** <https://github.com/grontis/gcanvas>
- **Issues:** <https://github.com/grontis/gcanvas/issues>
- **License:** [MIT](https://github.com/grontis/gcanvas/blob/main/LICENSE)
