import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
interface ProjectImage {
  url: string;
  label: string;
}

interface BeforeAfterPair {
  before: string;
  after: string;
  description: string;
}

interface VideoBeforeAfterPair {
  before: string;
  after: string;
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

  viewMode: 'carousel' | 'comparison' | 'video-comparison' = 'carousel';
  currentIndex = 0;
  comparisonIndex = 0;
  videoComparisonIndex = 0;
  sliderPosition = 50; // Posición inicial del slider (50%)
  isDragging = false;

  // Imágenes para el carrusel
  images: ProjectImage[] = [
    { url: 'https://via.placeholder.com/800x600.png?text=Vista+General+Antes', label: 'Vista General - Antes' },
    { url: 'https://via.placeholder.com/800x600.png?text=Vista+General+Después', label: 'Vista General - Después' },
    { url: 'https://via.placeholder.com/800x600.png?text=Cocina+Antes', label: 'Cocina - Antes' },
    { url: 'https://via.placeholder.com/800x600.png?text=Cocina+Después', label: 'Cocina - Después' },
    { url: 'https://via.placeholder.com/800x600.png?text=Baño+Antes', label: 'Baño - Antes' },
    { url: 'https://via.placeholder.com/800x600.png?text=Baño+Después', label: 'Baño - Después' }
  ];

  // Pares de imágenes antes/después
  beforeAfterPairs: BeforeAfterPair[] = [
    {
      before: 'https://via.placeholder.com/800x600.png?text=Vista+General+Antes',
      after: 'https://via.placeholder.com/800x600.png?text=Vista+General+Después',
      description: 'Renovación completa del espacio, mejorando iluminación y distribución'
    },
    {
      before: 'https://via.placeholder.com/800x600.png?text=Cocina+Antes',
      after: 'https://via.placeholder.com/800x600.png?text=Cocina+Después',
      description: 'Modernización de cocina con nuevos acabados y electrodomésticos'
    },
    {
      before: 'https://via.placeholder.com/800x600.png?text=Baño+Antes',
      after: 'https://via.placeholder.com/800x600.png?text=Baño+Después',
      description: 'Renovación completa del baño con materiales de alta calidad'
    }
  ];

  // Pares de videos antes/después
  videoBeforeAfterPairs: VideoBeforeAfterPair[] = [
    {
      before: 'assets/videos/cocina-antes.mp4',
      after: 'assets/videos/cocina-despues.mp4',
      description: 'Renovación completa de cocina - Vista 360° del espacio transformado'
    },
    {
      before: 'assets/videos/salon-antes.mp4',
      after: 'assets/videos/salon-despues.mp4',
      description: 'Remodelación del salón principal con nuevos acabados y diseño moderno'
    },
    {
      before: 'assets/videos/bano-antes.mp4',
      after: 'assets/videos/bano-despues.mp4',
      description: 'Modernización de baño con materiales premium y diseño contemporáneo'
    }
  ];

  ngOnInit(): void {
    // Inicialización si es necesaria
  }

  // ==================== MÉTODOS DEL CARRUSEL ====================
  
  prevImage(): void {
    this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.images.length - 1;
  }

  nextImage(): void {
    this.currentIndex = this.currentIndex < this.images.length - 1 ? this.currentIndex + 1 : 0;
  }

  // ==================== MÉTODOS DE COMPARACIÓN DE IMÁGENES ====================
  
  prevComparison(): void {
    if (this.comparisonIndex > 0) {
      this.comparisonIndex--;
      this.sliderPosition = 50; // Reset slider position
    }
  }

  nextComparison(): void {
    if (this.comparisonIndex < this.beforeAfterPairs.length - 1) {
      this.comparisonIndex++;
      this.sliderPosition = 50; // Reset slider position
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
    
    // Limitar entre 0 y 100
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
    if (this.videoComparisonIndex < this.videoBeforeAfterPairs.length - 1) {
      this.pauseAllVideos();
      this.videoComparisonIndex++;
    }
  }

  playBothVideos(): void {
    if (this.beforeVideo && this.afterVideo) {
      const beforeVid = this.beforeVideo.nativeElement;
      const afterVid = this.afterVideo.nativeElement;
      
      // Reiniciar ambos videos desde el inicio
      beforeVid.currentTime = 0;
      afterVid.currentTime = 0;
      
      // Reproducir ambos videos
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
      // Si se reproduce el video "antes", sincronizar el "después"
      afterVid.currentTime = beforeVid.currentTime;
      afterVid.play().catch(err => console.error('Error syncing after video:', err));
    } else {
      // Si se reproduce el video "después", sincronizar el "antes"
      beforeVid.currentTime = afterVid.currentTime;
      beforeVid.play().catch(err => console.error('Error syncing before video:', err));
    }
  }

  // ==================== MÉTODO PARA CAMBIAR DE MODO ====================
  
  changeViewMode(mode: 'carousel' | 'comparison' | 'video-comparison'): void {
    // Pausar videos al cambiar de modo
    if (this.viewMode === 'video-comparison') {
      this.pauseAllVideos();
    }
    this.viewMode = mode;
  }

  // ==================== LIFECYCLE HOOKS ====================
  
  ngOnDestroy(): void {
    // Limpiar recursos al destruir el componente
    this.pauseAllVideos();
  }
}