export interface Media {
  file_url: string;
  mime: string;
  media_type: string;
  description: string;
  is_before: boolean;
  id: string;
  project_id: string;
  // Flag local to the frontend to mark temporally added/pending media that
  // haven't been uploaded yet. Optional so backend objects remain compatible.
  is_pending?: boolean;
  created_at: string; // ISO string (fecha)
}

export interface IProject {
  title: string;
  description: string;
  location: string;
  service: string;
  completion_date: string; // ISO string (fecha)
  is_active: boolean;
  id: string;
  created_at: string;
  updated_at: string;
  media: Media[];
  // Nueva propiedad opcional para almacenar la URL/id de la imagen principal del proyecto
  main_image?: string;
}

// Utilidades para trabajar con Media
export class MediaHelper {
  
  static getByType(media: Media[], type: 'image' | 'video'): Media[] {
    return media.filter(m => m.media_type === type);
  }

  static getByState(media: Media[], isBefore: boolean): Media[] {
    return media.filter(m => m.is_before === isBefore);
  }

  static getBeforeMedia(media: Media[]): Media[] {
    return this.getByState(media, true);
  }

  static getAfterMedia(media: Media[]): Media[] {
    return this.getByState(media, false);
  }

  static getImages(media: Media[]): Media[] {
    return this.getByType(media, 'image');
  }

  static getVideos(media: Media[]): Media[] {
    return this.getByType(media, 'video');
  }

  static getBeforeImages(media: Media[]): Media[] {
    return this.getImages(this.getBeforeMedia(media));
  }

  static getAfterImages(media: Media[]): Media[] {
    return this.getImages(this.getAfterMedia(media));
  }

  static getBeforeVideos(media: Media[]): Media[] {
    return this.getVideos(this.getBeforeMedia(media));
  }

  static getAfterVideos(media: Media[]): Media[] {
    return this.getVideos(this.getAfterMedia(media));
  }

  static getThumbnail(media: Media[]): string | null {
    // Priorizar imágenes "después"
    const afterImages = this.getAfterImages(media);
    if (afterImages.length > 0) {
      return afterImages[0].file_url;
    }

    // Si no hay imágenes "después", buscar cualquier imagen
    const allImages = this.getImages(media);
    if (allImages.length > 0) {
      return allImages[0].file_url;
    }

    return null;
  }

  static hasVideos(media: Media[]): boolean {
    return this.getVideos(media).length > 0;
  }

  static hasImages(media: Media[]): boolean {
    return this.getImages(media).length > 0;
  }
}

// Interface para pares de media (útil para comparaciones)
export interface MediaPair {
  before: Media | null;
  after: Media | null;
  description: string;
}

export class MediaPairHelper {
  
  static createPairs(beforeList: Media[], afterList: Media[]): MediaPair[] {
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

  static createImagePairs(media: Media[]): MediaPair[] {
    const beforeImages = MediaHelper.getBeforeImages(media);
    const afterImages = MediaHelper.getAfterImages(media);
    return this.createPairs(beforeImages, afterImages);
  }

  static createVideoPairs(media: Media[]): MediaPair[] {
    const beforeVideos = MediaHelper.getBeforeVideos(media);
    const afterVideos = MediaHelper.getAfterVideos(media);
    return this.createPairs(beforeVideos, afterVideos);
  }
}