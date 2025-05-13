import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ApiService } from 'src/app/services/api/api.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { User } from 'src/app/user';
import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: "center",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

@Component({
  selector: 'app-revoke-access-researcher',
  templateUrl: './revoke-access-researcher.component.html',
  styleUrls: ['./revoke-access-researcher.component.css']
})
export class RevokeAccessResearcherComponent implements OnInit {

  patient : User[];
  returnsData : boolean = false;
  errorMessage : String;
  username : String;
  patientId : String;
  role : String;
  researcherId : String;
  org : String;
  researchersList : String[];

  isPatient : boolean = false;
  constructor(private _auth : AuthService,
    private _api : ApiService) { }

  ngOnInit(): void {
    this.isPatient = this._auth.isUserPatient();
    this.org = this._auth.getUserDetails("org");
    this.username = this._auth.getUserDetails("username");
    this.patientId = this._auth.getUserDetails("username");
    this.role = this._auth.getUserDetails("userData");
    this.researcherId = this._auth.getUserDetails("username");

    this.getSpecificResearchersList();
  }

  getSpecificResearchersList(form: NgForm = null) {
    let payload = {
      username: this.username,
      role: this.role
    }
    console.log(payload);
    this._api.postTypeRequest('getSpecificResearchersList', payload).subscribe((res: any) => {
      this.researchersList = res;
      console.log(this.researchersList);
    });
  }

  RevokeAccessResearcher(form : NgForm){
    
    let payload = { username : this.username,
                    // patientId : this.patientId,
                    role : this.role,
                    // id : this.id,
                    org : this.org,
                    researcherId : form.value.newRes
                  }
    console.log(payload);
    
    this._api.postTypeRequest("revokeAccessResearcher", payload).subscribe(async (res: any) => {
      if (res) {
        this.patient = Array.of(res);
        console.log(res);
        this.returnsData = true;
        // alert('Access revoked successfully!');
        await Toast.fire({
          icon: "success",
          title: 'Access revoked successfully!'
        });
        window.location.reload();
      }
      else {
        console.log(res);
        // alert(res);
        await Toast.fire({
          icon: "success",
          title: res
        });
        window.location.reload();
      }
    },
      async err => {
        this.errorMessage = err['error'].message;
        await Toast.fire({
          icon: "error",
          title: "Something went wrong"
        });
      });
  }

}
