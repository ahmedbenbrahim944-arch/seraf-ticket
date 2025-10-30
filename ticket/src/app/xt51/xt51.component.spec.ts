import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Xt51Component } from './xt51.component';

describe('Xt51Component', () => {
  let component: Xt51Component;
  let fixture: ComponentFixture<Xt51Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Xt51Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Xt51Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
