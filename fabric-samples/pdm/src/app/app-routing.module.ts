import { UpdateHealthRecordComponent } from './components/update-health-record/update-health-record.component';
import { NotfoundComponent } from './components/notfound/notfound.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AdminComponent } from './view/admin/admin.component';
import { DoctorComponent } from './view/doctor/doctor.component';
import { PatientComponent } from './view/patient/patient.component';
import { ResearcherComponent } from './view/researcher/researcher.component';
import { ReadComponent } from './components/read/read.component';
// import { UpdateComponent } from './components/update/update.component';
import { GrantAccessDoctorComponent } from './components/grant-access/grant-access-doctor.component';
import { RevokeAccessDoctorComponent } from './components/revoke-access/revoke-access-doctor.component';
import { GrantAccessPatientComponent } from './components/requests/grant-access-patient.component';
import { GrantEmergencyAccessPatientComponent } from './components/emergency/grant-emergency-access-patient.component';
// import { GrantAccessResearcherComponent } from './components/grant-access/grant-access-researcher.component';
// import { RevokeAccessResearcherComponent } from './components/revoke-access/revoke-access-researcher.component';

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'admin',
    component: AdminComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'doctor',
    component: DoctorComponent
  },
  {
    path: 'patient',
    component: PatientComponent
  },
  {
    path: 'researcher',
    component: ResearcherComponent
  },
  {
    path: 'read',
    component: ReadComponent
  },
  // {
  //   path : 'readalldata',
  //   component : ReadComponent
  // },
  {
    path: 'updateHealthRecord',
    component: UpdateHealthRecordComponent
  },

  // { path : 'update',
  //   component : UpdateComponent
  // },
  {
    path: 'grantdoctor',
    component: GrantAccessDoctorComponent
  },
  {
    path: 'revokedoctor',
    component: RevokeAccessDoctorComponent
  },

  {
    path: 'requests',
    component: GrantAccessPatientComponent
  },
  {
    path: 'emergency',
    component: GrantEmergencyAccessPatientComponent
  },
  // {
  //   path : 'grantresearcher',
  //   component : GrantAccessResearcherComponent
  // },
  // {
  //   path : 'revokeresearcher',
  //   component : RevokeAccessResearcherComponent
  // },
  {
    path: '', redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '404',
    component: NotfoundComponent
  },
  {
    path: '**',
    redirectTo: '/404'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {

}
