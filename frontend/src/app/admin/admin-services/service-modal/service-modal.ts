import { Component, OnChanges, SimpleChanges, EventEmitter, Input, Output, signal } from '@angular/core';
import { IService } from '../../../../core/models/service';
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

  // Use ngOnChanges to react to @Input() changes from the parent.
  // effect() won't rerun when Angular updates a plain @Input property,
  // so we must use the lifecycle hook to set the form data (including id).
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
    }
  }

  handleSave() {
    this.save.emit(this.formData());
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="14"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
  }
}
