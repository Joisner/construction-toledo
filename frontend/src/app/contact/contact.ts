import { Component } from '@angular/core';

@Component({
  selector: 'app-contact',
  standalone: true,
  templateUrl: './contact.html',
  styleUrls: ['./contact.css']
})
export class Contact {
  // Save submission to localStorage and open mailto to notify admin
  onSubmit(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);

    // Honeypot field to reduce bots
    const hp = fd.get('website');
    if (hp) {
      // likely bot, ignore
      return;
    }

    const submission = {
      name: String(fd.get('name') || ''),
      email: String(fd.get('email') || ''),
      phone: String(fd.get('phone') || ''),
      service: String(fd.get('service') || ''),
      message: String(fd.get('message') || ''),
      date: new Date().toISOString()
    };

    const key = 'cotizaciones';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.unshift(submission);
    localStorage.setItem(key, JSON.stringify(existing));

    // Prefill mailto to notify admin (replace with real admin address later)
    const adminEmail = 'admin@construccionestoledo.example';
    const subject = encodeURIComponent('Nueva solicitud de cotización - ' + submission.name);
    const body = encodeURIComponent(`Servicio: ${submission.service}\nNombre: ${submission.name}\nEmail: ${submission.email}\nTeléfono: ${submission.phone}\n\nMensaje:\n${submission.message}`);

    window.location.href = `mailto:${adminEmail}?subject=${subject}&body=${body}`;

    // Reset form
    form.reset();
    alert('Solicitud enviada. También se ha guardado localmente para revisión del administrador.');
  }
}
