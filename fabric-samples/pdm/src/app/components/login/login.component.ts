import { AuthModule } from '../../auth/auth.module';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgForm, FormGroup, FormBuilder, Validators } from '@angular/forms';

import { AuthService } from '../../services/auth/auth.service';
import { stringify } from '@angular/compiler/src/util';
import { ApiService } from 'src/app/services/api/api.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  isLogin: boolean;
  errorMessage;
  role;
  username;
  org;
  roleLoggedIn;
  
  constructor( 
    private _api: ApiService,
    private _auth: AuthService,
    private _router:Router,
    private _route: ActivatedRoute
   
    ) {}
  ngOnInit(): void {
    this.isUserLogin();
    this.roleLoggedIn = this._auth.getUserDetails("userData");
   
  }
  onSubmit(form: NgForm) {
    console.log('Your form data:', form.value);
    
    this._api.postTypeRequest('login', form.value).subscribe((res: any) => {
      if (res) {
        console.log(res);
        this.role = res.role;
        this.org = res.org
        this._auth.setDataInLocalStorage('username', form.value.username);
        this._auth.setDataInLocalStorage('userData', this.role);
        this._auth.setDataInLocalStorage('org', this.org);
        this._auth.setDataInLocalStorage('token', res.accessToken);

        window.location.href = `/${this.role}`;
      } 
      else {
      }
    }, 
    err => {
      alert("Invalid Username or Password");
      this.errorMessage = err['error'].message;
    });
  }
  

  isUserLogin(){
    if(this._auth.getToken()!= null){
      this.isLogin = true;
    }

  
  }

  getUserName(){
    return this.username;
  }
 
  
  logout(){
    this._auth.clearStorage();
    window.location.reload();

    }
  
  redirect(){
    console.log(JSON.stringify(this.role));
    this._router.navigate(this.role);
  }

}
