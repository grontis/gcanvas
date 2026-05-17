import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentPaletteComponent } from './component-palette.component';
import { LayersPanelComponent } from './layers-panel.component';

type LeftPanelTab = 'components' | 'layers';

@Component({
  selector: 'gc-editor-left-panel',
  standalone: true,
  imports: [ComponentPaletteComponent, LayersPanelComponent],
  templateUrl: './left-panel.component.html',
  styleUrl: './left-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorLeftPanelComponent {
  readonly activeTab = signal<LeftPanelTab>('components');

  setTab(tab: LeftPanelTab): void {
    this.activeTab.set(tab);
  }
}
