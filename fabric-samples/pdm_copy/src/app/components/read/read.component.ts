import { DoctorComponent } from '../../view/doctor/doctor.component';
import { ResearcherComponent } from '../../view/researcher/researcher.component';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { User } from '../../user';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from 'src/app/services/api/api.service';
import { saveAs } from 'file-saver';
import { HttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: "center",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});


@Component({
  selector: 'app-read',
  templateUrl: './read.component.html',
  styleUrls: ['./read.component.css']
})

export class ReadComponent implements OnInit {
  selectedFile: { [key: number]: string } = {};
  patient: User[];
  isValidUser;
  isDoctor: boolean;
  isPatient: boolean;
  isAdmin: boolean;
  isResearcher: boolean;
  roleDoctor = "doctor";
  roleResearcher = "researcher";
  role: string;
  username: String;
  patientId: String;
  loading = false;
  downloadloading = false;
  doctorId: String;
  org: String;
  errorMessage;
  org_name: string;
  patientIdTest : String;
  statistics: any = {};
  homomorphicData: any = {};
  showStats: any = {};
  showEncData: any = {};
  selectedHospitalId: number | null = null;


  constructor(private _auth: AuthService,
    private _route: RouterModule,
    private _api: ApiService,
    private _http: HttpClient) { }

  ngOnInit(): void {
    this.isDoctor = this._auth.isUserDoctor();
    this.isPatient = this._auth.isUserPatient();
    this.isAdmin = this._auth.isUserAdmin();
    this.isResearcher = this._auth.isUserResearcher();
    this.username = this._auth.getUserDetails("username");
    this.org = this._auth.getUserDetails("org");
    this.patientId = this._auth.getUserDetails("username");
    this.role = this._auth.getUserDetails("userData");
    this.doctorId = this._auth.getUserDetails("username");


    this.isValidUser = function () {
      if (this._auth.isDoctor || this._auth.isPatient || this._auth.isResearcher || this._auth.isAdmin) {
        return true;
      }
      else {
        return false;
      }
    }

    this.readByPatient();

  }
  // for doctor to read Patient Data
  async readByDoctor(form: NgForm) {
    this.loading = true;
    try {
      const payload = {
        username: this.username,
        role: this.role,
        patientId: form.value.patientId,
        org: form.value.org
      };

      this.org_name = form.value.org;
      this.patientIdTest= form.value.patientId
      console.log(payload);

      const res: any = await this._api.postTypeRequest("readPatientData", payload).toPromise();
      this.loading = false;
      this.patient = Array.of(res);

      if (res.patient && !Array.isArray(res.patient)) {
        // It's a single patient object
        this.patient = [{
          ...res.patient,
          files: res.files.map(f => f.filename)
        }];
      } else if (Array.isArray(res.patient)) {
        // It's an array of patients
        this.patient = res.patient.map((pt: any) => ({
          ...pt,
          files: res.files.filter((file: any) => file.patientId === pt.patientId).map(f => f.filename)
        }));
      } else {
        // Handle unexpected format or empty response
        console.error("Unexpected response format:", res);
        this.patient = []; // or any other default or error handling
      }
      console.log(this.patient);

      if (res === "Access not granted for the specified doctor and patient.") {
        // window.alert('Access not granted for the specified doctor and patient.');
        await Toast.fire({
          icon: "error",
          title: "Access not granted for the specified doctor and patient."
        });
      } else if (res === "Error: Not Valid Data"){
        // window.alert('Please contact admin. Data have been altered!')
        await Toast.fire({
          icon: "error",
          title: "Please contact admin. Data have been altered!"
        });
      }
       else if (res.length === 0) {
        // window.alert('No patient with this Id is assigned to this doctor');
        await Toast.fire({
          icon: "error",
          title: "No patient with this Id is assigned to this doctor"
        });
      }

      console.log(res);
    } catch (error) {
      console.log(error);
      this.loading = false;
      if (error instanceof HttpErrorResponse && error.error && error.error.text && error.error.text.includes("Error: Not Valid Data")) {
        // window.alert('Please contact admin. Data have been altered!');
        await Toast.fire({
          icon: "error",
          title: "Please contact admin. Data have been altered!"
        });
    }
    else
      // window.alert('Access not granted for the specified doctor and patient.');
      await Toast.fire({
        icon: "error",
        title: "Access not granted for the specified doctor and patient."
      });
    }
  }


  readByAdmin(form: NgForm) {

    let payload = {
      username: this.username,
      role: this.role,

      org: form.value.org
    }
    console.log(payload);



    // this._api.postTypeRequest("readPatientData",payload).subscribe((res : any)=>{
    //   this.patient = Array.of(res);
    //   try{
    //     this.patient = res.patient.map((pt: any) => ({
    //       ...pt,
    //       files: res.files.filter((file: any) => file.patientId === pt.patientId).map(f => f.filename)
    //     }));
    //   }catch(error){
    //     console.log(error);
    //   }
    // });
  }

  // for researcher to read Patient Data
  // for researcher to read Patient Data
  async readByResearcher(form: NgForm) {
    try {
      const payload = {
        username: this.username,
        role: this.role,
        researcherId: this.username, // Assuming researcherId is needed and matches username
        org: form.value.org
      };

      console.log(payload);

      const res: any = await this._api.postTypeRequest("readPatientData", payload).toPromise();
      this.patient = Array.isArray(res.patient) ? res.patient : [res.patient];

      console.log(this.patient);

      if (res === "Access not granted for the specified researcher and patient.") {
        // window.alert('Access not granted for the specified researcher and patient.');
        await Toast.fire({
          icon: "error",
          title: "Access not granted for the specified researcher and patient."
        });
        return;
      } else if (!res.patient || res.patient.length === 0) {
        // window.alert('No data available for the specified criteria.');
        await Toast.fire({
          icon: "error",
          title: 'No data available for the specified criteria.'
        });
        return;
      }

      // Fetch statistics for each hospital
      for (let hospitalId of [1, 2, 3]) {
        this.fetchHospitalStatistics(hospitalId);
      }

    } catch (error) {
      console.error(error);
      // window.alert('An error occurred while fetching data.');
      await Toast.fire({
        icon: "error",
        title: 'An error occurred while fetching data.'
      });
    }
  }

  showStatistics(hospitalId: number): void {
    this.showStats[hospitalId] = true;
    this.showEncData[hospitalId] = false;
    this.loading = true;
    this.selectedHospitalId = hospitalId;
    this.fetchHospitalStatistics(hospitalId);
  }

  showEncryptionData(): void {
    this.showStats[4] = false;
    this.showEncData[4] = true;
    this.loading = true;
    this.selectedHospitalId = null;
    this.fetchHospitalHomomorphicData();
  }
  fetchHospitalStatistics(hospitalId: number): void {
    this.selectedHospitalId = hospitalId;
    this._api.getHospitalStatistics(hospitalId).subscribe(
      data => {
        this.loading = false;
        this.statistics[hospitalId] = data;
        this.errorMessage = null;

        const researcherObj = {
          username: this.username,
          role: this.role,
          org: this.org,
          hospitalId: hospitalId
        };

        this._api.logResearcherRead(researcherObj).subscribe(
          res => console.log('Successfully logged researcher read operation', res),
          err => console.error('Failed to log researcher read operation', err)
        );
      },
      error => {
        this.statistics[hospitalId] = null;
        this.errorMessage = error.error.error;
      }
    );
  }

  fetchHospitalHomomorphicData(): void {
    this.loading = true;
    this._api.getHospitalHomomorphicData().subscribe(
      data => {
        this.loading = false;
        this.homomorphicData = data;
        this.errorMessage = null;

        const researcherObj = {
          username: this.username,
          role: this.role,
          org: this.org,
        };

        this._api.logResearcherReadHomomorphicData(researcherObj).subscribe(
          res => console.log('Successfully logged researcher read operation', res),
          err => console.error('Failed to log researcher read operation', err)
        );
      },
      error => {
        this.statistics = null;
        this.errorMessage = error.error.error;
      }
    );
  }

  // for patient to read His/Her Data
  readByPatient() {
    if (this.isPatient) {
      let payload = {
        username: this.username,
        // patientId: this.patientId,
        role: this.role,
        // id: this.id,
        org: this.org
      }
      this._api.postTypeRequest("readPersonalData", payload).subscribe((res: any) => {
        this.patient = Array.of(res);
        this.patient = [{
          ...res.patient,
          files: res.files.map(f => f.filename)
        }];
      });
    }
  }


  downloadFile(fileName: string): void {
    this.downloadloading = true;
    const payload = {
      fileName: fileName,
      role: this.role,
      patientId: this.patientIdTest,
      username: this.username,
      org: this.org_name
    }; // Adjust the payload as needed for your API
    console.log(payload)
    const url = 'downloadFile'; // The URL endpoint for downloading files

    this._api.downloadFileRequest(url, payload).subscribe(
      async (blob: Blob) => {
        this.downloadloading = false;
        // Use file-saver to save the downloaded file
        saveAs(blob, fileName.split('/').pop() || 'downloadedFile.pdf');
        await Toast.fire({
          icon: "success",
          title: 'File downloaded successfully!'
        });
      },
      async error => {
        this.downloadloading = false;
        console.error('Download error:', error);
        // alert('Failed to download file.');
        await Toast.fire({
          icon: "error",
          title: 'Failed to download file.'
        });
      }
    );
  }
}







