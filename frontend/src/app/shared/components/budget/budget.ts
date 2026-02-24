import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CompanyInfo, Invoice, InvoiceData, InvoiceItem } from '../../core/services/invoice';
import { Budgets } from '../../../../core/services/budget';
import { Invoices } from '../../../../core/services/invoice';
import { ToastrService } from '../../../../core/services/toastr';
import { IBudget } from '../../../../core/models/budget.model';
import { Router } from '@angular/router';

interface BudgetItem {
  description: string;
  amount: number;
}
@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './budget.html',
  styleUrls: ['./budget.css'],
})
export class Budget {
  // Budget data
  budgetNumber: string = '';
  budgetDate: string = '';
  validUntil: string = '';
  clientName: string = '';
  clientAddress: string = '';
  clientDNI: string = '';
  clientPhone: string = '';
  clientEmail: string = '';
  taxRate: number = 21;

  items: InvoiceItem[] = [
    {
      description: 'Concepto de trabajo a realizar',
      amount: 0
    }
  ];

  // UI state
  isEditorOpen: boolean = false;
  // backend id when editing existing budget
  backendId: string | null = null;
  showConvertDialog: boolean = false;

  // Validation errors
  validationErrors: { [key: string]: string } = {};

  // Company info
  companyInfo: CompanyInfo;

  // Condiciones del presupuesto
  conditions: string = `• Presupuesto válido por 30 días desde la fecha de emisión
• Los precios incluyen materiales y mano de obra
• No incluye permisos ni licencias municipales
• El pago se realizará: 40% al inicio, 30% a mitad de obra, 30% al finalizar
• Cualquier modificación sobre este presupuesto se cotizará aparte
• Los plazos de ejecución se confirmarán al aceptar el presupuesto`;

  constructor(
    private invoiceService: Invoice,
    private budgetsService: Budgets,
    private invoicesService: Invoices,
    private router: Router,
    private sanitizer: DomSanitizer,
    private toastr: ToastrService
  ) {
    this.companyInfo = this.invoiceService.getCompanyInfo();
  }

  ngOnInit(): void {
    // Generar número de presupuesto automático
    this.budgetNumber = this.invoiceService.getNextBudgetNumber();

    // Establecer fecha de hoy
    this.budgetDate = new Date().toISOString().split('T')[0];

    // Establecer validez a 30 días
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + 30);
    this.validUntil = validDate.toISOString().split('T')[0];

    // Si venimos con datos desde la navegación (editar / ver) — cargar
    try {
      const navState: any = (this.router.getCurrentNavigation && this.router.getCurrentNavigation()?.extras?.state) || (window.history && (window.history.state as any));
      const incoming = navState?.data || null;
      if (incoming && incoming.type === 'budget') {
        this.loadBudgetData(incoming);
      }
    } catch (e) {
      // ignore
    }

    // Suscribirse al servicio para recibir datos cuando otra vista solicita editar/mostrar
    this.invoiceService.invoiceData$.subscribe((data) => {
      if (data && data.type === 'budget') {
        this.loadBudgetData(data);
      }
    });
  }

  // Cargar datos en el editor desde un InvoiceData
  loadBudgetData(data: InvoiceData): void {
    this.budgetNumber = data.number || this.budgetNumber;
    this.budgetDate = data.date || this.budgetDate;
    this.validUntil = data.validUntil || this.validUntil;
    this.clientName = data.clientName || this.clientName;
    this.clientAddress = data.clientAddress || this.clientAddress;
    this.clientDNI = data.clientDNI || this.clientDNI || '';
    this.clientPhone = data.clientPhone || this.clientPhone || '';
    this.clientEmail = data.clientEmail || this.clientEmail || '';
    this.taxRate = (data.taxRate !== undefined) ? data.taxRate : this.taxRate;
    this.conditions = data.conditions || this.conditions;
    this.items = Array.isArray(data.items) ? [...data.items] : this.items;
    if (data.iban) (this.companyInfo as any).iban = data.iban;
    // Abrir editor para editar/visualizar
    this.isEditorOpen = true;
    // keep backend id if provided so saveBudget can update instead of create
    (this as any).backendId = (data as any).backendId || null;
  }

  toggleEditor(): void {
    this.isEditorOpen = !this.isEditorOpen;
  }

  hasValidationErrors(): boolean {
    return Object.keys(this.validationErrors).length > 0;
  }

  addItem(): void {
    this.items.push({
      description: 'Nuevo concepto',
      amount: 0
    });
    this.validateBudget();
  }

  removeItem(index: number): void {
    this.items.splice(index, 1);
    this.validateBudget();
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

  formatText(text: string): SafeHtml {
    const sanitizedText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return this.sanitizer.bypassSecurityTrustHtml(sanitizedText.replace(/\n/g, '<br>'));
  }
 print(): void {
    // Buscar el contenido a imprimir por ID
    const printContent = document.getElementById("budget-content")
    if (!printContent) {
      console.error("No se encontró el contenido a imprimir")
      // Fallback al método tradicional
      window.scrollTo(0, 0)
      setTimeout(() => window.print(), 100)
      return
    }

    // Crear un iframe oculto para la impresión
    const iframe = document.createElement("iframe")
    iframe.style.position = "fixed"
    iframe.style.right = "0"
    iframe.style.bottom = "0"
    iframe.style.width = "0"
    iframe.style.height = "0"
    iframe.style.border = "none"
    document.body.appendChild(iframe)

    // Obtener el documento del iframe
    const iframeDoc = iframe.contentWindow?.document
    if (!iframeDoc) {
      console.error("No se pudo acceder al documento del iframe")
      document.body.removeChild(iframe)
      window.print()
      return
    }

    // Copiar los estilos
    const styles = Array.from(document.styleSheets)
      .map((styleSheet) => {
        try {
          return Array.from(styleSheet.cssRules)
            .map((rule) => rule.cssText)
            .join("\n")
        } catch (e) {
          return ""
        }
      })
      .join("\n")

    // Escribir el contenido en el iframe con estilos inline críticos
    iframeDoc.open()
    iframeDoc.write(`
      <!DOCTYPE html>
      <html style="width: 100%; max-width: 100%; margin: 0; padding: 0; box-sizing: border-box;">
        <head>
          <meta charset="UTF-8">
          <style>${styles}</style>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @media print {
              html, body {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
              }
              .print-optimized {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
              }
              .max-w-4xl, .max-w-5xl, .max-w-6xl, .max-w-7xl {
                max-width: 100% !important;
              }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; width: 100%; max-width: 100%; box-sizing: border-box;">
          ${printContent.outerHTML}
        </body>
      </html>
    `)
    iframeDoc.close()

    // Esperar a que cargue y luego imprimir
    iframe.contentWindow?.focus()
    setTimeout(() => {
      try {
        iframe.contentWindow?.print()
      } catch (error) {
        console.error("Error al imprimir:", error)
        // Si falla el iframe, intentar con el método tradicional
        window.print()
      }

      // Limpiar después de imprimir
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 1000)
    }, 500)
  }


  downloadPDF(): void {
    const originalTitle = document.title;
    document.title = `Presupuesto_${this.budgetNumber}_${this.clientName.replace(/\s+/g, '_')}`;

    // Usar el mismo método de impresión
    this.print();

    setTimeout(() => {
      document.title = originalTitle;
    }, 2000);
  }

  // Calcular días de validez restantes
  getDaysRemaining(): number {
    const today = new Date();
    const validDate = new Date(this.validUntil);
    const diffTime = validDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  validateBudget(): boolean {
    this.validationErrors = {};

    if (!this.budgetNumber || this.budgetNumber.trim() === '') {
      this.validationErrors['budgetNumber'] = 'El número de presupuesto es obligatorio';
    }

    if (!this.budgetDate) {
      this.validationErrors['budgetDate'] = 'La fecha de emisión es obligatoria';
    }

    if (!this.clientName || this.clientName.trim() === '') {
      this.validationErrors['clientName'] = 'El nombre del cliente es obligatorio';
    }

    if (!this.clientAddress || this.clientAddress.trim() === '') {
      this.validationErrors['clientAddress'] = 'La dirección del cliente es obligatoria';
    }

    if (!this.clientDNI || this.clientDNI.trim() === '') {
      this.validationErrors['clientDNI'] = 'El DNI/NIF del cliente es obligatorio';
    }

    if (this.items.length === 0) {
      this.validationErrors['items'] = 'Debe haber al menos un trabajo en el presupuesto';
    }

    this.items.forEach((item, index) => {
      if (!item.description || item.description.trim() === '') {
        this.validationErrors['items'] = `El trabajo ${index + 1} debe tener descripción`;
      }
      if (item.amount <= 0) {
        this.validationErrors['items'] = `El trabajo ${index + 1} debe tener un importe mayor a 0`;
      }
    });

    if (this.taxRate < 0 || this.taxRate > 100) {
      this.validationErrors['taxRate'] = 'El IVA debe estar entre 0 y 100';
    }

    return Object.keys(this.validationErrors).length === 0;
  }

  // Guardar presupuesto
  saveBudget(): void {
    if (!this.validateBudget()) {
      this.toastr.error('Por favor, corrige los errores en el formulario', 'Validación');
      return;
    }
    const budgetData: InvoiceData = {
      type: 'budget',
      number: this.budgetNumber,
      date: this.budgetDate,
      clientName: this.clientName,
      clientAddress: this.clientAddress,
      clientPhone: this.clientPhone,
      clientEmail: this.clientEmail,
      items: this.items,
      taxRate: this.taxRate,
      validUntil: this.validUntil,
      conditions: this.conditions
    };

    // Save locally (keeps existing behaviour)
    this.invoiceService.saveData(budgetData);

    // Prepare payload for backend (map InvoiceItem -> IItem)
    const payload: Partial<IBudget> = {
      number: this.budgetNumber,
      date: this.budgetDate,
      clientName: this.clientName,
      clientAddress: this.clientAddress,
      clientDNI: this.clientDNI || '',
      clientPhone: this.clientPhone,
      clientEmail: this.clientEmail,
      items: this.items.map(it => {
        const base = Number(it.amount) || 0;
        const totalWithTax = Math.round(base * (1 + (this.taxRate / 100)) * 100) / 100;
        return {
          description: it.description,
          quantity: 1,
          price: base,
          total: totalWithTax,
          amount: totalWithTax // campo obligatorio para el backend (importe con IVA)
        };
      }),
      taxRate: this.taxRate,
      validUntil: this.validUntil,
      conditions: this.conditions,
      iban: 'ES44 0049 2685 7420 1400 8200'
    };

    // If editing an existing backend budget, attempt create+delete to emulate update
    const existingBackendId = (this as any).backendId || null;
    if (existingBackendId) {
      this.budgetsService.createBudget(payload).subscribe({
        next: () => {
          // Try to delete the old record to avoid duplicates
          this.budgetsService.deleteBudget(existingBackendId!).subscribe({
            next: () => {
              this.toastr.success('Presupuesto actualizado correctamente', 'Éxito');
              // clear backendId to prevent accidental re-update
              (this as any).backendId = null;
            },
            error: (delErr) => {
              console.warn('Presupuesto creado pero no se pudo eliminar el original', delErr);
              this.toastr.warning('Presupuesto guardado, pero no se pudo reemplazar el original en el servidor', 'Advertencia');
            }
          });
        },
        error: (err) => {
          console.error('Error updating budget on backend', err);
          this.toastr.error('Error al actualizar presupuesto en el servidor', 'Error');
        }
      });
    } else {
      this.budgetsService.createBudget(payload).subscribe({
        next: () => {
          this.toastr.success('Presupuesto guardado correctamente', 'Éxito');
        },
        error: (err) => {
          console.error('Error saving budget to backend', err);
          this.toastr.error('Error al guardar presupuesto en el servidor', 'Error');
        }
      });
    }
  }

  // Mostrar diálogo de confirmación para convertir
  confirmConvertToInvoice(): void {
    this.showConvertDialog = true;
  }

  // Cancelar conversión
  cancelConvert(): void {
    this.showConvertDialog = false;
  }

  // Convertir presupuesto a factura
  convertToInvoice(): void {
    // Primero guardar el presupuesto actual
    this.saveBudget();

    // Crear datos del presupuesto
    const budgetData: InvoiceData = {
      type: 'budget',
      number: this.budgetNumber,
      date: this.budgetDate,
      clientName: this.clientName,
      clientAddress: this.clientAddress,
      clientDNI: this.clientDNI, // Pasar el DNI del cliente
      clientPhone: this.clientPhone,
      clientEmail: this.clientEmail,
      items: this.items,
      taxRate: this.taxRate,
      validUntil: this.validUntil,
      conditions: this.conditions,
      iban: 'ES44 0049 2685 7420 1400 8200'
    };

    // Convertir a factura usando el servicio
    const invoiceData = this.invoiceService.convertBudgetToInvoice(budgetData);

    // Pasar datos a la factura y navegar
    this.invoiceService.saveData(invoiceData);

    // ALSO: create the invoice on the backend so conversion actually results in a server-side invoice
    const payload = {
      number: invoiceData.number,
      date: invoiceData.date,
      clientName: invoiceData.clientName,
      clientAddress: invoiceData.clientAddress,
      clientDNI: invoiceData.clientDNI || '',
      clientPhone: invoiceData.clientPhone || '',
      clientEmail: invoiceData.clientEmail || '',
      items: invoiceData.items.map(i => {
        const base = Number(i.amount) || 0;
        const totalWithTax = Math.round(base * (1 + (invoiceData.taxRate / 100)) * 100) / 100;
        return {
          description: i.description,
          quantity: 1,
          price: base,
          total: totalWithTax,
          amount: totalWithTax
        };
      }),
      taxRate: invoiceData.taxRate,
      iban: invoiceData.iban || ''
    };

    this.invoicesService.createInvoice(payload).subscribe({
      next: () => {
        this.toastr.success(`Presupuesto convertido y factura creada en servidor Nº ${invoiceData.number}`, 'Conversión y Guardado');
      },
      error: (err) => {
        console.error('Error creating invoice on backend', err);
        this.toastr.warning('Presupuesto convertido localmente pero no se pudo crear la factura en el servidor', 'Advertencia');
      }
    });

    this.toastr.success(`Presupuesto convertido a Factura Nº ${invoiceData.number}`, 'Conversión exitosa');
    this.showConvertDialog = false;

    // Navegar al componente de factura (opcional)
    // this.router.navigate(['/invoice'], { state: { data: invoiceData } });
  }
}

