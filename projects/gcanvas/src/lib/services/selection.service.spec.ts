/**
 * Unit tests for SelectionService.
 *
 * Uses TestBed for signal-reactive context.
 */

import { TestBed } from '@angular/core/testing';
import { SelectionService } from './selection.service';

describe('SelectionService', () => {
  let service: SelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SelectionService],
    });
    service = TestBed.inject(SelectionService);
  });

  it('should have selectedId null initially', () => {
    expect(service.selectedId()).toBeNull();
  });

  it('should have activeEditor null initially', () => {
    expect(service.activeEditor()).toBeNull();
  });

  it('select() should update selectedId', () => {
    service.select('el-1');
    expect(service.selectedId()).toBe('el-1');
  });

  it('select() should replace previous selection', () => {
    service.select('el-1');
    service.select('el-2');
    expect(service.selectedId()).toBe('el-2');
  });

  it('deselect() should set selectedId to null', () => {
    service.select('el-1');
    service.deselect();
    expect(service.selectedId()).toBeNull();
  });

  it('deselect() on already-null state should not throw', () => {
    expect(() => service.deselect()).not.toThrow();
  });

  it('activeEditor should be settable', () => {
    // Editor is a complex type — use a mock object to verify the signal works
    const mockEditor = { destroy: () => {} } as any;
    service.activeEditor.set(mockEditor);
    expect(service.activeEditor()).toBe(mockEditor);
  });

  it('activeEditor should be clearable back to null', () => {
    const mockEditor = { destroy: () => {} } as any;
    service.activeEditor.set(mockEditor);
    service.activeEditor.set(null);
    expect(service.activeEditor()).toBeNull();
  });
});
