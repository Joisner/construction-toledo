import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Project {
  id: number;
  title: string;
  description: string;
  service: string;
  before: string;
  after: string;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
})
export class Projects {
  projects: Project[] = [
    { id: 1, title: 'Reforma Cocina', description: 'Cambio completo de alicatado y suelos.', service: 'alicatado', before: 'https://via.placeholder.com/600x400.png?text=Before+1', after: 'https://via.placeholder.com/600x400.png?text=After+1' },
    { id: 2, title: 'Baño Moderno', description: 'Alicatado y mobiliario incorporado.', service: 'alicatado', before: 'https://via.placeholder.com/600x400.png?text=Before+2', after: 'https://via.placeholder.com/600x400.png?text=After+2' },
    { id: 3, title: 'Suelo Nuevo', description: 'Instalación de enpisado cerámico.', service: 'enpisado', before: 'https://via.placeholder.com/600x400.png?text=Before+3', after: 'https://via.placeholder.com/600x400.png?text=After+3' }
  ];

  filter = signal<string>('all');

  filtered() {
    const f = this.filter();
    if (f === 'all') return this.projects;
    return this.projects.filter(p => p.service === f);
  }
}
