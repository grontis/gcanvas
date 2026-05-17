# Canvas Editor — Design Integration & Implementation Plan

**Source designs:** `designs/canvas_editor/Canvas Editor Wireframes.html` (v2 / technical) and `Canvas Editor Wireframes v1 sketch.html` (v1 / hand-sketched). The v2 wireframes are the source of truth; v1 is the earlier sketch and adds no new screens.

**Existing implementation:** Angular 19 library at `projects/gcanvas` exposing a single `<gc-canvas>` component plus `CanvasStateService`, `SelectionService`, and a 3-element registry (text/image/generic). The demo at `projects/demo` is a one-row toolbar above the canvas. See `PLAN.md` for the original architecture.

This document covers (1) what the designs introduce, (2) what's already in the library, (3) the architectural shift required to integrate them, and (4) a phased implementation plan.

---

## 1. What the designs introduce

The designs cover **8 screens** with a single editor having **4 layout variations**:

| # | Screen | Notes |
|---|--------|-------|
| 1 | **Editor** | 4 layout variations (V1 classic three-panel, V2 icon rail + flyout, V3 canvas-first with ⌘K, V4 unified left panel). V1 is the recommended default. |
| 2 | **Empty canvas / new project** | Empty-state placeholder centered on the page; right inspector switches to **Page** properties (name, slug, background, max width, padding, SEO). |
| 3 | **Text editing** | Floating rich-text toolbar with heading dropdown, font size, B/I/U, link, list, color, more. Right inspector shows full typography (family, weight, size, line, letter, color, alignment, **per-breakpoint overrides**). |
| 4 | **Image editing** | Resize handles + **snap guides** + **dimension pills** + aspect-ratio lock indicator. Floating action toolbar (Replace / Crop / Fit / Link / More). Inspector adds Source, Fit, **Focal point**, Alt, Effects (Radius, Shadow). Hint: ⇧ to lock ratio, ⌥ to resize from center. |
| 5 | **Components & assets library (full modal)** | Three-pane: category nav / searchable grid / detail pane. |
| 6 | **Responsive preview** | Separate mode (not a dropdown). Mobile/Tablet/Desktop side-by-side under a black preview chrome. |
| 7 | **Publish modal** | URL confirm + change list + pre-flight checklist (mobile-friendly, SEO, alt-text, links). |
| 8 | **Templates picker** | Onboarding entry point — category chips + grid of template cards + "Blank canvas" tile. |

### Cross-cutting affordances introduced
- **Top chrome bar** — breadcrumbs (`Projects / Sunrise Bakery / Home`), save status pill (`● Saved`), undo/redo kbds, **Publish** button, breakpoint switcher.
- **Tool toolbar** — modal tools (Cursor / Text / Image / Shape / Button / Layers / Trash) with active-tool state, plus zoom indicator and breakpoint switcher.
- **Element type-specific** floating action toolbars above selection (today only the rich-text toolbar exists, and only during text-edit).
- **Element label badge** anchored to the top-left of a selected element (e.g. `Image · hero.jpg`).
- **Dimension pills** showing live W×H during drag/resize, plus a width-measurement pill above the element.
- **Snap guides** — vertical/horizontal accent lines drawn while an element aligns with siblings or canvas edges.
- **Aspect-ratio lock** during resize (Shift modifier), **resize from center** (Alt modifier).
- **Component palette** — categorized grid (Layout / Content / Media) with hover preview and drag-to-canvas affordance.
- **Layers tree** — element hierarchy with selection sync and indentation for nested sections.
- **Page inspector** — when nothing is selected, the inspector shows page-level properties.
- **Command palette (⌘K)** — global "do anything" entry point.
- **Tweaks panel** — runtime theming (accent color, density, panel toggles). Likely a demo affordance, not a library feature.
- **Element types beyond text/image**: heading, paragraph, list, quote, button, shape, card, form, video, embed, section/columns/stack containers.

---

## 2. Mapping designs → existing implementation

### Already in `@grontis/gcanvas`
| Design feature | Where it lives |
|---|---|
| Canvas viewport with positioned, draggable elements | `CanvasComponent` + `ElementWrapperComponent` |
| Selection (click) + 8-point resize handles | `ElementWrapperComponent` (`projects/gcanvas/src/lib/elements/element-wrapper/element-wrapper.component.ts:38-144`) |
| Min size 50×50 enforced | `CanvasStateService` (`canvas-state.service.ts:7,56-64`) |
| Text element with TipTap rich-text edit (B/I/U + color) | `TextElementComponent` + `FloatingToolbarComponent` (`text-element.component.ts:54-87`, `floating-toolbar.component.ts:46-52`) |
| Image element with `objectFit` + placeholder | `ImageElementComponent` |
| Undo/redo with 50-step history, signals `canUndo`/`canRedo` | `CanvasStateService` (`canvas-state.service.ts:6,24-32,98-117`) |
| Selection state + active TipTap editor signal | `SelectionService` |
| Element registry (plug-in element types) | `ELEMENT_REGISTRY_TOKEN` |
| Storage-agnostic input/output (`canvasData` in, `canvasChange` out) | `CanvasComponent` (`canvas.component.ts:46-67`) |
| Keyboard: Esc / Del / Ctrl+Z / Ctrl+Y | `CanvasComponent` (`canvas.component.ts:71-99`) |

### Net-new for the library
1. **More element types** — heading, paragraph, button, shape (and the registry is ready to receive them).
2. **Snap-to-guides** logic + visual overlay (vertical/horizontal accent lines, drawn from sibling/edge alignment).
3. **Dimension pill** + width-measurement pill during drag/resize.
4. **Element label badge** ("Image · hero.jpg") on selected element.
5. **Aspect-ratio lock** (Shift) and **resize-from-center** (Alt) modifiers.
6. **Floating action toolbar** for non-text elements (Replace/Crop/Fit for images; Link/More for any element).
7. **Extended TipTap extensions** — Heading, Link, BulletList/OrderedList, TextAlign, FontFamily/FontSize, Highlight.
8. **Drag-from-palette** insertion (CDK drop list) — currently only existing elements can be dragged.
9. **Click-to-place tool mode** (ToolStateService) — pick a tool, click on canvas to insert.
10. **Arrow-key nudge** (1 px / Shift+10 px) and **Cmd/Ctrl+D duplicate**, **Cmd/Ctrl+C/V copy/paste**.
11. **Z-index reorder UI primitives** (the service has `reorderElement`; no UI consumes it).
12. **Optional**: container/nested elements (section, columns, stack) — see "open decisions" below.

### Net-new for the editor shell (left/right panels, chrome, modals)
13. **Top chrome bar** with breadcrumbs, save status, undo/redo buttons, Publish CTA.
14. **Tool toolbar** with active-tool state, zoom selector, breakpoint switcher.
15. **Left panel** with tabbed content: Components palette / Layers tree / Assets browser.
16. **Right inspector panel** — selection-driven sections (Position/Size, Image, Typography, Effects, Link, Page-when-nothing-selected).
17. **Library modal** — full-screen browse view.
18. **Responsive preview mode** (separate route).
19. **Publish modal**.
20. **Template picker** (entry point for new projects).
21. **Command palette (⌘K)**.

### Out of scope for the library (demo concerns)
- Persistence (localStorage / API) — already storage-agnostic.
- Project name / breadcrumb data — passed into the shell as inputs.
- Actual publish/share/template fetching — stubs only.

---

## 3. Architecture

### 3.1 Where does the shell live — library or demo?

**Decision: in the library, as opt-in composable shell components.**

- The library should ship a complete drop-in editor (`<gc-canvas-editor>`); rebuilding it per consumer defeats the package's value-prop.
- Shell pieces are independently exported (`<gc-editor-toolbar>`, `<gc-editor-inspector>`, `<gc-component-palette>`, `<gc-layers-panel>`, etc.) so consumers can compose layout V2/V3/V4 if they want.
- `<gc-canvas>` continues to exist for headless/embed use cases.

### 3.2 Provider scope — the central refactor

Today, `CanvasComponent` provides `CanvasStateService` and `SelectionService` at the component level (`canvas.component.ts:29-42`). That works for a single canvas, but it means **sibling shell components rendered outside `<gc-canvas>` cannot inject the same instance**. The shell's left panel, inspector, layers tree, etc. all need to read+write canvas state.

**Refactor:**

1. Split `CanvasComponent` into two:
   - **`CanvasViewComponent`** (selector `gc-canvas-view`): the rendering surface — viewport `<div>`, `@for` of element wrappers, floating toolbar host. **No providers**, no inputs/outputs. Reads `CanvasStateService` and `SelectionService` from the injector. **Owns the keyboard host listeners** (`Esc` / `Del` / `Backspace` / `Ctrl+Z` / `Ctrl+Y` / `Ctrl+Shift+Z`) and `tabindex: '0'` — so the shortcuts fire identically whether the view is nested inside `<gc-canvas>` (standalone) or `<gc-canvas-editor>` (shell). The shell gets them for free by rendering `<gc-canvas-view>` directly.
   - **`CanvasComponent`** (selector `gc-canvas`, unchanged public API): provides the services + `ELEMENT_REGISTRY_TOKEN`, syncs the `canvasData` input → `loadSnapshot`, wires `canvasChange` output. Renders `<gc-canvas-view>` internally; no longer declares keyboard handlers (they move down to the view).

2. Add a `provideCanvas(config?)` helper (Angular 19 idiomatic):
   ```ts
   export function provideCanvas(config?: { registry?: ElementRegistryEntry[] }): EnvironmentProviders {
     return makeEnvironmentProviders([
       CanvasStateService,
       SelectionService,
       { provide: ELEMENT_REGISTRY_TOKEN, useValue: config?.registry ?? defaultRegistry },
     ]);
   }
   ```
   `CanvasComponent` uses it in its `providers`. `<gc-canvas-editor>` also uses it, hoisting the services to the shell scope so all panels share them.

3. **Backward compatibility** — `CanvasComponent`'s public API (selector, `canvasData` input, `canvasChange` output, keyboard handlers) is unchanged. Existing demo code continues to work without modification.

### 3.3 New shell-level services

| Service | Purpose | Notes |
|---|---|---|
| **`ToolStateService`** | Active tool: `'select' \| 'text' \| 'image' \| 'shape' \| 'button'`. Click-to-place flow. | Provided at shell scope. Canvas-view consults it on click for placement. |
| **`BreakpointService`** | Active editing breakpoint: `'desktop' \| 'tablet' \| 'mobile'`. | Affects canvas viewport width + per-bp data overrides if implemented. |
| **`EditorChromeService`** | Project name / breadcrumb / save status / publish state. | Driven by inputs to `<gc-canvas-editor>`. `saveStatus: 'saved' \| 'saving' \| 'unsaved'` is set by the consumer based on its own persistence outcome (e.g. debounced after `canvasChange`); the library only displays the signal. The "Editing text" accent pill is a separate derivation — rendered internally in the chrome top bar whenever `SelectionService.activeEditor() !== null`, replacing the save pill for that duration. Consumers never drive it. |
| **`SnapGuideService`** | Computes alignment guides from sibling/edge positions during drag/resize. | Shared by `ElementWrapperComponent` (during gesture) and a new `<gc-snap-guides-overlay>` (rendering). |
| **`AssetsService`** | Recent images, stock library entries. Defaults to in-memory; consumers override. | InjectionToken pattern (like `ELEMENT_REGISTRY_TOKEN`) so consumers plug in their own asset providers. |
| **`CommandPaletteService`** | Registry of commands + open/close state. | Commands are registered by feature modules (`registerCommand({ id, label, kbd, run })`). |

### 3.4 Component tree of the new editor

```
<gc-canvas-editor>                 ← top-level shell, hoists providers
  providers: provideCanvas(), ToolStateService, BreakpointService,
             EditorChromeService, SnapGuideService, AssetsService,
             CommandPaletteService
  ┌── <gc-editor-chrome-top>       breadcrumbs · save status · undo/redo · publish
  ├── <gc-editor-toolbar>          tool select · zoom · breakpoint switcher
  ├── <gc-editor-left-panel>       tabbed: Components / Layers / Assets
  │   ├── <gc-component-palette>     categorized grid · drag source
  │   ├── <gc-layers-panel>          tree of elements
  │   └── <gc-assets-panel>          image library
  ├── <gc-canvas-view>             the canvas surface (no input/output, reads services)
  │   ├── @for element wrapper       (existing)
  │   ├── <gc-snap-guides-overlay>   (new) draws guide lines + dim pills
  │   ├── <gc-floating-text-toolbar> (existing FloatingToolbarComponent — extended)
  │   ├── <gc-floating-action-toolbar>(new) Replace/Crop/Fit/Link/More
  │   └── <gc-empty-state>           (new) shown when elements.length === 0
  ├── <gc-editor-inspector>        right panel
  │   ├── <gc-position-size-section>
  │   ├── <gc-image-section>           (visible when image selected)
  │   ├── <gc-typography-section>      (visible when text selected)
  │   ├── <gc-effects-section>
  │   └── <gc-page-section>            (visible when nothing selected)
  ├── <gc-command-palette>         ⌘K modal
  ├── <gc-publish-modal>           triggered by chrome's Publish button
  └── <gc-template-picker>         optional onboarding overlay
</gc-canvas-editor>
```

### 3.5 Public API of `<gc-canvas-editor>`

```ts
@Component({ selector: 'gc-canvas-editor', ... })
export class CanvasEditorComponent {
  // Same I/O shape as <gc-canvas> for parity:
  canvasData    = input.required<CanvasData>();
  canvasChange  = output<CanvasChangeEvent>();

  // Chrome metadata (drives the top bar):
  projectName   = input<string>('Untitled');
  breadcrumbs   = input<string[]>([]);
  saveStatus    = input<'saved' | 'saving' | 'unsaved'>('saved');
  // Note: the "Editing text" pill is rendered internally when a TipTap editor
  // is active; consumers do not pass it in.

  // Layout preset — V1..V4 from the wireframes. Authoritative for panel visibility.
  layout        = input<'classic' | 'rail' | 'canvas-first' | 'unified-left'>('classic');

  // Panel visibility overrides. If left undefined, each value is derived from `layout`.
  showTopBar    = input<boolean | undefined>(undefined);
  showToolbar   = input<boolean | undefined>(undefined);
  showLeftPanel = input<boolean | undefined>(undefined);
  showInspector = input<boolean | undefined>(undefined);

  // Action stubs the consumer wires:
  publish       = output<void>();
  preview       = output<'mobile' | 'tablet' | 'desktop' | 'all'>();
}
```

**Layout ↔ visibility derivation.** `layout` is the authoritative source; explicit `showTopBar` / `showToolbar` / `showLeftPanel` / `showInspector` inputs override the preset's defaults. Preset defaults:

| Preset | `showTopBar` | `showToolbar` | `showLeftPanel` | `showInspector` |
|---|---|---|---|---|
| `classic` (V1) | `true` | `true` | `true` | `true` |
| `rail` (V2) | `true` | `true` | `true` (collapsed to icon rail) | `true` |
| `canvas-first` (V3) | `true` | `true` | `false` | `false` |
| `unified-left` (V4) | `true` | `true` | `true` (merged with inspector sections) | `false` |

### 3.6 Data model extensions

| Concern | Today | Proposed |
|---|---|---|
| Element types | `'text' \| 'image' \| GenericCanvasElement` | Keep `'text'` as a generic rich-text container (TipTap doc already expresses headings/lists/quotes via node types). Add `'button'` and `'shape'`. No `'heading'`/`'paragraph'`/`'list'`/`'quote'` element types — those are TipTap node types inside a `'text'` element. |
| Canvas viewport | `width / height / backgroundColor` | Add `maxWidth?: number`, `padding?: number \| { x: number; y: number }`. Used for V1's "max width 1200px" page-frame look. |
| Page metadata | None | Add `meta?: { name?: string; slug?: string; seoTitle?: string; seoDescription?: string }` to `CanvasData`. Drives the Page inspector. |
| Per-breakpoint overrides | None | **Deferred** (out of scope for this integration). Phase G's responsive preview renders the same data at three widths — cosmetic only. If demand surfaces post-launch, add `responsive?: { tablet?: Partial<Element>; mobile?: Partial<Element> }` and a per-bp inspector mode. |
| Aspect ratio lock | None | Element-level `lockAspectRatio?: boolean` for image elements. Shift-key behavior is a UI gesture (not persisted). |
| Container / nested elements | None | **Deferred** (out of scope for this integration). The flat `elements: CanvasElement[]` model can't express nesting. When introduced, change to `children?: CanvasElement[]` — major version bump. No `'section'`/`'columns'`/`'stack'` types until then. |
| Effects (radius, shadow, opacity, border) | `styles?: Record<string, string>` (open-ended) | Stays open-ended; the Effects inspector section writes typed CSS into `styles`. No model change needed. |
| Z-index | Arbitrary integers | On every reorder, normalize to dense `1..N` (cheap, avoids drift). Implemented in `CanvasStateService.reorderElement` in Phase D. |

The model extensions are **additive and optional** — existing `CanvasData` snapshots continue to load.

### 3.7 New element types — defaults

| Type | Defaults | Inspector sections |
|---|---|---|
| `'button'` | 140×40, `styles.background = ink`, `styles.color = white`, `content = 'Button'` | Position/Size, Typography (label), Effects, Link |
| `'shape'` | 200×200, `styles.background = #FAFBFC`, `styles.borderRadius = 6px` | Position/Size, Effects (fill, stroke, radius) |

Container types (`section`, `columns`, `stack`) are **deferred** — see "Open decisions" §6.

### 3.8 Snap guides — implementation sketch

`SnapGuideService` exposes:
```ts
class SnapGuideService {
  readonly activeGuides: Signal<Guide[]>;                 // [] when not gesturing
  computeSnap(
    draggingId: string,
    proposedRect: Rect,
    opts?: { disabled?: boolean },
  ): { rect: Rect; guides: Guide[] };
  clear(): void;                                          // called on gesture end
}
type Guide = { axis: 'x' | 'y'; position: number; range: [number, number] };
```

The service is pure: given a proposed rect and the sibling list (read from `CanvasStateService`), it returns the nearest-snapped rect (within a 4 px threshold) and the guides that were crossed. It maintains `activeGuides` as a signal for the overlay to render. `disabled: true` (Alt held) skips snap math but still clears the previous guides.

Snap targets: sibling edges (top/right/bottom/left), sibling centers, canvas edges, canvas vertical centerline.

**For drag (via cdkDrag):** use CDK's per-move hook `[cdkDragConstrainPosition]`. The wrapper binds a callback that CDK calls with the proposed pointer point on every move. The callback builds a `Rect` from `(proposedPoint, currentSize)`, calls `computeSnap(...)` (reading `event.altKey` from the captured modifier signal for the `disabled` flag), stores the returned `guides` on `SnapGuideService.activeGuides`, and returns the corrected point back to CDK. CDK applies its own transform from the returned value — no reassignment of `cdkDragFreeDragPosition` mid-gesture, no fight with CDK's transform math. On `cdkDragEnded`, the wrapper commits via `moveElement(event.source.getFreeDragPosition())` + `event.source.reset()` (existing pattern, `element-wrapper.component.ts:79-83`) and calls `clear()`.

**For resize (no cdkDrag):** the existing `onResizeMove` (`element-wrapper.component.ts:106-130`) calls `computeSnap(...)` with the proposed rect from the handle delta, then writes the corrected size/position into the existing `previewSize` / `previewPosition` signals (already bound to the wrapper's inline `[style]` — no change to bindings). Commit on pointerup unchanged. `onResizeEnd` calls `clear()`.

A new `<gc-snap-guides-overlay>` inside `<gc-canvas-view>` reads `activeGuides()` and renders absolutely-positioned guide divs + the dim pill.

**Why this shape.** `[cdkDragConstrainPosition]` is CDK's documented extension point for position correction — it's the right tool here. An earlier draft of this plan suggested writing snapped positions into `previewPosition` during drag, which would not have worked: today `previewPosition` is only read by inline-style bindings, not by CDK, and reassigning `cdkDragFreeDragPosition` mid-gesture fights CDK's internal transform.

### 3.9 Insertion gestures — implementation sketch

Both gestures ship together in Phase C. Palette drop is a discrete drop-point event and does not depend on the snap-guide work (Phase D).

**Click-to-add (and keyboard shortcuts).** Clicking a palette tile (or pressing its shortcut: `T` / `I` / `B` / `S`) inserts the element at canvas center. If a tool is active in `ToolStateService`, the next canvas click places the element at click coords. A tool stays active across multiple click placements until cancelled (Escape, switching tool, or a successful palette drop).

**Drag-from-palette (Angular CDK).**
- Each component-palette tile is a `cdkDrag` source carrying an element template `{ type, defaults }`.
- `<gc-canvas-view>` is a `cdkDropList` accepting drops; `cdkDropListEnterPredicate` accepts only palette items.
- On drop: compute drop coordinates relative to the canvas, call `canvasState.addElement({ ...template, id, position, zIndex })`. A successful palette drop also resets `ToolStateService.activeTool` to `'select'` so the user isn't left in placement mode after dropping.

---

## 4. Implementation phases

Each phase is independently shippable, ends with passing tests, and leaves the demo runnable.

### Phase A — Foundation refactor (no UX change)
Goal: shell scope can host providers without breaking the existing standalone canvas.

- Split `CanvasComponent` → `CanvasViewComponent` (rendering, no providers, **owns keyboard host listeners + `tabindex: '0'`**) + `CanvasComponent` (thin wrapper, public API unchanged; renders `<gc-canvas-view>`).
- Move `Esc` / `Del` / `Backspace` / `Ctrl+Z` / `Ctrl+Y` / `Ctrl+Shift+Z` handlers from `CanvasComponent` down to `CanvasViewComponent`. Behavior is unchanged from a consumer's perspective: focusing the canvas surface still activates the shortcuts. The benefit is that `<gc-canvas-editor>` inherits them by rendering `<gc-canvas-view>` directly.
- Add `provideCanvas()` environment-providers helper.
- Add `ToolStateService`, `BreakpointService`, `EditorChromeService` skeletons (signals only).
- Existing `phase3.spec.ts`, `canvas-state.service.spec.ts`, `canvas-state-integration.spec.ts`, `selection.service.spec.ts`, `text-element.component.spec.ts`, `models.spec.ts` continue to pass.

**Files added/changed:**
- `projects/gcanvas/src/lib/canvas/canvas-view.component.ts` (new)
- `projects/gcanvas/src/lib/canvas/canvas.component.ts` (slim down to wrapper)
- `projects/gcanvas/src/lib/providers/provide-canvas.ts` (new)
- `projects/gcanvas/src/lib/services/tool-state.service.ts` (new)
- `projects/gcanvas/src/lib/services/breakpoint.service.ts` (new)
- `projects/gcanvas/src/lib/services/editor-chrome.service.ts` (new)
- `projects/gcanvas/src/public-api.ts` (export new pieces)

**Acceptance:** `<gc-canvas>` selector, `canvasData` input, `canvasChange` output, providers, and keyboard handlers are unchanged from the consumer's perspective — the split is internal only. Demo app continues to compile and run unchanged; `ng build gcanvas` clean; tests pass. Any external consumer of `<gc-canvas>` continues to work without code changes.

---

### Phase B — Editor shell skeleton + chrome + page inspector
Goal: visible shell with the V1 layout, but only the chrome bar and right inspector are functional.

- New `<gc-canvas-editor>` with CSS grid layout matching the V1 wireframe (`grid-template-columns: 248px 1fr 296px`, `grid-template-rows: 40px 44px 1fr`).
- `<gc-editor-chrome-top>`: breadcrumbs, save-status pill, undo/redo buttons (wired to `canvasState.undo/redo` + `canUndo/canRedo` signals), Publish button (emits `publish` output, no modal yet).
- `<gc-editor-inspector>` shell with section components scaffolded.
- `<gc-position-size-section>`: reads selected element via `SelectionService` + `CanvasStateService`; displays X/Y/W/H; on edit, calls `moveElement` / `resizeElement`.
- `<gc-page-section>`: shown when `selectedId() === null`; edits viewport bg color, max width, padding; emits `'viewport'` change event (extend `CanvasStateService` with `updateViewport(viewport)` method — currently missing).
- Demo app updated to render `<gc-canvas-editor>` instead of `<gc-canvas>`. Existing buttons retired.

**Files added/changed:**
- `projects/gcanvas/src/lib/editor/canvas-editor.component.{ts,html,scss}` (new)
- `projects/gcanvas/src/lib/editor/chrome/chrome-top.component.{ts,html,scss}` (new)
- `projects/gcanvas/src/lib/editor/inspector/inspector.component.{ts,html,scss}` (new)
- `projects/gcanvas/src/lib/editor/inspector/sections/position-size-section.component.ts` (new)
- `projects/gcanvas/src/lib/editor/inspector/sections/page-section.component.ts` (new)
- `projects/gcanvas/src/lib/services/canvas-state.service.ts` (add `updateViewport`)
- `projects/demo/src/app/app.component.{ts,html,scss}` (use `<gc-canvas-editor>`)

**Acceptance:** demo shows three-panel layout. Selecting an element shows Position/Size, edits round-trip through `canvasChange`. Deselecting shows page properties. Undo/redo buttons reflect `canUndo/canRedo`.

---

### Phase C — Tool toolbar + component palette + new element types
Goal: users can add elements from the left panel and via toolbar tools.

- `<gc-editor-toolbar>`: tool buttons bound to `ToolStateService.activeTool`. Tools: select, text, image, shape, button. Plus zoom (display only initially) and breakpoint switcher (sets `BreakpointService.current`, no rendering effect yet).
- `<gc-component-palette>` left-panel tab: categorized grid (Layout-deferred / Content / Media). Each tile registered via a new `COMPONENT_PALETTE_TOKEN: PaletteEntry[]`.
  ```ts
  type PaletteEntry = {
    type: string;                 // matches element type
    label: string;
    icon: TemplateRef<unknown> | string;
    category: 'content' | 'media' | 'layout';
    shortcut?: string;            // 'T', 'I', etc.
    defaults: Omit<CanvasElement, 'id' | 'position' | 'zIndex'>;
  };
  ```
- **Click-to-add**: clicking a palette tile (or pressing its shortcut) inserts the element at canvas center; if a tool was active, the next canvas click places it at click coords.
- **Drag-from-palette**: palette tiles are `cdkDrag` sources carrying a template; `<gc-canvas-view>` is a `cdkDropList` accepting palette drops via `cdkDropListEnterPredicate`. On drop, compute canvas-relative coords and call `canvasState.addElement({ ...template, id, position, zIndex })`; reset `ToolStateService.activeTool` to `'select'`. Palette drop is discrete (drop point only) and does not depend on snap guides — those land in Phase D.
- New element components: `ButtonElementComponent`, `ShapeElementComponent`. Register in `ELEMENT_REGISTRY_TOKEN`'s default value.
- Keyboard shortcuts in `<gc-canvas-editor>`: `T` = add text, `I` = add image, `B` = add button, `S` = add shape (host-listened, only fires when canvas-editor has focus and no input is focused).
- Retire the demo's `Add Text Box` / `Add Image` buttons.

**Files added/changed:**
- `projects/gcanvas/src/lib/editor/toolbar/editor-toolbar.component.{ts,html,scss}` (new)
- `projects/gcanvas/src/lib/editor/left-panel/left-panel.component.{ts,html,scss}` (new)
- `projects/gcanvas/src/lib/editor/left-panel/component-palette.component.{ts,html,scss}` (new)
- `projects/gcanvas/src/lib/tokens/component-palette.token.ts` (new)
- `projects/gcanvas/src/lib/elements/button-element/` (new)
- `projects/gcanvas/src/lib/elements/shape-element/` (new)

**Acceptance:** clicking a palette tile or pressing T/I/B/S adds an element. Dragging a palette tile onto the canvas adds it at the drop point and switches back to the select tool. Active-tool highlight in toolbar. New element types render and are draggable/resizable.

---

### Phase D — Layers panel + element label + dim pill + snap guides
Goal: spatial awareness — layers tree, badges, snap behavior.

- `<gc-layers-panel>` left-panel tab: tree (flat for now, since no containers) of elements ordered by zIndex desc. Click row → select. Keyboard: drag-reorder updates zIndex (call `reorderElement`). Visibility/lock toggles per row.
- **Z-index normalization**: extend `CanvasStateService.reorderElement` to renumber all elements to dense `1..N` after every reorder, so zIndices don't drift over time.
- **Locked element treatment**: when `element.locked === true`, the wrapper suppresses resize handles, hides the floating action toolbar, disables `cdkDrag` (already done), and the badge shows a lock icon. The layer row greys out its drag handle. Re-clicking the lock toggle in the layer row unlocks.
- **Element label badge**: show `<type> · <name>` above selected element in the wrapper. `name` derives from the element (image filename, first 24 chars of text content, etc.) — add a tiny `elementLabel(el): string` util.
- **Dim pill** during drag/resize: bottom-right of the element shows live W×H. Wrapper component renders it conditionally on its existing `previewSize` signal.
- **Snap guides + width measurement pill**: implement `SnapGuideService` per §3.8. Add `<gc-snap-guides-overlay>` to `CanvasViewComponent`. For drag, bind `[cdkDragConstrainPosition]` on the wrapper to a callback that routes the proposed point through `computeSnap(...)` and returns the corrected point to CDK. For resize, thread `computeSnap(...)` into the existing `onResizeMove` and write the corrected size/position into the existing `previewSize` / `previewPosition` signals (no binding changes). On gesture end, call `clear()`.
- Snap targets: sibling edges (top/right/bottom/left), sibling centers, canvas edges, canvas vertical centerline. Threshold: 4 px. Holding `Alt` disables snap (during drag).

**Files added/changed:**
- `projects/gcanvas/src/lib/editor/left-panel/layers-panel.component.{ts,html,scss}` (new)
- `projects/gcanvas/src/lib/editor/canvas-overlay/snap-guides-overlay.component.{ts,html,scss}` (new)
- `projects/gcanvas/src/lib/services/snap-guide.service.ts` (new)
- `projects/gcanvas/src/lib/elements/element-wrapper/element-wrapper.component.{ts,html}` (extend with label + dim pill + snap integration)
- `projects/gcanvas/src/lib/util/element-label.util.ts` (new)

**Acceptance:** layers panel reflects element list and selection bidirectionally. Dragging an element shows guide lines when aligning with siblings. Selected element shows label badge above and dim pill below during gesture.

---

### Phase E — Image inspector + floating action toolbar + ratio lock
Goal: full-fidelity image editing.

- `<gc-image-section>` inspector: Source (with replace dropdown stub), Fit (cover/contain/fill/none segmented), Focal point (focal-box widget — 3×3 grid with draggable dot writing `styles.objectPosition`), Alt text.
- `<gc-effects-section>` inspector (visible for any element): Border radius, Shadow preset dropdown, Opacity slider, Border width+style.
- **`<gc-floating-action-toolbar>`**: dark pill above the selected element. Shown whenever an element is selected **and no TipTap editor is active** (i.e. not in text-edit mode). Button set varies by element type:
  - Image: Replace (opens file picker), Crop (stub, Phase G), Fit dropdown, Link, More menu.
  - Text (selected, not editing): Link, More.
  - Button / Shape: Link (button), More.
  The existing rich-text `FloatingToolbarComponent` replaces this pill whenever `selection.activeEditor() !== null`, so the two are mutually exclusive.
- **Aspect-ratio lock**: holding `Shift` during corner-handle resize constrains to the original ratio. Add a UI lock toggle in the inspector that persists `lockAspectRatio` on the element. Locked elements always constrain on corner resize.
- **Resize from center**: holding `Alt` during resize keeps the element's center fixed (mirror the delta to the opposite handle).
- Update `ElementWrapperComponent.onResizeMove` to read modifiers from the cached `pointermove` event.

**Files added/changed:**
- `projects/gcanvas/src/lib/editor/inspector/sections/image-section.component.ts` (new)
- `projects/gcanvas/src/lib/editor/inspector/sections/effects-section.component.ts` (new)
- `projects/gcanvas/src/lib/editor/canvas-overlay/floating-action-toolbar.component.{ts,html,scss}` (new)
- `projects/gcanvas/src/lib/elements/element-wrapper/element-wrapper.component.ts` (modifier-aware resize)
- `projects/gcanvas/src/lib/models/canvas-element.model.ts` (add optional `lockAspectRatio`)

**Acceptance:** images can be replaced, fit changed, focal point dragged, aspect ratio locked. Shift/Alt modifiers work during resize.

---

### Phase F — Typography inspector + extended rich-text toolbar
Goal: full-fidelity text editing.

- Extend `TextElementComponent` TipTap extensions with: `Heading`, `Link`, `BulletList` + `OrderedList` (already in StarterKit but expose buttons), `TextAlign`, `FontFamily`, `FontSize`, `Highlight`. Update peer-deps.
- Add a `TIPTAP_EXTENSIONS_TOKEN: AnyExtension[]` injection token so consumers can substitute their own extension list (or trim the default to reduce bundle size). `TextElementComponent` reads from this token instead of hard-coding the array. Default value bundles the common set above.
- Extend `FloatingToolbarComponent`:
  - Heading-level dropdown (paragraph / H1–H6) → `editor.chain().setHeading({ level })`.
  - Font size input (numeric) → `editor.chain().setFontSize(...)`.
  - Link button → modal/popover for URL.
  - List buttons (bullet, ordered).
  - Alignment segmented control (L/C/R/Justify).
  - Existing color picker stays.
- New `<gc-typography-section>` inspector: Family dropdown, Weight dropdown, Size, Line height, Letter spacing, Text color, Highlight, Alignment. Writes typed CSS into element `styles` (block-level defaults) and propagates to active TipTap selection when an editor is active.
- "Editing text" pill in the chrome top bar: when `selection.activeEditor() !== null`, the chrome renders an `Editing text` accent pill in place of the save-status pill. This is an internal derivation — consumers only drive `saveStatus: 'saved' | 'saving' | 'unsaved'` (§3.3, §3.5).

**Files added/changed:**
- `projects/gcanvas/src/lib/elements/text-element/text-element.component.ts` (read extensions from token)
- `projects/gcanvas/src/lib/tokens/tiptap-extensions.token.ts` (new)
- `projects/gcanvas/src/lib/toolbar/floating-toolbar.component.{ts,html,scss}` (extended controls)
- `projects/gcanvas/src/lib/editor/inspector/sections/typography-section.component.ts` (new)
- `projects/gcanvas/package.json` (peer-deps for new TipTap extensions)
- `README.md` (peer-dep install instructions)

**Acceptance:** floating toolbar matches the design's text-editing screen. Typography inspector edits propagate to selected text element + active TipTap selection.

---

### Phase G — Responsive preview + publish modal + template picker
Goal: secondary screens from the design.

- **Responsive preview** — route-level mode. The toolbar's preview button emits the `preview` output on `<gc-canvas-editor>` with the requested breakpoint (`'mobile' | 'tablet' | 'desktop' | 'all'`); the consumer routes to a standalone `<gc-responsive-preview [canvasData]="...">` page (its own route/component). The editor shell does not host a preview mode internally — keeping it focused on editing and avoiding embedded-preview complexity. `<gc-responsive-preview>` renders three read-only `<gc-canvas-view>` instances at fixed widths (360 / 720 / 1040), each inside its own `provideCanvas()` scope so state is isolated from the editor's.
- **Publish modal**: `<gc-publish-modal>` triggered by the chrome's Publish button. Shows live URL (consumer-provided via input), change list (computed from a `recentChanges$` accumulator on `EditorChromeService`), pre-flight checklist (alt-text presence per image, SEO title/description set, etc. — pure functions over `canvasData`). Emits `publish` output on confirm; consumer does the actual publish.
- **Template picker**: `<gc-template-picker>` overlay shown when `canvasData.elements.length === 0` and an `enableTemplatePicker` input is true. Templates registered via a new `TEMPLATE_REGISTRY_TOKEN: TemplateEntry[]` (each `TemplateEntry` has a name, category, preview thumbnail blocks, and a `() => CanvasData` factory). Selecting a template loads it via the consumer's `canvasChange` round-trip.

**Files added/changed:**
- `projects/gcanvas/src/lib/preview/responsive-preview.component.{ts,html,scss}` (new)
- `projects/gcanvas/src/lib/publish/publish-modal.component.{ts,html,scss}` (new)
- `projects/gcanvas/src/lib/publish/preflight.util.ts` (new — pure functions)
- `projects/gcanvas/src/lib/templates/template-picker.component.{ts,html,scss}` (new)
- `projects/gcanvas/src/lib/tokens/template-registry.token.ts` (new)

**Acceptance:** navigating to the consumer's preview route renders three breakpoints from the same `canvasData`. Publish modal opens with checklist. Empty canvas shows template picker.

---

### Phase H — Polish (command palette, library modal, theming, V2/V3/V4 layouts)
Goal: optional/experimental layouts and the long-tail polish from the designs.

- `<gc-command-palette>` (⌘K): registry-driven command list with fuzzy search.
- `<gc-library-modal>`: full-modal version of Screen 5. Reuses the same `<gc-component-palette>` from Phase C as the grid — wraps it with the category nav (left) and detail pane (right) so there's a single source of truth for palette entries.
- Theming via CSS custom properties: `--gc-accent`, `--gc-accent-soft`, `--gc-ink`, `--gc-bg`, `--gc-line`, `--gc-muted`. All shell components read from these vars; consumers override via host CSS. Documented in README. The wireframes' "Tweaks" panel stays a demo-only affordance — not shipped in the library.
- Alternative layout variations:
  - V2 (icon rail + flyout): `layout="rail"` collapses left panel to icons.
  - V3 (canvas-first): `layout="canvas-first"` hides left/right panels permanently; only floating toolbars + ⌘K.
  - V4 (unified left): `layout="unified-left"` merges Add/Layers/Style into the left panel and removes the right inspector.
- Tweaks panel — **demo only**, not a library feature.

**Acceptance:** cosmetically equivalent to the wireframes for the chosen layout. Consumers can switch layouts via the `layout` input.

---

## 5. Public API — final shape after Phase H

Additions to `projects/gcanvas/src/public-api.ts` (existing exports preserved):

```ts
// Top-level shell (recommended for most consumers)
export { CanvasEditorComponent } from './lib/editor/canvas-editor.component';

// Composable shell pieces (for custom layouts)
export { ChromeTopComponent } from './lib/editor/chrome/chrome-top.component';
export { EditorToolbarComponent } from './lib/editor/toolbar/editor-toolbar.component';
export { LeftPanelComponent } from './lib/editor/left-panel/left-panel.component';
export { ComponentPaletteComponent } from './lib/editor/left-panel/component-palette.component';
export { LayersPanelComponent } from './lib/editor/left-panel/layers-panel.component';
export { InspectorComponent } from './lib/editor/inspector/inspector.component';
export { CanvasViewComponent } from './lib/canvas/canvas-view.component';

// Bare canvas (existing — for headless/embed use)
export { CanvasComponent } from './lib/canvas/canvas.component';

// New services
export { ToolStateService } from './lib/services/tool-state.service';
export { BreakpointService } from './lib/services/breakpoint.service';
export { EditorChromeService } from './lib/services/editor-chrome.service';
export { SnapGuideService } from './lib/services/snap-guide.service';

// New tokens
export { COMPONENT_PALETTE_TOKEN, type PaletteEntry } from './lib/tokens/component-palette.token';
export { TEMPLATE_REGISTRY_TOKEN, type TemplateEntry } from './lib/tokens/template-registry.token';
export { ASSETS_PROVIDER_TOKEN, type AssetsProvider } from './lib/tokens/assets-provider.token';
export { TIPTAP_EXTENSIONS_TOKEN } from './lib/tokens/tiptap-extensions.token';

// New element types
export { ButtonElementComponent } from './lib/elements/button-element/button-element.component';
export { ShapeElementComponent } from './lib/elements/shape-element/shape-element.component';

// Provider helper
export { provideCanvas } from './lib/providers/provide-canvas';

// Existing exports preserved (services, models, ELEMENT_REGISTRY_TOKEN, FloatingToolbarComponent, etc.)
```

---

## 6. Confirmed decisions

This section is the canonical reference for each cross-cutting design call. Each is folded into the relevant phase or architecture section above.

| # | Decision | Folded into |
|---|---|---|
| 1 | **Container/nested elements** (`section`, `columns`, `stack`) are deferred. The flat `elements: CanvasElement[]` model stays for this integration. When introduced, `CanvasData.elements` becomes a tree (`children?: CanvasElement[]`) — major version bump. | §3.6 (data model) |
| 2 | **Per-breakpoint overrides** are deferred. Phase G renders the responsive preview from the same data at three widths (cosmetic only). If demand surfaces post-launch, add `responsive?: { tablet?: Partial<...>; mobile?: Partial<...> }` and a per-bp inspector mode. | §3.6 (data model), Phase G |
| 3 | **Both insertion gestures supported, both in Phase C.** Click-to-add and drag-from-palette ship together — palette drop is a discrete drop-point event and doesn't depend on snap-guide math (which lands in Phase D). | §3.9, Phase C |
| 4 | **TipTap extensions are bundled by default**, exposed via `TIPTAP_EXTENSIONS_TOKEN` so consumers can substitute their own list to reduce bundle size. | Phase F, §5 (public API) |
| 5 | **Z-index is normalized to dense `1..N` on every reorder** to avoid drift. Implemented in `CanvasStateService.reorderElement`. | §3.6, Phase D |
| 6 | **Tool/drag interaction:** a successful palette drop resets `ToolStateService.activeTool` to `'select'`. A tool stays active across multiple click placements until cancelled (Escape, switching tool, or palette drop). | §3.9, Phase C |
| 7 | **Locked elements** suppress resize handles, hide the floating action toolbar, disable `cdkDrag`, show a lock icon in the badge, and grey out the layer-row drag handle. The layer row's lock toggle unlocks. | Phase D |
| 8 | **`CanvasComponent`'s public API is preserved verbatim** through the Phase A refactor. Keyboard shortcuts (Esc / Del / Backspace / Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z) move from `CanvasComponent` down to `CanvasViewComponent`, along with `tabindex: '0'`. Behavior from the consumer's perspective is unchanged; the editor shell inherits the shortcuts for free by rendering `<gc-canvas-view>` directly. | Phase A (acceptance) |
| 9 | **Snap-guide / cdkDrag integration:** drag uses `[cdkDragConstrainPosition]` (CDK's per-move correction hook) — the callback returns the snapped point and CDK applies its own transform. No reassignment of `cdkDragFreeDragPosition` during the gesture, no fight with CDK's internal math. Resize uses the existing `previewSize` / `previewPosition` signals (already bound to the wrapper's inline styles). | §3.8, Phase D |
| 10 | **Library modal and left-panel palette share `<gc-component-palette>`** as the grid. The modal wraps it with category nav + detail pane. One source of truth for palette entries. | Phase H |
| 11 | **Theming via CSS custom properties:** `--gc-accent`, `--gc-accent-soft`, `--gc-ink`, `--gc-bg`, `--gc-line`, `--gc-muted`. Consumers override via host CSS. The wireframes' "Tweaks" panel stays a demo-only affordance — not shipped in the library. | Phase H, README |
| 12 | **Save status is consumer-driven, and split from text-edit state.** `EditorChromeService.saveStatus: 'saved' \| 'saving' \| 'unsaved'` is set by the consumer based on its own persistence outcome (e.g. debounced after `canvasChange`). The "Editing text" accent pill is a separate internal derivation: rendered in place of the save pill whenever `SelectionService.activeEditor() !== null`. Consumers never drive it. | §3.3, §3.5, Phase F |
| 13 | **`Alt` modifier is overloaded by gesture context.** During drag: disables snap. During corner-resize: locks the element's center (resize-from-center). The two gestures are mutually exclusive so there's no runtime conflict. Documented once in the keyboard-shortcuts table (Phase H). | §3.8, Phase E |
| 14 | **Layout ↔ visibility:** `layout` (V1–V4 preset) is the authoritative source for default panel visibility. The `showTopBar` / `showToolbar` / `showLeftPanel` / `showInspector` inputs override the preset's defaults — when left `undefined`, they derive from `layout` per the table in §3.5. | §3.5 |
| 15 | **Responsive preview is route-level, not in-place.** `<gc-canvas-editor>` emits a `preview` output; the consumer routes to a standalone `<gc-responsive-preview [canvasData]>` page. The editor shell does not host a preview mode. | Phase G |

---

## 7. Implementation order summary (Phase ↔ deliverable)

| Phase | Deliverable | Risk |
|---|---|---|
| A | Refactor: `CanvasViewComponent` + `provideCanvas()`. Public API unchanged. | Low — internal split; covered by existing tests. |
| B | Editor shell + chrome top + Position/Size + Page inspector. Demo migrates to `<gc-canvas-editor>`. | Low — new components, additive. |
| C | Toolbar + component palette + button/shape elements + T/I/B/S shortcuts. | Med — keyboard scoping, tool-mode interaction. |
| D | Layers panel + element label + dim pill + snap guides. | Med — snap math + cdkDrag interaction. |
| E | Image inspector + floating action toolbar + ratio lock + center-resize. | Low — localized to wrapper + one new section. |
| F | TipTap extensions + extended floating text toolbar + Typography inspector. | Med — TipTap version compatibility, peer-deps. |
| G | Responsive preview + publish modal + template picker. | Low — mostly UI, light data. |
| H | Command palette + library modal + alt layouts (V2/V3/V4) + theming polish. | Low — optional surface. |

Phases A–F are the core; G–H are nice-to-have and can be reordered or skipped per priority.

---

## 8. Testing strategy

For each phase, add unit tests in the same style as the existing `*.spec.ts` files (Jasmine + Angular `TestBed`):

- **Phase A**: provider-injection tests — `CanvasViewComponent` injected outside a `<gc-canvas>` (under `provideCanvas()`) sees the same service instance as a sibling component.
- **Phase B**: inspector edits round-trip through `canvasChange`. `updateViewport` mutation + history.
- **Phase C**: tool state transitions; keyboard shortcuts add elements; palette token registration.
- **Phase D**: snap-guide service computes correct guides from a sibling element list; layers reorder updates zIndex.
- **Phase E**: aspect-ratio constraint math; focal-point write-through to `styles.objectPosition`.
- **Phase F**: TipTap extension chain commands; typography-section writes propagate.
- **Phase G**: pre-flight pure functions (alt-text presence, SEO completeness); template factory produces valid `CanvasData`.

Existing integration test (`canvas-state-integration.spec.ts`) is the model; extend it with editor-shell scenarios.

---

## 9. Risks summary

1. **Provider refactor (Phase A)** is the only structural change. Mitigated by keeping `CanvasComponent`'s public surface identical (decision §6.8) and adding `<gc-canvas-view>` alongside, not replacing.
2. **CDK drag interaction with snap guides** — historically tricky (see `PLAN.md` §"Reactivity caveat"). Mechanism is now `[cdkDragConstrainPosition]` (decision §6.9), which is CDK's documented extension point for position correction — lower risk than reassigning `cdkDragFreeDragPosition` mid-gesture. Still allocate buffer in Phase D for manual UX testing (sibling lists > 50 elements, rapid directional changes).
3. **TipTap extensions bundle size** — Phase F may inflate the lib by ~50–100 KB. Mitigated by `TIPTAP_EXTENSIONS_TOKEN` (decision §6.4) so consumers can trim the default set.
4. **Cross-phase coupling** — keep each phase's PR scoped to its files; the editor shell is a pure addition through Phase B and grows additively after.

---

## 10. Where to put what

| Concern | Location |
|---|---|
| Bare canvas (existing) | `projects/gcanvas/src/lib/canvas/` |
| New canvas-view (no providers) | `projects/gcanvas/src/lib/canvas/canvas-view.component.ts` |
| Editor shell + chrome + toolbar + panels + inspector | `projects/gcanvas/src/lib/editor/**` |
| Snap guides + floating action toolbar overlays | `projects/gcanvas/src/lib/editor/canvas-overlay/**` |
| New element types (button, shape) | `projects/gcanvas/src/lib/elements/{button,shape}-element/**` |
| New services (tool, breakpoint, chrome, snap, command palette) | `projects/gcanvas/src/lib/services/**` |
| New tokens (palette, templates, assets) | `projects/gcanvas/src/lib/tokens/**` |
| Provider helper | `projects/gcanvas/src/lib/providers/provide-canvas.ts` |
| Responsive preview | `projects/gcanvas/src/lib/preview/**` |
| Publish modal | `projects/gcanvas/src/lib/publish/**` |
| Template picker | `projects/gcanvas/src/lib/templates/**` |
| Demo wiring (sample data, persistence stub, breadcrumb input) | `projects/demo/src/app/**` |

The consumer's `app.component.ts` after Phase B is roughly:
```ts
@Component({
  selector: 'app-root',
  imports: [CanvasEditorComponent],
  template: `
    <gc-canvas-editor
      [canvasData]="canvasData"
      [projectName]="'Sunrise Bakery'"
      [breadcrumbs]="['Projects', 'Sunrise Bakery', 'Home']"
      [saveStatus]="saveStatus()"
      (canvasChange)="onCanvasChange($event)"
      (publish)="onPublish()"
    />
  `,
})
export class AppComponent { /* ... */ }
```

---

## Reference: design ↔ component mapping (quick lookup)

| Design element | Component |
|---|---|
| Top breadcrumbs / save status / undo-redo / Publish | `<gc-editor-chrome-top>` |
| Tool buttons + zoom + breakpoint switcher | `<gc-editor-toolbar>` |
| Left "Components" grid | `<gc-component-palette>` (in `<gc-editor-left-panel>`) |
| Left "Layers" tree | `<gc-layers-panel>` (in `<gc-editor-left-panel>`) |
| Left "Assets" / image library | `<gc-assets-panel>` (in `<gc-editor-left-panel>`) |
| Right inspector — Position/Size | `<gc-position-size-section>` |
| Right inspector — Image (Source/Fit/Focal/Alt) | `<gc-image-section>` |
| Right inspector — Typography | `<gc-typography-section>` |
| Right inspector — Effects | `<gc-effects-section>` |
| Right inspector — Page (when nothing selected) | `<gc-page-section>` |
| Selection outline + 8 handles + label badge + dim pill | `<gc-element-wrapper>` (existing, extended Phases D/E) |
| Snap guides + width pill | `<gc-snap-guides-overlay>` |
| Floating rich-text toolbar (B/I/U/heading/font/link/list/align/color) | `<gc-floating-toolbar>` (existing, extended Phase F) |
| Floating action toolbar (Replace/Crop/Fit/Link/More) | `<gc-floating-action-toolbar>` |
| Empty canvas placeholder | `<gc-empty-state>` (Phase G) or `<gc-template-picker>` |
| Library modal (Screen 5) | `<gc-library-modal>` (Phase H) |
| Responsive preview (Screen 6) | `<gc-responsive-preview>` |
| Publish modal (Screen 7) | `<gc-publish-modal>` |
| Templates picker (Screen 8) | `<gc-template-picker>` |
| Command palette (⌘K) | `<gc-command-palette>` |
