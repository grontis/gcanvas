import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { EditorChromeService } from '../services/editor-chrome.service';
import { CanvasStateService } from '../services/canvas-state.service';
import { runPreflightChecks } from './preflight.util';

@Component({
  selector: 'gc-publish-modal',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './publish-modal.component.html',
  styleUrl: './publish-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublishModalComponent {
  open       = input<boolean>(false);
  publishUrl = input<string>('');

  confirmed = output<void>();
  closed    = output<void>();

  private readonly chromeService = inject(EditorChromeService);
  private readonly canvasState   = inject(CanvasStateService);

  readonly recentChanges$ = this.chromeService.recentChanges$;

  readonly preflightResults = computed(() =>
    runPreflightChecks(this.canvasState.canvasData())
  );

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
