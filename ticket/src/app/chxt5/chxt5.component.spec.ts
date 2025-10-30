import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Chxt5Component } from './chxt5.component';

describe('Chxt5Component', () => {
  let component: Chxt5Component;
  let fixture: ComponentFixture<Chxt5Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Chxt5Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Chxt5Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
