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
  // Use an Input setter so we react when the parent changes the input value.
  private _admin: IAdmin | null = null;
  @Input()
  set admin(value: IAdmin | null) {
    this._admin = value;
    if (this._admin) {
      // Normalize id type (backend sometimes returns string ids)
      const adminCopy: any = { ...this._admin };
      if (adminCopy.id !== undefined && adminCopy.id !== null) {
        const numeric = Number(adminCopy.id);
        adminCopy.id = Number.isNaN(numeric) ? adminCopy.id : numeric;
      }
      this.formData.set(adminCopy);
      this.confirmPassword = '';
    } else {
      // If modal closed or creating new, reset formData to defaults
      this.formData.set({
        username: '',
        email: '',
        password: '',
        is_admin: false,
        is_active: true
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
    is_active: true
  });

  confirmPassword = '';
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  constructor() {
    // No-op. Initialization is handled by the @Input setter when Angular sets `admin`.
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPassword() {
    this.showConfirmPassword.update(v => !v);
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
    if (username && username.length < 3) errors.push('El nombre de usuario debe tener al menos 3 caracteres');

    if (!email) errors.push('El email es obligatorio');
    else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) errors.push('Formato de email inválido');
    }

    // If creating new user or changing password
    if (!data.id || password) {
      if (!password || password.length < 6) errors.push('La contraseña debe tener al menos 6 caracteres');
      if (password !== this.confirmPassword) errors.push('Las contraseñas no coinciden');
    }

    // Debug log to help during development
    if (errors.length > 0) {
      // eslint-disable-next-line no-console
      console.debug('AdminModal validation errors:', errors);
    }

    return errors;
  }

  // Used from template because Angular's template parser doesn't accept regex literals inline
  isEmailInvalid(): boolean {
    const email = String(this.formData().email || '');
    if (!email) return false; // empty case handled by required message in template
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !emailRegex.test(email);
  }

  isUsernameTooShort(): boolean {
    const username = String(this.formData().username || '');
    return username.trim().length > 0 && username.trim().length < 3;
  }

  handleSave() {
    if (!this.isFormValid()) {
      return;
    }

    const dataToSave = { ...this.formData() };

    // If editing and no password change, remove password field
    if (dataToSave.id && !dataToSave.password) {
      delete dataToSave.password;
    }

    // Normalize id so callers don't get type surprises (string vs number)
    if (dataToSave.id !== undefined && dataToSave.id !== null) {
      const numeric = Number((dataToSave as any).id);
      (dataToSave as any).id = Number.isNaN(numeric) ? (dataToSave as any).id : numeric;
    }

    this.save.emit(dataToSave);
  }
}

