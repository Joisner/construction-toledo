import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../env/environment';
import { map, Observable } from 'rxjs';
import { IQuote } from '../models/quotes';
import { Auth } from './auth';

@Injectable({
  providedIn: 'root',
})
export class Quotes {
  environment = environment

  constructor(
    private http: HttpClient,
    private authService: Auth
  ) {}

  // Crear una nueva quote (probablemente pública)
  createQuote(quote: Partial<IQuote>): Observable<any> {
    return this.http.post(`${environment.urlServer}${environment.quoteService}`, quote).pipe(
      map((res: any) => res)
    );
  }

  // Obtener todas las quotes (admin)
  getQuotes(): Observable<IQuote[]> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get(`${environment.urlServer}${environment.quoteService}`, { headers }).pipe(
      map((res: any) => res)
    );
  }

  // Obtener una quote por id
  getQuoteById(quoteId: number | string): Observable<IQuote> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get(`${environment.urlServer}${environment.quoteService}${quoteId}`, { headers }).pipe(
      map((res: any) => res)
    );
  }

  // Actualizar una quote (admin)
  updateQuote(quoteId: number | string, data: Partial<IQuote>): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    return this.http.put(`${environment.urlServer}${environment.quoteService}${quoteId}`, data, { headers }).pipe(
      map((res: any) => res)
    );
  }

  // Eliminar una quote (admin)
  deleteQuote(quoteId: number | string): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    return this.http.delete(`${environment.urlServer}${environment.quoteService}${quoteId}`, { headers }).pipe(
      map((res: any) => res)
    );
  }
}
