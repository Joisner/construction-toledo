import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  /** Counter of active HTTP requests. */
  private activeRequests = 0;

  private loadingSubject = new BehaviorSubject<boolean>(false);

  /** Observable that emits `true` while at least one HTTP request is in flight. */
  loading$ = this.loadingSubject.asObservable();

  show(): void {
    this.activeRequests++;
    this.loadingSubject.next(true);
  }

  hide(): void {
    this.activeRequests--;
    if (this.activeRequests <= 0) {
      this.activeRequests = 0;
      this.loadingSubject.next(false);
    }
  }
}
