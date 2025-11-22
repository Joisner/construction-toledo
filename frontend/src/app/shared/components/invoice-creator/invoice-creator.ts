import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CompanyInfo, Invoice, InvoiceData } from '../../core/services/invoice';
import { CommonModule } from '@angular/common';

interface InvoiceItem {
  description: string;
  amount: number;
}

@Component({
  selector: 'app-invoice-creator',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './invoice-creator.html',
  styleUrl: './invoice-creator.css',
})

export class InvoiceEditor {
  // Invoice data
  invoiceNumber: string = '';
  invoiceDate: string = '';
  clientName: string = 'FRANCISCA RODRIGUEZ ORDOÑEZ';
  clientAddress: string = 'C/ PINTOR FRANCISCO RIBALTA Nº 724\n46702 GANDIA';
  clientDNI: string = '19 987 173 N';
  taxRate: number = 21;
  iban: string = 'ES44 0049 2685 7420 1400 8200';

  items: InvoiceItem[] = [
    {
      description: 'Quitar gotele y lucidos de paredes, techo, pasillos, salon y cuartos\nInstalación pladur techo salón y cuartos',
      amount: 9800
    }
  ];

  // UI state
  isEditorOpen: boolean = false;

  // Company info
  companyInfo: CompanyInfo;

  constructor(private invoiceService: Invoice) {
    this.companyInfo = this.invoiceService.getCompanyInfo();
  }

  ngOnInit(): void {
    // Generar número de factura automático
    this.invoiceNumber = this.invoiceService.getNextInvoiceNumber();

    // Establecer fecha de hoy
    this.invoiceDate = new Date().toISOString().split('T')[0];

    // Suscribirse a datos de presupuesto convertido
    this.invoiceService.invoiceData$.subscribe((data: any) => {
      if (data && data.type === 'invoice') {
        this.loadInvoiceData(data);
      }
    });
  }

  // Cargar datos desde un presupuesto convertido
  loadInvoiceData(data: InvoiceData): void {
    this.invoiceNumber = data.number;
    this.invoiceDate = data.date;
    this.clientName = data.clientName;
    this.clientAddress = data.clientAddress;
    this.clientDNI = data.clientDNI || '';
    this.items = [...data.items];
    this.taxRate = data.taxRate;
    this.iban = data.iban || this.iban;
  }

  toggleEditor(): void {
    this.isEditorOpen = !this.isEditorOpen;
  }

  addItem(): void {
    this.items.push({
      description: 'Nuevo concepto',
      amount: 0
    });
  }

  removeItem(index: number): void {
    this.items.splice(index, 1);
  }

  getSubtotal(): number {
    return this.items.reduce((sum, item) => sum + item.amount, 0);
  }

  getTax(): number {
    return this.getSubtotal() * (this.taxRate / 100);
  }

  getTotal(): number {
    return this.getSubtotal() + this.getTax();
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

  print(): void {
    window.print();
  }

  downloadPDF(): void {
    const originalTitle = document.title;
    document.title = `Factura_${this.invoiceNumber}_${this.clientName.replace(/\s+/g, '_')}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  }

  formatText(text: string): string {
    return text ? text.replace(/\n/g, '<br>') : '';
  }
}
