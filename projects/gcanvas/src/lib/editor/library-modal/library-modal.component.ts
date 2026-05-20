import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  Signal,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { COMPONENT_PALETTE_TOKEN, PaletteEntry } from '../../tokens/component-palette.token';

@Component({
  selector: 'gc-library-modal',
  standalone: true,
  imports: [A11yModule],
  templateUrl: './library-modal.component.html',
  styleUrl: './library-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryModalComponent implements OnInit, OnDestroy {
  open = input<boolean>(false);
  closed = output<void>();

  private readonly _allEntries = inject(COMPONENT_PALETTE_TOKEN);

  // Track the element that had focus before the modal opened so we can restore it on close
  private _previouslyFocusedElement: HTMLElement | null = null;

  readonly _query    = signal('');
  readonly _category = signal<string | null>(null);
  readonly _selected = signal<PaletteEntry | null>(null);

  readonly categories: Signal<string[]> = computed(() => {
    const cats = this._allEntries
      .map(e => e.category)
      .filter((c): c is string => !!c);
    return [...new Set(cats)];
  });

  readonly filteredEntries: Signal<PaletteEntry[]> = computed(() => {
    const q   = this._query().toLowerCase().trim();
    const cat = this._category();
    return this._allEntries.filter(e => {
      const matchCat   = !cat || e.category === cat;
      const matchQuery = !q   || e.label.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  });

  ngOnInit(): void {
    // Capture the currently focused element so we can restore focus when the modal closes
    this._previouslyFocusedElement = document.activeElement as HTMLElement | null;
  }

  ngOnDestroy(): void {
    // Restore focus to the element that triggered the modal
    if (this._previouslyFocusedElement && typeof this._previouslyFocusedElement.focus === 'function') {
      this._previouslyFocusedElement.focus();
    }
  }

  onQueryChange(event: Event): void {
    this._query.set((event.target as HTMLInputElement).value);
  }

  setCategory(cat: string | null): void { this._category.set(cat); }
  selectEntry(entry: PaletteEntry): void { this._selected.set(entry); }
  dismiss(): void { this.closed.emit(); }
  onBackdropClick(): void { this.dismiss(); }
}
