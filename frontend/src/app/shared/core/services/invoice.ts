import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
export interface InvoiceItem {
  description: string;
  amount: number;
}

export interface InvoiceData {
  type: 'invoice' | 'budget';
  number: string;
  date: string;
  clientName: string;
  clientAddress: string;
  clientDNI?: string;
  clientPhone?: string;
  clientEmail?: string;
  items: InvoiceItem[];
  taxRate: number;
  iban?: string;
  validUntil?: string;
  conditions?: string;
}

export interface CompanyInfo {
  name: string;
  owner: string;
  address: string;
  city: string;
  nif: string;
  phone: string;
  email: string;
}
@Injectable({
  providedIn: 'root',
})
export class Invoice {
  // Observable para comunicar entre componentes
  private invoiceDataSubject = new BehaviorSubject<InvoiceData | null>(null);
  public invoiceData$ = this.invoiceDataSubject.asObservable();

  // Información de la empresa (centralizada)
  private companyInfo: CompanyInfo = {
    name: 'CONSTRUCCIONES TOLEDO',
    owner: 'NELSON TOLEDO MEDINA',
    address: 'C/ SAN CARLOS 33-1º',
    city: '03780 PEGO (ALICANTE)',
    nif: 'Z 0305882 X',
    phone: '667 161 300',
    email: 'iconstruccionestoledo38@gmail.com'
  };

  constructor() { }

  // Obtener información de la empresa
  getCompanyInfo(): CompanyInfo {
    return { ...this.companyInfo };
  }

  // Actualizar información de la empresa
  updateCompanyInfo(info: Partial<CompanyInfo>): void {
    this.companyInfo = { ...this.companyInfo, ...info };
  }

  // Guardar datos de presupuesto/factura
  saveData(data: InvoiceData): void {
    this.invoiceDataSubject.next(data);
    // Guardar en localStorage para persistencia
    localStorage.setItem(`${data.type}_${data.number}`, JSON.stringify(data));
  }

  // Obtener datos guardados
  getData(type: 'invoice' | 'budget', number: string): InvoiceData | null {
    const data = localStorage.getItem(`${type}_${number}`);
    return data ? JSON.parse(data) : null;
  }

  // Listar todos los presupuestos
  getAllBudgets(): InvoiceData[] {
    const budgets: InvoiceData[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('budget_')) {
        const data = localStorage.getItem(key);
        if (data) {
          budgets.push(JSON.parse(data));
        }
      }
    }
    return budgets.sort((a, b) => b.date.localeCompare(a.date));
  }

  // Listar todas las facturas
  getAllInvoices(): InvoiceData[] {
    const invoices: InvoiceData[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('invoice_')) {
        const data = localStorage.getItem(key);
        if (data) {
          invoices.push(JSON.parse(data));
        }
      }
    }
    return invoices.sort((a, b) => b.date.localeCompare(a.date));
  }

  // Convertir presupuesto a factura
  convertBudgetToInvoice(budgetData: InvoiceData): InvoiceData {
    const today = new Date().toISOString().split('T')[0];
    const year = new Date().getFullYear();

    // Generar número de factura automático
    const existingInvoices = this.getAllInvoices();
    const invoicesThisYear = existingInvoices.filter(inv =>
      inv.number.includes(year.toString())
    );
    const nextNumber = invoicesThisYear.length + 1;
    const invoiceNumber = `${year}-${nextNumber.toString().padStart(3, '0')}`;

    // Crear factura desde presupuesto
    const invoiceData: InvoiceData = {
      type: 'invoice',
      number: invoiceNumber,
      date: today,
      clientName: budgetData.clientName,
      clientAddress: budgetData.clientAddress,
      clientDNI: budgetData.clientDNI || '',
      clientPhone: budgetData.clientPhone,
      clientEmail: budgetData.clientEmail,
      items: [...budgetData.items], // Copiar items
      taxRate: budgetData.taxRate,
      iban: budgetData.iban || 'ES44 0049 2685 7420 1400 8200'
    };

    // Guardar la factura
    this.saveData(invoiceData);

    // Marcar el presupuesto como convertido
    const updatedBudget = { ...budgetData, converted: true, invoiceNumber };
    localStorage.setItem(`budget_${budgetData.number}`, JSON.stringify(updatedBudget));

    return invoiceData;
  }

  // Generar siguiente número de presupuesto
  getNextBudgetNumber(): string {
    const year = new Date().getFullYear();
    const budgets = this.getAllBudgets();
    const budgetsThisYear = budgets.filter(b =>
      b.number.includes(year.toString())
    );
    const nextNumber = budgetsThisYear.length + 1;
    return `PRES-${year}-${nextNumber.toString().padStart(3, '0')}`;
  }

  // Generar siguiente número de factura
  getNextInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const invoices = this.getAllInvoices();
    const invoicesThisYear = invoices.filter(inv =>
      inv.number.includes(year.toString())
    );
    const nextNumber = invoicesThisYear.length + 1;
    return `${year}-${nextNumber.toString().padStart(3, '0')}`;
  }

  // Eliminar presupuesto o factura
  deleteData(type: 'invoice' | 'budget', number: string): void {
    localStorage.removeItem(`${type}_${number}`);
  }

  // Limpiar todos los datos
  clearAllData(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('invoice_') || key?.startsWith('budget_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Exportar datos a JSON
  exportAllData(): string {
    const data = {
      invoices: this.getAllInvoices(),
      budgets: this.getAllBudgets(),
      company: this.companyInfo,
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  // Importar datos desde JSON
  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);

      // Importar facturas
      if (data.invoices) {
        data.invoices.forEach((invoice: InvoiceData) => {
          this.saveData(invoice);
        });
      }

      // Importar presupuestos
      if (data.budgets) {
        data.budgets.forEach((budget: InvoiceData) => {
          this.saveData(budget);
        });
      }

      // Importar info de empresa
      if (data.company) {
        this.updateCompanyInfo(data.company);
      }

      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}
