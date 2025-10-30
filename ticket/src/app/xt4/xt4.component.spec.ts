import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Xt4Component } from './xt4.component';

describe('Xt4Component', () => {
  let component: Xt4Component;
  let fixture: ComponentFixture<Xt4Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Xt4Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Xt4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
