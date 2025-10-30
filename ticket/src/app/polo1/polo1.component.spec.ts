import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Polo1Component } from './polo1.component';

describe('Polo1Component', () => {
  let component: Polo1Component;
  let fixture: ComponentFixture<Polo1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Polo1Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Polo1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
