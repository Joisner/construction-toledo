import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../env/environment';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  constructor(private http: HttpClient){}
  environment = environment;
  authValidation(credentials: { username: string, password: string }){
    // FastAPI expects form data for fields like username/password when using
    // Form(...) in the backend. Angular's HttpClient would normally send JSON
    // which can cause a 422 from FastAPI. Serialize as x-www-form-urlencoded
    // so the backend receives username and password as form fields.
    const body = new URLSearchParams();
    body.set('username', credentials.username || '');
    body.set('password', credentials.password || '');
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    return this.http.post(`${environment.authService}`, body.toString(), { headers }).pipe(
      map((res:any) => {
        return res
      })
    )
  }
}
