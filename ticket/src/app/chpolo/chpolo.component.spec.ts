import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChpoloComponent } from './chpolo.component';

describe('ChpoloComponent', () => {
  let component: ChpoloComponent;
  let fixture: ComponentFixture<ChpoloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChpoloComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChpoloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
