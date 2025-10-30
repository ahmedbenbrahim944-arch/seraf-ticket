import { ComponentFixture, TestBed } from '@angular/core/testing';

import { T4Component } from './t4.component';

describe('T4Component', () => {
  let component: T4Component;
  let fixture: ComponentFixture<T4Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [T4Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(T4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
