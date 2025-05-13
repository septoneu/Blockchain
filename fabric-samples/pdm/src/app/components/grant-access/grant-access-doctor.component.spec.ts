import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrantAccessDoctorComponent } from './grant-access-doctor.component';

describe('GrantAccessDoctorComponent', () => {
  let component: GrantAccessDoctorComponent;
  let fixture: ComponentFixture<GrantAccessDoctorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GrantAccessDoctorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GrantAccessDoctorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
