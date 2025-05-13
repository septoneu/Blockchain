class User {
  constructor(obj) {
    // this.id = obj.id
    this.patientId = obj.patientId
    this.org = obj.org
    // this.address = obj.address
    // this.telephone = obj.tel
    this.TAG = obj.TAG
    this.WBCs = obj.WBCs
    this.LDL = obj.LDL
    this.response = obj.response
    this.notificationId = obj.notificationId
    this.doctorId = obj.doctorId
    this.researcherId = obj.researcherId
    this.role = obj.role
    this.username = obj.username
    this.firstNameDoctor = obj.firstNameDoctor
    this.lastNameDoctor = obj.lastNameDoctor
    this.firstNamePatient = obj.firstNamePatient
    this.lastNamePatient = obj.lastNamePatient
    this.firstNameResearcher = obj.firstNameResearcher
    this.lastNameResearcher = obj.lastNameResearcher
    this.fileUpload = obj.fileUpload
    this.fileName = obj.fileName
    this.reason = obj.reason
    this.proof = obj.proof
    this.publicSignals = obj.publicSignals
    this.password = obj.password
    this.firstLogin = obj.firstLogin
  }
}

module.exports = User

