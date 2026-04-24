import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CanvasComponent } from 'gcanvas';
import type { CanvasData, CanvasChangeEvent, TextCanvasElement, ImageCanvasElement } from 'gcanvas';

@Component({
  selector: 'app-root',
  imports: [CanvasComponent, FormsModule],
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
  };

  readonly showImageInput = signal(false);
  imageUrl = '';

  onCanvasChange(event: CanvasChangeEvent): void {
    this.canvasData = event.canvasData;
    console.log('Canvas changed:', event.changeType, event.changedElementIds);
  }

  addTextBox(): void {
    const nextZ = this.canvasData.elements.length + 1;
    const element: TextCanvasElement = {
      id: `el-${Date.now()}`,
      type: 'text',
      position: { x: 80 + (nextZ % 5) * 40, y: 80 + (nextZ % 4) * 40 },
      size: { width: 240, height: 120 },
      zIndex: nextZ,
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'New text box' }] }],
      },
    };
    this.canvasData = {
      ...this.canvasData,
      elements: [...this.canvasData.elements, element],
    };
  }

  toggleImageInput(): void {
    this.showImageInput.update(v => !v);
    this.imageUrl = '';
  }

  confirmAddImage(): void {
    const nextZ = this.canvasData.elements.length + 1;
    const element: ImageCanvasElement = {
      id: `el-${Date.now()}`,
      type: 'image',
      position: { x: 80 + (nextZ % 5) * 40, y: 80 + (nextZ % 4) * 40 },
      size: { width: 200, height: 200 },
      zIndex: nextZ,
      src: this.imageUrl.trim(),
      objectFit: 'cover',
    };
    this.canvasData = {
      ...this.canvasData,
      elements: [...this.canvasData.elements, element],
    };
    this.showImageInput.set(false);
    this.imageUrl = '';
  }
}
