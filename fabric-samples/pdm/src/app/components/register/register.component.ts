import { SelectorListContext } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/services/api/api.service';
import { AuthService } from '../../services/auth/auth.service';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { first } from 'rxjs-compat/operator/first';
import { User } from 'src/app/user';
// import { RegisterComponent } from './register.component';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})

export class RegisterComponent implements OnInit {
  isLogin: boolean = false;
  isAdmin: boolean = false;
  selectedRole: string;
  org: String;
  doctorList: any[];
  selectedDoctorId: String;
  errorMessage;
  roles = ["Doctor", "Patient", "Researcher"];
  _url;
  username;


  constructor(
    private _api: ApiService,
    private _auth: AuthService,
    private _router: Router,
  ) {
    this.selectedRole = localStorage.getItem('selectedRole') || '';
  }

  ngOnInit(): void {
    this.isUserLogin();
    this.isAdmin = this._auth.isUserAdmin();
    this.username = this._auth.getUserDetails("username");
    this.org = this._auth.getUserDetails('org');
    this.fetchDoctors();
  }

  fetchDoctors() {
        this._api.postTypeRequest('getDoctorsList', {username: this.username, role: 'patient'}).subscribe((res: any) => {
          this.doctorList = res;
        });
    }

  getselectedDoctor() {
    console.log(this.selectedDoctorId);
    return this.doctorList.find(doctor => doctor.id.toString() === this.selectedDoctorId.toString());
  }

  onSubmit(form: NgForm) {

    console.log('Your form data : ', form.value);
    this._url = form.value.role;
    let payload = null
    if(form.value.role==="Doctor") {
      payload = {
        username: this.username,
        role: form.value.role,
        // id: form.value.id,
        doctorId: form.value.doctorId,
        org: form.value.org,
        // address : form.value.address,
        // tel : form.value.tel,
        patientId: form.value.patientId,
        researcherId: form.value.researcherId,
        LDL: 1,
        WBCs: 1,
        TAG: 1,
        firstNameDoctor: form.value.firstNameDoctor,
        lastNameDoctor: form.value.lastNameDoctor,
        firstNamePatient: form.value.firstNamePatient,
        lastNamePatient: form.value.lastNamePatient,
        firstNameResearcher: form.value.firstNameResearcher,
        lastNameResearcher: form.value.lastNameResearcher,
      }
    }else{
      console.log(this.doctorList);
      const doctor = this.getselectedDoctor()
      console.log(doctor);
      payload = {
        username: this.username,
        role: form.value.role,
        // id: form.value.id,
        doctorId: doctor.doctorId,
        org: doctor.org,
        // address : form.value.address,
        // tel : form.value.tel,
        patientId: form.value.patientId,
        researcherId: form.value.researcherId,
        LDL: 1,
        WBCs: 1,
        TAG: 1,
        firstNameDoctor: form.value.firstNameDoctor,
        lastNameDoctor: form.value.lastNameDoctor,
        firstNamePatient: form.value.firstNamePatient,
        lastNamePatient: form.value.lastNamePatient,
        firstNameResearcher: form.value.firstNameResearcher,
        lastNameResearcher: form.value.lastNameResearcher,
      }
    }
    console.log(payload);
    if (payload.role === "Doctor") {
      if (payload.firstNameDoctor === '' || payload.lastNameDoctor === '') {
        alert("Doctor name fields are required");
      }
      else {
        this._api.postTypeRequest(`register${this._url}`, payload).subscribe((res: any) => {
          if (res) {
            console.log(JSON.stringify(res));
            alert(JSON.stringify(res));
            window.location.reload();
          }
          else {
            console.log(res);
            alert(res)
          }
        },

          err => {
            this.errorMessage = err['error'].message;
          });
      }
    }
    else if (payload.role === "Patient") {
      if (this.selectedDoctorId === '') {
        alert("Patient Doctor is required");
      }
      if (payload.firstNamePatient === '' || payload.lastNamePatient === '') {
        alert("Patient name fields are required");
      }
      else {
        this._api.postTypeRequest(`register${this._url}`, payload).subscribe((res: any) => {
          if (res) {
            console.log(JSON.stringify(res));
            alert(JSON.stringify(res));
            window.location.reload();
          }
          else {
            console.log(res);
            alert(res)
          }
        },

          err => {
            this.errorMessage = err['error'].message;
          });
      }
    }
    else if (payload.role === "Researcher") {
      if (payload.firstNameResearcher === '' || payload.lastNameResearcher === '') {
        alert("Researcher name fields are required");
      }
      else {
        this._api.postTypeRequest(`register${this._url}`, payload).subscribe((res: any) => {
          if (res) {
            console.log(JSON.stringify(res));
            alert(JSON.stringify(res));
            window.location.reload();
          }
          else {
            console.log(res);
            alert(res)
          }
        },

          err => {
            this.errorMessage = err['error'].message;
          });
      }
    }
  }


  isUserLogin() {
    if (this._auth.getToken() != null) {
      this.isLogin = true;
    }
    else {
      this.isLogin = false;
    }
  }

  onRoleChange() {
    localStorage.setItem('selectedRole', this.selectedRole);
    window.location.reload();
  }

}