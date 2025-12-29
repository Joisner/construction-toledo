import { Component, signal } from '@angular/core';
import { IQuote } from '../../../../core/models/quotes';
import { CommonModule } from '@angular/common';
import { QuoteModal } from '../quote-modal/quote-modal';
import { DeleteConfirmation } from '../../../shared/components/delete-confirmation/delete-confirmation';
import { Quotes } from '../../../../core/services/quotes';

@Component({
  selector: 'app-quotes-list',
  imports: [CommonModule, QuoteModal, DeleteConfirmation],
  templateUrl: './quotes-list.html',
  styleUrl: './quotes-list.css',
})
export class QuotesList {
  quotes = signal<IQuote[]>([]);

  currentFilter = signal<'all' | 'pending' | 'contacted' | 'accepted' | 'rejected'>('all');
  showModal = signal(false);
  showDeleteModal = signal(false);
  selectedQuote = signal<IQuote | null>(null);
  quoteToDelete = signal<IQuote | null>(null);

  filteredQuotes = signal<IQuote[]>([]);

  constructor(private quotesService: Quotes) {
    this.loadQuotes();
  }

  loadQuotes() {
    this.quotesService.getQuotes().subscribe({
      next: (res: IQuote[]) => {
        debugger;
        this.quotes.set(res || []);
        this.updateFilteredQuotes();
      },
      error: (err) => {
        console.error('Failed to load quotes', err);
      }
    });
  }

  setFilter(filter: 'all' | 'pending' | 'contacted' | 'accepted' | 'rejected') {
    this.currentFilter.set(filter);
    this.updateFilteredQuotes();
  }

  updateFilteredQuotes() {
    const filter = this.currentFilter();
    if (filter === 'all') {
      this.filteredQuotes.set(this.quotes());
    } else {
      this.filteredQuotes.set(this.quotes().filter(q => q.status === filter));
    }
  }

  getCountByStatus(status: string): number {
    return this.quotes().filter(q => q.status === status).length;
  }

  getStatusLabel(status: string): string {
    const labels = {
      pending: 'Pendiente',
      contacted: 'Contactado',
      accepted: 'Aceptado',
      rejected: 'Rechazado'
    };
    return labels[status as keyof typeof labels] || status;
  }

  updateStatus(quote: IQuote, status: IQuote['status']) {
    if (!quote.id) return;
    this.quotesService.updateQuote(quote.id, { status }).subscribe({
      next: (res: any) => {
        this.quotes.update(list =>
          list.map(q => q.id === quote.id
            ? { ...q, status, updated_at: new Date().toISOString() }
            : q
          )
        );
        this.updateFilteredQuotes();
      },
      error: (err) => console.error('Failed to update quote status', err)
    });
  }

  openViewModal(quote: IQuote) {
    this.selectedQuote.set({ ...quote });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedQuote.set(null);
  }

  openDeleteConfirm(quote: IQuote) {
    this.quoteToDelete.set(quote);
    this.showDeleteModal.set(true);
  }

  closeDeleteConfirm() {
    this.showDeleteModal.set(false);
    this.quoteToDelete.set(null);
  }

  deleteQuote() {
    const quote = this.quoteToDelete();
    if (quote?.id) {
      this.quotesService.deleteQuote(quote.id).subscribe({
        next: () => {
          this.quotes.update(list => list.filter(q => q.id !== quote.id));
          this.updateFilteredQuotes();
          this.closeDeleteConfirm();
        },
        error: (err) => {
          console.error('Failed to delete quote', err);
          this.closeDeleteConfirm();
        }
      });
    } else {
      this.closeDeleteConfirm();
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return 'Hace unos minutos';
    } else if (diffHours < 24) {
      return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
      return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
}