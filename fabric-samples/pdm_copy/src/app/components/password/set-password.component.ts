import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ApiService } from 'src/app/services/api/api.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { User } from 'src/app/user';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';


const Toast = Swal.mixin({
  toast: true,
  position: "center",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

@Component({
  selector: 'app-set-password',
  templateUrl: './set-password.component.html',
  styleUrls: ['./set-password.component.css']
})
export class SetPasswordComponent implements OnInit {

  patient : User[];
  returnsData : boolean = false;
  errorMessage : String;
  username : String;
  patientId : String;
  role : String;
  doctorId : String;
  org : String;
  firstLogin : String;
  loading = false;
  password:String;
  repassword:String;
  

  isPatient : boolean = false;
  constructor(
    private _auth: AuthService,
    private _api: ApiService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.isPatient = this._auth.isUserPatient();
    this.org = this._auth.getUserDetails('org');
    this.username = this._auth.getUserDetails("username");
    this.patientId = this._auth.getUserDetails("username");
    this.role = this._auth.getUserDetails("userData");
    this.doctorId = this._auth.getUserDetails("username");
    this.firstLogin = this._auth.getUserDetails("firstLogin");

    // this.readByPatient();
    if(this.firstLogin==="1"){
      this.router.navigate(["/"+this.role.toLowerCase()])
    }
  }


  async set_password(form : NgForm){

    if(this.password!=this.repassword || this.password=== '' || this.repassword === ''){
      await Toast.fire({
        icon: "error",
        title: "Passwords not match!"
      }); 
      return;
    }
    this.loading = true;

    let payload = { 
                    username : this.username,
                    org : this.org,
                    doctorId : this.doctorId,
                    role:this.role,
                    patientId:this.patientId,
                    password: this.password
                  }
    console.log(payload);
    
    this._api.postTypeRequest("updatePassword",payload).subscribe(async (res : any)=>{
      this.loading = false;
      if (res){
      this.patient = Array.of(res);
      console.log(res);
      this.returnsData = true;
      
      // alert('Access granted successfully!');
      this._auth.setDataInLocalStorage('firstLogin', "1");
      await Toast.fire({
        icon: "success",
        title: "Password changed successfully!",
        timer: 2000
      });
      // window.location.reload();
      this.router.navigate(["/"+this.role.toLowerCase()])
      }
      else {
        console.log(res);
        await Toast.fire({
          icon: "success",
          title: res,
        });
        // alert(res);
        
        window.location.reload();
      }
    },
    async err => {
      this.loading = false;
      this.errorMessage = err['error'].message;
      await Toast.fire({
        icon: "error",
        title: "Something went wrong"
      });
    });
  }

}
