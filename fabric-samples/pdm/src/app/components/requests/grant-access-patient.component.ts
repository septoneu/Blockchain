import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ApiService } from 'src/app/services/api/api.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { User } from 'src/app/user';

@Component({
  selector: 'app-grant-access-patient',
  templateUrl: './grant-access-patient.component.html',
  styleUrls: ['./grant-access-patient.component.css']
})
export class GrantAccessPatientComponent implements OnInit {

  patient: User[];
  returnsData: boolean = false;
  errorMessage: String;
  username: String;
  patientId: String;
  role: String;
  doctorId: String;
  org: String;
  patientList1: any[];
  // researcherList : String[];
  loading = false
  newPatientName: String;
  newPatientId: String;


  isDoctor: boolean = false;
  constructor(private _auth: AuthService,
    private _api: ApiService) { }

  ngOnInit(): void {
    this.isDoctor = this._auth.isUserDoctor();
    this.org = this._auth.getUserDetails('org');
    this.username = this._auth.getUserDetails("username");
    this.patientId = this._auth.getUserDetails("username");
    this.role = this._auth.getUserDetails("userData");
    this.doctorId = this._auth.getUserDetails("username");

    this.getPatientsList();
  }

  getPatientsList() {
    this._api.postTypeRequest('getPatientsList', { username: this.username, role: this.role }).subscribe((res: any) => {
      this.patientList1 = res;

    });
  }

  setPatientId() {
    const selectedPatient = this.patientList1.find(patient =>
      `${patient.firstNamePatient} ${patient.lastNamePatient}` === this.newPatientName);
    if (selectedPatient) {
      this.newPatientId = selectedPatient.patientId;
    } else {
      this.newPatientId = null;
    }
  }
  RequestAccessDoctor(form : NgForm){
    this.loading = true;
    
    let payload = { username : this.username,
                    org : this.org,
                    patientId : form.value.newPat,
                  }
    console.log(payload);
    
    this._api.postTypeRequest("requestAccess",payload).subscribe((res : any)=>{
      this.loading = false;
      if (res){
      this.patient = Array.of(res);
      console.log(res);
      this.returnsData = true;
      
      alert('Access granted successfully!');
      // window.location.reload();
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
