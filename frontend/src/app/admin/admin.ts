import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Project } from '../../core/services/project';
import { IProject, Media } from '../../core/models/project.model';
import { MediaManagement } from '../shared/components/media-management/media-management';
interface Quote {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  date: string;
  status: 'pending' | 'contacted' | 'completed' | 'rejected';
}

interface Service {
  id: string;
  title: string;
  description: string;
  details: string;
  image: string;
  active: boolean;
}





interface IAdmin {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'editor';
  active: boolean;
}

type AdminTab = 'quotes' | 'projects' | 'services' | 'admins';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MediaManagement],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class Admin implements OnInit {
  currentTab = signal<AdminTab>('quotes');
  editingItem = signal<any>(null);
  showDeleteConfirm = signal<any>(null);

  showMediaModal = signal<boolean>(false);
  currentMediaList = signal<Media[]>([]);

  quotes = signal<Quote[]>([]);
  projects = signal<IProject[]>([]);
  services = signal<Service[]>([]);
  admins = signal<IAdmin[]>([]);

  pendingQuotes = computed(() =>
    this.quotes().filter(q => q.status === 'pending').length
  );

  constructor(
    private router: Router,
    private projectService: Project
  ) {
    this.loadAllData();
  }

  ngOnInit() {
    const authId = localStorage.getItem('authAdminId');
    if (!authId) {
      this.router.navigate(['/login']);
      return;
    }
  }

  openMediaModal() {
    const currentProject = this.editingItem();
    this.currentMediaList.set(currentProject?.media || []);
    this.showMediaModal.set(true);
  }

  closeMediaModal() {
    this.showMediaModal.set(false);
  }

  onMediaSaved(mediaList: Media[]) {
    const currentProject = this.editingItem();
    if (currentProject) {
      currentProject.media = mediaList;
      this.editingItem.set({ ...currentProject });
    }
    this.showMediaModal.set(false);
  }

  logout() {
    localStorage.removeItem('authAdminId');
    this.router.navigate(['/login']);
  }

  private loadAllData() {
    this.getProjects();

    const oldQuotes = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    const migratedQuotes: Quote[] = oldQuotes.map((q: any) => ({
      id: q.id || Date.now().toString(),
      name: q.name,
      email: q.email,
      phone: q.phone,
      service: q.service,
      message: q.message,
      date: q.date,
      status: q.status || 'pending'
    }));

    this.quotes.set(migratedQuotes);
    this.services.set(JSON.parse(localStorage.getItem('services') || '[]'));
    this.admins.set(JSON.parse(localStorage.getItem('admins') || '[]'));

    if (this.admins().length === 0) {
      this.addAdmin({
        username: 'admin',
        email: 'admin@construccionestoledo.example',
        role: 'admin'
      });
    }
  }

  private getProjects() {
    this.projectService.getAllProjects().subscribe({
      next: (projects: IProject[]) => {
        this.projects.set(projects);
      },
      error: (err) => {
        console.error('Error loading projects:', err);
      }
    });
  }

  setTab(tab: AdminTab) {
    this.currentTab.set(tab);
    this.editingItem.set(null);
    this.showDeleteConfirm.set(null);
  }

  updateQuoteStatus(quote: Quote, status: Quote['status']) {
    const updated = this.quotes().map(q =>
      q.id === quote.id ? { ...q, status } : q
    );
    this.quotes.set(updated);
    localStorage.setItem('quotes', JSON.stringify(updated));
  }

  deleteQuote(id: string) {
    const updated = this.quotes().filter(q => q.id !== id);
    this.quotes.set(updated);
    localStorage.setItem('quotes', JSON.stringify(updated));
    this.showDeleteConfirm.set(null);
  }

  addProject(project: Partial<IProject>) {
    const newProject: IProject = {
      id: Date.now().toString(),
      title: project.title || '',
      description: project.description || '',
      location: project.location || '',
      service: project.service || '',
      completion_date: project.completion_date || new Date().toISOString().split('T')[0],
      is_active: true,
      media: project.media || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.projectService.createProject(newProject).subscribe({
      next: () => {
        this.getProjects();
        this.editingItem.set(null);
      },
      error: (err) => {
        console.error('Error creating project:', err);
        alert('Error al crear el proyecto');
      }
    });
  }

  updateProject(project: IProject) {
    const updatedProject = {
      ...project,
      updated_at: new Date().toISOString()
    };

    this.projectService.updateProject(project.id, updatedProject).subscribe({
      next: () => {
        this.getProjects();
        this.editingItem.set(null);
      },
      error: (err) => {
        console.error('Error updating project:', err);
        alert('Error al actualizar el proyecto');
      }
    });
  }

  deleteProject(id: string) {
    this.projectService.deleteProject(id).subscribe({
      next: () => {
        this.getProjects();
        this.showDeleteConfirm.set(null);
      },
      error: (err) => {
        console.error('Error deleting project:', err);
        alert('Error al eliminar el proyecto');
      }
    });
  }

  addService(service: Partial<Service>) {
    const newService: Service = {
      id: Date.now().toString(),
      title: service.title || '',
      description: service.description || '',
      details: service.details || '',
      image: service.image || '',
      active: true
    };

    const updated = [...this.services(), newService];
    this.services.set(updated);
    localStorage.setItem('services', JSON.stringify(updated));
    this.editingItem.set(null);
  }

  updateService(service: Service) {
    const updated = this.services().map(s =>
      s.id === service.id ? service : s
    );
    this.services.set(updated);
    localStorage.setItem('services', JSON.stringify(updated));
    this.editingItem.set(null);
  }

  deleteService(id: string) {
    const updated = this.services().filter(s => s.id !== id);
    this.services.set(updated);
    localStorage.setItem('services', JSON.stringify(updated));
    this.showDeleteConfirm.set(null);
  }

  addAdmin(admin: Partial<IAdmin>) {
    const newAdmin: IAdmin = {
      id: Date.now().toString(),
      username: admin.username || '',
      email: admin.email || '',
      role: admin.role || 'editor',
      active: true
    };

    const updated = [...this.admins(), newAdmin];
    this.admins.set(updated);
    localStorage.setItem('admins', JSON.stringify(updated));
    this.editingItem.set(null);
  }

  updateAdmin(admin: IAdmin) {
    const updated = this.admins().map(a =>
      a.id === admin.id ? admin : a
    );
    this.admins.set(updated);
    localStorage.setItem('admins', JSON.stringify(updated));
    this.editingItem.set(null);
  }

  deleteAdmin(id: string) {
    if (this.admins().length <= 1) {
      alert('No se puede eliminar el último administrador');
      return;
    }

    const updated = this.admins().filter(a => a.id !== id);
    this.admins.set(updated);
    localStorage.setItem('admins', JSON.stringify(updated));
    this.showDeleteConfirm.set(null);
  }

  confirmDelete(item: any, type: 'quote' | 'project' | 'service' | 'admin') {
    this.showDeleteConfirm.set({ item, type });
  }

  executeDelete() {
    const confirm = this.showDeleteConfirm();
    if (!confirm) return;

    const { item, type } = confirm;

    switch (type) {
      case 'quote':
        this.deleteQuote(item.id);
        break;
      case 'project':
        this.deleteProject(item.id);
        break;
      case 'service':
        this.deleteService(item.id);
        break;
      case 'admin':
        this.deleteAdmin(item.id);
        break;
    }
  }

  cancelDelete() {
    this.showDeleteConfirm.set(null);
  }

  startEdit(item: any) {
    this.editingItem.set({ ...item, media: item.media || [] });
  }

  cancelEdit() {
    this.editingItem.set(null);
  }

  getBeforeMedia(project: IProject): Media[] {
    return project.media.filter(m => m.is_before);
  }

  getAfterMedia(project: IProject): Media[] {
    return project.media.filter(m => !m.is_before);
  }

  getMediaByType(media: Media[]): { images: Media[], videos: Media[] } {
    return {
      images: media.filter(m => m.media_type === 'image'),
      videos: media.filter(m => m.media_type === 'video')
    };
  }
}