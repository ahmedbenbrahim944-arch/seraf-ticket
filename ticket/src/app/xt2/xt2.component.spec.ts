import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Xt2Component } from './xt2.component';

describe('Xt2Component', () => {
  let component: Xt2Component;
  let fixture: ComponentFixture<Xt2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Xt2Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Xt2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
