import { Component } from '@angular/core';
import {
  OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef,
  signal, computed, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService } from '../../core/services/attendance';
import { CameraService } from '../../core/services/camera';
import { AttendanceRecordDisplay } from '../../core/models/attendance-record.model';
import { Auth } from '../../../../core/services/auth';
import { Router } from '@angular/router';

type CameraState = 'loading' | 'ready' | 'error' | 'captured';

@Component({
  selector: 'app-register-assistant',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register-assistant.html',
  styleUrl: './register-assistant.css',
})
export class RegisterAssistant implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('videoEl') videoRef!: ElementRef<HTMLVideoElement>;

  // --- Camera state ---
  cameraState = signal<CameraState>('loading');
  capturedPhoto = signal<string | null>(null);
  flashOn = signal(false);
  lastResult = signal<AttendanceRecordDisplay | null>(null);

  // --- User info (SIGNAL FIXED) ---
  userInfo = signal<{ name: string }>({
    name: ''
  });

  // --- Initials SAFE ---
  userInitials = computed(() => {
    const name = this.userInfo().name ?? '';

    if (!name) return '';

    const parts = name.trim().split(' ');

    return parts
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p.charAt(0).toUpperCase())
      .join('');
  });

  // --- Clock ---
  currentTime = signal('');
  currentDate = signal('');

  private clockInterval?: ReturnType<typeof setInterval>;

  // --- Shift ---
  shiftLabel = computed(() =>
    this.attendance.getCurrentShift() === 'ENTRADA'
      ? '▲ Hora de Entrada'
      : '▼ Hora de Salida'
  );

  shiftClass = computed(() =>
    this.attendance.getCurrentShift() === 'ENTRADA'
      ? 'shift-pill entry'
      : 'shift-pill exit'
  );

  constructor(
    private attendance: AttendanceService,
    private camera: CameraService,
    private authService: Auth,
    private router: Router
  ) { }

  // --- INIT ---
  ngOnInit(): void {
    debugger;
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);

    const userData = localStorage.getItem('user');

    if (userData) {
      try {
        const user = JSON.parse(userData);

        this.userInfo.set({
          name: user?.username ?? ''
        });
      } catch {
        this.userInfo.set({ name: '' });
      }
    }
  }

  ngAfterViewInit(): void {
    this.initCamera();
  }

  ngOnDestroy(): void {
    this.camera.stopCamera();
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  // --- CLOCK ---
  private updateClock(): void {
    const now = new Date();

    this.currentTime.set(
      now.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    );

    this.currentDate.set(
      now.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })
    );
  }

  // --- CAMERA ---
  private async initCamera(): Promise<void> {
    this.cameraState.set('loading');

    try {
      await this.camera.startCamera(this.videoRef.nativeElement);
      this.cameraState.set('ready');
    } catch {
      this.cameraState.set('error');
    }
  }

  capture(): void {
    debugger;
    if (this.cameraState() !== 'ready') return;

    this.flashOn.set(true);
    setTimeout(() => this.flashOn.set(false), 170);

    const result = this.camera.captureFrame(this.videoRef.nativeElement);

    this.capturedPhoto.set(result.dataUrl);

    this.camera.stopCamera();
    this.cameraState.set('captured');

    const record = this.attendance.addRecord(result.dataUrl, this.userInfo().name);
    this.lastResult.set(record);
  }

  retry(): void {
    this.capturedPhoto.set(null);
    this.lastResult.set(null);
    this.cameraState.set('loading');

    setTimeout(() => this.initCamera(), 50);
  }

  async logout() {
    if (this.clockInterval) clearInterval(this.clockInterval);
    this.camera.stopCamera();

    const logout = this.authService.clearToken();
    if (logout === null) {
      localStorage.clear();
      await this.router.navigate(['/login']);
    }
  }
}