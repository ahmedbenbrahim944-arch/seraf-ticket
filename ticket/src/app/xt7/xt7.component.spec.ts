import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Xt7Component } from './xt7.component';

describe('Xt7Component', () => {
  let component: Xt7Component;
  let fixture: ComponentFixture<Xt7Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Xt7Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Xt7Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
