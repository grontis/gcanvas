import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CanvasStateService } from '../../../services/canvas-state.service';
import { CanvasElement } from '../../../models/canvas-element.model';

export type ShadowPreset = 'none' | 'soft' | 'medium' | 'hard';

export const SHADOW_PRESETS: Record<ShadowPreset, string> = {
  none:   'none',
  soft:   '0 2px 8px rgba(0,0,0,0.12)',
  medium: '0 4px 16px rgba(0,0,0,0.24)',
  hard:   '4px 4px 0px rgba(0,0,0,0.80)',
};

@Component({
  selector: 'gc-effects-section',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './effects-section.component.html',
  styleUrl: './effects-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EffectsSectionComponent {
  element = input.required<CanvasElement>();

  private readonly canvasState = inject(CanvasStateService);

  readonly shadowPresets = Object.keys(SHADOW_PRESETS) as ShadowPreset[];

  readonly borderRadius = computed(() =>
    this.element().styles?.['border-radius'] ?? '0',
  );

  readonly shadowPreset = computed<ShadowPreset>(() => {
    const current = this.element().styles?.['box-shadow'] ?? 'none';
    return (Object.entries(SHADOW_PRESETS).find(([, v]) => v === current)?.[0] as ShadowPreset) ?? 'none';
  });

  readonly opacity = computed(() =>
    Math.round(parseFloat(this.element().styles?.['opacity'] ?? '1') * 100),
  );

  readonly borderValue = computed(() =>
    this.element().styles?.['border'] ?? '',
  );

  onBorderRadiusChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.setBorderRadius(value);
  }

  onShadowChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as ShadowPreset;
    this.setShadow(value);
  }

  onOpacityInput(event: Event): void {
    const value = +(event.target as HTMLInputElement).value;
    this.setOpacity(value);
  }

  onBorderChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.setBorder(value);
  }

  setBorderRadius(value: string): void {
    const clean = value.match(/^\d+$/) ? `${value}px` : value;
    this.canvasState.patchStyles(this.element().id, { 'border-radius': clean });
  }

  setShadow(preset: ShadowPreset): void {
    this.canvasState.patchStyles(this.element().id, { 'box-shadow': SHADOW_PRESETS[preset] });
  }

  setOpacity(percent: number): void {
    const clamped = Math.max(0, Math.min(100, percent));
    this.canvasState.patchStyles(this.element().id, { 'opacity': (clamped / 100).toFixed(2) });
  }

  setBorder(value: string): void {
    this.canvasState.patchStyles(this.element().id, { 'border': value });
  }
}
