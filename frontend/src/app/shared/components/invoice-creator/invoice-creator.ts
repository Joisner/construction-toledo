import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CompanyInfo, Invoice as LocalInvoice, InvoiceData } from '../../core/services/invoice';
import { Invoices } from '../../../../core/services/invoice';
import { CommonModule } from '@angular/common';

interface InvoiceItem {
  description: string;
  amount: number;
}

@Component({
  selector: 'app-invoice-creator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './invoice-creator.html',
  styleUrls: ['./invoice-creator.css'],
})

export class InvoiceEditor {
  // Invoice data
  invoiceNumber: string = '';
  invoiceDate: string = '';
  clientName: string = 'FRANCISCA RODRIGUEZ ORDOÑEZ';
  clientAddress: string = 'C/ PINTOR FRANCISCO RIBALTA Nº 724\n46702 GANDIA';
  clientDNI: string = '19 987 173 N';
  clientPhone: string = '';
  clientEmail: string = '';
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
  // backend id when editing existing invoice
  backendId: string | null = null;

  // Company info
  companyInfo: CompanyInfo;

  constructor(private invoiceService: LocalInvoice, private invoicesService: Invoices) {
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
        // abrir editor cuando recibimos una orden de edición/visualización
        this.isEditorOpen = true;
      }
    });
  }

  // Detectar si venimos con state de navegación (editar/ver)
  ngAfterViewInit(): void {
    try {
      const navState: any = (history && (history.state as any)) || null;
      const incoming = navState?.data || null;
      if (incoming && incoming.type === 'invoice') {
        // load after view init to ensure bindings present
        this.loadInvoiceData(incoming);
        this.isEditorOpen = true;
      }
    } catch (e) {
      // ignore
    }
  }

  // Crear factura en el backend
  createInvoice(): void {
    const payload = {
      number: this.invoiceNumber,
      date: this.invoiceDate,
      clientName: this.clientName,
      clientAddress: this.clientAddress,
      clientDNI: this.clientDNI,
      clientPhone: this.clientPhone || '',
      clientEmail: this.clientEmail || '',
      items: this.items.map(i => {
        const base = Number(i.amount) || 0;
        const totalWithTax = Math.round(base * (1 + (this.taxRate / 100)) * 100) / 100;
        return {
          description: i.description,
          quantity: 1,
          price: base,
          total: totalWithTax,
          amount: totalWithTax
        };
      }),
      taxRate: this.taxRate,
      iban: this.iban
    };

    // Save locally first
    this.invoiceService.saveData({
      type: 'invoice',
      number: this.invoiceNumber,
      date: this.invoiceDate,
      clientName: this.clientName,
      clientAddress: this.clientAddress,
      clientDNI: this.clientDNI,
      items: this.items,
      taxRate: this.taxRate,
      iban: this.iban
    });

    const existingBackendId = (this as any).backendId || null;
    if (existingBackendId) {
      // emulate update: create then delete old
      this.invoicesService.createInvoice(payload).subscribe({
        next: (res) => {
          this.invoicesService.deleteInvoice(existingBackendId!).subscribe({
            next: () => {
              alert('Factura actualizada correctamente (backend)');
              (this as any).backendId = null;
            },
            error: (delErr) => {
              console.warn('Factura creada pero no se pudo eliminar la original', delErr);
              alert('Factura guardada, pero no se pudo reemplazar la original en el servidor');
            }
          });
        },
        error: (err) => {
          console.error('Error updating invoice on backend', err);
          alert('Error al actualizar factura en el servidor');
        }
      });
    } else {
      this.invoicesService.createInvoice(payload).subscribe({
        next: () => {
          alert('Factura creada correctamente (backend)');
        },
        error: (err) => {
          console.error('Error creating invoice', err);
          alert('Error al crear factura en el servidor');
        }
      });
    }
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
    // store backend id if provided
    (this as any).backendId = (data as any).backendId || null;
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
