import { AuthService } from '../../services/auth/auth.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-patient',
  templateUrl: './patient.component.html',
  styleUrls: ['./patient.component.css']
})
export class PatientComponent implements OnInit {
  isPatient : boolean = false;
  username;
  firstLogin : String;
  role : String;
  
  constructor(
      private _auth: AuthService,
      // private _api: ApiService,
      private router: Router
    ) { }

  ngOnInit(): void {
    this.isPatient = this._auth.isUserPatient();
    this.username = this._auth.getUserDetails("username");
    this.firstLogin = this._auth.getUserDetails("firstLogin");
    this.role = this._auth.getUserDetails("userData");
    // this.readByPatient();
    if(this.firstLogin==="0"){
      this.router.navigate(["/setpass"]);
    }
  }

}
