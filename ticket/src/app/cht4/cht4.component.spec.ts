import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cht4Component } from './cht4.component';

describe('Cht4Component', () => {
  let component: Cht4Component;
  let fixture: ComponentFixture<Cht4Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cht4Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Cht4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
