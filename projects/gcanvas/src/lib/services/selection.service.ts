import { Injectable, signal, Signal } from '@angular/core';
import type { Editor } from '@tiptap/core';

@Injectable()
export class SelectionService {
  private readonly _selectedId = signal<string | null>(null);
  readonly selectedId: Signal<string | null> = this._selectedId.asReadonly();

  // Active TipTap editor instance — null when not in text-edit mode
  // Deliberately writable because TextElementComponent sets it directly
  readonly activeEditor = signal<Editor | null>(null);

  select(id: string): void {
    this._selectedId.set(id);
  }

  deselect(): void {
    this._selectedId.set(null);
  }
}
