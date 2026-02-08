import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CompanyInfo, Invoice as LocalInvoice, InvoiceData } from '../../core/services/invoice';
import { Invoices } from '../../../../core/services/invoice';
import { ToastrService } from '../../../../core/services/toastr';
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
  clientName: string = '';
  clientAddress: string = '';
  clientDNI: string = '';
  clientPhone: string = '';
  clientEmail: string = '';
  taxRate: number = 21;
  iban: string = '';

  items: InvoiceItem[] = [
    {
      description: 'Descripción del servicio o producto',
      amount: 0
    }
  ];

  // UI state
  isEditorOpen: boolean = false;
  // backend id when editing existing invoice
  backendId: string | null = null;

  // Company info
  companyInfo: CompanyInfo;

  constructor(private invoiceService: LocalInvoice, private invoicesService: Invoices, private sanitizer: DomSanitizer, private toastr: ToastrService) {
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
              this.toastr.success('Factura actualizada correctamente', 'Éxito');
              (this as any).backendId = null;
            },
            error: (delErr) => {
              console.warn('Factura creada pero no se pudo eliminar la original', delErr);
              this.toastr.warning('Factura guardada, pero no se pudo reemplazar la original en el servidor', 'Advertencia');
            }
          });
        },
        error: (err) => {
          console.error('Error updating invoice on backend', err);
          this.toastr.error('Error al actualizar factura en el servidor', 'Error');
        }
      });
    } else {
      this.invoicesService.createInvoice(payload).subscribe({
        next: () => {
          this.toastr.success('Factura creada correctamente', 'Éxito');
        },
        error: (err) => {
          console.error('Error creating invoice', err);
          this.toastr.error('Error al crear factura en el servidor', 'Error');
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
      description: 'Descripción del concepto',
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

  formatText(text: string): SafeHtml {
    const sanitizedText = text ? text.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
    return this.sanitizer.bypassSecurityTrustHtml(sanitizedText.replace(/\n/g, '<br>'));
  }
}