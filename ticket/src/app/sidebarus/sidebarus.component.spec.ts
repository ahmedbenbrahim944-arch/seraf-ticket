import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarusComponent } from './sidebarus.component';

describe('SidebarusComponent', () => {
  let component: SidebarusComponent;
  let fixture: ComponentFixture<SidebarusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarusComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SidebarusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
