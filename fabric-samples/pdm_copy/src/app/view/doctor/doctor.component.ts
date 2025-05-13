import { NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { Component, OnInit } from '@angular/core';

import { User } from 'src/app/user';
import { ApiService } from 'src/app/services/api/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-doctor',
  templateUrl: './doctor.component.html',
  styleUrls: ['./doctor.component.css']
})
export class DoctorComponent implements OnInit {
  hide = true;
  isDoctor: boolean = false;
  patient: User;
  columnsToDisplay = ["Patient Id"]
  role = "doctor";
  username;
  firstLogin:String;

  constructor(
    private _auth: AuthService,
    private _api: ApiService,
    private router: Router) { }

  ngOnInit(): void {
    this.isDoctor = this._auth.isUserDoctor();
    this.username = this._auth.getUserDetails("username");
    this.firstLogin = this._auth.getUserDetails("firstLogin");
    console.log(this.firstLogin);
    if(this.firstLogin==="0"){
      this.router.navigate(["/setpass"]);
    }
  }



}
