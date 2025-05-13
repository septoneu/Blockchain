import { asLiteral } from '@angular/compiler/src/render3/view/util';
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ApiService } from 'src/app/services/api/api.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { User } from 'src/app/user';

@Component({
  selector: 'app-grant-access-researcher',
  templateUrl: './grant-access-researcher.component.html',
  styleUrls: ['./grant-access-researcher.component.css']
})
export class GrantAccessResearcherComponent implements OnInit {

  patient : User[];
  returnsData : boolean = false;
  errorMessage : String;
  username : String;
  patientId : String;
  role : String;
  researcherId : String;
  org : String;
  researchersList : any[];
  newResearcherName : String;
  newResearcherId : String;

  isPatient : boolean = false;
  constructor(private _auth : AuthService,
    private _api : ApiService) { }

  ngOnInit(): void {
    this.isPatient = this._auth.isUserPatient();
    this.org = this._auth.getUserDetails('org');
    this.username = this._auth.getUserDetails("username");
    this.patientId = this._auth.getUserDetails("username");
    this.role = this._auth.getUserDetails("userData");
    this.researcherId = this._auth.getUserDetails("username");
    this.getResearchersList();
  }

  getResearchersList() {
    this._api.postTypeRequest('getResearchersList', {username: this.username, role: this.role}).subscribe((res: any) => {
      this.researchersList = res;
    
    });
  }

  setResearcherId() {
    const selectedResearcher = this.researchersList.find(researcher => 
        `${researcher.firstNameResearcher} ${researcher.lastNameResearcher}` === this.newResearcherName);
    if (selectedResearcher) {
        this.newResearcherId = selectedResearcher.researcherId;
    } else {
        this.newResearcherId = null; // or some default/error handling
    }
}

  GrantAccessResearcher(form : NgForm){
    
    let payload = { username : this.username,
                    // patientId : this.patientId,
                    role : this.role,
                    org : this.org,
                    researcherId : form.value.newRes
                  }
    console.log(payload);
    
    this._api.postTypeRequest("grantAccessResearcher",payload).subscribe((res : any)=>{
      if (res){
      this.patient = Array.of(res);
      console.log(res);
      this.returnsData = true;
      }
      else {
        console.log(res);
        alert(res);
        window.location.reload();
      }
    },
    err => {
      this.errorMessage = err['error'].message;
    });
  }

}
