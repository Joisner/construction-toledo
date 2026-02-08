import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Invoice, InvoiceData } from '../../core/services/invoice';
import { Budgets } from '../../../../core/services/budget';
import { Invoices } from '../../../../core/services/invoice';
import { ToastrService } from '../../../../core/services/toastr';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-documents-list',
  standalone: true,
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
    private budgetsService: Budgets,
    private invoicesService: Invoices,
    private router: Router,
    private toastr: ToastrService
  ) {}

  // Raw backend arrays (to keep backend ids for deletes)
  allBudgetsRaw: any[] = [];
  allInvoicesRaw: any[] = [];

  ngOnInit(): void {
    this.loadDocuments();
    this.calculateStats();
    this.extractYears();
  }

  loadDocuments(): void {
    // Load from backend (budgets + invoices)
    forkJoin({
      budgets: this.budgetsService.getBudgets(),
      invoices: this.invoicesService.getInvoices()
    }).subscribe({
      next: ({ budgets, invoices }) => {
        // Keep raw arrays for id-based operations
        this.allBudgetsRaw = budgets as any[];
        this.allInvoicesRaw = invoices as any[];

        // Map backend models to local InvoiceData shape
        this.allBudgets = (budgets as any[]).map(b => ({
          type: 'budget',
          number: b.number,
          date: b.date,
          clientName: b.clientName,
          clientAddress: b.clientAddress,
          clientDNI: b.clientDNI || '',
          clientPhone: b.clientPhone,
          clientEmail: b.clientEmail,
          items: (b.items || []).map((it: any) => {
            const qty = it.quantity || 1;
            const taxFactor = 1 + ((b.taxRate || 0) / 100);
            // Determine base price: prefer explicit price, otherwise derive from total or amount
            let basePrice = 0;
            if (it.price !== undefined) basePrice = Number(it.price);
            else if (it.total !== undefined) basePrice = Math.round((Number(it.total) / taxFactor) * 100) / 100;
            else if (it.amount !== undefined) basePrice = Math.round((Number(it.amount) / taxFactor) * 100) / 100;
            const amountForUI = basePrice;
            return { description: it.description, amount: amountForUI };
          }),
          taxRate: b.taxRate,
          validUntil: b.validUntil,
          conditions: b.conditions,
          iban: b.iban
        }));

        this.allInvoices = (invoices as any[]).map(i => ({
          type: 'invoice',
          number: i.number,
          date: i.date,
          clientName: i.clientName,
          clientAddress: i.clientAddress,
          clientDNI: i.clientDNI || '',
          clientPhone: i.clientPhone,
          clientEmail: i.clientEmail,
          items: (i.items || []).map((it: any) => {
            const qty = it.quantity || 1;
            const taxFactor = 1 + ((i.taxRate || 0) / 100);
            let basePrice = 0;
            if (it.price !== undefined) basePrice = Number(it.price);
            else if (it.total !== undefined) basePrice = Math.round((Number(it.total) / taxFactor) * 100) / 100;
            else if (it.amount !== undefined) basePrice = Math.round((Number(it.amount) / taxFactor) * 100) / 100;
            return { description: it.description, amount: basePrice };
          }),
          taxRate: i.taxRate,
          iban: i.iban
        }));

        this.applyFilters();
        this.calculateStats();
        this.extractYears();
      },
      error: (err) => {
        console.error('Error loading documents from backend', err);
        this.toastr.warning('Error al cargar documentos del servidor, usando almacenamiento local', 'Advertencia');
        // Fallback to local storage implementation
        this.allBudgets = this.invoiceService.getAllBudgets();
        this.allInvoices = this.invoiceService.getAllInvoices();
        this.applyFilters();
        this.calculateStats();
        this.extractYears();
      }
    });
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
        // Guardar en el servicio compartido para que el editor integrado pueda leer los datos
        // Añadir backend id cuando esté disponible (para permitir actualizaciones)
        const payload = { ...doc } as any;
        if (doc.type === 'budget') {
          const raw = this.allBudgetsRaw.find(b => b.number === doc.number);
          if (raw && raw.id) payload.backendId = raw.id;
        } else {
          const raw = this.allInvoicesRaw.find(i => i.number === doc.number);
          if (raw && raw.id) payload.backendId = raw.id;
        }

        this.invoiceService.saveData(payload);

        // Si estamos embebidos dentro del admin dashboard, abrir inline en lugar de navegar
        const isEmbedded = !!document.querySelector('app-admin-dashboard');
        try {
          window.dispatchEvent(new CustomEvent('open-document', { detail: { type: payload.type, number: payload.number } }));
        } catch (e) {
          // ignore
        }

        if (!isEmbedded) {
          // fallback: navegar para flujos independientes
          if (doc.type === 'budget') {
            this.router.navigate(['/budget'], { state: { data: payload } });
          } else {
            this.router.navigate(['/invoice'], { state: { data: payload } });
          }
        }
  }

  editDocument(doc: InvoiceData): void {
    // Save into shared service so editor components can pick it up
        // Prefer the same flow as viewDocument but keep a semantic edit action
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
      // Try to delete from backend when possible
      const doc = this.documentToDelete;
      if (doc.type === 'budget') {
        const raw = this.allBudgetsRaw.find(b => b.number === doc.number);
        if (raw && raw.id) {
          this.budgetsService.deleteBudget(raw.id).subscribe({
            next: () => {
              this.showDeleteConfirm = false;
              this.documentToDelete = null;
              this.loadDocuments();
            },
            error: (err) => {
              console.error('Error deleting budget on backend', err);
              this.toastr.error('Error al eliminar presupuesto en el servidor', 'Error');
            }
          });
        } else {
          // Fallback to local
          this.invoiceService.deleteData('budget', doc.number);
          this.showDeleteConfirm = false;
          this.documentToDelete = null;
          this.loadDocuments();
          this.calculateStats();
        }
      } else {
        const raw = this.allInvoicesRaw.find(i => i.number === doc.number);
        if (raw && raw.id) {
          this.invoicesService.deleteInvoice(raw.id).subscribe({
            next: () => {
              this.showDeleteConfirm = false;
              this.documentToDelete = null;
              this.loadDocuments();
            },
            error: (err) => {
              console.error('Error deleting invoice on backend', err);
              this.toastr.error('Error al eliminar factura en el servidor', 'Error');
            }
          });
        } else {
          this.invoiceService.deleteData('invoice', doc.number);
          this.showDeleteConfirm = false;
          this.documentToDelete = null;
          this.loadDocuments();
          this.calculateStats();
        }
      }
    }
  }

  convertBudgetToInvoice(budget: InvoiceData): void {
    // Create invoice in backend from budget
    // Find backend budget raw (to get items with price/quantity)
    const raw = this.allBudgetsRaw.find(b => b.number === budget.number);
    const invoicePayload: any = {
      number: '',
      date: new Date().toISOString().split('T')[0],
      clientName: budget.clientName,
      clientAddress: budget.clientAddress,
      clientDNI: budget.clientDNI || '',
      clientPhone: budget.clientPhone,
      clientEmail: budget.clientEmail,
      items: raw ? (raw.items || []).map((it: any) => {
        const qty = it.quantity || 1;
        const price = Number(it.price) || 0;
        const total = (it.total !== undefined) ? Number(it.total) : Math.round(price * qty * (1 + (budget.taxRate / 100)) * 100) / 100;
        const amount = (it.amount !== undefined) ? Number(it.amount) : total;
        return { description: it.description, quantity: qty, price, total, amount };
      }) : (budget.items || []).map(it => {
        const base = Number(it.amount) || 0;
        const totalWithTax = Math.round(base * (1 + (budget.taxRate / 100)) * 100) / 100;
        return { description: it.description, quantity: 1, price: base, total: totalWithTax, amount: totalWithTax };
      }),
      taxRate: budget.taxRate,
      iban: budget.iban || ''
    };

    this.invoicesService.createInvoice(invoicePayload).subscribe({
      next: (created) => {
        // Optionally delete the budget on backend
        if (raw && raw.id) {
          this.budgetsService.deleteBudget(raw.id).subscribe({
            next: () => {
              this.toastr.success(`Presupuesto convertido a Factura Nº ${created.number}`, 'Conversión exitosa');
              this.loadDocuments();
              this.calculateStats();
              this.router.navigate(['/invoice'], { state: { data: created } });
            },
            error: (err) => {
              console.error('Error deleting original budget after conversion', err);
              this.toastr.warning('Factura creada, pero no se pudo eliminar el presupuesto original', 'Advertencia');
              this.loadDocuments();
            }
          });
        } else {
          // Fallback: use local conversion
          const invoice = this.invoiceService.convertBudgetToInvoice(budget);
          this.toastr.success(`Presupuesto convertido a Factura Nº ${invoice.number}`, 'Conversión exitosa');
          this.loadDocuments();
          this.calculateStats();
          this.router.navigate(['/invoice'], { state: { data: invoice } });
        }
      },
      error: (err) => {
        console.error('Error converting budget to invoice', err);
        this.toastr.error('Error al convertir presupuesto en el servidor', 'Error');
      }
    });
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
          this.toastr.success('Datos importados correctamente', '\u00c9xito');
          this.loadDocuments();
          this.calculateStats();
          this.extractYears();
        } else {
          this.toastr.error('Error al importar datos', 'Error');
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
      this.toastr.success('Todos los datos han sido eliminados', '\u00c9xito');
    }
  }
}