import { Injectable, signal, Signal } from '@angular/core';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

@Injectable()
export class BreakpointService {
  private readonly _current = signal<Breakpoint>('desktop');
  readonly current: Signal<Breakpoint> = this._current.asReadonly();

  set(bp: Breakpoint): void {
    this._current.set(bp);
  }
}
