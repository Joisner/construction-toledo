import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { Quotes } from '../../core/services/quotes';
import { Services } from '../../core/services/services';
import { IService } from '../../core/models/service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './contact.html',
  styleUrls: ['./contact.css']
})
export class Contact {
  contactForm: FormGroup;
  loading = false;
  success = false;
  errorMsg = '';
  services = signal<IService[]>([]);
  formSubmitted = false;

  constructor(
    private fb: FormBuilder,
    private quotesService: Quotes,
    private serviceService: Services,
  ) {
    this.loadAllData();
    this.contactForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      phone: ['', [
        Validators.pattern(/^[\d\s\+\-\(\)]+$/)
      ]],
      service: ['', Validators.required],
      message: ['', [
        Validators.maxLength(1000)
      ]],
      website: [''] // honeypot para anti-spam
    });
  }

  loadAllData() {
    this.loadService();
  }

  loadService() {
    this.serviceService.getServices().subscribe({
      next: (response) => { this.services.set(response) },
      error: (err) => { console.error(err) }
    })
  }

  onSend() {
    this.formSubmitted = true;
    this.success = false;
    this.errorMsg = '';

     // Marcar todos los campos como touched para mostrar errores
    Object.keys(this.contactForm.controls).forEach(key => {
      this.contactForm.get(key)?.markAsTouched();
    });

    if (this.contactForm.get('website')?.value) {
      console.log('Bot detectado - Honeypot activado');
      // No mostrar mensaje al usuario, simplemente no enviar
      return;
    }

     if (this.contactForm.invalid) {
      this.errorMsg = 'Por favor, complete todos los campos obligatorios correctamente.';
      
      // Scroll al primer error
      setTimeout(() => {
        const firstError = document.querySelector('.border-red-500');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      return;
    }

     if (!this.validateFormData()) {
      return;
    }
    
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const value = this.contactForm.value;

    // Honeypot (anti bots)
    if (value.website) {
      return;
    }

    const quotePayload = {
      name: value.name,
      email: value.email,
      phone: value.phone,
      service: value.service,
      message: value.message
    };

    this.loading = true;
    this.errorMsg = '';
    this.success = false;

    this.quotesService.createQuote(quotePayload).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;

        this.contactForm.reset({
          service: 'Enpisado'
        });
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.errorMsg = 'No se pudo enviar la cotización. Inténtalo más tarde.';
      }
    });
  }

  getErrorMessage(field: string): string {
    const control = this.contactForm.get(field);

    if (!control || !control.errors) {
      return '';
    }

    const errors = control.errors;

    if (errors['required']) {
      const fieldNames: { [key: string]: string } = {
        'name': 'El nombre',
        'email': 'El correo electrónico',
        'service': 'El servicio'
      };
      return `${fieldNames[field] || 'Este campo'} es obligatorio`;
    }

    if (errors['email']) {
      return 'Introduzca un email válido (ej: correo@ejemplo.com)';
    }

    if (errors['minlength']) {
      const min = errors['minlength'].requiredLength;
      return `Mínimo ${min} caracteres requeridos`;
    }

    if (errors['maxlength']) {
      const max = errors['maxlength'].requiredLength;
      return `Máximo ${max} caracteres permitidos`;
    }

    if (errors['pattern']) {
      if (field === 'phone') {
        return 'El teléfono solo puede contener números, espacios y símbolos + - ( )';
      }
      return 'Formato no válido';
    }

    return 'Campo inválido';
  }

  validateFormData(): boolean {
    const formValue = this.contactForm.value;
    const errors: string[] = [];

    // Validar que el nombre no sea solo espacios
    if (formValue.name && formValue.name.trim().length === 0) {
      errors.push('El nombre no puede estar vacío');
    }

    // Validar formato de email adicional
    if (formValue.email && formValue.email.includes('..')) {
      errors.push('El email no puede contener puntos consecutivos');
    }

    // Validar longitud mínima de teléfono si se proporciona
    if (formValue.phone && formValue.phone.trim().length > 0 && formValue.phone.trim().length < 7) {
      errors.push('El teléfono debe tener al menos 7 caracteres');
    }

    if (errors.length > 0) {
      this.errorMsg = errors.join('. ');
      return false;
    }

    return true;
  }

}
