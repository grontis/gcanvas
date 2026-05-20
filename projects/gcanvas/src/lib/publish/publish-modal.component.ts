import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { EditorChromeService } from '../services/editor-chrome.service';
import { CanvasStateService } from '../services/canvas-state.service';
import { runPreflightChecks } from './preflight.util';

@Component({
  selector: 'gc-publish-modal',
  standalone: true,
  imports: [AsyncPipe, A11yModule],
  templateUrl: './publish-modal.component.html',
  styleUrl: './publish-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublishModalComponent implements OnInit, OnDestroy {
  open       = input<boolean>(false);
  publishUrl = input<string>('');

  confirmed = output<void>();
  closed    = output<void>();

  private readonly chromeService = inject(EditorChromeService);
  private readonly canvasState   = inject(CanvasStateService);

  // Track the element that had focus before the modal opened so we can restore it on close
  private _previouslyFocusedElement: HTMLElement | null = null;

  readonly recentChanges$ = this.chromeService.recentChanges$;

  readonly preflightResults = computed(() =>
    runPreflightChecks(this.canvasState.canvasData())
  );

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

  confirm(): void {
    this.confirmed.emit();
    this.closed.emit();
  }

  dismiss(): void {
    this.closed.emit();
  }

  onBackdropClick(): void {
    this.dismiss();
  }
}
