import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../env/environment';
import { Auth } from './auth';
import { IAdmin } from '../models/admin';

@Injectable({
  providedIn: 'root',
})
export class Users {

  environment = environment;

  constructor(
    private http: HttpClient,
    private authService: Auth
  ) {}

  // 🔹 LISTAR USUARIOS
  getUsers(): Observable<IAdmin[]> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<IAdmin[]>(
      `${environment.urlServer}${environment.userService}`,
      { headers }
    );
  }

  // 🔹 OBTENER USUARIO POR ID
  getUserById(userId: string): Observable<IAdmin> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<IAdmin>(
      `${environment.urlServer}${environment.userService}/${userId}`,
      { headers }
    );
  }

  // 🔹 CREAR USUARIO
  createUser(body: Partial<IAdmin>): Observable<IAdmin> {
    const headers = this.authService.getAuthHeaders();
    return this.http.post<IAdmin>(
      `${environment.urlServer}/api/v1/auth/register`,
      body,
      { headers }
    );
  }

  // 🔹 ACTUALIZAR USUARIO
  updateUser(userId: string, body: Partial<IAdmin>): Observable<IAdmin> {
    const headers = this.authService.getAuthHeaders();
    return this.http.put<IAdmin>(
      `${environment.urlServer}${environment.userService}${userId}`,
      body,
      { headers }
    );
  }

  // 🔹 ELIMINAR USUARIO
  deleteUser(userId: string): Observable<void> {
    const headers = this.authService.getAuthHeaders();
    return this.http.delete<void>(
      `${environment.urlServer}${environment.userService}/${userId}`,
      { headers }
    );
  }
}
