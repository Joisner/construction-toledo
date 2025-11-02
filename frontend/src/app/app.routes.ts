import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { ProjectDetail } from './project-detail/project-detail';
import { Projects } from './projects/projects';
import { Home } from './home/home';
import { Services } from './services/services';
import { About } from './about/about';
import { Contact } from './contact/contact';
import { Testimonials } from './testimonials/testimonials';
import { Admin } from './admin/admin';
import { Login } from './login/login';

// ✅ Simple Auth Guard
const authGuard = () => {
  const router = inject(Router);
  const authId = localStorage.getItem('authAdminId');

  if (!authId) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'services', component: Services },
  { path: 'projects', component: Projects },
  { path: 'project/:id', component: ProjectDetail },
  { path: 'about', component: About },
  { path: 'contact', component: Contact },
  { path: 'testimonials', component: Testimonials },
  { path: 'login', component: Login },
  { 
    path: 'admin', 
    component: Admin,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '' }
];
/* import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { ProjectDetail } from './project-detail/project-detail';
import { Projects } from './projects/projects';
import { Home } from './home/home';
import { Services } from './services/services';
import { About } from './about/about';
import { Contact } from './contact/contact';
import { Testimonials } from './testimonials/testimonials';
import { Admin } from './admin/admin';
import { Login } from './login/login';

// Simple auth guard function
const authGuard = () => {
    debugger
    const authId = localStorage.getItem('authAdminId');
    if (!authId) {
        return false;
    }
    return
};

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'services', component: Services },
    { path: 'projects', component: Projects },
    { path: 'project/:id', component: ProjectDetail },
    { path: 'about', component: About },
    { path: 'contact', component: Contact },
    { path: 'testimonials', component: Testimonials },
    { path: 'login', component: Login },
    {
        path: 'admin',
        component: Admin,
        canActivate: [() => {
            const isAuth = authGuard();
            if (!isAuth) {
                const router = inject(Router);
                router.navigate(['/login']);
            }
            return isAuth;
        }]
    },
    { path: '**', redirectTo: '' }
];
 */