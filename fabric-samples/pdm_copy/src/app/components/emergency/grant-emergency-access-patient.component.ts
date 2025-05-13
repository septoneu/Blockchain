// import { Component, OnInit } from '@angular/core';
// import { NgForm } from '@angular/forms';
// import * as snarkjs from 'snarkjs';
// import { ApiService } from 'src/app/services/api/api.service';
// import { AuthService } from 'src/app/services/auth/auth.service';
// import { User } from 'src/app/user';

// @Component({
//   selector: 'app-grant-emergency-access-patient',
//   templateUrl: './grant-emergency-access-patient.component.html',
//   styleUrls: ['./grant-emergency-access-patient.component.css']
// })
// export class GrantEmergencyAccessPatientComponent implements OnInit {

//   patient: User[];
//   returnsData: boolean = false;
//   errorMessage: String;
//   username: String;
//   patientId: String;
//   role: String;
//   doctorId: String;
//   org: String;
//   loading = false;
//   patientList1: any[];
//   newPatientName: String;
//   newPatientId: String;
//   isDoctor: boolean = false;

// reasonsList: string[] = [
//   'Medical emergency',
//   'Patient unconscious',
//   'Doctor consultation',
//   'Critical test results',
//   'Follow-up treatment required',
//   'Patient referral',
//   'Surgery preparation',
//   'Accidental data loss',
//   'Legal requirement',
//   'Family member request'
// ];

//   selectedReason: string;

//   constructor(
//     private _auth: AuthService,
//     private _api: ApiService
//   ) { }

//   ngOnInit(): void {
//     this.isDoctor = this._auth.isUserDoctor();
//     this.org = this._auth.getUserDetails('org');
//     this.username = this._auth.getUserDetails('username');
//     this.patientId = this._auth.getUserDetails('username');
//     this.role = this._auth.getUserDetails('userData');
//     this.doctorId = this._auth.getUserDetails('username');

//     this.getPatientsList();

    
//   }



//   getPatientsList() {
//     this._api.postTypeRequest('getPatientsList', { username: this.username, role: this.role }).subscribe((res: any) => {
//       this.patientList1 = res;
//     });
//   }

//   setPatientId() {
//     const selectedPatient = this.patientList1.find(patient =>
//       `${patient.firstNamePatient} ${patient.lastNamePatient}` === this.newPatientName);
//     if (selectedPatient) {
//       this.newPatientId = selectedPatient.patientId;
//     } else {
//       this.newPatientId = null;
//     }
//   }

//   async RequestEmergencyAccessDoctor(form: NgForm) {
//     // Adding the selected reason to the payload
//     this.loading = true;
//     const selectedPatientId = form.value.newPat;
//     const selectedReason = this.selectedReason;
//     // const selectedReason = "23"

//     try {
//       // Prepare payload with the proof

//       const payload = {
//         username: this.username,
//         org: this.org,
//         patientId: selectedPatientId, 
//         reason: selectedReason,
//         // proof: proof // Add proof to the payload
//       };

//       console.log(payload);

//       // Send request to backend
//       this._api.postTypeRequest('emergencyAccessPatientRecord', payload).subscribe((res: any) => {
//         this.loading = false;
//         if (res) {
//           this.patient = Array.of(res);
//           console.log(res);
//           this.returnsData = true;
//           alert('Access granted successfully!');
//           // Optionally refresh or reload the page
//           // window.location.reload();
//         } else {
//           console.log(res);
//           alert(res);
//           window.location.reload();
//         }
//       }, err => {
//         this.loading = false;
//         this.errorMessage = err['error'].message;
//       });

//     } catch (error) {
//       this.loading = false;
//       console.error('Error in processing:', error);
//       alert('Error in processing the request. Please try again.');
//     }
//   }
// }

import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import * as snarkjs from 'snarkjs';
import { ApiService } from 'src/app/services/api/api.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { User } from 'src/app/user';
import Swal from 'sweetalert2';
// import * as circomlibjs from 'circomlibjs';
import { poseidon1 } from 'poseidon-lite';

const Toast = Swal.mixin({
  toast: true,
  position: "center",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});


@Component({
  selector: 'app-grant-emergency-access-patient',
  templateUrl: './grant-emergency-access-patient.component.html',
  styleUrls: ['./grant-emergency-access-patient.component.css']
})
export class GrantEmergencyAccessPatientComponent implements OnInit {

  patient: User[];
  returnsData: boolean = false;
  errorMessage: string;
  username: string;
  patientId: string;
  role: string;
  doctorId: string;
  org: string;
  loading = false;
  patientList1: any[];
  newPatientName: string;
  newPatientId: string;
  isDoctor: boolean = false;
  zokratesProvider: any;

  reasonsList: string[] = [
    'Medical emergency',
    'Patient unconscious',
    'Doctor consultation',
    'Critical test results',
    'Follow-up treatment required',
    'Patient referral',
    'Surgery preparation',
    'Accidental data loss',
    'Legal requirement',
    'Family member request'
  ];

  selectedReason: string;

  // New variables for emergency proof inputs (supplied by the doctor)
  emergencySecret: string;
  // publicSecret: string;

  // Variables to store the generated proof and public signals
  emergencyProof: any;
  emergencyPublicSignals: any;

  constructor(
    private _auth: AuthService,
    private _api: ApiService
  ) { }

  ngOnInit(): void {
    this.isDoctor = this._auth.isUserDoctor();
    this.org = this._auth.getUserDetails('org');
    this.username = this._auth.getUserDetails('username');
    this.patientId = this._auth.getUserDetails('username');
    this.role = this._auth.getUserDetails('userData');
    this.doctorId = this._auth.getUserDetails('username');
    this.getPatientsList();

    // Optionally initialize emergency secret and public secret with default values (for testing)
    this.emergencySecret = "";
    // this.publicSecret = "";
  }

  getPatientsList() {
    this._api.postTypeRequest('getPatientsList', { username: this.username, role: this.role }).subscribe((res: any) => {
      this.patientList1 = res;
    });
  }

  setPatientId() {
    const selectedPatient = this.patientList1.find(patient =>
      `${patient.firstNamePatient} ${patient.lastNamePatient}` === this.newPatientName);
    if (selectedPatient) {
      this.newPatientId = selectedPatient.patientId;
    } else {
      this.newPatientId = null;
    }
  }

  // async computePoseidonHash(secret: string): Promise<string> {
  //   const poseidon = await circomlibjs.buildPoseidon();
  //   const hash = poseidon.F.toString(poseidon([secret])); // Compute Poseidon hash
  //   return hash;
  //   }

  async computePoseidonHash(secret: string): Promise<string> {
  
    
    const secretBigInt = BigInt(secret);
    const output = poseidon1([secretBigInt]);
    console.log(output.toString());
    return output.toString();
  }

  async generateEmergencyProof(hash): Promise<void> {
    // const pubHash = await this.computePoseidonHash(this.emergencySecret);
    const emergencyInput = {
      sk: this.emergencySecret,
      flag: '1',
      pubHash: hash
    };
    console.log(emergencyInput);
    try {
      const result = await snarkjs.groth16.fullProve(
        emergencyInput,
        'assets/EmergencyAccess.wasm',
        'assets/emergency_final.zkey'
      );
      this.emergencyProof = result.proof;
      this.emergencyPublicSignals = result.publicSignals;
      console.log('Emergency proof generated:', result);
    } catch (error) {
      console.error('Error generating emergency proof:', error);
      throw error;
    }
  }
  
  async RequestEmergencyAccessDoctor(form: NgForm) {
    this.loading = true;
    const selectedPatientId = form.value.newPat;
    const selectedReason = this.selectedReason;
    const tempPayload = {
      username: this.username,
      org: this.org,
      patientId: selectedPatientId,
    };
  
    this._api.postTypeRequest('emergencyAccessPatientRecordHash', tempPayload).subscribe(
      async (res: any) => {
        this.loading = false;
        if (res) {
          console.log("Retrieved Hash:", res);
          await Toast.fire({
            icon: "success",
            title: "Retrieved Hash successfully!"
          });
  
          // Now that hash is available, generate the proof
          try {
            await this.generateEmergencyProof(res);
  
            // Prepare payload with the generated proof.
            const payload = {
              username: this.username,
              org: this.org,
              patientId: selectedPatientId,
              reason: selectedReason,
              proof: this.emergencyProof,  // Include the generated zk-SNARK proof.
              publicSignals: this.emergencyPublicSignals, // Include the public signals.
            };
  
            console.log('Payload with emergency proof:', payload);
  
            // Send the request to your backend API.
            this._api.postTypeRequest('emergencyAccessPatientRecord', payload).subscribe(
              async (res: any) => {
                this.loading = false;
                if (res) {
                  this.patient = Array.of(res);
                  console.log(res);
                  this.returnsData = true;
                  await Toast.fire({
                    icon: "success",
                    title: "Access granted successfully!"
                  });
                } else {
                  console.log(res);
                  await Toast.fire({
                    icon: "success",
                    title: res
                  });
                  window.location.reload();
                }
              },
              err => {
                this.loading = false;
                this.errorMessage = err['error'].message;
              }
            );
  
          } catch (error) {
            this.loading = false;
            console.error('Error generating emergency proof:', error);
            await Toast.fire({
              icon: "error",
              title: "Error generating proof. Please try again."
            });
          }
  
        } else {
          console.log(res);
          await Toast.fire({
            icon: "error",
            title: res
          });
          window.location.reload();
        }
      },
      async err => {
        this.loading = false;
        this.errorMessage = err['error'].message;
        await Toast.fire({
          icon: "error",
          title: "Error Retrieving Hash."
        });
      }
    );
  }
}  