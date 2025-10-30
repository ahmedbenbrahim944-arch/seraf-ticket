import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Chxt7Component } from './chxt7.component';

describe('Chxt7Component', () => {
  let component: Chxt7Component;
  let fixture: ComponentFixture<Chxt7Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Chxt7Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Chxt7Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
