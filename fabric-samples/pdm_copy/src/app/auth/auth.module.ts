import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from 'src/app/components/login/login.component';
import { RegisterComponent } from 'src/app/components/register/register.component';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AdminComponent } from 'src/app/view/admin/admin.component';



@NgModule({ declarations: [
        LoginComponent,
        RegisterComponent
    ],
    exports: [
        LoginComponent,
        RegisterComponent,
    ], imports: [CommonModule,
        FormsModule], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class AuthModule { }
