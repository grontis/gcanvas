import { DestroyRef, Injectable, inject, signal, Signal } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CanvasStateService } from './canvas-state.service';
import { CanvasChangeEvent } from '../models/canvas-data.model';

export type SaveStatus = 'saved' | 'saving' | 'unsaved';

@Injectable()
export class EditorChromeService {
  private readonly _recentChanges$ = new BehaviorSubject<CanvasChangeEvent[]>([]);
  readonly recentChanges$: Observable<CanvasChangeEvent[]> = this._recentChanges$.asObservable();

  constructor() {
    const canvasState = inject(CanvasStateService);
    const destroyRef  = inject(DestroyRef);

    canvasState.changes$
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(event => {
        const current = this._recentChanges$.getValue();
        const next = [event, ...current].slice(0, 50);
        this._recentChanges$.next(next);
      });
  }

  // --- Existing sidebar state ---
  private readonly _sidebarOpen = signal<boolean>(false);
  readonly sidebarOpen: Signal<boolean> = this._sidebarOpen.asReadonly();

  toggleSidebar(): void {
    this._sidebarOpen.update(v => !v);
  }

  setSidebarOpen(open: boolean): void {
    this._sidebarOpen.set(open);
  }

  // --- New: project metadata and save status ---
  private readonly _projectName = signal<string>('Untitled');
  readonly projectName: Signal<string> = this._projectName.asReadonly();

  private readonly _breadcrumbs = signal<string[]>([]);
  readonly breadcrumbs: Signal<string[]> = this._breadcrumbs.asReadonly();

  private readonly _saveStatus = signal<SaveStatus>('saved');
  readonly saveStatus: Signal<SaveStatus> = this._saveStatus.asReadonly();

  setProjectName(name: string): void {
    this._projectName.set(name);
  }

  setBreadcrumbs(crumbs: string[]): void {
    this._breadcrumbs.set(crumbs);
  }

  setSaveStatus(status: SaveStatus): void {
    this._saveStatus.set(status);
  }

  // --- Publish availability ---
  private readonly _publishEnabled = signal<boolean>(true);
  readonly publishEnabled: Signal<boolean> = this._publishEnabled.asReadonly();
  setPublishEnabled(enabled: boolean): void { this._publishEnabled.set(enabled); }

  // --- Phase H subjects ---
  readonly openPublishModal$ = new Subject<void>();
  readonly openLibraryModal$ = new Subject<void>();
}
