import { Injectable, signal, Signal } from '@angular/core';

export type ToolId = 'select' | 'text' | 'image' | 'button' | 'shape' | string;

@Injectable()
export class ToolStateService {
  private readonly _activeTool = signal<ToolId>('select');
  readonly activeTool: Signal<ToolId> = this._activeTool.asReadonly();

  setTool(tool: ToolId): void {
    this._activeTool.set(tool);
  }

  resetToSelect(): void {
    this._activeTool.set('select');
  }
}
