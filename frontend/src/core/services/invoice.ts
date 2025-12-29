import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../env/environment';
import { Auth } from './auth';
import { IInvoice } from '../models/invoice.model';

@Injectable({
  providedIn: 'root',
})
export class Invoices {

  constructor(
    private http: HttpClient,
    private authService: Auth
  ) {}

  // 🔹 LISTAR FACTURAS
  getInvoices(): Observable<IInvoice[]> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<IInvoice[]>(
      `${environment.urlServer}/api/v1/invoices/`,
      { headers }
    );
  }

  // 🔹 OBTENER FACTURA POR ID
  getInvoiceById(invoiceId: string): Observable<IInvoice> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<IInvoice>(
      `${environment.urlServer}/api/v1/invoices/${invoiceId}`,
      { headers }
    );
  }

  // 🔹 CREAR FACTURA
  createInvoice(body: Partial<IInvoice>): Observable<IInvoice> {
    const headers = this.authService.getAuthHeaders();
    return this.http.post<IInvoice>(
      `${environment.urlServer}/api/v1/invoices/`,
      body,
      { headers }
    );
  }

  // 🔹 ELIMINAR FACTURA
  deleteInvoice(invoiceId: string): Observable<void> {
    const headers = this.authService.getAuthHeaders();
    return this.http.delete<void>(
      `${environment.urlServer}/api/v1/invoices/${invoiceId}`,
      { headers }
    );
  }
}
