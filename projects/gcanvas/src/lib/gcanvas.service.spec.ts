import { TestBed } from '@angular/core/testing';

import { GcanvasService } from './gcanvas.service';

describe('GcanvasService', () => {
  let service: GcanvasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GcanvasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
