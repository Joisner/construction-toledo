import { Component, signal, computed, effect } from '@angular/core';
import { AttendanceRecordDisplay } from '../../shared/core/models/attendance-record.model';
import { AttendanceService } from '../../shared/core/services/attendance';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register-modal.html',
  styleUrl: './register-modal.css',
})
export class RegisterModal {
  filterName = '';
  filterType = '';
  filterDate = '';
  filtered      = signal<AttendanceRecordDisplay[]>([]);
  modalRecord   = signal<AttendanceRecordDisplay | null>(null);

  constructor(readonly attendance: AttendanceService) {
    // Reaccionar automáticamente a cambios en los records del backend
    effect(() => {
      // Acceder a los records para que el effect se suscriba a cambios
      this.attendance.records();
      // Cuando los records cambien, reaplica los filtros
      this.applyFilters();
    });
  }

  ngOnInit(): void { this.applyFilters(); }

  applyFilters(): void {
    debugger;
    this.filtered.set(this.attendance.filterRecords(this.filterName, this.filterType, this.filterDate));
  }

  clearFilters(): void {
    this.filterName = ''; this.filterType = ''; this.filterDate = '';
    this.applyFilters();
  }

  hasFilters(): boolean { return !!(this.filterName || this.filterType || this.filterDate); }

  clearAll(): void {
    if (!confirm('¿Eliminar todos los registros?')) return;
    this.attendance.clearAll();
    this.applyFilters();
  }

  deleteRecord(r: AttendanceRecordDisplay): void {
    if (!confirm(`¿Eliminar registro de ${r.worker} - ${r.type}?`)) return;
    this.attendance.deleteRecord(r.id);
    this.closeModal();
    this.applyFilters();
  }

  openModal(r: AttendanceRecordDisplay): void { 
    this.modalRecord.set(r); 
  }
  closeModal(): void { this.modalRecord.set(null); }
  trackById(_i: number, r: AttendanceRecordDisplay): number { return r.id; }
}
