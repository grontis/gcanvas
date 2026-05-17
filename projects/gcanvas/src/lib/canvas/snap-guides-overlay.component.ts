import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { SnapGuideService } from '../services/snap-guide.service';

@Component({
  selector: 'gc-snap-guides-overlay',
  standalone: true,
  templateUrl: './snap-guides-overlay.component.html',
  styleUrl: './snap-guides-overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnapGuidesOverlayComponent {
  /** Canvas dimensions — needed to size the full-length guide lines. */
  canvasWidth = input.required<number>();
  canvasHeight = input.required<number>();

  protected readonly snapGuide = inject(SnapGuideService);
}
