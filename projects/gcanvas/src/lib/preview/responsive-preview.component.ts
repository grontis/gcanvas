import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CanvasData } from '../models/canvas-data.model';
import { BreakpointCanvasComponent } from './breakpoint-canvas.component';
import { BreakpointIframeComponent } from './breakpoint-iframe.component';
import { CanvasSerializer } from '../serialize/canvas-serializer.service';
import { provideCanvas } from '../providers/provide-canvas';

@Component({
  selector: 'gc-responsive-preview',
  standalone: true,
  imports: [BreakpointCanvasComponent, BreakpointIframeComponent],
  templateUrl: './responsive-preview.component.html',
  styleUrl: './responsive-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: provideCanvas(),
})
export class ResponsivePreviewComponent {
  canvasData  = input.required<CanvasData>();
  previewMode = input<'angular' | 'html'>('html');

  private readonly canvasSerializer = inject(CanvasSerializer);

  /** Serialized HTML document for each breakpoint viewport width. */
  readonly serializedMobile = computed(() =>
    this._serializeAtWidth(375)
  );

  readonly serializedTablet = computed(() =>
    this._serializeAtWidth(768)
  );

  readonly serializedDesktop = computed(() =>
    this._serializeAtWidth(1280)
  );

  private _serializeAtWidth(width: number): string {
    const data = this.canvasData();
    // Override viewport width for the given breakpoint
    const breakpointData: CanvasData = {
      ...data,
      viewport: { ...data.viewport, width },
    };
    return this.canvasSerializer.serialize(breakpointData).fullDocument;
  }
}
