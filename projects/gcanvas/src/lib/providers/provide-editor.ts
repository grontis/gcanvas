import { Provider } from '@angular/core';
import { ToolStateService } from '../services/tool-state.service';
import { BreakpointService } from '../services/breakpoint.service';
import { EditorChromeService } from '../services/editor-chrome.service';
import { CanvasStateService } from '../services/canvas-state.service';
import { CommandPaletteService } from '../services/command-palette.service';
import { COMPONENT_PALETTE_TOKEN, PaletteEntry } from '../tokens/component-palette.token';
import { COMMAND_REGISTRY_TOKEN, CommandEntry } from '../tokens/command-registry.token';
import { TEMPLATE_REGISTRY_TOKEN } from '../tokens/template-registry.token';

export interface EditorConfig {
  palette?: PaletteEntry[];
  commands?: CommandEntry[];
}

const TEXT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/>
  <line x1="12" y1="4" x2="12" y2="20"/>
</svg>`;

const IMAGE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
  <polyline points="21 15 16 10 5 21"/>
</svg>`;

const BUTTON_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2" y="7" width="20" height="10" rx="3"/>
  <line x1="7" y1="12" x2="17" y2="12"/>
</svg>`;

const SHAPE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="3" width="18" height="18" rx="2"/>
</svg>`;

export const defaultPaletteEntries: PaletteEntry[] = [
  { toolId: 'text',   label: 'Text',   icon: TEXT_ICON,   defaultSize: { width: 200, height: 60  }, category: 'content' },
  { toolId: 'image',  label: 'Image',  icon: IMAGE_ICON,  defaultSize: { width: 300, height: 200 }, category: 'media'   },
  { toolId: 'button', label: 'Button', icon: BUTTON_ICON, defaultSize: { width: 160, height: 44  }, category: 'content' },
  { toolId: 'shape',  label: 'Shape',  icon: SHAPE_ICON,  defaultSize: { width: 120, height: 120 }, category: 'media'   },
];

export function defaultCommandsFactory(
  chrome: EditorChromeService,
  toolState: ToolStateService,
  canvasState: CanvasStateService,
): CommandEntry[] {
  return [
    { id: 'add-text',     label: 'Add Text',     category: 'add',     hotkey: 'T',    action: () => toolState.setTool('text')           },
    { id: 'add-image',    label: 'Add Image',    category: 'add',     hotkey: 'I',    action: () => toolState.setTool('image')          },
    { id: 'add-button',   label: 'Add Button',   category: 'add',     hotkey: 'B',    action: () => toolState.setTool('button')         },
    { id: 'add-shape',    label: 'Add Shape',    category: 'add',     hotkey: 'S',    action: () => toolState.setTool('shape')          },
    { id: 'undo',         label: 'Undo',         category: 'history', hotkey: '⌘Z',   action: () => canvasState.undo()                  },
    { id: 'redo',         label: 'Redo',         category: 'history', hotkey: '⌘⇧Z',  action: () => canvasState.redo()                  },
    { id: 'open-library', label: 'Open Library', category: 'view',    hotkey: '',     action: () => chrome.openLibraryModal$.next()     },
    { id: 'publish',      label: 'Publish',      category: 'publish', hotkey: '',     action: () => chrome.openPublishModal$.next(),     isAvailable: () => chrome.publishEnabled() },
  ];
}

export function provideEditor(config?: EditorConfig): Provider[] {
  return [
    ToolStateService,
    BreakpointService,
    EditorChromeService,
    CommandPaletteService,
    {
      provide: COMPONENT_PALETTE_TOKEN,
      useValue: config?.palette ?? defaultPaletteEntries,
    },
    {
      provide: COMMAND_REGISTRY_TOKEN,
      useFactory: (chrome: EditorChromeService, tool: ToolStateService, canvas: CanvasStateService) =>
        config?.commands ?? defaultCommandsFactory(chrome, tool, canvas),
      deps: [EditorChromeService, ToolStateService, CanvasStateService],
    },
    {
      provide: TEMPLATE_REGISTRY_TOKEN,
      useValue: [],
    },
  ];
}
