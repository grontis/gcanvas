import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GcanvasComponent } from './gcanvas.component';

describe('GcanvasComponent', () => {
  let component: GcanvasComponent;
  let fixture: ComponentFixture<GcanvasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GcanvasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GcanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
