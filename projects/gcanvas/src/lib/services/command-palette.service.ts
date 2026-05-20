import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { COMMAND_REGISTRY_TOKEN, CommandEntry } from '../tokens/command-registry.token';

@Injectable()
export class CommandPaletteService {
  private readonly _commands = inject(COMMAND_REGISTRY_TOKEN);

  private readonly _open  = signal(false);
  private readonly _query = signal('');

  readonly isOpen:  Signal<boolean> = this._open.asReadonly();
  readonly query:   Signal<string>  = this._query.asReadonly();

  readonly filteredCommands: Signal<CommandEntry[]> = computed(() => {
    const q = this._query().toLowerCase().trim();
    if (!q) return this._commands;
    return this._commands.filter(cmd =>
      cmd.label.toLowerCase().includes(q) ||
      (cmd.category?.toLowerCase().includes(q) ?? false)
    );
  });

  open(): void  { this._open.set(true);  this._query.set(''); }
  close(): void { this._open.set(false); this._query.set(''); }
  toggle(): void { this._open() ? this.close() : this.open(); }
  setQuery(q: string): void { this._query.set(q); }
}
