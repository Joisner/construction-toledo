import { Component, OnChanges, SimpleChanges, EventEmitter, Input, Output, signal } from '@angular/core';
import { IService } from '../../../../core/models/service';
import { ToastrService } from '../../../../core/services/toastr';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-service-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './service-modal.html',
  styleUrl: './service-modal.css',
})
export class ServiceModal {
 @Input() isOpen = false;
  @Input() service: IService | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<IService>();

  formData = signal<IService>({
    title: '',
    description: '',
    details: '',
    image_url: '',
    is_active: true
  });

  // ✅ Nuevo flag para validaciones
  formSubmitted = false;

  constructor(private toastr: ToastrService) { }

  // React to @Input() changes from the parent
  ngOnChanges(changes: SimpleChanges) {
    if (changes['service']) {
      if (this.service) {
        this.formData.set({ ...this.service });
      } else {
        this.formData.set({
          title: '',
          description: '',
          details: '',
          image_url: '',
          is_active: true
        });
      }
      // ✅ Resetear validaciones cuando se abre el modal
      this.formSubmitted = false;
    }
    
    // ✅ Resetear validaciones cuando se cierra el modal
    if (changes['isOpen'] && !changes['isOpen'].currentValue) {
      this.formSubmitted = false;
    }
  }

  // ================= VALIDACIONES =================

  // ✅ Validación de URL
  isValidUrl(url: string): boolean {
    if (!url || url.trim().length === 0) {
      return false;
    }
    
    try {
      const urlObj = new URL(url.trim());
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  // ✅ Validación completa del formulario
  private validateServiceForm(): boolean {
    const data = this.formData();
    const errors: string[] = [];

    // Validar título
    if (!data.title || data.title.trim().length === 0) {
      errors.push('El título es obligatorio');
    } else if (data.title.trim().length < 3) {
      errors.push('El título debe tener al menos 3 caracteres');
    } else if (data.title.trim().length > 100) {
      errors.push('El título no puede exceder 100 caracteres');
    }

    // Validar descripción breve
    if (!data.description || data.description.trim().length === 0) {
      errors.push('La descripción es obligatoria');
    } else if (data.description.trim().length < 10) {
      errors.push('La descripción debe tener al menos 10 caracteres');
    } else if (data.description.trim().length > 200) {
      errors.push('La descripción no puede exceder 200 caracteres');
    }

    // Validar detalles
    if (!data.details || data.details.trim().length === 0) {
      errors.push('Los detalles son obligatorios');
    } else if (data.details.trim().length < 20) {
      errors.push('Los detalles deben tener al menos 20 caracteres');
    } else if (data.details.trim().length > 2000) {
      errors.push('Los detalles no pueden exceder 2000 caracteres');
    }

    // Validar URL de imagen
    if (!data.image_url || data.image_url.trim().length === 0) {
      errors.push('La URL de la imagen es obligatoria');
    } else if (!this.isValidUrl(data.image_url)) {
      errors.push('La URL de la imagen no es válida (debe comenzar con http:// o https://)');
    }

    // Mostrar errores si existen
    if (errors.length > 0) {
      this.toastr.error(errors.join('\n'), 'Errores de validación');
      
      // Scroll al primer campo con error
      setTimeout(() => {
        const firstError = document.querySelector('.border-red-500');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      return false;
    }

    return true;
  }

  // ================= MANEJO DE GUARDADO =================

  // ✅ Manejar guardado con validación
  handleSave() {
    this.formSubmitted = true;
    
    if (!this.validateServiceForm()) {
      return;
    }

    // ✅ Limpiar espacios en blanco antes de guardar
    const cleanedData: IService = {
      ...this.formData(),
      title: this.formData().title.trim(),
      description: this.formData().description.trim(),
      details: this.formData().details.trim(),
      image_url: this.formData().image_url.trim()
    };

    console.log('Saving service:', cleanedData);
    this.save.emit(cleanedData);
    
    // ✅ Resetear validaciones después de guardar exitosamente
    this.formSubmitted = false;
  }

  // ================= HELPERS =================

  // ✅ Manejar error de imagen con placeholder SVG
  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="16" font-family="sans-serif"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
  }

  // ✅ Método auxiliar para verificar si un campo tiene error
  hasError(field: keyof IService): boolean {
    if (!this.formSubmitted) return false;
    
    const value = this.formData()[field];
    
    switch (field) {
      case 'title':
        return !value || (typeof value === 'string' && value.trim().length < 3);
      case 'description':
        return !value || (typeof value === 'string' && value.trim().length < 10);
      case 'details':
        return !value || (typeof value === 'string' && value.trim().length < 20);
      case 'image_url':
        return !value || (typeof value === 'string' && !this.isValidUrl(value));
      default:
        return false;
    }
  }

  // ✅ Método para obtener la clase CSS de error
  getFieldClass(field: keyof IService): string {
    return this.hasError(field) ? 'border-red-500' : '';
  }
}