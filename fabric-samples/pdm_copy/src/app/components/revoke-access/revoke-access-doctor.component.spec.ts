import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevokeAccessDoctorComponent } from './revoke-access-doctor.component';

describe('RevokeAccessDoctorComponent', () => {
  let component: RevokeAccessDoctorComponent;
  let fixture: ComponentFixture<RevokeAccessDoctorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RevokeAccessDoctorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RevokeAccessDoctorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
