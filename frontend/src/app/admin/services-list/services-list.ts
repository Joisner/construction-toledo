import { Component, signal } from '@angular/core';
import { Service } from '../../../core/models/service.model';
import { DeleteConfirmation } from '../../shared/components/delete-confirmation/delete-confirmation';
@Component({
  selector: 'app-services-list',
  imports: [DeleteConfirmation],
  templateUrl: './services-list.html',
  styleUrl: './services-list.css',
})
export class ServicesList {
 services = signal<Service[]>([
    {
      id: 1,
      name: 'Remodelación Integral',
      description: 'Transformamos espacios completos con diseño moderno y funcional. Incluye demolición, construcción y acabados de alta calidad.',
      icon: '🏗️',
      is_active: true,
      features: [
        'Diseño arquitectónico personalizado',
        'Gestión completa del proyecto',
        'Materiales de primera calidad',
        'Garantía de 2 años',
        'Asesoría de diseño de interiores'
      ],
      starting_price: 15000
    },
    {
      id: 2,
      name: 'Pintura Profesional',
      description: 'Servicio de pintura interior y exterior con acabados impecables. Preparación de superficies y aplicación profesional.',
      icon: '🎨',
      is_active: true,
      features: [
        'Pinturas premium',
        'Preparación de superficies',
        'Limpieza incluida',
        'Consultoría de color'
      ],
      starting_price: 800
    },
    {
      id: 3,
      name: 'Instalaciones Eléctricas',
      description: 'Instalaciones eléctricas residenciales y comerciales. Certificación y cumplimiento normativo garantizado.',
      icon: '⚡',
      is_active: true,
      features: [
        'Certificación oficial',
        'Materiales certificados',
        'Garantía de instalación',
        'Mantenimiento preventivo'
      ],
      starting_price: 1200
    }
  ]);

  showModal = signal(false);
  showDeleteModal = signal(false);
  selectedService = signal<Service | null>(null);
  serviceToDelete = signal<Service | null>(null);

  openCreateModal() {
    this.selectedService.set({
      name: '',
      description: '',
      icon: '🔧',
      is_active: true,
      features: []
    });
    this.showModal.set(true);
  }

  openEditModal(service: Service) {
    this.selectedService.set({ ...service });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedService.set(null);
  }

  saveService(service: Service) {
    if (service.id) {
      this.services.update(list => 
        list.map(s => s.id === service.id ? service : s)
      );
    } else {
      const newService = { ...service, id: Date.now() };
      this.services.update(list => [...list, newService]);
    }
    this.closeModal();
  }

  openDeleteConfirm(service: Service) {
    this.serviceToDelete.set(service);
    this.showDeleteModal.set(true);
  }

  closeDeleteConfirm() {
    this.showDeleteModal.set(false);
    this.serviceToDelete.set(null);
  }

  deleteService() {
    const service = this.serviceToDelete();
    if (service?.id) {
      this.services.update((list: any) => list.filter((s: any) => s.id !== service.id));
    }
    this.closeDeleteConfirm();
  }
}
