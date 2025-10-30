import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Xt6Component } from './xt6.component';

describe('Xt6Component', () => {
  let component: Xt6Component;
  let fixture: ComponentFixture<Xt6Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Xt6Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Xt6Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
