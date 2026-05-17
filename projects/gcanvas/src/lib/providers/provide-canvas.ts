import { Provider } from '@angular/core';
import { CanvasStateService } from '../services/canvas-state.service';
import { SelectionService } from '../services/selection.service';
import { SnapGuideService } from '../services/snap-guide.service';
import { ELEMENT_REGISTRY_TOKEN, ElementRegistryEntry } from '../tokens/element-registry.token';
import { TextElementComponent } from '../elements/text-element/text-element.component';
import { ImageElementComponent } from '../elements/image-element/image-element.component';
import { ButtonElementComponent } from '../elements/button-element/button-element.component';
import { ShapeElementComponent } from '../elements/shape-element/shape-element.component';

export interface CanvasConfig {
  registry?: ElementRegistryEntry[];
}

const defaultRegistry: ElementRegistryEntry[] = [
  { type: 'text',   component: TextElementComponent   },
  { type: 'image',  component: ImageElementComponent  },
  { type: 'button', component: ButtonElementComponent },
  { type: 'shape',  component: ShapeElementComponent  },
];

export function provideCanvas(config?: CanvasConfig): Provider[] {
  return [
    CanvasStateService,
    SelectionService,
    SnapGuideService,
    {
      provide: ELEMENT_REGISTRY_TOKEN,
      useValue: config?.registry ?? defaultRegistry,
    },
  ];
}
