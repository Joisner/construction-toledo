import { Component, EventEmitter, Input, Output, signal, OnInit, SimpleChanges } from '@angular/core';
import { Media } from '../../../../core/models/project.model';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PendingMediaItem } from '../../../../core/models/media.model';
import { ToastrService } from '../../../../core/services/toastr';
@Component({
  selector: 'app-media-management',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './media-management.html',
  styleUrl: './media-management.css',
})
export class MediaManagement implements OnInit {
  @Input() isOpen = false;
  @Input() mediaList: Media[] = []; // Media ya guardada
  @Output() save = new EventEmitter<PendingMediaItem[]>(); // ✅ Cambio: emitir archivos pendientes
  @Output() close = new EventEmitter<void>();

  // Lista de archivos pendientes a subir
  pendingMediaList = signal<PendingMediaItem[]>([]);
  
  constructor(private toastr: ToastrService) { }
  
  newMediaItem = signal<{
    file: File | null;
    description: string;
    is_before: boolean;
    media_type: 'image' | 'video';
    preview_url: string;
    is_main?: boolean;
  }>({
    file: null,
    description: '',
    is_before: true,
    media_type: 'image',
    preview_url: ''
  });

  ngOnInit() {
    console.log('MediaManagement initialized');
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      // Limpiar cuando se abre el modal
      this.pendingMediaList.set([]);
      this.resetNewMediaItem();
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Crear URL temporal para preview
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.newMediaItem.set({
          file: file,
          description: this.newMediaItem().description,
          is_before: this.newMediaItem().is_before,
          media_type: file.type.startsWith('video/') ? 'video' : 'image',
          preview_url: e.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  }

  addMediaToList() {
    const current = this.newMediaItem();

    if (!current.file || !current.description.trim()) {
      this.toastr.warning('Por favor completa el archivo y descripción del media', 'Datos incompletos');
      return;
    }

    const pendingItem: PendingMediaItem = {
      file: current.file,
      description: current.description,
      is_before: current.is_before,
      media_type: current.media_type,
      preview_url: current.preview_url
      , is_main: current.is_main ?? false
    };

    // Si el nuevo item está marcado como principal, desmarcar cualquier otro pendiente
    if (pendingItem.is_main) {
      const updated = this.pendingMediaList().map(p => ({ ...p, is_main: false }));
      this.pendingMediaList.set([...updated, pendingItem]);
    } else {
      this.pendingMediaList.set([...this.pendingMediaList(), pendingItem]);
    }
    console.log('Media added to pending list. Count:', this.pendingMediaList().length);
    
    this.resetNewMediaItem();
    
    // Resetear el input file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  removeMediaFromList(index: number) {
    const updated = this.pendingMediaList().filter((_, i) => i !== index);
    this.pendingMediaList.set(updated);
    console.log('Media removed. Current count:', updated.length);
  }

  closeMediaModal() {
    console.log('Closing modal');
    this.pendingMediaList.set([]);
    this.resetNewMediaItem();
    this.close.emit();
  }

  saveMediaList() {
    const pending = this.pendingMediaList();
    console.log('=== SAVING MEDIA LIST ===');
    console.log('Total items to save:', pending.length);
    console.log('Items details:', pending.map(p => ({
      fileName: p.file.name,
      description: p.description,
      isBefore: p.is_before,
      type: p.media_type
    })));
    console.log('Emitting save event...');
    
    this.save.emit(pending); // ✅ Emitir archivos pendientes
    
    console.log('Save event emitted successfully');
    console.log('========================');
  }

  private resetNewMediaItem() {
    this.newMediaItem.set({
      file: null,
      description: '',
      is_before: true,
      media_type: 'image',
      preview_url: '',
      is_main: false
    });
  }

  // Permite marcar un item pendiente existente como principal (solo uno)
  setPendingMain(index: number) {
    const items = this.pendingMediaList();
    const updated = items.map((it, i) => ({ ...it, is_main: i === index }));
    this.pendingMediaList.set(updated);
  }

  // Helper para obtener el conteo total (media guardada + pendiente)
  getTotalMediaCount(): number {
    return this.mediaList.length + this.pendingMediaList().length;
  }
}