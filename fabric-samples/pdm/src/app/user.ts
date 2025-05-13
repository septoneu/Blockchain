export class User {
  patientId: string;
  org: string;

  TAG: number;
  WBCs: number;
  LDL: number;

  doctorId: string;
  researcherId: string;
  role: string;
  doctorAuthorizationList: any[];
  reseacherAuthorizationList: any[];
  firstNameDoctor: string[];
  lastNameDoctor: string[];
  firstNamePatient: string[];
  lastNamePatient: string[];
  firstNameResearcher: string[];
  lastNameResearcher: string[];
  fileUpload: File;
  files: string[];
}
