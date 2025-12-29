import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../env/environment';
import { map, Observable } from 'rxjs';
import { IProject } from '../models/project.model';
import { PendingMediaItem } from '../models/media.model';
import { Auth } from './auth';

@Injectable({
  providedIn: 'root',
})
export class Project {
  constructor(
    private http: HttpClient,
    private authService: Auth
  ) { }

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

  createProject(project: Partial<IProject>): Observable<any> {
    return this.http.post(`${environment.urlServer}${environment.projectService}`, project, { headers: this.authService.getAuthHeaders() }).pipe(
      map((res: any) => {
        return res;
      })
    )
  }
  updateProject(projectId: string, project: Partial<IProject>): Observable<any> {
    // Use PATCH to perform a partial update so omitted fields (like media)
    // are not replaced by empty values on the backend.
    return this.http.put(
      `${environment.urlServer}${environment.projectService}${projectId}`,
      project,
      { headers: this.authService.getAuthHeaders() }
    ).pipe(
      map((res: any) => res)
    );
  }

  deleteProject(projectId: string): Observable<any> {
    return this.http.delete(
      `${environment.urlServer}${environment.projectService}${projectId}`,
      { headers: this.authService.getAuthHeaders() }
    ).pipe(
      map((res: any) => res)
    );
  }

  /**
   * Upload multiple media items in a single request using the /media/batch endpoint.
   * Each PendingMediaItem will be appended as repeated multipart fields: file, description, is_before, media_type
   */
  uploadMediaBatch(projectId: string, items: PendingMediaItem[]): Observable<any> {
    const headers = this.authService.getAuthHeaders();

    const formData = new FormData();

    items.forEach((it, index) => {
      // Append file (multiple files with the same key 'file')
      formData.append('file', it.file, it.file.name);
      // Append corresponding metadata. Repeat keys so backend can parse parallel arrays or repeated entries.
      formData.append('description', it.description ?? '');
      formData.append('is_before', String(it.is_before));
      if (it.media_type) {
        formData.append('media_type', it.media_type);
      }
    });

    return this.http.post(
      `${environment.urlServer}/api/v1/projects/${projectId}/media/batch`,
      formData,
      { headers }
    );
  }

  uploadMedia(projectId: string, formData: FormData): Observable<any> {
    // When uploading FormData we must NOT set the Content-Type header manually.
    // Let the browser set the correct multipart/form-data boundary.
    const headers = this.authService.getAuthHeaders();

    return this.http.post(
      `${environment.urlServer}/api/v1/projects/${projectId}/media`,
      formData,
      { headers }
    );
  }

  // También puedes necesitar estos métodos auxiliares:

  deleteMedia(projectId: string, mediaId: string): Observable<any> {
    const headers = this.authService.getAuthHeaders().set('Content-Type', 'application/json');

    return this.http.delete(
      `${environment.urlServer}/api/v1/projects/${projectId}/media/${mediaId}`,
      { headers }
    );
  }
}
