import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then(m => m.Home)
  },
  {
    path: 'services',
    loadComponent: () => import('./services/services').then(m => m.Services)
  },
  {
    path: 'projects',
    loadComponent: () => import('./projects/projects').then(m => m.Projects)
  },
  {
    path: 'about',
    loadComponent: () => import('./about/about').then(m => m.About)
  },
  {
    path: 'contact',
    loadComponent: () => import('./contact/contact').then(m => m.Contact)
  },
];
