import { Component } from '@angular/core';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  templateUrl: './testimonials.html',
  styleUrls: ['./testimonials.css']
})
export class Testimonials {
  testimonials = [
    { name: 'Ana García', service: 'Alicatado', text: 'Excelente trabajo, puntualidad y muy buena atención.', rating: 5 },
    { name: 'Luis Martínez', service: 'Enpisado', text: 'Profesionales y trabajo limpio. Muy recomendable.', rating: 4 }
  ];
}
