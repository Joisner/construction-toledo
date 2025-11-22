import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { Media } from '../../../../core/models/project.model';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-media-management',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './media-management.html',
  styleUrl: './media-management.css',
})
export class MediaManagement {
  @Input() isOpen = false;
  @Input() mediaList: Media[] = [];
  @Output() save = new EventEmitter<Media[]>();

  showMediaModal = signal<boolean>(false);
  // Para gestionar media en el modal
  currentMediaList = signal<Media[]>([]);
  newMediaItem = signal<Partial<Media>>({
    file_url: '',
    mime: '',
    media_type: 'image',
    description: '',
    is_before: true
  });
  editingItem = signal<any>(null);
  // PROYECTOS
  openMediaModal() {
    const currentProject = this.editingItem();
    this.currentMediaList.set(currentProject?.media || []);
    this.showMediaModal.set(true);
  }
  closeMediaModal() {
    this.showMediaModal.set(false);
    this.resetNewMediaItem();
  }

  addMediaToList() {
    const newMedia = this.newMediaItem();

    if (!newMedia.file_url || !newMedia.description) {
      alert('Por favor completa la URL y descripción del media');
      return;
    }

    const mediaItem: Media = {
      id: Date.now().toString(),
      file_url: newMedia.file_url!,
      mime: newMedia.mime || this.detectMimeType(newMedia.file_url!, newMedia.media_type!),
      media_type: newMedia.media_type || 'image',
      description: newMedia.description!,
      is_before: newMedia.is_before ?? true,
      project_id: this.editingItem()?.id || '',
      created_at: new Date().toISOString()
    };

    this.currentMediaList.set([...this.currentMediaList(), mediaItem]);
    this.resetNewMediaItem();
  }

  removeMediaFromList(index: number) {
    const updated = this.currentMediaList().filter((_, i) => i !== index);
    this.currentMediaList.set(updated);
  }

  saveMediaList() {
    const currentProject = this.editingItem();
    if (currentProject) {
      currentProject.media = this.currentMediaList();
      this.editingItem.set({ ...currentProject });
    }
    this.closeMediaModal();
  }

  private resetNewMediaItem() {
    this.newMediaItem.set({
      file_url: '',
      mime: '',
      media_type: 'image',
      description: '',
      is_before: true
    });
  }

  private detectMimeType(url: string, mediaType: string): string {
    const ext = url.split('.').pop()?.toLowerCase();

    if (mediaType === 'video') {
      switch (ext) {
        case 'mp4': return 'video/mp4';
        case 'webm': return 'video/webm';
        case 'ogg': return 'video/ogg';
        default: return 'video/mp4';
      }
    } else {
      switch (ext) {
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'png': return 'image/png';
        case 'gif': return 'image/gif';
        case 'webp': return 'image/webp';
        default: return 'image/jpeg';
      }
    }
  }
}
