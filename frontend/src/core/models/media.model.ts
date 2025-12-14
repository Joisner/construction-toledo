export interface PendingMediaItem {
  file: File; // Archivo real
  description: string;
  is_before: boolean;
  media_type: 'image' | 'video';
  preview_url: string; // URL temporal para preview
}