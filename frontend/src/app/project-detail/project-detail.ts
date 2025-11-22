import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IProject, Media } from '../../core/models/project.model';
import { ActivatedRoute } from '@angular/router';
import { Project } from '../../core/services/project';
interface MediaPair {
  before: Media | null;
  after: Media | null;
  description: string;
}

@Component({
  selector: 'app-project-detail',
  imports: [CommonModule],
  templateUrl: './project-detail.html',
  styleUrls: ['./project-detail.css'],
})
export class ProjectDetail implements OnInit {
  @ViewChild('comparisonContainer') comparisonContainer!: ElementRef;
  @ViewChild('beforeVideo') beforeVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('afterVideo') afterVideo!: ElementRef<HTMLVideoElement>;

  project: IProject | null = null;
  loading: boolean = true;

  viewMode: 'carousel' | 'comparison' | 'video-comparison' = 'carousel';
  currentIndex = 0;
  comparisonIndex = 0;
  videoComparisonIndex = 0;
  sliderPosition = 50;
  isDragging = false;

  // Media organizada
  allMedia: Media[] = [];
  imagePairs: MediaPair[] = [];
  videoPairs: MediaPair[] = [];

  constructor(
    private route: ActivatedRoute,
    private projectService: Project
  ) { }

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (projectId) {
      this.loadProject(projectId);
    }
  }

  ngOnDestroy(): void {
    this.pauseAllVideos();
  }

  private loadProject(id: string): void {
    this.projectService.getProjectById(id).subscribe({
      next: (project: IProject) => {
        debugger
        this.project = project;
        this.allMedia = project.media;
        this.organizePairs();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading project:', err);
        this.loading = false;
      }
    });
  }

  private organizePairs(): void {
    if (!this.project) return;

    const images = this.project.media.filter(m => m.media_type === 'image');
    const videos = this.project.media.filter(m => m.media_type === 'video');

    // Organizar imágenes en pares
    const beforeImages = images.filter(m => m.is_before);
    const afterImages = images.filter(m => !m.is_before);

    this.imagePairs = this.createPairs(beforeImages, afterImages);

    // Organizar videos en pares
    const beforeVideos = videos.filter(m => m.is_before);
    const afterVideos = videos.filter(m => !m.is_before);

    this.videoPairs = this.createPairs(beforeVideos, afterVideos);
  }

  private createPairs(beforeList: Media[], afterList: Media[]): MediaPair[] {
    const pairs: MediaPair[] = [];
    const maxLength = Math.max(beforeList.length, afterList.length);

    for (let i = 0; i < maxLength; i++) {
      const before = beforeList[i] || null;
      const after = afterList[i] || null;

      pairs.push({
        before,
        after,
        description: after?.description || before?.description || 'Transformación'
      });
    }

    return pairs;
  }

  // ==================== MÉTODOS DEL CARRUSEL ====================

  prevImage(): void {
    this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.allMedia.length - 1;
  }

  nextImage(): void {
    this.currentIndex = this.currentIndex < this.allMedia.length - 1 ? this.currentIndex + 1 : 0;
  }

  // ==================== MÉTODOS DE COMPARACIÓN DE IMÁGENES ====================

  prevComparison(): void {
    if (this.comparisonIndex > 0) {
      this.comparisonIndex--;
      this.sliderPosition = 50;
    }
  }

  nextComparison(): void {
    if (this.comparisonIndex < this.imagePairs.length - 1) {
      this.comparisonIndex++;
      this.sliderPosition = 50;
    }
  }

  // ==================== MÉTODOS DEL SLIDER ANTES/DESPUÉS ====================

  startDragging(event: MouseEvent | TouchEvent): void {
    this.isDragging = true;
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  @HostListener('document:touchmove', ['$event'])
  onDrag(event: MouseEvent | TouchEvent): void {
    if (!this.isDragging || !this.comparisonContainer) return;

    const container = this.comparisonContainer.nativeElement;
    const rect = container.getBoundingClientRect();

    let clientX: number;
    if (event instanceof MouseEvent) {
      clientX = event.clientX;
    } else {
      clientX = event.touches[0].clientX;
    }

    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    this.sliderPosition = Math.max(0, Math.min(100, percentage));
  }

  @HostListener('document:mouseup')
  @HostListener('document:touchend')
  stopDragging(): void {
    this.isDragging = false;
  }

  // ==================== MÉTODOS DE COMPARACIÓN DE VIDEOS ====================

  prevVideoComparison(): void {
    if (this.videoComparisonIndex > 0) {
      this.pauseAllVideos();
      this.videoComparisonIndex--;
    }
  }

  nextVideoComparison(): void {
    if (this.videoComparisonIndex < this.videoPairs.length - 1) {
      this.pauseAllVideos();
      this.videoComparisonIndex++;
    }
  }

  playBothVideos(): void {
    if (this.beforeVideo && this.afterVideo) {
      const beforeVid = this.beforeVideo.nativeElement;
      const afterVid = this.afterVideo.nativeElement;

      beforeVid.currentTime = 0;
      afterVid.currentTime = 0;

      beforeVid.play().catch(err => console.error('Error playing before video:', err));
      afterVid.play().catch(err => console.error('Error playing after video:', err));
    }
  }

  pauseAllVideos(): void {
    if (this.beforeVideo) {
      this.beforeVideo.nativeElement.pause();
    }
    if (this.afterVideo) {
      this.afterVideo.nativeElement.pause();
    }
  }

  syncVideos(source: 'before' | 'after'): void {
    if (!this.beforeVideo || !this.afterVideo) return;

    const beforeVid = this.beforeVideo.nativeElement;
    const afterVid = this.afterVideo.nativeElement;

    if (source === 'before') {
      afterVid.currentTime = beforeVid.currentTime;
      afterVid.play().catch(err => console.error('Error syncing after video:', err));
    } else {
      beforeVid.currentTime = afterVid.currentTime;
      beforeVid.play().catch(err => console.error('Error syncing before video:', err));
    }
  }

  // ==================== MÉTODO PARA CAMBIAR DE MODO ====================

  changeViewMode(mode: 'carousel' | 'comparison' | 'video-comparison'): void {
    if (this.viewMode === 'video-comparison') {
      this.pauseAllVideos();
    }
    this.viewMode = mode;
  }

  // ==================== UTILIDADES ====================

  hasImagePairs(): boolean {
    return this.imagePairs.length > 0;
  }

  hasVideoPairs(): boolean {
    return this.videoPairs.length > 0;
  }

  getMediaLabel(media: Media): string {
    return `${media.is_before ? 'Antes' : 'Después'} - ${media.description}`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}