import { NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { User } from 'src/app/user';
import { ApiService } from 'src/app/services/api/api.service';

@Component({
  selector: 'app-researcher',
  templateUrl: './researcher.component.html',
  styleUrls: ['./researcher.component.css']
})
export class ResearcherComponent implements OnInit {
  hide = true;
  isDoctor: boolean = false;
  isResearcher: boolean = false;
  patient: User;
  columnsToDisplay = ["Patient Id"]
  role = "researcher";
  username;
  firstLogin:String;
  

  constructor(
    private _auth: AuthService,
    private _api: ApiService,
  private router :Router) { }

  ngOnInit(): void {
    // this.isDoctor = this._auth.isUserDoctor();
    this.isResearcher = this._auth.isUserResearcher();
    this.username = this._auth.getUserDetails("username");
    this.firstLogin = this._auth.getUserDetails("firstLogin");
    // this.readByPatient();
    if(this.firstLogin==="0"){
      this.router.navigate(["/setpass"]);
    }
  }



}
