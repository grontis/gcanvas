# @grontis/gcanvas

An Angular no-code canvas editor library. Embed a visual canvas where users can place, drag, resize, and edit text boxes (with rich text) and images.

## Features

- Drag and reposition elements freely
- Resize elements with 8-point handles
- Rich text editing via TipTap (bold, italic, underline, color)
- Image elements with configurable `objectFit`
- Undo/redo (50-step history)
- Signal-based, `OnPush` throughout — Angular 19 idiomatic
- Storage-agnostic: accepts `CanvasData` as input, emits `CanvasChangeEvent` on every change
- Plugin-friendly element registry for custom element types

## Installation

Add a `.npmrc` to your project pointing `@grontis` to GitHub Packages:

```
@grontis:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

Then install:

```bash
npm install @grontis/gcanvas
```

Peer dependencies (install these too if not already present):

```bash
npm install @angular/cdk @tiptap/core @tiptap/starter-kit @tiptap/html \
  @tiptap/extension-text-style @tiptap/extension-color @tiptap/extension-underline \
  ngx-tiptap
```

## Basic usage

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

## Development

```bash
# Terminal 1 — watch-build the library
ng build gcanvas --watch

# Terminal 2 — serve the demo app
ng serve demo
```

The demo app imports `@grontis/gcanvas` via a `tsconfig.json` path alias pointing to `dist/gcanvas`, so you must run the library build at least once before serving the demo.

## Running tests

```bash
ng test gcanvas --no-watch --browsers=ChromeHeadless
```

## Releasing

Releases are published to GitHub Packages automatically when a version tag is pushed.

```bash
# Bump the version in projects/gcanvas/package.json, then:
git add projects/gcanvas/package.json
git commit -m "chore: bump version to x.y.z"
git tag vx.y.z
git push origin main --tags
```

The `.github/workflows/publish.yml` workflow triggers on `v*` tags, builds the library in production mode, and publishes `dist/gcanvas` to `https://npm.pkg.github.com`.

No manual secrets are needed — the workflow uses the built-in `GITHUB_TOKEN`.

## Keyboard shortcuts (in the canvas)

| Key | Action |
|-----|--------|
| Click | Select element |
| Double-click | Enter text edit mode |
| Escape | Deselect / exit text edit |
| Delete / Backspace | Remove selected element |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z / Ctrl+Y | Redo |
