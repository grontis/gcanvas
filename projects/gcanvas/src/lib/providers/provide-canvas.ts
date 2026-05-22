import { Provider } from '@angular/core';
import { CanvasStateService } from '../services/canvas-state.service';
import { SelectionService } from '../services/selection.service';
import { SnapGuideService } from '../services/snap-guide.service';
import { ELEMENT_REGISTRY_TOKEN, ElementRegistryEntry } from '../tokens/element-registry.token';
import { TIPTAP_EXTENSIONS_TOKEN, DEFAULT_TIPTAP_EXTENSIONS } from '../tokens/tiptap-extensions.token';
import { ELEMENT_SERIALIZER_TOKEN, ElementSerializerEntry } from '../tokens/element-serializer.token';
import { IMAGE_RESOLVER_TOKEN } from '../tokens/image-resolver.token';
import { TextElementComponent } from '../elements/text-element/text-element.component';
import { ImageElementComponent } from '../elements/image-element/image-element.component';
import { ButtonElementComponent } from '../elements/button-element/button-element.component';
import { ShapeElementComponent } from '../elements/shape-element/shape-element.component';
import { serializeTextElement } from '../serialize/element-serializers/text.serializer';
import { serializeImageElement } from '../serialize/element-serializers/image.serializer';
import { serializeButtonElement } from '../serialize/element-serializers/button.serializer';
import { serializeShapeElement } from '../serialize/element-serializers/shape.serializer';
import { CanvasSerializer } from '../serialize/canvas-serializer.service';
import type { ImageCanvasElement } from '../models/canvas-element.model';

export interface CanvasConfig {
  registry?: ElementRegistryEntry[];
}

const defaultRegistry: ElementRegistryEntry[] = [
  { type: 'text',   component: TextElementComponent   },
  { type: 'image',  component: ImageElementComponent  },
  { type: 'button', component: ButtonElementComponent },
  { type: 'shape',  component: ShapeElementComponent  },
];

const defaultSerializers: ElementSerializerEntry[] = [
  { type: 'text',   serialize: (el, ctx) => serializeTextElement(el as any, ctx) },
  { type: 'image',  serialize: (el, ctx) => serializeImageElement(el as ImageCanvasElement, ctx) },
  { type: 'button', serialize: (el, ctx) => serializeButtonElement(el as any, ctx) },
  { type: 'shape',  serialize: (el, ctx) => serializeShapeElement(el as any, ctx) },
];

export function provideCanvas(config?: CanvasConfig): Provider[] {
  return [
    CanvasStateService,
    SelectionService,
    SnapGuideService,
    CanvasSerializer,
    {
      provide: ELEMENT_REGISTRY_TOKEN,
      useValue: config?.registry ?? defaultRegistry,
    },
    {
      provide: TIPTAP_EXTENSIONS_TOKEN,
      useValue: DEFAULT_TIPTAP_EXTENSIONS,
    },
    {
      provide: ELEMENT_SERIALIZER_TOKEN,
      useValue: defaultSerializers,
    },
    {
      provide: IMAGE_RESOLVER_TOKEN,
      useValue: (src: string, _element: ImageCanvasElement) => src,
    },
  ];
}
