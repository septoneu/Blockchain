import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevokeAccessResearcherComponent } from './revoke-access-researcher.component';

describe('RevokeAccessResearcherComponent', () => {
  let component: RevokeAccessResearcherComponent;
  let fixture: ComponentFixture<RevokeAccessResearcherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RevokeAccessResearcherComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RevokeAccessResearcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
