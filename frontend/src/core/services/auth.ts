import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../env/environment';
import { BehaviorSubject, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {

  private tokenSubject: BehaviorSubject<string | null>;
  public token$: Observable<string | null>;
  environment = environment;

  constructor(private http: HttpClient) {
    this.tokenSubject = new BehaviorSubject<string | null>(
      localStorage.getItem('authAdminId')
    );
    this.token$ = this.tokenSubject.asObservable();
  }
  // Obtener el token actual
  getToken(): string | null {
    // Prefer the in-memory value, but fallback to localStorage for cases
    // where other parts of the app wrote directly to localStorage.
    return this.tokenSubject.value || localStorage.getItem('authAdminId');
  }

  // Set/clear helpers so the Auth service is the single source of truth
  setToken(token: string | null) {
    if (token) {
      localStorage.setItem('authAdminId', token);
      this.tokenSubject.next(token);
    } else {
      this.clearToken();
    }
  }

  clearToken() {
    localStorage.removeItem('authAdminId');
    this.tokenSubject.next(null);
  }
  authValidation(credentials: { username: string, password: string }) {
    // FastAPI expects form data for fields like username/password when using
    // Form(...) in the backend. Angular's HttpClient would normally send JSON
    // which can cause a 422 from FastAPI. Serialize as x-www-form-urlencoded
    // so the backend receives username and password as form fields.
    const body = new URLSearchParams();
    body.set('username', credentials.username || '');
    body.set('password', credentials.password || '');
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    return this.http.post(`${environment.urlServer}${environment.authService}`, body.toString(), { headers }).pipe(
      map((res: any) => {
        return res
      })
    )
  }

  // Devuelve HttpHeaders con Authorization Bearer <token> o lanza si no hay token.
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    console.log('=== DEBUG TOKEN ===');
    console.log('Token from service:', token);
    console.log('Token length:', token?.length);
    console.log('Token starts with:', token?.substring(0, 20));

    if (!token) {
      console.error('No token found!');
      throw new Error('No authentication token available');
    }

    // Only set the Authorization header here. Let HttpClient set Content-Type
    // automatically depending on the request body. Some backends can reject
    // requests when a Content-Type is present on DELETE or multipart requests.
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token.trim()}`
    });

    console.log('Headers created:', headers.get('Authorization'));
    console.log('===================');

    return headers;
  }
}
