import { Component, EventEmitter, Input, Output, signal, OnInit, SimpleChanges } from '@angular/core';
import { Media } from '../../../../core/models/project.model';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PendingMediaItem } from '../../../../core/models/media.model';
import { ToastrService } from '../../../../core/services/toastr';

export interface MediaEditorItem {
  id?: string;
  project_id?: string;
  file_url: string;
  mime?: string;
  media_type: 'image' | 'video';
  description: string;
  is_before: boolean;
  is_main?: boolean;
  is_pending: boolean;
  file?: File;
  preview_url: string;
}
@Component({
  selector: 'app-media-management',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './media-management.html',
  styleUrl: './media-management.css',
})
export class MediaManagement implements OnInit {
  @Input() isOpen = false;
  @Input() mediaList: Media[] = []; // Media ya guardada
  @Input() mainImageUrl = '';
  @Output() save = new EventEmitter<{ pendingMedia: PendingMediaItem[]; deletedMediaIds: string[]; previewMedia: Media[]; mainMediaUrl?: string }>();
  @Output() close = new EventEmitter<void>();

  mediaQueue = signal<MediaEditorItem[]>([]);
  deletedMediaIds = signal<string[]>([]);
  draggedIndex: number | null = null;
  
  constructor(private toastr: ToastrService) { }
  
  newMediaItem = signal<{
    files: File[];
    file: File | null;
    description: string;
    is_before: boolean;
    media_type: 'image' | 'video';
    preview_url: string;
    is_main?: boolean;
  }>({
    files: [],
    file: null,
    description: '',
    is_before: true,
    media_type: 'image',
    preview_url: ''
  });

  dragOverZone = false;

  ngOnInit() {
    console.log('MediaManagement initialized');
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      // Reset when opening the modal
      this.mediaQueue.set(this.buildQueue(this.mediaList, []));
      this.deletedMediaIds.set([]);
      this.resetNewMediaItem();
    }
  }

  private buildQueue(existingMedia: Media[], pendingItems: PendingMediaItem[]): MediaEditorItem[] {
    const existing = (existingMedia || []).map((m) => ({
      id: m.id,
      project_id: m.project_id,
      file_url: m.file_url,
      mime: m.mime,
      media_type: m.media_type as 'image' | 'video',
      description: m.description,
      is_before: m.is_before,
      is_main: m.file_url === this.mainImageUrl,
      is_pending: false,
      preview_url: m.file_url
    }));

    const pending = (pendingItems || []).map((item) => ({
      file: item.file,
      file_url: item.preview_url,
      mime: item.file.type,
      media_type: item.media_type,
      description: item.description,
      is_before: item.is_before,
      is_main: item.is_main ?? false,
      is_pending: true,
      preview_url: item.preview_url
    }));

    return [...existing, ...pending];
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    this.setSelectedFiles(files);
  }

  onFilesDropped(event: DragEvent) {
    event.preventDefault();
    this.dragOverZone = false;
    const files = event.dataTransfer ? Array.from(event.dataTransfer.files) : [];
    this.setSelectedFiles(files);
  }

  onDragEnter(event: DragEvent) {
    event.preventDefault();
    this.dragOverZone = true;
  }

  onDropZoneDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dragOverZone = false;
  }

  private setSelectedFiles(files: File[]) {
    if (!files.length) {
      return;
    }

    const firstFile = files[0];
    const mediaType = firstFile.type.startsWith('video/') ? 'video' : 'image';
    const previewUrl = URL.createObjectURL(firstFile);

    this.newMediaItem.set({
      files: files,
      file: firstFile,
      description: this.newMediaItem().description,
      is_before: this.newMediaItem().is_before,
      media_type: mediaType,
      preview_url: previewUrl,
      is_main: this.newMediaItem().is_main ?? false
    });
  }

  addMediaToList() {
    const current = this.newMediaItem();

    if (!current.file || !current.description.trim()) {
      this.toastr.warning('Por favor completa el archivo y descripción del media', 'Datos incompletos');
      return;
    }

    const files = current.files.length ? current.files : current.file ? [current.file] : [];
    const newItems: MediaEditorItem[] = files.map((file, index) => ({
      file,
      file_url: URL.createObjectURL(file),
      mime: file.type,
      media_type: file.type.startsWith('video/') ? 'video' : 'image',
      description: current.description,
      is_before: current.is_before,
      is_main: current.is_main ? index === 0 : false,
      is_pending: true,
      preview_url: URL.createObjectURL(file)
    }));

    if (!newItems.length) {
      this.toastr.warning('No hay archivos seleccionados para agregar', 'Archivo vacío');
      return;
    }

    const currentQueue = this.mediaQueue();
    const resetMain = newItems.some(item => item.is_main);
    const updatedQueue = currentQueue.map(item => ({ ...item, is_main: resetMain ? false : item.is_main }));
    this.mediaQueue.set([...updatedQueue, ...newItems]);
    console.log('Media added to queue. Count:', this.mediaQueue().length);
    
    this.resetNewMediaItem();
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  removeMediaFromList(index: number) {
    const items = this.mediaQueue();
    const item = items[index];
    if (!item) {
      return;
    }

    if (!item.is_pending && item.id) {
      this.deletedMediaIds.set([...this.deletedMediaIds(), item.id]);
    }

    items.splice(index, 1);
    this.mediaQueue.set([...items]);
    console.log('Media removed. Current queue count:', items.length);
  }

  closeMediaModal() {
    console.log('Closing modal');
    this.mediaQueue.set([]);
    this.deletedMediaIds.set([]);
    this.resetNewMediaItem();
    this.close.emit();
  }

  saveMediaList() {
    const queue = this.mediaQueue();
    const pending = queue.filter(item => item.is_pending).map(item => ({
      file: item.file as File,
      description: item.description,
      is_before: item.is_before,
      media_type: item.media_type,
      preview_url: item.preview_url,
      is_main: item.is_main
    }));

    const previewMedia: Media[] = queue.map((item, index) => ({
      id: item.id || `pending-${Date.now()}-${index}`,
      file_url: item.file_url,
      mime: item.mime || item.file?.type || 'image/jpeg',
      media_type: item.media_type,
      description: item.description,
      is_before: item.is_before,
      project_id: item.project_id || '',
      is_pending: item.is_pending,
      created_at: new Date().toISOString()
    }));

    const selectedMain = queue.find(item => item.is_main);

    console.log('=== SAVING MEDIA LIST ===');
    console.log('Pending items:', pending.length);
    console.log('Deleted IDs:', this.deletedMediaIds().length);
    console.log('Preview items total:', previewMedia.length);

    this.save.emit({
      pendingMedia: pending,
      deletedMediaIds: this.deletedMediaIds(),
      previewMedia,
      mainMediaUrl: selectedMain && !selectedMain.is_pending ? selectedMain.file_url : undefined
    });
  }

  private resetNewMediaItem() {
    this.newMediaItem.set({
      files: [],
      file: null,
      description: '',
      is_before: true,
      media_type: 'image',
      preview_url: '',
      is_main: false
    });
  }

  // Permite marcar un item existente o pendiente como principal (solo uno)
  setPendingMain(index: number) {
    const items = this.mediaQueue();
    const updated = items.map((it, i) => ({ ...it, is_main: i === index }));
    this.mediaQueue.set(updated);
  }

  // Helper para obtener el conteo total (media guardada + pendiente)
  getTotalMediaCount(): number {
    return this.mediaQueue().length;
  }

  // ==================== DRAG & DROP ====================
  
  onDragStart(event: DragEvent, index: number) {
    this.draggedIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent, dropIndex: number) {
    event.preventDefault();
    if (this.draggedIndex === null || this.draggedIndex === dropIndex) {
      this.draggedIndex = null;
      return;
    }

    const items = this.mediaQueue();
    const draggedItem = items[this.draggedIndex];
    const newList = items.filter((_, i) => i !== this.draggedIndex);
    newList.splice(dropIndex, 0, draggedItem);
    this.mediaQueue.set(newList);
    this.draggedIndex = null;
  }

  // Botones para mover arriba/abajo
  moveUp(index: number) {
    if (index > 0) {
      const items = this.mediaQueue();
      [items[index], items[index - 1]] = [items[index - 1], items[index]];
      this.mediaQueue.set([...items]);
    }
  }

  moveDown(index: number) {
    const items = this.mediaQueue();
    if (index < items.length - 1) {
      [items[index], items[index + 1]] = [items[index + 1], items[index]];
      this.mediaQueue.set([...items]);
    }
  }

  // Cambiar estado Antes/Después
  toggleBeforeAfter(index: number) {
    const items = this.mediaQueue();
    const item = { ...items[index], is_before: !items[index].is_before };
    items[index] = item;
    this.mediaQueue.set([...items]);
    this.toastr.info(
      `Imagen marcada como ${item.is_before ? '🔴 ANTES' : '🟢 DESPUÉS'}`,
      'Estado actualizado'
    );
  }
}
