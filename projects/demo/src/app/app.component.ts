import { Component, signal } from '@angular/core';
import { CanvasEditorComponent } from '@grontis/gcanvas';
import type { CanvasData, CanvasChangeEvent, SaveStatus } from '@grontis/gcanvas';

@Component({
  selector: 'app-root',
  imports: [CanvasEditorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  canvasData: CanvasData = {
    version: 1,
    viewport: { width: 1200, height: 800, backgroundColor: '#fafafa' },
    elements: [
      {
        id: 'el-1',
        type: 'text',
        position: { x: 100, y: 100 },
        size: { width: 300, height: 150 },
        zIndex: 1,
        content: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello canvas!' }] }],
        },
      },
      {
        id: 'el-2',
        type: 'image',
        position: { x: 500, y: 200 },
        size: { width: 200, height: 200 },
        zIndex: 2,
        src: '',
        objectFit: 'cover',
      },
    ],
    meta: { name: 'Home', slug: '/' },
  };

  readonly saveStatus = signal<SaveStatus>('saved');

  onCanvasChange(event: CanvasChangeEvent): void {
    this.canvasData = event.canvasData;
    this.saveStatus.set('saving');
    // Simulate async save — replace with real persistence in production.
    setTimeout(() => this.saveStatus.set('saved'), 1200);
    console.log('Canvas changed:', event.changeType, event.changedElementIds);
  }

  onPublish(): void {
    console.log('Publish requested — modal coming in Phase G.');
  }
}
