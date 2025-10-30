import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Chst7Component } from './chst7.component';

describe('Chst7Component', () => {
  let component: Chst7Component;
  let fixture: ComponentFixture<Chst7Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Chst7Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Chst7Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
