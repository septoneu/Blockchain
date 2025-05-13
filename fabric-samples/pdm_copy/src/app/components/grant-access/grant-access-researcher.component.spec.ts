import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrantAccessResearcherComponent } from './grant-access-researcher.component';

describe('GrantAccessComponent', () => {
  let component: GrantAccessResearcherComponent;
  let fixture: ComponentFixture<GrantAccessResearcherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GrantAccessResearcherComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GrantAccessResearcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
