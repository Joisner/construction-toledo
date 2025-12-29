import { Component, inject, signal } from '@angular/core';
import { IService } from '../../../../core/models/service';
import { CommonModule } from '@angular/common';
import { DeleteConfirmation } from '../../../shared/components/delete-confirmation/delete-confirmation';
import { ServiceModal } from '../service-modal/service-modal';
import { Services } from '../../../../core/services/services';
@Component({
  selector: 'app-services-list',
  imports: [CommonModule, DeleteConfirmation, ServiceModal],
  templateUrl: './services-list.html',
  styleUrl: './services-list.css',
})
export class ServicesList {
  services = signal<IService[]>([]);

  showModal = signal(false);
  showDeleteModal = signal(false);
  selectedService = signal<IService | null>(null);
  serviceToDelete = signal<IService | null>(null);

  serviceServices = inject(Services)
  constructor() {
    this.loadServices()
  }

  loadServices() {
    this.serviceServices.getServices().subscribe({
      next: (services) => {
        this.services.set(services);
      },
      error: (err) => {
        console.error('Error loading services', err);
      }
    });
  }

  openCreateModal() {
    this.selectedService.set({
      title: '',
      description: '',
      details: '',
      image_url: '',
      is_active: true
    });
    this.showModal.set(true);
  }

  openEditModal(service: IService) {
    this.selectedService.set({ ...service });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedService.set(null);
  }

  saveService(service: IService) {
    if (service.id) {
      // UPDATE
      this.serviceServices.updateService(service.id, service).subscribe({
        next: (updated) => {
          this.services.update(list =>
            list.map(s => s.id === updated.id ? updated : s)
          );
          this.closeModal();
        },
        error: (err) => {
          console.error('Error updating service', err);
        }
      });

    } else {
      // CREATE
      this.serviceServices.createService(service).subscribe({
        next: (created) => {
          this.services.update(list => [...list, created]);
          this.closeModal();
        },
        error: (err) => {
          console.error('Error creating service', err);
        }
      });
    }
  }


  openDeleteConfirm(service: IService) {
    this.serviceToDelete.set(service);
    this.showDeleteModal.set(true);
  }

  closeDeleteConfirm() {
    this.showDeleteModal.set(false);
    this.serviceToDelete.set(null);
  }

  deleteService(id?: number) {
    this.serviceServices.deleteService(id!).subscribe({
      next: () => {
        this.services.update(list => list.filter(s => s.id !== id));
      },
      error: (err) => {
        console.error('Error deleting service', err);
      }
    });
  }


  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3C/svg%3E';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}