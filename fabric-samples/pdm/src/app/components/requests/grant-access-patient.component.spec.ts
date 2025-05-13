import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrantAccessPatientComponent } from './grant-access-patient.component';

describe('GrantAccessPatientComponent', () => {
  let component: GrantAccessPatientComponent;
  let fixture: ComponentFixture<GrantAccessPatientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GrantAccessPatientComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GrantAccessPatientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
