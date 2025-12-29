import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { ProjectsGrid } from '../projects-grid/projects-grid';
import { ServicesList } from '../admin-services/services-list/services-list';
import { QuotesList } from '../admin-quotes/quotes-list/quotes-list';
import { Budget } from '../../shared/components/budget/budget';
import { DocumentsList } from '../../shared/components/documents-list/documents-list';
import { InvoiceEditor } from '../../shared/components/invoice-creator/invoice-creator';
import { AdminsList } from './admins-list/admins-list';
type TabType = 'quotes' | 'projects' | 'services' | 'accounting' | 'admins'
  | 'budgets' | 'invoice' | 'documents';

interface MenuItem {
  id: TabType;
  label: string;
  icon: string;
  badge?: number;
  // optional nested sub-items for expandable groups (e.g. Contabilidad)
  subItems?: Array<{
    id: TabType;
    label: string;
    icon?: string;
    badge?: number;
  }>;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [ProjectsGrid, ServicesList, QuotesList, DocumentsList, Budget, InvoiceEditor, AdminsList],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard {
  currentTab = signal<TabType>('quotes');
  sidebarCollapsed = signal(false);
  pendingCount = signal(5);

  menuItems: MenuItem[] = [
    {
      id: 'quotes',
      label: 'Cotizaciones',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      badge: 5
    },
    {
      id: 'projects',
      label: 'Proyectos',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
    },
    {
      id: 'services',
      label: 'Servicios',
      icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
    },
    {
      id: 'accounting',
      label: 'Contabilidad',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      badge: 3,
      // subItems will be shown when this group is expanded
      subItems: [
        // Document list (document with text lines)
        { id: 'documents', label: 'Documentos', icon: 'M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z M7 7h10 M7 11h10 M7 15h6' },
        // Budgets (receipt/paper with lines)
        { id: 'budgets', label: 'Presupuestos', icon: 'M3 5a2 2 0 012-2h14a2 2 0 012 2v14l-4-2-4 2-4-2-4 2V5z M7 10h10 M7 14h6' },
        // Invoices (receipt with currency/lines)
        { id: 'invoice', label: 'Facturas', icon: 'M21 8V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2v-2 M7 10h10 M7 14h6' }
      ]
    },
    {
      id: 'admins',
      label: 'Administradores',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
    }
  ];

  toggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
  }

  setTab(tab: TabType) {
    this.currentTab.set(tab);
  }

  getCurrentTitle(): string {
    const titles: Record<TabType, string> = {
      quotes: 'Cotizaciones',
      projects: 'Proyectos',
      services: 'Servicios',
      accounting: 'Contabilidad',
      admins: 'Administradores',
      'budgets': 'Presupuestos',
      'invoice': 'Facturas',
      'documents': 'Documentos'
    };
    return titles[this.currentTab()];
  }

  getCurrentDescription(): string {
    const descriptions: Record<TabType, string> = {
      quotes: 'Gestiona solicitudes y cotizaciones de clientes',
      projects: 'Administra tu portafolio de proyectos',
      services: 'Configura los servicios que ofreces',
      accounting: 'Control financiero de tu negocio',
      admins: 'Gestión de usuarios administradores',
      'budgets': 'Crear y editar presupuestos',
      'invoice': 'Crear y editar facturas',
      'documents': 'Listado y exportación de documentos'
    };
    return descriptions[this.currentTab()];
  }

  // track which sidebar group is expanded (e.g. 'accounting')
  expandedGroup = signal<string | null>(null);

  private _openDocumentHandler = (e: any) => {
    const detail = e?.detail;
    if (!detail || !detail.type) return;
    if (detail.type === 'budget') {
      this.expandedGroup.set('accounting');
      this.currentTab.set('budgets');
    } else if (detail.type === 'invoice') {
      this.expandedGroup.set('accounting');
      this.currentTab.set('invoice');
    } else if (detail.type === 'documents') {
      this.currentTab.set('documents');
    }
  }

  ngOnInit(): void {
    // Listen to embedded edit/view events from lists
    try {
      window.addEventListener('open-document', this._openDocumentHandler as EventListener);
    } catch (e) {
      // ignore
    }
  }

  ngOnDestroy(): void {
    try {
      window.removeEventListener('open-document', this._openDocumentHandler as EventListener);
    } catch (e) {
      // ignore
    }
  }

  toggleGroup(groupId: string) {
    this.expandedGroup.update(g => (g === groupId ? null : groupId));
  }

  onMenuClick(item: MenuItem) {
    if (item.subItems && item.subItems.length > 0) {
      this.toggleGroup(item.id);
    } else {
      this.setTab(item.id as TabType);
    }
  }

  // helpers used from template to avoid direct string-literal comparisons
  isAccountingDocuments(): boolean {
    return this.currentTab() === 'documents';
  }

  isAccountingBudgets(): boolean {
    return this.currentTab() === 'budgets';
  }

  isAccountingInvoice(): boolean {
    return this.currentTab() === 'invoice';
  }

  logout() {
    if (confirm('¿Cerrar sesión?')) {
      console.log('Logging out...');
      // Implementar lógica de logout
    }
  }
}