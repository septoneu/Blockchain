import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResearcherComponent } from './researcher.component';

describe('DoctorComponent', () => {
  let component: ResearcherComponent;
  let fixture: ComponentFixture<ResearcherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResearcherComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResearcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
