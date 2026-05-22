import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'gc-breakpoint-iframe',
  standalone: true,
  templateUrl: './breakpoint-iframe.component.html',
  styleUrl: './breakpoint-iframe.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreakpointIframeComponent {
  srcdoc = input.required<string>();
  width  = input.required<number>();
  height = input<number>(600);

  private readonly sanitizer = inject(DomSanitizer);

  /** Trusted HTML — bypasses Angular sanitization so the full document renders in the iframe. */
  readonly trustedSrcdoc = computed((): SafeHtml =>
    this.sanitizer.bypassSecurityTrustHtml(this.srcdoc())
  );
}
