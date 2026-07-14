import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../env/environment';
import { AttendanceRecord, RecordType } from '../models/attendance-record.model';
import { Auth } from '../../../../core/services/auth';

export interface CreateAttendancePayload {
  worker_id: number;
  worker_name: string;
  type: RecordType;
  photo: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class AttendanceHttpService {
  private apiUrl = `${environment.urlServer}/api/v1/attendance`;

  constructor(
    private http: HttpClient,
    private authService: Auth
  ) {}

  /**
   * Obtiene lista de registros de asistencia con filtros opcionales
   * GET /api/v1/attendance/
   */
  listAttendance(params?: { date?: string; worker_id?: number }): Observable<AttendanceRecord[]> {
    let queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    if (params?.worker_id) queryParams.append('worker_id', params.worker_id.toString());

    const url = queryParams.toString() ? `${this.apiUrl}/?${queryParams}` : `${this.apiUrl}/`;

    return this.http.get<AttendanceRecord[]>(url);
  }

  /**
   * Crea un nuevo registro de asistencia
   * POST /api/v1/attendance/
   */
  createAttendance(payload: CreateAttendancePayload): Observable<AttendanceRecord> {
    return this.http.post<AttendanceRecord>(`${this.apiUrl}/`, payload);
  }

  /**
   * Elimina un registro de asistencia
   * DELETE /api/v1/attendance/{record_id}/
   */
  deleteAttendance(recordId: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${recordId}/`);
  }
}
