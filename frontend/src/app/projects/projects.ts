import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IProject } from '../../core/models/project.model';
import { Project } from '../../core/services/project';
import { ToastrService } from '../../core/services/toastr';
import { environment } from '../../env/environment';


@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
})
export class Projects {
  projects = signal<IProject[]>([]);
  filter = signal<string>('all');
  loading = signal<boolean>(true);

  constructor(private projectService: Project, private toastr: ToastrService) { }

  ngOnInit() {
    this.loadProjects();
  }

  private loadProjects() {
    this.projectService.getAllProjects().subscribe({
      next: (projects: IProject[]) => {
        debugger;
        // Normalizar rutas de media y main_image antes de setear
        const normalized = projects.map(p => this.normalizeProjectMedia(p));

        // Solo mostrar proyectos activos
        this.projects.set(normalized.filter(p => p.is_active));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading projects:', err);
        this.toastr.error('Error al cargar los proyectos', 'Error');
        this.loading.set(false);
      }
    });
  }

  // Normaliza URLs relativas a absolutas usando environment.urlServer
  private getMediaUrl(fileUrl?: string): string {
    if (!fileUrl) return '';

    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://') || fileUrl.startsWith('//')) {
      return fileUrl;
    }

    if (fileUrl.startsWith('/')) {
      return `${environment.urlServer}${fileUrl}`;
    }

    return `${environment.urlServer}/${fileUrl}`;
  }

  private normalizeProjectMedia(project: IProject): IProject {
    return {
      ...project,
      media: (project.media || []).map(m => ({ ...m, file_url: this.getMediaUrl((m as any).file_url) })),
      main_image: (project as any).main_image ? this.getMediaUrl((project as any).main_image) : (project as any).main_image
    } as IProject;
  }

  filtered() {
    const f = this.filter();
    const allProjects = this.projects();

    if (f === 'all') return allProjects;
    return allProjects.filter(p => p.service.toLowerCase().includes(f.toLowerCase()));
  }

  // Obtener la primera imagen "después" de un proyecto para mostrar como thumbnail
  getThumbnail(project: IProject): string {
    const afterImages = project.media
      .filter(m => !m.is_before && m.media_type === 'image');

    if (afterImages.length > 0) {
      return afterImages[0].file_url;
    }

    // Si no hay imágenes "después", buscar cualquier imagen
    const anyImage = project.media.find(m => m.media_type === 'image');
    if (anyImage) {
      return anyImage.file_url;
    }

    // Placeholder si no hay imágenes
    return 'https://via.placeholder.com/600x400.png?text=' + encodeURIComponent(project.title);
  }

  // Contar total de media items
  getMediaCount(project: IProject): number {
    return project.media.length;
  }

  // Verificar si tiene videos
  hasVideos(project: IProject): boolean {
    return project.media.some(m => m.media_type === 'video');
  }
}