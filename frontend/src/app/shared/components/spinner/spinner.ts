import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { LoaderService } from '../../../../core/services/loader';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [AsyncPipe],
  styleUrl: './spinner.css',
  template: `
    @if (loader.loading$ | async) {
      <div class="spinner-overlay">
        <div class="spinner-ring"></div>
        <span class="spinner-label">Cargando...</span>
      </div>
    }
  `,
})
export class Spinner {
  constructor(public loader: LoaderService) {}
}
