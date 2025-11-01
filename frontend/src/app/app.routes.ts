import { Routes } from '@angular/router';
import { ProjectDetail } from './project-detail/project-detail';
import { Projects } from './projects/projects';
import { Home } from './home/home';
import { Services } from './services/services';
import { About } from './about/about';
import { Contact } from './contact/contact';
import { Testimonials } from './testimonials/testimonials';
import { Admin } from './admin/admin';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'services', component: Services },
    { path: 'projects', component: Projects },
    { path: 'project/:id', component: ProjectDetail },
    { path: 'about', component: About },
    { path: 'contact', component: Contact },
    { path: 'testimonials', component: Testimonials },
    { path: 'admin', component: Admin },
    { path: '**', redirectTo: '' }
];
