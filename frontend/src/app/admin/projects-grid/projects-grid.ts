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
import { ToastrService } from '../../../core/services/toastr';

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
  deletedMediaIds = signal<string[]>([]);
  currentMainMediaUrl = signal<string | null>(null);
  formSubmitted = false;
  constructor(
    private router: Router,
    private projectService: Project,
    private serviceService: Services,
    private toastr: ToastrService
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

  private validateProjectForm(): boolean {
    const item = this.editingItem();
    const errors: string[] = [];

    // Validar título
    if (!item.title || item.title.trim().length === 0) {
      errors.push('El título es obligatorio');
    } else if (item.title.trim().length < 3) {
      errors.push('El título debe tener al menos 3 caracteres');
    } else if (item.title.trim().length > 100) {
      errors.push('El título no puede exceder 100 caracteres');
    }

    // Validar ubicación
    if (!item.location || item.location.trim().length === 0) {
      errors.push('La ubicación es obligatoria');
    } else if (item.location.trim().length < 3) {
      errors.push('La ubicación debe tener al menos 3 caracteres');
    }

    // Validar servicio
    if (!item.service) {
      errors.push('Debe seleccionar un servicio');
    }

    // Validar fecha (opcional pero si existe debe ser válida)
    if (item.completion_date) {
      const date = new Date(item.completion_date);
      if (isNaN(date.getTime())) {
        errors.push('La fecha de finalización no es válida');
      }
    }

    // Validar descripción (opcional pero con límite)
    if (item.description && item.description.length > 1000) {
      errors.push('La descripción no puede exceder 1000 caracteres');
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

  // ✅ Método que se ejecuta al hacer submit
  onSubmitProject() {
    this.formSubmitted = true;

    if (!this.validateProjectForm()) {
      return;
    }

    const item = this.editingItem();

    if (item.id) {
      this.updateProject(item);
    } else {
      this.addProject(item);
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

  onMediaSaved(result: { pendingMedia: PendingMediaItem[]; deletedMediaIds: string[]; previewMedia: Media[]; mainMediaUrl?: string }) {
    console.log('=== onMediaSaved called ===');
    console.log('Received pending media:', result.pendingMedia.length, 'files');
    console.log('Deleted media IDs:', result.deletedMediaIds.length);

    this.pendingMediaFiles.set(result.pendingMedia);
    this.deletedMediaIds.set(result.deletedMediaIds);
    this.previewMedia.set(result.previewMedia || []);

    if (result.mainMediaUrl) {
      const current = this.editingItem() || {};
      current.main_image = result.mainMediaUrl;
      this.editingItem.set(current);
      this.currentMainMediaUrl.set(result.mainMediaUrl);
      console.log('Main image set to existing media URL:', result.mainMediaUrl);
    }

    if (!result.mainMediaUrl && this.currentMainMediaUrl()) {
      const currentMain = this.currentMainMediaUrl();
      const stillExists = result.previewMedia.some(m => m.file_url === currentMain);
      if (!stillExists) {
        const current = this.editingItem() || {};
        current.main_image = '';
        this.editingItem.set(current);
        this.currentMainMediaUrl.set(null);
        console.log('Main image cleared because the selected item was removed.');
      }
    }

    this.showMediaModal.set(false);
    console.log('Modal closed. Pending files and delete instructions saved.');
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

    // ✅ Limpiar espacios en blanco antes de crear
    const newProject: IProject = {
      id: Date.now().toString(),
      title: project.title!.trim(),
      description: project.description?.trim() || '',
      location: project.location!.trim(),
      service: project.service!,
      completion_date: project.completion_date || new Date().toISOString().split('T')[0],
      is_active: project.is_active ?? true,
      media: [],
      main_image: (project as any).main_image || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating project:', newProject);

    this.projectService.createProject(newProject).subscribe({
      next: (createdProject) => {
        console.log('✅ Project created successfully:', createdProject);

        const pendingFiles = this.pendingMediaFiles();
        if (pendingFiles.length > 0) {
          console.log(`📤 Uploading ${pendingFiles.length} media files...`);
          this.uploadMediaFiles(createdProject.id, pendingFiles);
        } else {
          this.toastr.success('Proyecto creado exitosamente', 'Éxito');
          this.getProjects();
          this.cancelEdit();
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

  // ✅ Método corregido con validación
  updateProject(project: IProject) {
    const pendingFiles = this.pendingMediaFiles();
    const deletedIds = this.deletedMediaIds();

    // ✅ Limpiar espacios en blanco antes de actualizar
    const { media, ...projectWithoutMedia } = project as any;
    const updatedProject: any = {
      ...projectWithoutMedia,
      title: project.title.trim(),
      location: project.location.trim(),
      description: project.description?.trim() || '',
      updated_at: new Date().toISOString()
    };

    if (this.currentMainMediaUrl()) {
      updatedProject.main_image = this.currentMainMediaUrl();
    }

    const performUpdate = () => {
      this.projectService.updateProject(project.id, updatedProject).subscribe({
        next: (res) => {
          if (pendingFiles && pendingFiles.length > 0) {
            console.log(`Uploading ${pendingFiles.length} new media files for project ${project.id} after update`);
            this.uploadMediaFiles(project.id, pendingFiles);
          } else {
            this.toastr.success('Proyecto actualizado exitosamente', 'Éxito');
            this.getProjects();
            this.cancelEdit();
          }
        },
        error: (err) => {
          console.error('Error updating project:', err);
          this.toastr.error('Error al actualizar el proyecto', 'Error');
        }
      });
    };

    if (deletedIds && deletedIds.length > 0) {
      console.log('Deleting existing media before project update:', deletedIds);
      this.deleteProjectMedia(project.id, deletedIds, () => {
        this.deletedMediaIds.set([]);
        performUpdate();
      });
    } else {
      performUpdate();
    }
  }


  // ✅ NUEVO MÉTODO: uploadMediaFiles
  private uploadMediaFiles(projectId: string, files: PendingMediaItem[]) {
    let uploadedCount = 0;
    let errorCount = 0;
    const totalFiles = files.length;

    console.log(`📤 Starting sequential upload of ${totalFiles} files for project ${projectId}`);

    const uploadNext = (index: number) => {
      if (index >= totalFiles) {
        this.finalizeUpload(uploadedCount, errorCount);
        return;
      }

      const item = files[index];
      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('description', item.description);
      formData.append('is_before', item.is_before.toString());
      if (item.is_main) {
        formData.append('is_main', 'true');
      }
      formData.append('order', index.toString());

      console.log(`📤 Uploading file ${index + 1}/${totalFiles}: ${item.file.name}`);

      this.projectService.uploadMedia(projectId, formData, item.is_main).subscribe({
        next: (response) => {
          uploadedCount++;
          console.log(`✅ Media ${index + 1}/${totalFiles} uploaded successfully:`, response);
          uploadNext(index + 1);
        },
        error: (err) => {
          errorCount++;
          console.error(`❌ Error uploading media ${index + 1}/${totalFiles}:`, err);
          uploadNext(index + 1);
        }
      });
    };

    uploadNext(0);
  }

  private deleteProjectMedia(projectId: string, deletedIds: string[], onComplete: () => void) {
    if (!deletedIds || deletedIds.length === 0) {
      onComplete();
      return;
    }

    const remaining = [...deletedIds];
    const deleteNext = () => {
      if (remaining.length === 0) {
        onComplete();
        return;
      }

      const mediaId = remaining.shift()!;
      this.projectService.deleteMedia(projectId, mediaId).subscribe({
        next: () => {
          console.log(`Deleted media ${mediaId}`);
          deleteNext();
        },
        error: (err) => {
          console.error(`Error deleting media ${mediaId}:`, err);
          deleteNext();
        }
      });
    };

    deleteNext();
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

  // ✅ Método mejorado con reset de validaciones
  startEdit(item: any) {
    console.log('✏️ Starting edit:', item);
    this.pendingMediaFiles.set([]);
    this.deletedMediaIds.set([]);
    this.currentMainMediaUrl.set(item.main_image || null);
    this.editingItem.set({ ...item, media: item.media || [] });
    this.previewMedia.set(this.normalizeMediaList(item.media || []));
    this.formSubmitted = false; // ✅ Resetear validaciones
  }

  // ✅ Método mejorado con reset de validaciones
  cancelEdit() {
    console.log('🚫 Canceling edit - clearing pending media');
    this.editingItem.set(null);
    this.pendingMediaFiles.set([]);
    this.deletedMediaIds.set([]);
    this.currentMainMediaUrl.set(null);
    this.previewMedia.set([]);
    this.formSubmitted = false; // ✅ Resetear validaciones
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

  private getServices() {
    this.serviceService.getServices().subscribe({
      next: (service: IService[]) => {
        this.services.set(service);
      },
      error: (err) => { }
    })
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
