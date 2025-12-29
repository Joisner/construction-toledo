import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IQuote } from '../../../../core/models/quotes';
import { Quotes } from '../../../../core/services/quotes';

@Component({
  selector: 'app-quote-modal',
  imports: [],
  templateUrl: './quote-modal.html',
  styleUrl: './quote-modal.css',
})
export class QuoteModal {
  @Input() isOpen = false;
  @Input() quote: IQuote | null = null;
  @Input() readOnly = false;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<IQuote>();

  constructor(private quotesService: Quotes) {}

  getStatusLabel(status: string): string {
    const labels = {
      pending: 'Pendiente',
      contacted: 'Contactado',
      accepted: 'Aceptado',
      rejected: 'Rechazado'
    };
    return labels[status as keyof typeof labels] || status;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Guarda los cambios hechos en la cotización (si el modal se extiende para editar)
  saveQuote() {
    if (!this.quote) return;

    if (this.quote.id) {
      this.quotesService.updateQuote(this.quote.id, this.quote).subscribe({
        next: (res) => this.saved.emit(res),
        error: (err) => console.error('Failed to update quote', err)
      });
    } else {
      this.quotesService.createQuote(this.quote).subscribe({
        next: (res) => this.saved.emit(res),
        error: (err) => console.error('Failed to create quote', err)
      });
    }
  }
}