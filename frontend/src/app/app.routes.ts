import { Routes } from '@angular/router';
import { ProjectDetail } from './project-detail/project-detail';
import { Projects } from './projects/projects';

export const routes: Routes = [
    { path: 'projects', component: Projects },
    { path: 'project/:id', component: ProjectDetail }
];
