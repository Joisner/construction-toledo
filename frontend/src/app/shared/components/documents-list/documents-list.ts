import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Invoice, InvoiceData } from '../../core/services/invoice';
import { Router } from '@angular/router';

@Component({
  selector: 'app-documents-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './documents-list.html',
  styleUrl: './documents-list.css',
})
export class DocumentsList {
   // Pestañas
  activeTab: 'budgets' | 'invoices' | 'all' = 'all';

  // Listas
  allBudgets: InvoiceData[] = [];
  allInvoices: InvoiceData[] = [];
  filteredDocuments: InvoiceData[] = [];

  // Búsqueda y filtros
  searchTerm: string = '';
  filterYear: string = 'all';
  filterStatus: string = 'all'; // all, valid, expired (para presupuestos)
  sortBy: 'date' | 'number' | 'client' | 'amount' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';

  // UI
  showDeleteConfirm: boolean = false;
  documentToDelete: InvoiceData | null = null;
  showExportMenu: boolean = false;

  // Años disponibles
  availableYears: string[] = [];

  // Estadísticas
  stats = {
    totalBudgets: 0,
    totalInvoices: 0,
    totalBudgetsAmount: 0,
    totalInvoicesAmount: 0,
    validBudgets: 0,
    expiredBudgets: 0
  };

  constructor(
    private invoiceService: Invoice,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
    this.calculateStats();
    this.extractYears();
  }

  loadDocuments(): void {
    this.allBudgets = this.invoiceService.getAllBudgets();
    this.allInvoices = this.invoiceService.getAllInvoices();
    this.applyFilters();
  }

  applyFilters(): void {
    let documents: InvoiceData[] = [];

    // Filtrar por pestaña
    if (this.activeTab === 'budgets') {
      documents = [...this.allBudgets];
    } else if (this.activeTab === 'invoices') {
      documents = [...this.allInvoices];
    } else {
      documents = [...this.allBudgets, ...this.allInvoices];
    }

    // Filtrar por búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      documents = documents.filter(doc =>
        doc.clientName.toLowerCase().includes(term) ||
        doc.number.toLowerCase().includes(term) ||
        doc.items.some(item => item.description.toLowerCase().includes(term))
      );
    }

    // Filtrar por año
    if (this.filterYear !== 'all') {
      documents = documents.filter(doc => doc.date.startsWith(this.filterYear));
    }

    // Filtrar por estado (solo presupuestos)
    if (this.filterStatus !== 'all' && this.activeTab === 'budgets') {
      documents = documents.filter(doc => {
        if (doc.type === 'budget' && doc.validUntil) {
          const isValid = new Date(doc.validUntil) >= new Date();
          return this.filterStatus === 'valid' ? isValid : !isValid;
        }
        return true;
      });
    }

    // Ordenar
    documents.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'date':
          comparison = a.date.localeCompare(b.date);
          break;
        case 'number':
          comparison = a.number.localeCompare(b.number);
          break;
        case 'client':
          comparison = a.clientName.localeCompare(b.clientName);
          break;
        case 'amount':
          const totalA = this.calculateTotal(a);
          const totalB = this.calculateTotal(b);
          comparison = totalA - totalB;
          break;
      }

      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    this.filteredDocuments = documents;
  }

  changeTab(tab: 'budgets' | 'invoices' | 'all'): void {
    this.activeTab = tab;
    this.applyFilters();
  }

  calculateTotal(doc: InvoiceData): number {
    const subtotal = doc.items.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * (doc.taxRate / 100);
    return subtotal + tax;
  }

  calculateStats(): void {
    this.stats.totalBudgets = this.allBudgets.length;
    this.stats.totalInvoices = this.allInvoices.length;
    
    this.stats.totalBudgetsAmount = this.allBudgets.reduce(
      (sum, budget) => sum + this.calculateTotal(budget), 0
    );
    
    this.stats.totalInvoicesAmount = this.allInvoices.reduce(
      (sum, invoice) => sum + this.calculateTotal(invoice), 0
    );

    this.stats.validBudgets = this.allBudgets.filter(b => 
      b.validUntil && new Date(b.validUntil) >= new Date()
    ).length;

    this.stats.expiredBudgets = this.allBudgets.filter(b =>
      b.validUntil && new Date(b.validUntil) < new Date()
    ).length;
  }

  extractYears(): void {
    const years = new Set<string>();
    [...this.allBudgets, ...this.allInvoices].forEach(doc => {
      years.add(doc.date.substring(0, 4));
    });
    this.availableYears = Array.from(years).sort().reverse();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' €';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  }

  isExpired(doc: InvoiceData): boolean {
    if (doc.type === 'budget' && doc.validUntil) {
      return new Date(doc.validUntil) < new Date();
    }
    return false;
  }

  getDaysRemaining(doc: InvoiceData): number {
    if (doc.type === 'budget' && doc.validUntil) {
      const today = new Date();
      const validDate = new Date(doc.validUntil);
      const diffTime = validDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return 0;
  }

  // Acciones
  createNewBudget(): void {
    this.router.navigate(['/budget']);
  }

  createNewInvoice(): void {
    this.router.navigate(['/invoice']);
  }

  viewDocument(doc: InvoiceData): void {
    // Navegar al componente correspondiente con los datos cargados
    if (doc.type === 'budget') {
      this.router.navigate(['/budget'], { state: { data: doc } });
    } else {
      this.router.navigate(['/invoice'], { state: { data: doc } });
    }
  }

  editDocument(doc: InvoiceData): void {
    this.invoiceService.saveData(doc);
    this.viewDocument(doc);
  }

  confirmDelete(doc: InvoiceData): void {
    this.documentToDelete = doc;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.documentToDelete = null;
  }

  deleteDocument(): void {
    if (this.documentToDelete) {
      this.invoiceService.deleteData(
        this.documentToDelete.type,
        this.documentToDelete.number
      );
      this.showDeleteConfirm = false;
      this.documentToDelete = null;
      this.loadDocuments();
      this.calculateStats();
    }
  }

  convertBudgetToInvoice(budget: InvoiceData): void {
    const invoice = this.invoiceService.convertBudgetToInvoice(budget);
    alert(`Presupuesto convertido a Factura Nº ${invoice.number}`);
    this.loadDocuments();
    this.calculateStats();
    this.router.navigate(['/invoice'], { state: { data: invoice } });
  }

  // Exportar
  exportToJSON(): void {
    const jsonData = this.invoiceService.exportAllData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `construcciones_toledo_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.showExportMenu = false;
  }

  exportCurrentView(): void {
    const data = {
      documents: this.filteredDocuments,
      filters: {
        tab: this.activeTab,
        search: this.searchTerm,
        year: this.filterYear,
        status: this.filterStatus
      },
      exportDate: new Date().toISOString()
    };
    
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vista_actual_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.showExportMenu = false;
  }

  // Exportar a Excel
  exportToExcel(): void {
    // Preparar datos para Excel
    const excelData = this.filteredDocuments.map(doc => {
      const subtotal = doc.items.reduce((sum, item) => sum + item.amount, 0);
      const iva = subtotal * (doc.taxRate / 100);
      const total = subtotal + iva;

      return {
        'Tipo': doc.type === 'budget' ? 'Presupuesto' : 'Factura',
        'Número': doc.number,
        'Fecha': this.formatDate(doc.date),
        'Cliente': doc.clientName,
        'Dirección': doc.clientAddress.replace(/\n/g, ', '),
        'Teléfono': doc.clientPhone || '',
        'Email': doc.clientEmail || '',
        'DNI/NIF': doc.clientDNI || '',
        'Conceptos': doc.items.length,
        'Subtotal': subtotal.toFixed(2),
        'IVA %': doc.taxRate,
        'IVA €': iva.toFixed(2),
        'Total': total.toFixed(2),
        'Estado': doc.type === 'budget' ? (this.isExpired(doc) ? 'Caducado' : `Vigente (${this.getDaysRemaining(doc)} días)`) : 'Emitida',
        'Válido hasta': doc.validUntil ? this.formatDate(doc.validUntil) : '',
        'IBAN': doc.iban || ''
      };
    });

    // Crear CSV
    const headers = Object.keys(excelData[0] || {});
    const csvContent = [
      headers.join(','),
      ...excelData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escapar comillas y comas
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    // Añadir BOM para que Excel reconozca UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `construcciones_toledo_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.showExportMenu = false;
  }

  // Importar
  importData(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const success = this.invoiceService.importData(e.target.result);
        if (success) {
          alert('Datos importados correctamente');
          this.loadDocuments();
          this.calculateStats();
          this.extractYears();
        } else {
          alert('Error al importar datos');
        }
      };
      reader.readAsText(file);
    }
  }

  clearAllData(): void {
    if (confirm('¿Estás seguro de que quieres eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
      this.invoiceService.clearAllData();
      this.loadDocuments();
      this.calculateStats();
      alert('Todos los datos han sido eliminados');
    }
  }
}