import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CanvasStateService } from '../../../services/canvas-state.service';
import { ImageCanvasElement } from '../../../models/canvas-element.model';

// Object-fit options typed so the template can call setObjectFit without casting
export const FIT_OPTIONS: Array<'cover' | 'contain' | 'fill' | 'none'> = [
  'cover', 'contain', 'fill', 'none',
];

// Focal-point grid: row-major, top-left to bottom-right
export const FOCAL_POINT_POSITIONS: string[] = [
  'left top',    'center top',    'right top',
  'left center', 'center center', 'right center',
  'left bottom', 'center bottom', 'right bottom',
];

@Component({
  selector: 'gc-image-section',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './image-section.component.html',
  styleUrl: './image-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageSectionComponent {
  element = input.required<ImageCanvasElement>();

  @ViewChild('filePicker') filePicker!: ElementRef<HTMLInputElement>;

  private readonly canvasState = inject(CanvasStateService);

  readonly fitOptions = FIT_OPTIONS;
  readonly focalPositions = FOCAL_POINT_POSITIONS;

  readonly objectFit  = computed(() => this.element().objectFit ?? 'cover');
  readonly altText    = computed(() => this.element().alt ?? '');
  readonly focalPoint = computed(
    () => this.element().styles?.['object-position'] ?? 'center center',
  );

  triggerReplace(): void {
    this.filePicker.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input  = event.target as HTMLInputElement;
    const file   = input.files?.[0];
    if (!file) return;

    // Read as data: URL so it is self-contained in CanvasData (survives reload).
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.canvasState.patchElement(this.element().id, { src: dataUrl });
    };
    reader.readAsDataURL(file);

    // Reset so selecting the same file again triggers change event next time.
    input.value = '';
  }

  setObjectFit(fit: 'cover' | 'contain' | 'fill' | 'none'): void {
    this.canvasState.patchElement(this.element().id, { objectFit: fit });
  }

  setFocalPoint(position: string): void {
    this.canvasState.patchStyles(this.element().id, { 'object-position': position });
  }

  onAltTextChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.canvasState.patchElement(this.element().id, { alt: value });
  }
}
