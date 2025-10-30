import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XT5Component } from './xt5.component';

describe('XT5Component', () => {
  let component: XT5Component;
  let fixture: ComponentFixture<XT5Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XT5Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(XT5Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
