# @grontis/gcanvas

An Angular 19 no-code canvas editor library. Embed either:

- **`<gc-canvas>`** — the primitive (drag, resize, rich-text edit; no chrome)
- **`<gc-canvas-editor>`** — the full editor shell (top chrome, palette, layers, inspector, modals, command palette, responsive preview)

Both surfaces share the same `CanvasData` / `CanvasChangeEvent` contract.

## Install

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

## Primitive

```typescript
import { CanvasComponent } from '@grontis/gcanvas';

@Component({
  imports: [CanvasComponent],
  template: `<gc-canvas [canvasData]="canvasData" (canvasChange)="onChange($event)" />`,
})
export class AppComponent {
  canvasData = { version: 1, viewport: { width: 1200, height: 800, backgroundColor: '#fff' }, elements: [] };
  onChange(e) { this.canvasData = e.canvasData; }
}
```

## Full editor

```typescript
import { CanvasEditorComponent } from '@grontis/gcanvas';

@Component({
  imports: [CanvasEditorComponent],
  template: `
    <gc-canvas-editor
      [canvasData]="canvasData"
      [projectName]="'My Project'"
      [layout]="'classic'"
      (canvasChange)="onChange($event)"
      (publish)="onPublish()" />
  `,
})
export class AppComponent { /* ... */ }
```

Layouts: `classic` (default), `rail`, `canvas-first`, `unified-left`.

## Theming

Override CSS custom properties on `gc-canvas-editor`:

```scss
gc-canvas-editor {
  --gc-accent: #2563eb;
  --gc-bg: #ffffff;
  --gc-ink: #0b0d10;
  --gc-line: #e5e7eb;
  /* ... see GitHub README for the full token list */
}
```

## Extension points

Five `InjectionToken<T[]>` extension points let you register custom element types, palette entries, templates, TipTap extensions, and `⌘K` commands. Defaults are provided automatically by `provideCanvas()` / `provideEditor()`.

## Full documentation

See the [GitHub repository](https://github.com/grontis/gcanvas) for the complete README, including:

- All extension-point examples
- Accessibility model (modal a11y, focus management, focus-visible)
- Keyboard shortcuts
- Development & release workflow
