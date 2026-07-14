import { Injectable } from '@angular/core';

export interface CaptureResult {
  dataUrl: string;
  width: number;
  height: number;
}

@Injectable({ providedIn: 'root' })
export class CameraService {

  private stream: MediaStream | null = null;

  async startCamera(videoEl: HTMLVideoElement): Promise<void> {
    this.stopCamera();
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
    });
    videoEl.srcObject = this.stream;
    await videoEl.play();
  }

  captureFrame(videoEl: HTMLVideoElement, quality = 0.88): CaptureResult {
    const w = videoEl.videoWidth  || 640;
    const h = videoEl.videoHeight || 480;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoEl, 0, 0);
    return { dataUrl: canvas.toDataURL('image/jpeg', quality), width: w, height: h };
  }

  stopCamera(): void {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
  }

  get isActive(): boolean {
    return this.stream !== null && this.stream.active;
  }
}
