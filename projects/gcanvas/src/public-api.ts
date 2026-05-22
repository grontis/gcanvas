export { CanvasComponent } from './lib/canvas/canvas.component';
export { CanvasViewComponent } from './lib/canvas/canvas-view.component';
export { ElementWrapperComponent } from './lib/elements/element-wrapper/element-wrapper.component';
export { TextElementComponent } from './lib/elements/text-element/text-element.component';
export { ImageElementComponent } from './lib/elements/image-element/image-element.component';
export { FloatingToolbarComponent } from './lib/toolbar/floating-toolbar.component';
export { CanvasStateService } from './lib/services/canvas-state.service';
export { SelectionService } from './lib/services/selection.service';
export { ToolStateService, type ToolId } from './lib/services/tool-state.service';
export { BreakpointService, type Breakpoint } from './lib/services/breakpoint.service';
export { EditorChromeService, type SaveStatus } from './lib/services/editor-chrome.service';
export { ELEMENT_REGISTRY_TOKEN, type ElementRegistryEntry } from './lib/tokens/element-registry.token';
export { provideCanvas, type CanvasConfig } from './lib/providers/provide-canvas';
export { CanvasEditorComponent } from './lib/editor/canvas-editor.component';
export { ChromeTopComponent } from './lib/editor/chrome/chrome-top.component';
export { InspectorComponent } from './lib/editor/inspector/inspector.component';
// PositionSizeSectionComponent and PageSectionComponent are internal; not exported (see ARCH §3)
export * from './lib/models/canvas-element.model';
export * from './lib/models/canvas-data.model';

// Phase C additions
export { provideEditor, type EditorConfig, defaultPaletteEntries } from './lib/providers/provide-editor';
export { COMPONENT_PALETTE_TOKEN, type PaletteEntry } from './lib/tokens/component-palette.token';
export { EditorToolbarComponent } from './lib/editor/toolbar/editor-toolbar.component';
export { EditorLeftPanelComponent } from './lib/editor/left-panel/left-panel.component';
export { ComponentPaletteComponent } from './lib/editor/left-panel/component-palette.component';
export { ButtonElementComponent } from './lib/elements/button-element/button-element.component';
export { ShapeElementComponent } from './lib/elements/shape-element/shape-element.component';

// Phase D additions
export { SnapGuideService, type SnapGuide, type SnapResult } from './lib/services/snap-guide.service';
export { SnapGuidesOverlayComponent } from './lib/canvas/snap-guides-overlay.component';
export { LayersPanelComponent } from './lib/editor/left-panel/layers-panel.component';
export { elementLabel } from './lib/elements/element-label.util';

// Phase E additions
export { FloatingActionToolbarComponent } from './lib/canvas/overlays/floating-action-toolbar.component';
// ImageSectionComponent and EffectsSectionComponent are internal; export only preset data (see ARCH §3)
export { FOCAL_POINT_POSITIONS } from './lib/editor/inspector/sections/image-section.component';
export { SHADOW_PRESETS, type ShadowPreset } from './lib/editor/inspector/sections/effects-section.component';

// Phase F additions
export { TIPTAP_EXTENSIONS_TOKEN, DEFAULT_TIPTAP_EXTENSIONS } from './lib/tokens/tiptap-extensions.token';
export { FontSize } from './lib/elements/text-element/font-size.extension';
// TypographySectionComponent is internal; export only preset data (see ARCH §3)
export { SYSTEM_FONTS, type TextAlign } from './lib/editor/inspector/sections/typography-section.component';

// Phase G additions
export { ResponsivePreviewComponent } from './lib/preview/responsive-preview.component';
export { BreakpointCanvasComponent } from './lib/preview/breakpoint-canvas.component';
export { PublishModalComponent } from './lib/publish/publish-modal.component';
export { TemplatePickerComponent } from './lib/templates/template-picker.component';
export { TEMPLATE_REGISTRY_TOKEN, type TemplateEntry, type ThumbnailBlock } from './lib/tokens/template-registry.token';
export { runPreflightChecks, checkImageAlt, checkSeoTitle, checkSeoDescription, type PreflightResult } from './lib/publish/preflight.util';

// Phase H additions
export { COMMAND_REGISTRY_TOKEN, type CommandEntry } from './lib/tokens/command-registry.token';
export { CommandPaletteService } from './lib/services/command-palette.service';
export { CommandPaletteComponent } from './lib/editor/command-palette/command-palette.component';
export { LibraryModalComponent } from './lib/editor/library-modal/library-modal.component';
export { defaultCommandsFactory } from './lib/providers/provide-editor';

// Review-fixes additions
export { isSafeUrl } from './lib/utils/sanitize-url.util';

// Publish-export additions
export type { PublishPayload } from './lib/models/publish-payload.model';
export {
  ELEMENT_SERIALIZER_TOKEN,
  type ElementSerializerEntry,
  type SerializerContext,
  type SerializedFragment,
} from './lib/tokens/element-serializer.token';
export { IMAGE_RESOLVER_TOKEN, type ImageResolver } from './lib/tokens/image-resolver.token';
export { CanvasSerializer } from './lib/serialize/canvas-serializer.service';
export { serializeCanvas, toHtmlDocument } from './lib/serialize/canvas-serializer';
export { BreakpointIframeComponent } from './lib/preview/breakpoint-iframe.component';
