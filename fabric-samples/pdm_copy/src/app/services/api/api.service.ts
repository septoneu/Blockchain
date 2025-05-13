import { Injectable } from '@angular/core';
//import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable(
  { providedIn: 'root' }
)

export class ApiService {
  baseUrl = 'https://keycloak.netoperis.com/api/';
  constructor(private _http: HttpClient) { }
  getTypeRequest(url) {
    return this._http.get(`${this.baseUrl}${url}`).pipe(map(res => { return res; }));
  }
  putTypeRequest(url, payload) {
    return this._http.put(`${this.baseUrl}${url}`, payload).pipe(map(res => { return res; }));
  }

  postTypeRequest<T>(url: string, payload: any, responseType: 'json' | 'blob' | 'arraybuffer' = 'json'): Observable<T> {
    return this._http.post<T>(`${this.baseUrl}${url}`, payload, { responseType: responseType as any });
  }
  downloadFileRequest(url: string, payload: any): Observable<Blob> {
    return this.postTypeRequest<Blob>(url, payload, 'blob');
  }
  getHospitalStatistics(hospitalId: number): Observable<any> {
    return this._http.get<any>(`https://keycloak.netoperis.com/dp/hospital_stats/${hospitalId}`);
  }
  getHospitalHomomorphicData(): Observable<any> {
    return this._http.get<any>(`https://keycloak.netoperis.com/he/encrypt_sums`);
  }
  logResearcherRead(userObj: any): Observable<any> {
    const url = `${this.baseUrl}readStatisticsData`;
    return this._http.post<any>(url, userObj);
  }
  logResearcherReadHomomorphicData(userObj: any): Observable<any> {
    const url = `${this.baseUrl}readHomomorphicData`;
    return this._http.post<any>(url, userObj);
  }
  getNotifications(doctorObj: any): Observable<any> {
    return this._http.post(`${this.baseUrl}getNotification`, doctorObj);
  }
  markNotificationsAsRead(doctorObj: any): Observable<any> {
    return this._http.post(`${this.baseUrl}markNotificationsAsRead`, doctorObj);
  }
  requestAccess(doctorObj: any): Observable<any> {
    return this._http.post(`${this.baseUrl}requestAccess`, doctorObj);
  }
  getPatientNotifications(patientObj: any): Observable<any> {
    return this._http.post(`${this.baseUrl}getPatientNotification`, patientObj);
  }
  changeStatus(patientObj: any): Observable<any> {
    return this._http.post(`${this.baseUrl}changeStatus`, patientObj);
  }
  RequestEmergencyAccessDoctor(patientObj: any): Observable<any> {
    return this._http.post(`${this.baseUrl}requestEmergencyAccessDoctor`, patientObj);
  }

}