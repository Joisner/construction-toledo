import { Injectable } from '@angular/core';
import * as toastr from 'toastr';

@Injectable({
  providedIn: 'root'
})
export class ToastrService {

  constructor() {
    toastr.options.closeButton = true;
    toastr.options.progressBar = true;
    toastr.options.positionClass = 'toast-top-right';
    toastr.options.preventDuplicates = true;
  }

  success(message: string, title?: string): void {
    toastr.success(message, title);
  }

  error(message: string, title?: string): void {
    toastr.error(message, title);
  }

  warning(message: string, title?: string): void {
    toastr.warning(message, title);
  }

  info(message: string, title?: string): void {
    toastr.info(message, title);
  }
}
