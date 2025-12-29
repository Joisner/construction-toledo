import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../env/environment';
import { Auth } from './auth';
import { IBudget } from '../models/budget.model';

@Injectable({
  providedIn: 'root',
})
export class Budgets {

  constructor(
    private http: HttpClient,
    private authService: Auth
  ) {}

  // 🔹 LISTAR PRESUPUESTOS
  getBudgets(): Observable<IBudget[]> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<IBudget[]>(
      `${environment.urlServer}/api/v1/budgets/`,
      { headers }
    );
  }

  // 🔹 OBTENER PRESUPUESTO POR ID
  getBudgetById(budgetId: string): Observable<IBudget> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<IBudget>(
      `${environment.urlServer}/api/v1/budgets/${budgetId}`,
      { headers }
    );
  }

  // 🔹 CREAR PRESUPUESTO
  createBudget(body: Partial<IBudget>): Observable<IBudget> {
    const headers = this.authService.getAuthHeaders();
    return this.http.post<IBudget>(
      `${environment.urlServer}/api/v1/budgets/`,
      body,
      { headers }
    );
  }

  // 🔹 ELIMINAR PRESUPUESTO
  deleteBudget(budgetId: string): Observable<void> {
    const headers = this.authService.getAuthHeaders();
    return this.http.delete<void>(
      `${environment.urlServer}/api/v1/budgets/${budgetId}`,
      { headers }
    );
  }
}
