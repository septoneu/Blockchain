import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrantEmergencyAccessPatientComponent } from './grant-emergency-access-patient.component';

describe('GrantEmergencyAccessPatientComponent', () => {
  let component: GrantEmergencyAccessPatientComponent;
  let fixture: ComponentFixture<GrantEmergencyAccessPatientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GrantEmergencyAccessPatientComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GrantEmergencyAccessPatientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
