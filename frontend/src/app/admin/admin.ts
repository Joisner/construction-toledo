import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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

interface Project {
  id: string;
  title: string;
  description: string;
  location: string;
  service: string;
  completionDate: string;
  beforeAfterPairs: {
    before: string;
    after: string;
    description: string;
  }[];
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
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class Admin implements OnInit {
  // Estado actual
  currentTab = signal<AdminTab>('quotes');
  editingItem = signal<any>(null);
  showDeleteConfirm = signal<any>(null);
  
  // Datos
  quotes = signal<Quote[]>([]);
  projects = signal<Project[]>([]);
  services = signal<Service[]>([]);
  admins = signal<IAdmin[]>([]);

  // Computed properties para filtrado
  pendingQuotes = computed(() => 
    this.quotes().filter(q => q.status === 'pending').length
  );

  constructor(private router: Router) {
    // Cargar datos al iniciar
    this.loadAllData();
  }

  ngOnInit() {
    debugger;
    // Verificar autenticación
    const authId = localStorage.getItem('authAdminId');
    if (!authId) {
      this.router.navigate(['/login']);
      return;
    }
/*     const admins = JSON.parse(localStorage.getItem('admins') || '[]');
    const isAuth = admins.some((admin: any) => admin.id === authId);
    if (!isAuth) {
      this.router.navigate(['/login']);
    } */
  }

  logout() {
    localStorage.removeItem('authAdminId');
    this.router.navigate(['/login']);
  }

  addBeforeAfterPair() {
    const item = this.editingItem();
    if (!item.beforeAfterPairs) {
      item.beforeAfterPairs = [];
    }
    item.beforeAfterPairs.push({
      before: '',
      after: '',
      description: ''
    });
    this.editingItem.set({ ...item });
  }

  private loadAllData() {
    // Convertir cotizaciones antiguas al nuevo formato
    const oldQuotes = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    const migratedQuotes: Quote[] = oldQuotes.map((q: any) => ({
      id: Date.now().toString(),
      name: q.name,
      email: q.email,
      phone: q.phone,
      service: q.service,
      message: q.message,
      date: q.date,
      status: 'pending'
    }));
    
    this.quotes.set(migratedQuotes);
    this.projects.set(JSON.parse(localStorage.getItem('projects') || '[]'));
    this.services.set(JSON.parse(localStorage.getItem('services') || '[]'));
    this.admins.set(JSON.parse(localStorage.getItem('admins') || '[]'));
    
    // Si no hay admins, crear uno por defecto
    if (this.admins().length === 0) {
      this.addAdmin({
        username: 'admin',
        email: 'admin@construccionestoledo.example',
        role: 'admin'
      });
    }
  }

  // Navegación
  setTab(tab: AdminTab) {
    this.currentTab.set(tab);
    this.editingItem.set(null);
    this.showDeleteConfirm.set(null);
  }

  // Cotizaciones
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

  // Proyectos
  addProject(project: Partial<Project>) {
    const newProject: Project = {
      id: Date.now().toString(),
      title: project.title || '',
      description: project.description || '',
      location: project.location || '',
      service: project.service || '',
      completionDate: project.completionDate || new Date().toISOString().split('T')[0],
      beforeAfterPairs: project.beforeAfterPairs || [],
      active: true
    };
    
    const updated = [...this.projects(), newProject];
    this.projects.set(updated);
    localStorage.setItem('projects', JSON.stringify(updated));
    this.editingItem.set(null);
  }

  updateProject(project: Project) {
    const updated = this.projects().map(p => 
      p.id === project.id ? project : p
    );
    this.projects.set(updated);
    localStorage.setItem('projects', JSON.stringify(updated));
    this.editingItem.set(null);
  }

  deleteProject(id: string) {
    const updated = this.projects().filter(p => p.id !== id);
    this.projects.set(updated);
    localStorage.setItem('projects', JSON.stringify(updated));
    this.showDeleteConfirm.set(null);
  }

  // Servicios
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

  // Administradores
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
    // Prevenir eliminar el último admin
    if (this.admins().length <= 1) {
      alert('No se puede eliminar el último administrador');
      return;
    }
    
    const updated = this.admins().filter(a => a.id !== id);
    this.admins.set(updated);
    localStorage.setItem('admins', JSON.stringify(updated));
    this.showDeleteConfirm.set(null);
  }

  // Helpers
  confirmDelete(item: any, type: 'quote' | 'project' | 'service' | 'admin') {
    this.showDeleteConfirm.set({ item, type });
  }

  cancelDelete() {
    this.showDeleteConfirm.set(null);
  }

  startEdit(item: any) {
    this.editingItem.set({ ...item }); // Clone para edición
  }

  cancelEdit() {
    this.editingItem.set(null);
  }
}
