import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api/api.service';
import { AuthService } from '../../services/auth/auth.service';
import { NgForm } from '@angular/forms';
import { User } from 'src/app/user';
import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: "center",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

@Component({
  selector: 'app-update-health-record',
  templateUrl: './update-health-record.component.html',
  styleUrls: ['./update-health-record.component.css']
})
export class UpdateHealthRecordComponent implements OnInit {
  patient: User[];
  returnsData: boolean = false;
  errorMessage;

  isDoctor: boolean = false;
  isResearcher: boolean = false;
  username: string;
  doctorId: string;
  researcherId: string;
  role: string;
  // id: string;
  loading= false;
  patientId: string;
  org: string;

  update = false;

  TAG: number;
  WBCs: number;
  LDL: number;

  // Added property for file handling
  fileToUpload: File;

  constructor(private _auth: AuthService, private _api: ApiService) { }

  ngOnInit(): void {
    this.isDoctor = this._auth.isUserDoctor();
    this.username = this._auth.getUserDetails("username");
    this.doctorId = this._auth.getUserDetails("username");
    this.role = this._auth.getUserDetails("userData");
    this.doctorId = this._auth.getUserDetails("username");
  }

  handleFileInput(event: any): void {
    this.fileToUpload = event.target.files[0];
    console.log(this.fileToUpload);
  }

  async UpdateHealthRecord(form: NgForm): Promise<void> {
    this.loading = true;
    try {
      let payload = {
        username: this.username,
        org: form.value.org,
        patientId: form.value.patientId,
        TAG: 1,
        WBCs: 1,
        LDL: 1
      };

      this._api.postTypeRequest<any>("updatePatientHealthRecord", payload).subscribe(async (res: any) => {
        this.loading = false;
        this.patient = Array.of(res);
        this.uploadFile(this.fileToUpload, form.value.patientId, form.value.org, payload.username);

        if (res === "Access not granted for the specified doctor and patient.") {
          // window.alert('Access not granted for the specified doctor and patient.');
          await Toast.fire({
            icon: "error",
            title: "Access not granted for the specified doctor and patient."
          });
        } else if (res.length === 0) {
          // window.alert('No patient with this Id is assigned to this doctor');
          await Toast.fire({
            icon: "error",
            title: "No patient with this Id is assigned to this doctor"
          });
        }

      });
    } catch (error) {
      this.loading = false;
      console.error(error);
      window.alert('Access not granted for the specified doctor and patient.');
      await Toast.fire({
        icon: "error",
        title: "Access not granted for the specified doctor and patient."
      });
    }
  }

  async uploadFile(file: File, patientId: string, org: string, username: string): Promise<void> {
    console.log('uploadFile function called');

    const formData: FormData = new FormData();
    formData.append('fileUpload', file, file.name);
    formData.append('org', org);
    formData.append('username', username);

    // Append patientId as a query parameter
    const uploadUrl = `uploadFileEndpoint?patientId=${patientId}`;

    try {
      const res: any = await this._api.postTypeRequest(uploadUrl, formData).toPromise();
      console.log(res);
      await Toast.fire({
        icon: "success",
        title: "File uploaded successfully!"
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      await Toast.fire({
        icon: "error",
        title: "Error uploading file"
      });
      // Handle error as needed
    }
  }


}
