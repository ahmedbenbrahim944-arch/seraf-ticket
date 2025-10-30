import { ComponentFixture, TestBed } from '@angular/core/testing';

import { St7Component } from './st7.component';

describe('St7Component', () => {
  let component: St7Component;
  let fixture: ComponentFixture<St7Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [St7Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(St7Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
