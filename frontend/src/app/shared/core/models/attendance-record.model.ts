export type RecordType = 'ENTRADA' | 'SALIDA';

export interface AttendanceRecord {
  id: number;
  worker_id: number;
  worker_name: string;
  type: RecordType;
  time: string;
  date: string;
  date_iso: string;
  photo: string;
  timestamp: string;
}

// Alias para compatibilidad con el código existente
export interface AttendanceRecordDisplay {
  id: number;
  worker: string;
  workerId: string;
  type: RecordType;
  time: string;
  date: string;
  dateISO: string;
  photo: string;
  timestamp: string;
}
