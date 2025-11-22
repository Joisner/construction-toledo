import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../env/environment';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Project {
  constructor(private http: HttpClient) { }

  getAllProjects() {
    return this.http.get(`${environment.urlServer}${environment.projectService}`).pipe(
      map((res: any) => {
        return res;
      })
    )
  }

  getProjectById(projectId: string): Observable<any> {
    return this.http.get(`${environment.urlServer}${environment.projectService}${projectId}`).pipe(
      map((res: any) => {
        return res;
      })
    )
  }

  createProject(x: any): Observable<any> {
    return this.http.post(``, '').pipe(
      map((res: any) => {
        return res;
      })
    )
  }
  updateProject(x: any, y: any): Observable<any> {
    return this.http.post(``, '').pipe(
      map((res: any) => {
        return res;
      })
    )
  }
  deleteProject(x: any): Observable<any> {
    return this.http.post(``, '').pipe(
      map((res: any) => {
        return res;
      })
    )
  }

}
