import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor(private _http: HttpClient) { }
  listPatientFiles(): Observable<any> {

    // Adjust the URL based on your API endpoint
    return this._http.get('/listPatientFiles');
  }
}
