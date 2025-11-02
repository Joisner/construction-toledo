import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './testimonials.html',
  styleUrls: ['./testimonials.css']
})
export class Testimonials {
  testimonials = [
    { name: 'Ana García', service: 'Alicatado', text: 'Excelente trabajo, puntualidad y muy buena atención.', rating: 5 },
    { name: 'Luis Martínez', service: 'Enpisado', text: 'Profesionales y trabajo limpio. Muy recomendable.', rating: 4 }
  ];
}
