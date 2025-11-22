import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CompanyInfo, Invoice, InvoiceData, InvoiceItem } from '../../core/services/invoice';
import { Router } from '@angular/router';

interface BudgetItem {
  description: string;
  amount: number;
}
@Component({
  selector: 'app-budget',
  imports: [CommonModule, FormsModule],
  templateUrl: './budget.html',
  styleUrl: './budget.css',
})
export class Budget {
 // Budget data
  budgetNumber: string = '';
  budgetDate: string = '';
  validUntil: string = '';
  clientName: string = '';
  clientAddress: string = '';
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
  showConvertDialog: boolean = false;

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
    private router: Router
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

  formatText(text: string): string {
    return text.replace(/\n/g, '<br>');
  }

  print(): void {
    window.print();
  }

  downloadPDF(): void {
    const originalTitle = document.title;
    document.title = `Presupuesto_${this.budgetNumber}_${this.clientName.replace(/\s+/g, '_')}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  }

  // Calcular días de validez restantes
  getDaysRemaining(): number {
    const today = new Date();
    const validDate = new Date(this.validUntil);
    const diffTime = validDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Guardar presupuesto
  saveBudget(): void {
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

    this.invoiceService.saveData(budgetData);
    alert('Presupuesto guardado correctamente');
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
      clientDNI: '', // Se pedirá en la factura
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
    
    alert(`Presupuesto convertido a Factura Nº ${invoiceData.number}`);
    this.showConvertDialog = false;

    // Navegar al componente de factura (opcional)
    // this.router.navigate(['/invoice'], { state: { data: invoiceData } });
  }
}

