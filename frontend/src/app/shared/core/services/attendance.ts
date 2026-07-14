import { Injectable, signal, computed } from '@angular/core';
import { AttendanceRecord, RecordType, AttendanceRecordDisplay } from '../models/attendance-record.model';
import { AttendanceHttpService, CreateAttendancePayload } from './attendance-http.service';
import { ToastrService } from '../../../../core/services/toastr';

const ENTRY_START = 4;
const ENTRY_END   = 13;

@Injectable({ providedIn: 'root' })
export class AttendanceService {

  private _records = signal<AttendanceRecord[]>([]);
  private _isLoading = signal<boolean>(false);

  readonly records      = this._records.asReadonly();
  readonly isLoading    = this._isLoading.asReadonly();
  readonly totalCount   = computed(() => this._records().length);
  readonly todayRecords = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this._records().filter(r => r.date_iso === today);
  });
  readonly entryCount = computed(() => this.todayRecords().filter(r => r.type === 'ENTRADA').length);
  readonly exitCount  = computed(() => this.todayRecords().filter(r => r.type === 'SALIDA').length);
  readonly lastRecord = computed(() => {
    const rec = this._records()[0];
    return rec ? this.mapToDisplay(rec) : null;
  });

  constructor(
    private http: AttendanceHttpService,
    private toastr: ToastrService
  ) {
    this.loadRecords();
  }

  getCurrentShift(): RecordType {
    const h = new Date().getHours();
    return h >= ENTRY_START && h < ENTRY_END ? 'ENTRADA' : 'SALIDA';
  }

  /**
   * Carga todos los registros desde el backend
   */
  loadRecords(params?: { date?: string; worker_id?: number }): void {
    this._isLoading.set(true);
    this.http.listAttendance(params).subscribe({
      next: (records) => {
        // Ordenar por timestamp descendente para mostrar más recientes primero
        const sorted = records.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        this._records.set(sorted);
        this._isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading attendance records:', err);
        this.toastr.error('Error al cargar registros de asistencia');
        this._isLoading.set(false);
      }
    });
  }

  /**
   * Crea un nuevo registro de asistencia
   * Retorna el registro de forma optimista mientras se envía al backend
   */
  addRecord(photo: string, userInfo?: string, workerId?: number): AttendanceRecordDisplay {
    debugger;
    const type = this.getCurrentShift();
    const now = new Date();
    const workerName = userInfo || 'Unknown Worker';

    // Crear registro local temporal para mostrar inmediatamente
    const tempRecord: AttendanceRecord = {
      id: -1, // ID temporal
      worker_id: workerId || 1,
      worker_name: workerName,
      type,
      photo,
      timestamp: now.toISOString(),
      time: now.toLocaleTimeString('es-PE', { hour12: false }),
      date: now.toLocaleDateString('es-PE'),
      date_iso: now.toISOString().split('T')[0],
    };

    // Mostrar inmediatamente (optimistic update)
    this._records.update(list => [tempRecord, ...list]);

    // Enviar al backend de forma asincrónica
    const payload: CreateAttendancePayload = {
      worker_id: workerId || 1,
      worker_name: workerName,
      type,
      photo,
      timestamp: now.toISOString(),
    };

    this.http.createAttendance(payload).subscribe({
      next: (record) => {
        // Reemplazar el registro temporal con el del servidor
        this._records.update(list => {
          const index = list.findIndex(r => r.id === -1 && r.timestamp === tempRecord.timestamp);
          if (index !== -1) {
            list[index] = record;
          }
          return list;
        });
        this.toastr.success(`${type === 'ENTRADA' ? 'Entrada' : 'Salida'} registrada exitosamente`);
      },
      error: (err) => {
        console.error('Error creating attendance record:', err);
        // Remover el registro temporal si hay error
        this._records.update(list => list.filter(r => !(r.id === -1 && r.timestamp === tempRecord.timestamp)));
        this.toastr.error('Error al registrar asistencia');
      }
    });

    return this.mapToDisplay(tempRecord);
  }

  /**
   * Elimina un registro de asistencia
   */
  deleteRecord(recordId: number): void {
    this.http.deleteAttendance(recordId).subscribe({
      next: () => {
        this._records.update(list => list.filter(r => r.id !== recordId));
        this.toastr.success('Registro eliminado exitosamente');
      },
      error: (err) => {
        console.error('Error deleting attendance record:', err);
        this.toastr.error('Error al eliminar registro');
      }
    });
  }

  /**
   * Filtra registros por nombre, tipo y fecha
   */
  filterRecords(name: string, type: string, date: string): AttendanceRecordDisplay[] {
    return this._records()
      .filter(r => {
        if (name && !r.worker_name.toLowerCase().includes(name.toLowerCase())
                 && !String(r.worker_id).includes(name)) return false;
        if (type && r.type !== type) return false;
        if (date && r.date_iso !== date) return false;
        return true;
      })
      .map(r => this.mapToDisplay(r));
  }

  /**
   * Limpia todos los registros (llama al backend para cada uno)
   */
  clearAll(): void {
    const recordIds = this._records().map(r => r.id);
    recordIds.forEach(id => this.deleteRecord(id));
  }

  /**
   * Mapea AttendanceRecord a AttendanceRecordDisplay para compatibilidad con los componentes
   */
  private mapToDisplay(record: AttendanceRecord): AttendanceRecordDisplay {
    return {
      id: record.id,
      worker: record.worker_name,
      workerId: String(record.worker_id),
      type: record.type,
      time: record.time,
      date: record.date,
      dateISO: record.date_iso,
      photo: record.photo,
      timestamp: record.timestamp,
    };
  }
}
