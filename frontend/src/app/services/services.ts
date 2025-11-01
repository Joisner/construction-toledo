import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  image: string;
  details?: string;
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './services.html',
  styleUrls: ['./services.css']
})
export class Services {
  services: ServiceItem[] = [
    { id: 'enpisado', title: 'Enpisado', description: 'Instalación de suelos y acabados.', image: 'https://via.placeholder.com/400x250.png?text=Enpisado', details: 'Trabajamos con cerámica, madera y resinas.' },
    { id: 'enlucido', title: 'Enlucido', description: 'Reparación y enlucido de paredes.', image: 'https://via.placeholder.com/400x250.png?text=Enlucido', details: 'Acabados lisos, enfoscados, y tratamientos antihumedad.' },
    { id: 'alicatado', title: 'Alicatado', description: 'Alicatado de baños y cocinas.', image: 'https://via.placeholder.com/400x250.png?text=Alicatado', details: 'Colocación de azulejos y lechada profesional.' },
    { id: 'estructuras', title: 'Estructuras', description: 'Refuerzo y construcción de estructuras.', image: 'https://via.placeholder.com/400x250.png?text=Estructuras', details: 'Cimentaciones, muros y refuerzos estructurales.' },
    { id: 'tabiqueria', title: 'Tabiquería', description: 'Divisiones interiores y tabiquería seca.', image: 'https://via.placeholder.com/400x250.png?text=Tabiquería', details: 'Pladur, tabiquería metálica y aislantes.' },
    { id: 'revestimiento', title: 'Revestimiento', description: 'Revestimientos interiores y exteriores.', image: 'https://via.placeholder.com/400x250.png?text=Revestimiento', details: 'Revoques, monocapa y pintura especializada.' }
  ];

  selected = signal<ServiceItem | null>(null);

  showDetails(s: ServiceItem) {
    this.selected.set(s);
  }

  close() {
    this.selected.set(null);
  }
}
