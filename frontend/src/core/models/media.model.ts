export interface PendingMediaItem {
  file: File; // Archivo real
  description: string;
  is_before: boolean;
  media_type: 'image' | 'video';
  preview_url: string; // URL temporal para preview
  // Indica si este media será la imagen principal/thumbnail del proyecto
  is_main?: boolean;
}