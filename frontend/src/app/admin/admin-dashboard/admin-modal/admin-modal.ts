import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { IAdmin } from '../../../../core/models/admin';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-modal.html',
  styleUrl: './admin-modal.css',
})
export class AdminModal {
  @Input() isOpen = false;

  private _admin: IAdmin | null = null;
  @Input()
  set admin(value: IAdmin | null) {
    this._admin = value;
    if (this._admin) {
      const adminCopy: any = { ...this._admin };
      if (adminCopy.id !== undefined && adminCopy.id !== null) {
        const numeric = Number(adminCopy.id);
        adminCopy.id = Number.isNaN(numeric) ? adminCopy.id : numeric;
      }
      // Garantizar que has_attendance existe aunque el backend no lo devuelva aún
      if (adminCopy.has_attendance === undefined) {
        adminCopy.has_attendance = false;
      }
      this.formData.set(adminCopy);
      this.confirmPassword = '';
    } else {
      this.formData.set({
        username: '',
        email: '',
        password: '',
        is_admin: false,
        is_active: true,
        has_attendance: false,
      });
      this.confirmPassword = '';
    }
  }
  get admin(): IAdmin | null {
    return this._admin;
  }

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<IAdmin>();

  formData = signal<IAdmin>({
    username: '',
    email: '',
    password: '',
    is_admin: false,
    is_active: true,
    has_attendance: false,
  });

  confirmPassword = '';
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPassword() {
    this.showConfirmPassword.update((v) => !v);
  }

  isFormValid(): boolean {
    return this.getValidationErrors().length === 0;
  }

  getValidationErrors(): string[] {
    const errors: string[] = [];
    const data = this.formData();

    const username = String(data.username || '').trim();
    const email = String(data.email || '').trim();
    const password = String(data.password || '');

    if (!username) errors.push('El nombre de usuario es obligatorio');
    if (username && username.length < 3)
      errors.push('El nombre de usuario debe tener al menos 3 caracteres');

    if (!email) errors.push('El email es obligatorio');
    else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) errors.push('Formato de email inválido');
    }

    if (!data.id || password) {
      if (!password || password.length < 6)
        errors.push('La contraseña debe tener al menos 6 caracteres');
      if (password !== this.confirmPassword)
        errors.push('Las contraseñas no coinciden');
    }

    // Validar que tenga al menos un módulo si la cuenta está activa
    if (data.is_active && !data.is_admin && !data.has_attendance) {
      errors.push('El usuario activo debe tener acceso a al menos un módulo');
    }

    return errors;
  }

  isEmailInvalid(): boolean {
    const email = String(this.formData().email || '');
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !emailRegex.test(email);
  }

  isUsernameTooShort(): boolean {
    const username = String(this.formData().username || '');
    return username.trim().length > 0 && username.trim().length < 3;
  }

  handleSave() {
    if (!this.isFormValid()) return;

    const dataToSave = { ...this.formData() };

    if (dataToSave.id && !dataToSave.password) {
      delete dataToSave.password;
    }

    if (dataToSave.id !== undefined && dataToSave.id !== null) {
      const numeric = Number((dataToSave as any).id);
      (dataToSave as any).id = Number.isNaN(numeric)
        ? (dataToSave as any).id
        : numeric;
    }

    this.save.emit(dataToSave);
  }
}
