import { InjectionToken, Type } from '@angular/core';

export interface ElementRegistryEntry {
  type: string;       // matches BaseCanvasElement.type
  component: Type<unknown>;
}

export const ELEMENT_REGISTRY_TOKEN = new InjectionToken<ElementRegistryEntry[]>(
  'gc.elementRegistry'
);
