import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { CommandPaletteService } from '../../services/command-palette.service';
import { CommandEntry } from '../../tokens/command-registry.token';

@Component({
  selector: 'gc-command-palette',
  standalone: true,
  imports: [A11yModule],
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPaletteComponent implements OnInit, OnDestroy {
  readonly paletteService = inject(CommandPaletteService);
  readonly _activeIndex = signal(0);

  // Track the element that had focus before the palette opened so we can restore it on close
  private _previouslyFocusedElement: HTMLElement | null = null;

  ngOnInit(): void {
    // Capture the currently focused element so we can restore focus when the palette closes
    this._previouslyFocusedElement = document.activeElement as HTMLElement | null;
  }

  ngOnDestroy(): void {
    // Restore focus to the element that triggered the palette
    if (this._previouslyFocusedElement && typeof this._previouslyFocusedElement.focus === 'function') {
      this._previouslyFocusedElement.focus();
    }
  }

  onQueryChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.paletteService.setQuery(value);
    this._activeIndex.set(0);
  }

  onKeydown(event: KeyboardEvent): void {
    const cmds = this.paletteService.filteredCommands();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this._activeIndex.update(i => Math.min(i + 1, cmds.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this._activeIndex.update(i => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      const cmd = cmds[this._activeIndex()];
      if (cmd) { this.activateCommand(cmd); }
    } else if (event.key === 'Escape') {
      this.paletteService.close();
    }
  }

  activateCommand(cmd: CommandEntry): void {
    cmd.action();
    this.paletteService.close();
  }

  onBackdropClick(): void {
    this.paletteService.close();
  }
}
