import { SelectorListContext } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/services/api/api.service';
import { AuthService } from '../../services/auth/auth.service';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
// import { first } from 'rxjs-compat/operator/first';
import { User } from 'src/app/user';
// import { RegisterComponent } from './register.component';
import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: "center",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});


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
  loading = false;


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
        this._api.postTypeRequest('getDoctorsListByOrg', {username: this.username, role: 'patient',org:this.org}).subscribe((res: any) => {
          this.doctorList = res;
        });
    }

  getselectedDoctor() {
    console.log(this.selectedDoctorId);
    return this.doctorList.find(doctor => doctor.id.toString() === this.selectedDoctorId.toString());
  }

  async onSubmit(form: NgForm) {
    this.loading = true;

    console.log('Your form data : ', form.value);
    this._url = form.value.role;
    let payload = null
    if(form.value.role==="doctor") {
      payload = {
        username: this.username,
        role: form.value.role,
        // id: form.value.id,
        doctorId: form.value.doctorId,
        org: this.org,
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
        password:form.value.password
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
        password:form.value.password
      }
    }
    console.log(payload);
    if (payload.role === "doctor") {
      if (payload.firstNameDoctor === '' || payload.lastNameDoctor === '') {
        await Toast.fire({
          icon: "info",
          title: "Doctor name fields are required"
        });
      }
      else {
        this._api.postTypeRequest(`register${this._url}`, payload).subscribe(async (res: any) => {
          if (res) {
            console.log(JSON.stringify(res));
            await Toast.fire({
              icon: "success",
              title: JSON.stringify(res)
            });
            this.loading = false;
            window.location.reload();
          }
          else {
            console.log(res);
             await Toast.fire({
              icon: "success",
              title: res
            });
            this.loading = false;
          }
        },

          async err => {
            this.errorMessage = err['error'].message;
            await Toast.fire({
              icon: "error",
              title: "Something went wrong"
            });
            this.loading = false;
          });
      }
    }
    else if (payload.role === "patient") {
      if (this.selectedDoctorId === '') {
        await Toast.fire({
          icon: "info",
          title: "Patient Doctor is required"
        });
        this.loading = false;
      }
      if (payload.firstNamePatient === '' || payload.lastNamePatient === '') {
        await Toast.fire({
          icon: "info",
          title: "Patient name fields are required"
        });
        this.loading = false;
      }
      else {
        this._api.postTypeRequest(`register${this._url}`, payload).subscribe(async (res: any) => {
          if (res) {
            console.log(JSON.stringify(res));
            // alert(JSON.stringify(res));
            await Toast.fire({
              icon: "success",
              title: JSON.stringify(res)
            });
            this.loading = false;
            window.location.reload();
          }
          else {
            console.log(res);
            // alert(res)
            await Toast.fire({
              icon: "success",
              title: JSON.stringify(res)
            });
            this.loading = false;
          }
        },

          async err => {
            this.errorMessage = err['error'].message;
            console.log( this.errorMessage)
            await Toast.fire({
              icon: "error",
              title: "Something went wrong"
            });
            this.loading = false;
          });
      }
    }
    else if (payload.role === "researcher") {
      if (this.selectedDoctorId === '') {
        await Toast.fire({
          icon: "info",
          title: "Patient Doctor is required"
        });
        this.loading = false;
      }
      if (payload.firstNameResearcher === '' || payload.lastNameResearcher === '') {
        // alert("Researcher name fields are required");
        await Toast.fire({
          icon: "info",
          title: "Researcher name fields are required"
        });
      }
      else {
        this._api.postTypeRequest(`register${this._url}`, payload).subscribe(async (res: any) => {
          if (res) {
            console.log(JSON.stringify(res));
            // alert(JSON.stringify(res));
            await Toast.fire({
              icon: "success",
              title: JSON.stringify(res)
            });
            this.loading = false;
            window.location.reload();
          }
          else {
            console.log(res);
            // alert(res)
            await Toast.fire({
              icon: "success",
              title: JSON.stringify(res)
            });
            this.loading = false;
          }
        },

          async err => {
            this.errorMessage = err['error'].message;
            console.log( this.errorMessage)
            await Toast.fire({
              icon: "error",
              title: "Something went wrong"
            });
            this.loading = false;
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