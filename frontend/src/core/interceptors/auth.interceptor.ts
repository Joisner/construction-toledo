import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Auth } from '../services/auth';
import { ToastrService } from '../services/toastr';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const auth = inject(Auth);
  const toastr = inject(ToastrService);
  const router = inject(Router);
  let authReq = req;

  // We don't want to add the token to the login request
  if (!req.url.includes('login')) {
    const token = auth.getToken();
    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  return next(authReq).pipe(
    tap((event) => {
      // Show success notification for non-GET requests
      if (event.type === 4 && req.method !== 'GET') {
        toastr.success('Operation completed successfully', 'Success');
      }
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        // Handle unauthorized or forbidden errors
        toastr.error('Your session has expired. Please log in again.', 'Unauthorized');
        auth.clearToken();
        router.navigate(['/login']);
      } else {
        // Handle other HTTP errors
        toastr.error(error.error?.message || 'An unexpected error occurred.', 'Error');
      }
      return throwError(() => error);
    })
  );
};
