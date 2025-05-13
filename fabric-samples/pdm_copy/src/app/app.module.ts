import { HttpInterceptor, HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { UpdateComponent } from './components/update/update.component';
import { ReadComponent } from './components/read/read.component';
import { AccessComponent } from './components/access/access.component';
import { AuthModule } from './auth/auth.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthInterceptor } from './services/interceptor/auth.interceptor';
import { AdminComponent } from './view/admin/admin.component';
import { PatientComponent } from './view/patient/patient.component';
import { DoctorComponent } from './view/doctor/doctor.component';
import { ResearcherComponent } from './view/researcher/researcher.component';
import { NotfoundComponent } from './components/notfound/notfound.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UpdateHealthRecordComponent } from './components/update-health-record/update-health-record.component';
import { GrantAccessDoctorComponent } from './components/grant-access/grant-access-doctor.component';
import { RevokeAccessDoctorComponent } from './components/revoke-access/revoke-access-doctor.component';
import { GrantAccessResearcherComponent } from './components/grant-access/grant-access-researcher.component';
import { RevokeAccessResearcherComponent } from './components/revoke-access/revoke-access-researcher.component';
import { GrantAccessPatientComponent } from './components/requests/grant-access-patient.component';
import { GrantEmergencyAccessPatientComponent } from './components/emergency/grant-emergency-access-patient.component';
import { SetPasswordComponent } from './components/password/set-password.component';


import { MatMenuModule } from '@angular/material/menu';

import { MatButtonModule } from '@angular/material/button';


@NgModule({ declarations: [
        AppComponent,
        UpdateComponent,
        ReadComponent,
        AccessComponent,
        PatientComponent,
        DoctorComponent,
        ResearcherComponent,
        AdminComponent,
        NotfoundComponent,
        UpdateHealthRecordComponent,
        GrantAccessDoctorComponent,
        RevokeAccessDoctorComponent,
        GrantAccessResearcherComponent,
        RevokeAccessResearcherComponent,
        GrantAccessPatientComponent,
        GrantEmergencyAccessPatientComponent,
        SetPasswordComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        AuthModule,
        RouterModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        MatMenuModule,
        MatButtonModule], providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
        },
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule { }
export class DemoMaterialModule { }