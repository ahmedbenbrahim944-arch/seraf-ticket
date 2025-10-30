import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Xt3Component } from './xt3.component';

describe('Xt3Component', () => {
  let component: Xt3Component;
  let fixture: ComponentFixture<Xt3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Xt3Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Xt3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
