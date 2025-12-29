import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../env/environment';
import { IService } from '../models/service';
import { Auth } from './auth';

@Injectable({
  providedIn: 'root',
})
export class Services {
  environment = environment;
  constructor(private http: HttpClient, private authService: Auth) { }

  getServices(): Observable<IService[]> {
    debugger
    return this.http.get<IService[]>(
      `${environment.urlServer}${environment.serviceService}`
    );
  }

  createService(body: Partial<IService>): Observable<IService> {
    return this.http.post<IService>(
      `${environment.urlServer}${environment.serviceService}`,
      body,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  updateService(id: number, body: Partial<IService>): Observable<IService> {
    return this.http.put<IService>(
      `${environment.urlServer}${environment.serviceService}${id}`,
      body,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  deleteService(id: number): Observable<void> {
    return this.http.delete<void>(
      `${environment.urlServer}${environment.serviceService}/${id}`,
      { headers: this.authService.getAuthHeaders() }
    );
  }
}
