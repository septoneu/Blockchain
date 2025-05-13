import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ApiService } from 'src/app/services/api/api.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { User } from 'src/app/user';

@Component({
  selector: 'app-revoke-access-doctor',
  templateUrl: './revoke-access-doctor.component.html',
  styleUrls: ['./revoke-access-doctor.component.css']
})
export class RevokeAccessDoctorComponent implements OnInit {

  patient: User[];
  returnsData: boolean = false;
  errorMessage: String;
  username: String;
  patientId: String;
  role: String;
  doctorId: String;
  loading = false;
  org: String;
  doctorList: String[];
  // researcherList: String[];

  isPatient: boolean = false;
  constructor(private _auth: AuthService,
    private _api: ApiService) { }

  ngOnInit(): void {
    this.isPatient = this._auth.isUserPatient();
    this.org = this._auth.getUserDetails('org');
    this.username = this._auth.getUserDetails("username");
    this.patientId = this._auth.getUserDetails("username");
    this.role = this._auth.getUserDetails("userData");
    this.doctorId = this._auth.getUserDetails("username");
    this.getSpecificDoctorsList();
  }

  getSpecificDoctorsList(form: NgForm = null) {
    let payload = {
      username: this.username,
      // patientId : this.patientId,
      role : this.role,
      // id : this.id,
      // org: this.org,
      // doctorId: form.value.newDoc,
      // researcherId : form.value.res
    }
    console.log(payload);
    this._api.postTypeRequest('getSpecificDoctorsList', payload).subscribe((res: any) => {
      this.doctorList = res;
      console.log(this.doctorList);
    });
  }


  RevokeAccessDoctor(form: NgForm) {
    this.loading = true;

    let payload = {
      username: this.username,
      // patientId : this.patientId,
      // role : this.role,
      // id : this.id,
      org: this.org,
      doctorId: form.value.newDoc,
      // researcherId : form.value.res
    }
    console.log(payload);

    this._api.postTypeRequest("revokeAccessDoctor", payload).subscribe((res: any) => {
      this.loading = false;
      if (res) {
        this.patient = Array.of(res);
        console.log(res);
        this.returnsData = true;
        alert('Access revoked successfully!');
        window.location.reload();
      }
      else {
        console.log(res);
        alert(res);
        window.location.reload();
      }
    },
      err => {
        this.loading = false;
        this.errorMessage = err['error'].message;
      });
  }

}
