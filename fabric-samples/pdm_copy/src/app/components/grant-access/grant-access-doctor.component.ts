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
  selector: 'app-grant-access-doctor',
  templateUrl: './grant-access-doctor.component.html',
  styleUrls: ['./grant-access-doctor.component.css']
})
export class GrantAccessDoctorComponent implements OnInit {

  patient : User[];
  returnsData : boolean = false;
  errorMessage : String;
  username : String;
  patientId : String;
  role : String;
  doctorId : String;
  org : String;
  doctorList1: any[];
  // researcherList : String[];
  loading = false;
  newDoctorName : String;
  newDoctorId : String;
  

  isPatient : boolean = false;
  constructor(private _auth : AuthService,
    private _api : ApiService) { }

  ngOnInit(): void {
    this.isPatient = this._auth.isUserPatient();
    this.org = this._auth.getUserDetails('org');
    this.username = this._auth.getUserDetails("username");
    this.patientId = this._auth.getUserDetails("username");
    this.role = this._auth.getUserDetails("userData");
    this.doctorId = this._auth.getUserDetails("username");

    // this.readByPatient();
    this.getDoctorsList();
  }

  getDoctorsList() {
    this._api.postTypeRequest('getDoctorsList', {username: this.username, role: this.role}).subscribe((res: any) => {
      this.doctorList1 = res;
    
    });
  }

  setDoctorId() {
    const selectedDoctor = this.doctorList1.find(doctor => 
        `${doctor.firstNameDoctor} ${doctor.lastNameDoctor}` === this.newDoctorName);
    if (selectedDoctor) {
        this.newDoctorId = selectedDoctor.doctorId;
    } else {
        this.newDoctorId = null; // or some default/error handling
    }
}

  GrantAccessDoctor(form : NgForm){
    this.loading = true;
    
    let payload = { username : this.username,
                    org : this.org,
                    doctorId : form.value.newDoc,
                  }
    console.log(payload);
    
    this._api.postTypeRequest("grantAccessDoctor",payload).subscribe(async (res : any)=>{
      this.loading = false;
      if (res){
      this.patient = Array.of(res);
      console.log(res);
      this.returnsData = true;
      
      // alert('Access granted successfully!');
      await Toast.fire({
        icon: "success",
        title: "Access granted successfully!"
      });
      // window.location.reload();
      }
      else {
        console.log(res);
        await Toast.fire({
          icon: "success",
          title: res
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
