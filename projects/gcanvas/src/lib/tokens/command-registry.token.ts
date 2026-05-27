import { InjectionToken } from '@angular/core';

export interface CommandEntry {
  /** Unique machine key, e.g. 'add-text', 'publish'. */
  id: string;
  /** Human-readable label shown in the palette list. */
  label: string;
  /** Optional keyboard shortcut hint displayed alongside the label. */
  hotkey?: string;
  /** Optional category for grouping, e.g. 'add', 'history', 'publish'. */
  category?: string;
  /** Called when the user activates this command (click or Enter). */
  action: () => void;
  /** Optional predicate; when it returns false the command is hidden/unavailable in the palette. */
  isAvailable?: () => boolean;
}

export const COMMAND_REGISTRY_TOKEN = new InjectionToken<CommandEntry[]>(
  'gc.commandRegistry'
);
