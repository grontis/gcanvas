# gcanvas — Angular No-Code Canvas Editor Library

## Context

Building a reusable Angular npm package called `gcanvas` that provides a no-code webpage canvas editor. The library allows Angular app developers to embed a visual canvas where end users can place, drag, resize, and edit text boxes (with rich text) and images. The library is storage-agnostic — it accepts `CanvasData` as input and emits change events; persistence is the consumer's responsibility.

The Angular ecosystem lacks a native, idiomatic canvas editor library. Most alternatives (GrapesJS, Unlayer) are framework-agnostic or React-focused. This fills that gap.

Starting from a blank directory: `C:\Users\grant\_dev\gcanvas`

---

## Phase 1: Project Scaffold

```bash
# From C:\Users\grant\_dev\gcanvas
ng new gcanvas --no-create-application --skip-git
cd gcanvas
ng generate library gcanvas --prefix=gc
ng generate application demo --routing=false --style=scss
npm install @angular/cdk
npm install @tiptap/core @tiptap/starter-kit @tiptap/extension-text-style @tiptap/extension-color @tiptap/extension-underline @tiptap/html ngx-tiptap
```

---

## Phase 2: Data Model

**File: `projects/gcanvas/src/lib/models/canvas-element.model.ts`**

```typescript
import type { JSONContent } from '@tiptap/core';

export type BuiltInElementType = 'text' | 'image';
// Plugin element types use string — keep CanvasElement as a discriminated union
// and provide a GenericCanvasElement for plugin authors.

export interface ElementPosition { x: number; y: number; }
export interface ElementSize { width: number; height: number; }

export interface BaseCanvasElement {
  id: string;
  type: string;
  position: ElementPosition;
  size: ElementSize;
  zIndex: number;
  locked?: boolean;
  styles?: Record<string, string>;
}

export interface TextCanvasElement extends BaseCanvasElement {
  type: 'text';
  content: JSONContent; // TipTap JSON document — serialization is the consumer's responsibility
}

export interface ImageCanvasElement extends BaseCanvasElement {
  type: 'image';
  src: string;
  alt?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
}

/** For plugin element types not covered by the built-in union. */
export interface GenericCanvasElement extends BaseCanvasElement {
  [key: string]: unknown;
}

export type CanvasElement = TextCanvasElement | ImageCanvasElement | GenericCanvasElement;
```

**File: `projects/gcanvas/src/lib/models/canvas-data.model.ts`**

```typescript
import type { CanvasElement } from './canvas-element.model';

export interface CanvasViewport {
  width: number;  // px — canvas is always a fixed-size artboard
  height: number; // px
  backgroundColor?: string;
}

export interface CanvasData {
  version: number; // start at 1
  viewport: CanvasViewport;
  elements: CanvasElement[];
}

export interface CanvasChangeEvent {
  canvasData: CanvasData;
  changedElementIds: string[]; // affected element(s); empty for viewport-only changes
  changeType: 'move' | 'resize' | 'edit' | 'add' | 'remove' | 'reorder' | 'viewport';
}
```

---

## Phase 3: Library File/Folder Structure

```
projects/gcanvas/src/
├── public-api.ts
└── lib/
    ├── models/
    │   ├── canvas-element.model.ts
    │   ├── canvas-data.model.ts
    │   └── index.ts
    ├── tokens/
    │   └── element-registry.token.ts    # plugin injection token
    ├── services/
    │   ├── canvas-state.service.ts      # signal-based state, mutation methods
    │   └── selection.service.ts         # selected element tracking
    ├── canvas/
    │   ├── canvas.component.ts          # main public component
    │   ├── canvas.component.html
    │   └── canvas.component.scss
    ├── elements/
    │   ├── element-wrapper/
    │   │   ├── element-wrapper.component.ts   # wraps each element: drag, select, resize handles
    │   │   ├── element-wrapper.component.html
    │   │   └── element-wrapper.component.scss
    │   ├── text-element/
    │   │   ├── text-element.component.ts
    │   │   ├── text-element.component.html
    │   │   └── text-element.component.scss
    │   └── image-element/
    │       ├── image-element.component.ts
    │       ├── image-element.component.html
    │       └── image-element.component.scss
    └── toolbar/
        ├── floating-toolbar.component.ts   # rich text formatting bar
        ├── floating-toolbar.component.html
        └── floating-toolbar.component.scss
```

---

## Phase 4: Component Architecture

### `CanvasStateService`
- Provided at `CanvasComponent` level (not root) — one instance per canvas
- Internal `WritableSignal<CanvasData>`; exposes **readonly** `Signal<CanvasData>` publicly
- Mutation methods: `loadSnapshot`, `moveElement`, `resizeElement`, `updateContent`, `addElement`, `removeElement`, `reorderElement(id, newZIndex)`
- Each mutation emits a `CanvasChangeEvent` via an internal `Subject` exposed as `changes$: Observable<CanvasChangeEvent>`
- **Undo/redo**: maintains a history stack (capped at ~50 snapshots). Methods: `undo()`, `redo()`, signals: `canUndo`, `canRedo`

### `SelectionService`
- Also provided at `CanvasComponent` level
- `selectedId: Signal<string | null>` (readonly public; writable internally)
- Methods: `select(id)`, `deselect()`
- **Does NOT handle keyboard events** — keyboard bindings live in `CanvasComponent` (see below)

### `CanvasComponent` (selector: `gc-canvas`)
```typescript
@Component({
  selector: 'gc-canvas',
  providers: [CanvasStateService, SelectionService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { tabindex: '0' }, // focusable for keyboard events
})
export class CanvasComponent {
  canvasData = input.required<CanvasData>();
  canvasChange = output<CanvasChangeEvent>();
}
```
- Uses `effect()` to call `canvasStateService.loadSnapshot()` when `canvasData` input changes
- Renders elements via `@for (el of canvasStateService.elements(); track el.id)`
- Each element is wrapped in `<gc-element-wrapper>` which contains `NgComponentOutlet` + `ngComponentOutletInputs` to pass the `CanvasElement` data to the dynamic component
- Emits `canvasChange` by subscribing to `canvasStateService.changes$`
- Handles keyboard events via `@HostListener`:
  - `Escape` → `selectionService.deselect()`
  - `Delete` / `Backspace` → `canvasStateService.removeElement(selectedId)`
  - `Ctrl+Z` → `canvasStateService.undo()`
  - `Ctrl+Shift+Z` / `Ctrl+Y` → `canvasStateService.redo()`

### `ElementWrapperComponent`
Replaces the original `BaseElementDirective` + `GcResizableDirective`. A directive cannot add `cdkDrag` to its host, and a directive cannot render resize handle elements. A wrapper **component** solves both:
- Receives `element: CanvasElement` as `@Input`
- Template includes `cdkDrag` on its root `<div>`, with `[cdkDragFreeDragPosition]` bound to element position
- When selected (`selectionService.selectedId() === element.id`), renders 8 resize handles as child `<div>`s
- Resize handles use `pointerdown`/`pointermove`/`pointerup` with `setPointerCapture`
- Calculates new size+position based on which handle was grabbed
- On `pointerup`: calls `canvasStateService.resizeElement()`
- Enforces minimum 50×50px
- Calls `selectionService.select(id)` on click
- Uses `NgComponentOutlet` + `[ngComponentOutletInputs]="{ element }"` to render the inner element component

### `TextElementComponent`
- Receives `element: TextCanvasElement` via input
- State machine: DISPLAY → EDIT (double-click) → DISPLAY (blur/Escape)
- DISPLAY mode: renders stored TipTap JSON as HTML using `generateHTML()` (from `@tiptap/html`)
- EDIT mode: mounts TipTap `Editor` with `ngx-tiptap` directive, debounces `onUpdate` to call `canvasStateService.updateContent()`
- Destroys `Editor` instance on mode switch and `ngOnDestroy`
- When entering EDIT mode, sets `selectionService.activeEditor` signal (see toolbar wiring below)

### `ImageElementComponent`
- Receives `element: ImageCanvasElement` via input
- Binds `[src]` and `[alt]` from element model
- Shows placeholder SVG when `src` is empty

### `FloatingToolbarComponent`
- Rendered inside `CanvasComponent` template (sibling to the element list)
- Reads the active TipTap `Editor` from `selectionService.activeEditor` signal (set by `TextElementComponent` on edit, cleared on blur)
- Conditionally visible only when `activeEditor()` is non-null
- Positioned with CDK Overlay (preferred) or `position: absolute` relative to the canvas, computed from the active element's bounding rect
- Bold / italic / underline / text color buttons calling `editor.chain()...run()`

---

## Phase 5: Key Implementation Details

### Drag (Angular CDK)
Template lives in `ElementWrapperComponent`:
```html
<div
  cdkDrag
  [cdkDragFreeDragPosition]="{ x: element.position.x, y: element.position.y }"
  [cdkDragDisabled]="element.locked ?? false"
  (cdkDragEnded)="onDragEnded($event)"
  style="position: absolute; left: 0; top: 0;"
>
```
```typescript
onDragEnded(event: CdkDragEnd) {
  const pos = event.source.getFreeDragPosition();
  this.canvasStateService.moveElement(this.element.id, pos);
  event.source.reset(); // CRITICAL: prevents double-offset on re-render
}
```
Canvas host: `position: relative; overflow: hidden`

**Reactivity caveat**: When the parent pushes new `canvasData` (e.g., from undo), the `cdkDragFreeDragPosition` binding updates. After `reset()`, cdkDrag clears its internal transform, so the next render picks up the new position from the signal. This flow must be tested explicitly — cdkDrag's internal state can conflict with signal-driven re-renders if `reset()` is missed.

### Plugin System (Element Registry Token)
```typescript
export interface ElementRegistryEntry {
  type: string;                     // matches BaseCanvasElement.type
  component: Type<unknown>;         // the component class to render
}

export const ELEMENT_REGISTRY_TOKEN = new InjectionToken<ElementRegistryEntry[]>('gc.elementRegistry');
```

Built-in entries (`text` → `TextElementComponent`, `image` → `ImageElementComponent`) are registered in `CanvasComponent`'s `providers` array.

`ElementWrapperComponent` looks up the component via: `registry.find(e => e.type === element.type)?.component`

Consumers extend via:
```typescript
{ provide: ELEMENT_REGISTRY_TOKEN, useValue: { type: 'video', component: VideoElementComponent }, multi: true }
```

### Angular Patterns
- Signals + `input()` / `output()` throughout (Angular 19 idiomatic)
- `ChangeDetectionStrategy.OnPush` on all components
- Standalone components only (no NgModules)
- `@for` with `track el.id`

---

## Phase 6: Public API (`public-api.ts`)

```typescript
export { CanvasComponent } from './lib/canvas/canvas.component';
export { ElementWrapperComponent } from './lib/elements/element-wrapper/element-wrapper.component';
export { TextElementComponent } from './lib/elements/text-element/text-element.component';
export { ImageElementComponent } from './lib/elements/image-element/image-element.component';
export { FloatingToolbarComponent } from './lib/toolbar/floating-toolbar.component';
export { CanvasStateService } from './lib/services/canvas-state.service';
export { SelectionService } from './lib/services/selection.service';
export { ELEMENT_REGISTRY_TOKEN, type ElementRegistryEntry } from './lib/tokens/element-registry.token';
export * from './lib/models/canvas-element.model';
export * from './lib/models/canvas-data.model';
```

---

## Phase 7: Build & Publish

**Development workflow:**
```bash
# Terminal 1: watch-build library
ng build gcanvas --watch

# Terminal 2: serve demo app
ng serve demo
```

`tsconfig.json` path alias: `"gcanvas": ["dist/gcanvas"]` — demo imports `gcanvas` as if it were a real npm consumer.

**Publish:**
```bash
ng build gcanvas --configuration=production
cd dist/gcanvas
npm publish --access public
```

**`projects/gcanvas/package.json` peerDependencies:**
```json
{
  "@angular/common": ">=19.0.0",
  "@angular/core": ">=19.0.0",
  "@angular/cdk": ">=19.0.0",
  "@tiptap/core": ">=2.0.0",
  "@tiptap/html": ">=2.0.0",
  "@tiptap/starter-kit": ">=2.0.0",
  "@tiptap/extension-text-style": ">=2.0.0",
  "@tiptap/extension-color": ">=2.0.0",
  "@tiptap/extension-underline": ">=2.0.0",
  "ngx-tiptap": ">=9.0.0"
}
```

---

## Verification

1. `ng build gcanvas` completes with no errors
2. `ng serve demo` starts the demo app
3. Demo app renders `<gc-canvas [canvasData]="data" (canvasChange)="onchange($event)">` successfully
4. Can drag a text element; `canvasChange` fires with correct new position
5. Double-clicking a text element activates TipTap editor; typing updates emitted `canvasData`
6. Dragging resize handle changes element size; `canvasChange` fires
7. Image element renders with bound `src`
8. Selecting an element shows resize handles; pressing Delete removes it from emitted `canvasData`

---

## Critical Files (Implementation Order)

1. `projects/gcanvas/src/lib/models/canvas-element.model.ts` — interfaces everything depends on
2. `projects/gcanvas/src/lib/models/canvas-data.model.ts`
3. `projects/gcanvas/src/lib/models/index.ts` — barrel export
4. `projects/gcanvas/src/lib/tokens/element-registry.token.ts`
5. `projects/gcanvas/src/lib/services/canvas-state.service.ts` — includes undo/redo history
6. `projects/gcanvas/src/lib/services/selection.service.ts` — includes `activeEditor` signal for toolbar
7. `projects/gcanvas/src/lib/elements/element-wrapper/element-wrapper.component.ts` — drag, select, resize handles
8. `projects/gcanvas/src/lib/elements/text-element/text-element.component.ts`
9. `projects/gcanvas/src/lib/elements/image-element/image-element.component.ts`
10. `projects/gcanvas/src/lib/toolbar/floating-toolbar.component.ts`
11. `projects/gcanvas/src/lib/canvas/canvas.component.ts` — keyboard bindings live here
12. `projects/gcanvas/src/public-api.ts`
13. `projects/demo/src/app/app.component.ts` — demo wiring
