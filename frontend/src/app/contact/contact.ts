import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { Quotes } from '../../core/services/quotes';
import { Services } from '../../core/services/services';
import { IService } from '../../core/models/service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './contact.html',
  styleUrls: ['./contact.css']
})
export class Contact {
  contactForm: FormGroup;
  loading = false;
  success = false;
  errorMsg = '';
  services = signal<IService[]>([]);

  constructor(
    private fb: FormBuilder,
    private quotesService: Quotes,
    private serviceService: Services,
  ) {
    this.loadAllData();
    this.contactForm = this.fb.group({
      website: [''], // honeypot
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      service: ['', Validators.required],
      message: ['']
    });
  }

  loadAllData(){
    this.loadService();
  }

  loadService(){
    this.serviceService.getServices().subscribe({
      next: (response) => { this.services.set(response)},
      error: (err) => {console.error(err)}
    })
  }

  onSend() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const value = this.contactForm.value;

    // Honeypot (anti bots)
    if (value.website) {
      return;
    }

    const quotePayload = {
      name: value.name,
      email: value.email,
      phone: value.phone,
      service: value.service,
      message: value.message
    };

    this.loading = true;
    this.errorMsg = '';
    this.success = false;

    this.quotesService.createQuote(quotePayload).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;

        this.contactForm.reset({
          service: 'Enpisado'
        });
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.errorMsg = 'No se pudo enviar la cotización. Inténtalo más tarde.';
      }
    });
  }
}
