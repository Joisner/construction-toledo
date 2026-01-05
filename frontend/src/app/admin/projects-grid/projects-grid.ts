import { Component, computed, signal } from '@angular/core';
import { IProject, Media } from '../../../core/models/project.model';
import { PendingMediaItem } from '../../../core/models/media.model';
import { Router } from '@angular/router';
import { Project } from '../../../core/services/project';
import { environment } from '../../../env/environment';
import { MediaManagement } from '../../shared/components/media-management/media-management';
import { DeleteConfirmation } from '../../shared/components/delete-confirmation/delete-confirmation';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Services } from '../../../core/services/services';
import { IService } from '../../../core/models/service';

@Component({
  selector: 'app-projects-grid',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MediaManagement, DeleteConfirmation],
  templateUrl: './projects-grid.html',
  styleUrl: './projects-grid.css',
})
export class ProjectsGrid {
  editingItem = signal<any>(null);
  showDeleteConfirm = signal<any>(null);

  showMediaModal = signal<boolean>(false);
  currentMediaList = signal<Media[]>([]);
  // Preview media array used by the form UI. This keeps temporary/mock media
  // separate from the actual `editingItem().media` so we don't accidentally
  // overwrite or remove existing media in the UI before the user saves.
  previewMedia = signal<Media[]>([]);


  projects = signal<IProject[]>([]);
  services = signal<IService[]>([]);

  pendingMediaFiles = signal<PendingMediaItem[]>([]);
  constructor(
    private router: Router,
    private projectService: Project,
    private serviceService: Services
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
    // Normalizar tanto las URLs de los media como la posible propiedad `main_image`
    const copy: IProject = {
      ...project,
      media: (project.media || []).map(m => ({ ...m, file_url: this.getMediaUrl((m as any).file_url) })),
      // Normalizar main_image si existe (puede venir como ruta relativa desde el backend)
      main_image: (project as any).main_image ? this.getMediaUrl((project as any).main_image) : (project as any).main_image
    };

    return copy;
  }

  normalizeMediaList(mediaList: Media[]): Media[] {
    return (mediaList || []).map(m => ({ ...m, file_url: this.getMediaUrl((m as any).file_url) }));
  }
  // --------------------------------------------------------------------

  onMediaSaved(pendingMedia: PendingMediaItem[]) {
    console.log('=== onMediaSaved called ===');
    console.log('Received pending media:', pendingMedia.length, 'files');

    // Guardar los archivos pendientes (para subir luego)
    this.pendingMediaFiles.set(pendingMedia);

    // Crear media "mock" solo para mostrar el contador y preview
    const mockMedia: Media[] = pendingMedia.map((item, index) => ({
      id: `pending-${Date.now()}-${index}`,
      file_url: item.preview_url, // URL temporal para preview
      mime: item.file.type,
      media_type: item.media_type,
      description: item.description,
      is_before: item.is_before,
      is_pending: true,
      project_id: '',
      created_at: new Date().toISOString()
    }));

    // Merge into previewMedia so we don't mutate editingItem.media directly
    const existingPreview = this.previewMedia() || (this.editingItem()?.media || []);
    const merged = [...existingPreview, ...mockMedia];
    this.previewMedia.set(merged);

    console.log('Preview media updated with pending mocks. Added:', mockMedia.length, 'Preview total:', merged.length);

    // Cerrar el modal
    this.showMediaModal.set(false);
    console.log('Modal closed. Files ready to upload after project creation.');

    // Si entre los archivos pendientes hay alguno marcado como principal,
    // asignarlo al editingItem() para que el form incluya la referencia
    const main = pendingMedia.find(p => p.is_main);
    if (main) {
      const current = this.editingItem() || {};
      // usar preview_url temporal como referencia hasta que se suba
      current.main_image = main.preview_url;
      this.editingItem.set(current);
      console.log('Main image set on editingItem (preview):', main.preview_url);
    }
  }

  // ✅ MÉTODO CORREGIDO: addProject
  addProject(project: Partial<IProject>) {
    const token = localStorage.getItem('authAdminId');

    if (!token) {
      console.error('Cannot create project: No authentication token');
      alert('Debes iniciar sesión nuevamente');
      this.router.navigate(['/login']);
      return;
    }

    // Validar campos requeridos
    if (!project.title || !project.location || !project.service) {
      alert('Por favor completa todos los campos requeridos (Título, Ubicación, Servicio)');
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
      // Si el formulario ya contiene un valor para main_image (por ejemplo el usuario marcó
      // un pending media como principal), incluirlo aquí como referencia inicial.
      main_image: (project as any).main_image || '',
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
          alert('Proyecto creado exitosamente');
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
          alert(`Error de autenticación: ${errorMsg}\n\nPor favor, inicia sesión nuevamente.`);
          this.router.navigate(['/login']);
        } else if (err.status === 401) {
          alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          this.router.navigate(['/login']);
        } else {
          const errorMsg = err.error?.detail || err.message || 'Error desconocido';
          alert(`Error al crear el proyecto: ${errorMsg}`);
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
    debugger
    files.forEach((item, index) => {
      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('description', item.description);
      formData.append('is_before', item.is_before.toString());
      // Si el item está marcado como principal, incluir esa metadata para que el backend
      // pueda marcar la media como imagen principal del proyecto.
      if (item.is_main) {
        formData.append('is_main', 'true');
      }

      console.log(`📤 Uploading file ${index + 1}/${totalFiles}: ${item.file.name}`);

      // Llamar al endpoint de tu API
      this.projectService.uploadMedia(projectId, formData).subscribe({
        next: (response) => {
          uploadedCount++;
          console.log(`✅ Media ${uploadedCount}/${totalFiles} uploaded successfully:`, response);
          if(!!item.is_main){
            this.projectService.uploadMedia(projectId, formData, item.is_main!).subscribe({
              next: () => { console.log(`Principal subida`)},
              error: (err) => {}
            })
          }
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
      alert(`⚠️ Proyecto creado pero hubo ${errorCount} error(es) al subir las imágenes`);
    } else {
      alert(`✅ Proyecto creado exitosamente con ${successCount} imagen(es)`);
    }

    // Limpiar y recargar
    this.pendingMediaFiles.set([]);
    this.previewMedia.set([]);
    this.editingItem.set(null);
    this.getProjects();
  }

  // Devuelve la URL a usar en la tarjeta del proyecto, priorizando `main_image` si existe
  getProjectThumbnail(project: IProject): string {
    // Si el proyecto trae explícitamente una main_image (path o URL), normalizarla
    if ((project as any).main_image) {
      return this.getMediaUrl((project as any).main_image);
    }

    const after = this.getAfterMedia(project)[0];
    if (after) return after.file_url;

    return '';
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
    this.getServices();
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

  private getServices(){
    this.serviceService.getServices().subscribe({
      next: (service: IService[]) => {
        this.services.set(service);
      },
      error: (err) => {}
    })
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
        // Show backend detail when available
        const detail = err?.error?.detail || err?.error?.message || err?.message || 'Sin detalles';
        if (err.status === 403) {
          alert(`No tienes permisos para eliminar este proyecto: ${detail}`);
          // Optional: redirect to login if token invalid/expired
          // this.router.navigate(['/login']);
        } else if (err.status === 401) {
          alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          this.router.navigate(['/login']);
        } else {
          alert(`Error al eliminar el proyecto: ${detail}`);
        }
      }
    });
  }


  confirmDelete(item: any, type: 'quote' | 'project' | 'service' | 'admin') {
    this.showDeleteConfirm.set({ item, type });
  }

 /*  executeDelete() {
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
 */
  cancelDelete() {
    this.showDeleteConfirm.set(null);
  }

  executeDelete() {
    const confirm = this.showDeleteConfirm();
    if (!confirm) return;

    const { item, type } = confirm;

    switch (type) {
      case 'project':
        this.deleteProject(item.id);
        break;
      // other types not implemented in this component
      default:
        this.showDeleteConfirm.set(null);
        break;
    }
  }

  getDeleteMessage(): string {
    const confirm = this.showDeleteConfirm();
    const title = confirm?.item?.title || '';
    return `¿Estás seguro que quieres eliminar el proyecto ${title}? Esta acción no se puede deshacer.`;
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
