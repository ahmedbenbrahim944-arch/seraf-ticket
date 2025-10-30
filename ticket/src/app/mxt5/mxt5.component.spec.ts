import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mxt5Component } from './mxt5.component';

describe('Mxt5Component', () => {
  let component: Mxt5Component;
  let fixture: ComponentFixture<Mxt5Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mxt5Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Mxt5Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
