import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Project } from '../../core/services/project';
import { ToastrService } from '../../core/services/toastr';
import { IProject, Media } from '../../core/models/project.model';
import { MediaManagement } from '../shared/components/media-management/media-management';
import { environment } from '../../env/environment';
import { PendingMediaItem } from '../../core/models/media.model';

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

type MediaSaveResult = {
  pendingMedia: PendingMediaItem[];
  deletedMediaIds: string[];
  previewMedia: Media[];
  mainMediaUrl?: string;
};

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
  // Preview media array used by the form UI. This keeps temporary/mock media
  // separate from the actual `editingItem().media` so we don't accidentally
  // overwrite or remove existing media in the UI before the user saves.
  previewMedia = signal<Media[]>([]);

  quotes = signal<Quote[]>([]);
  projects = signal<IProject[]>([]);
  services = signal<Service[]>([]);
  admins = signal<IAdmin[]>([]);

  pendingQuotes = computed(() =>
    this.quotes().filter(q => q.status === 'pending').length
  );
  pendingMediaFiles = signal<PendingMediaItem[]>([]);
  constructor(
    private router: Router,
    private projectService: Project,
    private toastr: ToastrService
  ) {
    this.loadAllData();
  }

  async ngOnInit() {
    const authId = localStorage.getItem('authAdminId');
    if (!authId) {
      this.router.navigate(['/login']);
      return;
    }
  }

  // ------------------- Helpers para normalizar URLs -------------------
  getMediaUrl(fileUrl?: string): string {
    if (!fileUrl) return '';

    // ya es absoluta
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://') || fileUrl.startsWith('//')) {
      return fileUrl;
    }

    // ya viene con slash al inicio -> prefijar apiUrl
    if (fileUrl.startsWith('/')) {
      return `${environment.urlServer}${fileUrl}`;
    }

    // no tiene slash -> añadirlo
    return `${environment.urlServer}/${fileUrl}`;
  }

  normalizeProjectMedia(project: IProject): IProject {
    // Copiamos para no mutar directamente el objeto original (buena práctica)
    const copy: IProject = { ...project, media: (project.media || []).map(m => ({ ...m, file_url: this.getMediaUrl((m as any).file_url) })) };
    return copy;
  }

  normalizeMediaList(mediaList: Media[]): Media[] {
    return (mediaList || []).map(m => ({ ...m, file_url: this.getMediaUrl((m as any).file_url) }));
  }
  // --------------------------------------------------------------------

  onMediaSaved(result: MediaSaveResult) {
    console.log('=== onMediaSaved called ===');
    console.log('Received pending media:', result.pendingMedia.length, 'files');
    console.log('Deleted media IDs:', result.deletedMediaIds.length);

    // Guardar los archivos pendientes (para subir luego)
    this.pendingMediaFiles.set(result.pendingMedia);

    // Usar el preview generado por el componente hijo para mostrar la preview.
    this.previewMedia.set(result.previewMedia || []);

    if (result.mainMediaUrl) {
      const current = this.editingItem() || {};
      (current as any).main_image = result.mainMediaUrl;
      this.editingItem.set(current);
      console.log('Main image preserved:', result.mainMediaUrl);
    }

    // Cerrar el modal
    this.showMediaModal.set(false);
    console.log('Modal closed. Files ready to upload after project creation.');
  }

  // ✅ MÉTODO CORREGIDO: addProject
  addProject(project: Partial<IProject>) {
    const token = localStorage.getItem('authAdminId');

    if (!token) {
      console.error('Cannot create project: No authentication token');
      this.toastr.error('Debes iniciar sesión nuevamente', 'Error de autenticación');
      this.router.navigate(['/login']);
      return;
    }

    // Validar campos requeridos
    if (!project.title || !project.location || !project.service) {
      this.toastr.error('Por favor completa todos los campos requeridos (Título, Ubicación, Servicio)', 'Validación');
      return;
    }

    // 1. Crear el proyecto SIN media
    const newProject: IProject = {
      id: Date.now().toString(),
      title: project.title,
      description: project.description || '',
      location: project.location,
      service: project.service,
      completion_date: project.completion_date || new Date().toISOString().split('T')[0],
      is_active: project.is_active ?? true,
      media: [], // ✅ Sin media por ahora
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating project:', newProject);

    this.projectService.createProject(newProject).subscribe({
      next: (createdProject) => {
        console.log('✅ Project created successfully:', createdProject);

        // 2. Si hay archivos pendientes, subirlos ahora
        const pendingFiles = this.pendingMediaFiles();
        if (pendingFiles.length > 0) {
          console.log(`📤 Uploading ${pendingFiles.length} media files...`);
          this.uploadMediaFiles(createdProject.id, pendingFiles);
        } else {
          // No hay archivos, solo recargar la lista
          this.toastr.success('Proyecto creado exitosamente', 'Éxito');
          this.getProjects();
          this.editingItem.set(null);
          this.pendingMediaFiles.set([]);
        }
      },
      error: (err) => {
        console.error('=== FULL ERROR DETAILS ===');
        console.error('Status:', err.status);
        console.error('Status Text:', err.statusText);
        console.error('Error body:', err.error);
        console.error('========================');

        if (err.status === 403) {
          const errorMsg = err.error?.detail || err.error?.message || 'Sin detalles adicionales';
          this.toastr.error(`Error de autenticación: ${errorMsg}`, 'Acceso denegado');
          this.router.navigate(['/login']);
        } else if (err.status === 401) {
          this.toastr.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'Sesión expirada');
          this.router.navigate(['/login']);
        } else {
          const errorMsg = err.error?.detail || err.message || 'Error desconocido';
          this.toastr.error(`Error al crear el proyecto: ${errorMsg}`, 'Error');
        }
      }
    });
  }

  // ✅ NUEVO MÉTODO: uploadMediaFiles
  private uploadMediaFiles(projectId: string, files: PendingMediaItem[]) {
    let uploadedCount = 0;
    let errorCount = 0;
    const totalFiles = files.length;

    console.log(`📤 Starting upload of ${totalFiles} files for project ${projectId}`);

    files.forEach((item, index) => {
      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('description', item.description);
      formData.append('is_before', item.is_before.toString());

      console.log(`📤 Uploading file ${index + 1}/${totalFiles}: ${item.file.name}`);

      // Llamar al endpoint de tu API
      this.projectService.uploadMedia(projectId, formData).subscribe({
        next: (response) => {
          uploadedCount++;
          console.log(`✅ Media ${uploadedCount}/${totalFiles} uploaded successfully:`, response);

          // Si es el último archivo, recargar la lista
          if (uploadedCount + errorCount === totalFiles) {
            this.finalizeUpload(uploadedCount, errorCount);
          }
        },
        error: (err) => {
          errorCount++;
          console.error(`❌ Error uploading media ${index + 1}/${totalFiles}:`, err);

          // Si es el último archivo, recargar la lista
          if (uploadedCount + errorCount === totalFiles) {
            this.finalizeUpload(uploadedCount, errorCount);
          }
        }
      });
    });
  }

  // ✅ NUEVO MÉTODO: finalizeUpload
  private finalizeUpload(successCount: number, errorCount: number) {
    console.log(`🏁 Upload complete: ${successCount} successful, ${errorCount} failed`);

    if (errorCount > 0) {
      this.toastr.warning(`Proyecto creado pero hubo ${errorCount} error(es) al subir las imágenes`, 'Advertencia');
    } else {
      this.toastr.success(`Proyecto creado exitosamente con ${successCount} imagen(es)`, 'Éxito');
    }

    // Limpiar y recargar
    this.pendingMediaFiles.set([]);
    this.previewMedia.set([]);
    this.editingItem.set(null);
    this.getProjects();
  }

  // ✅ MÉTODO CORREGIDO: openMediaModal
  openMediaModal() {
    const currentProject = this.editingItem();

    // Si es un proyecto nuevo o edición, obtener la media existente
    const mediaList = currentProject?.media || [];

    // Initialize previewMedia if empty
    if (!this.previewMedia() || this.previewMedia().length === 0) {
      this.previewMedia.set(this.normalizeMediaList(mediaList));
    }

    this.currentMediaList.set(this.previewMedia());
    this.showMediaModal.set(true);

    console.log('📂 Opening media modal with', mediaList.length, 'existing media items');
  }

  // ✅ MÉTODO CORREGIDO: closeMediaModal
  closeMediaModal() {
    console.log('❌ closeMediaModal called - modal closing without saving');
    this.showMediaModal.set(false);
    // No limpiar pendingMediaFiles aquí, se limpian después de subir o cancelar
  }

  // ✅ MÉTODO CORREGIDO: cancelEdit
  cancelEdit() {
    console.log('🚫 Canceling edit - clearing pending media');
    this.editingItem.set(null);
    this.pendingMediaFiles.set([]); // Limpiar archivos pendientes al cancelar
    this.previewMedia.set([]);
  }

  // ✅ MÉTODO CORREGIDO: startEdit
  startEdit(item: any) {
    console.log('✏️ Starting edit:', item);
    // Limpiar archivos pendientes al empezar una nueva edición
    this.pendingMediaFiles.set([]);
    this.editingItem.set({ ...item, media: item.media || [] });
    // Set preview media from item.media so UI shows current media
    this.previewMedia.set(this.normalizeMediaList(item.media || []));
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
        // Normalizar todas las media URLs aquí para evitar 404 por rutas relativas
        const normalized = projects.map(p => this.normalizeProjectMedia(p));
        this.projects.set(normalized);
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


  updateProject(project: IProject) {
    // Don't send the `media` array when updating the project, because media
    // are managed via separate endpoints. Sending `media` here can overwrite
    // or remove existing entries on the backend. Instead: update the project
    // fields, then upload any pending media items separately.
    const pendingFiles = this.pendingMediaFiles();

    const { media, ...projectWithoutMedia } = project as any;
    const updatedProject = {
      ...projectWithoutMedia,
      updated_at: new Date().toISOString()
    };

    this.projectService.updateProject(project.id, updatedProject).subscribe({
      next: (res) => {
        // If there are pending files, upload them and then refresh.
        if (pendingFiles && pendingFiles.length > 0) {
          console.log(`Uploading ${pendingFiles.length} new media files for project ${project.id} after update`);
          // Use the existing single-file uploader which appends media instead of replacing
          this.uploadMediaFiles(project.id, pendingFiles);
        } else {
          this.getProjects();
          this.editingItem.set(null);
        }
      },
      error: (err) => {
        console.error('Error updating project:', err);
        this.toastr.error('Error al actualizar el proyecto', 'Error');
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
        // Show backend detail when available
        const detail = err?.error?.detail || err?.error?.message || err?.message || 'Sin detalles';
        if (err.status === 403) {
          this.toastr.error(`No tienes permisos para eliminar este proyecto: ${detail}`, 'Acceso denegado');
          // Optional: redirect to login if token invalid/expired
          // this.router.navigate(['/login']);
        } else if (err.status === 401) {
          this.toastr.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'Sesión expirada');
          this.router.navigate(['/login']);
        } else {
          this.toastr.error(`Error al eliminar el proyecto: ${detail}`, 'Error');
        }
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
      this.toastr.warning('No se puede eliminar el último administrador', 'Advertencia');
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

  // Fallback visual para imágenes que fallan al cargar
  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/img/placeholder.png'; // Pon una imagen placeholder en assets
  }
}