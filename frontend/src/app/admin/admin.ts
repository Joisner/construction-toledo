import { Component } from '@angular/core';

@Component({
  selector: 'app-admin',
  standalone: true,
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class Admin {
  get submissions() {
    return JSON.parse(localStorage.getItem('cotizaciones') || '[]');
  }

  get services() {
    return JSON.parse(localStorage.getItem('services') || '[]');
  }

  deleteSubmission(index: number) {
    const arr = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    arr.splice(index, 1);
    localStorage.setItem('cotizaciones', JSON.stringify(arr));
    location.reload();
  }

  addService(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const s = { id: Date.now().toString(), title: String(fd.get('title') || ''), description: String(fd.get('description') || ''), image: String(fd.get('image') || '') };
    const arr = JSON.parse(localStorage.getItem('services') || '[]');
    arr.unshift(s);
    localStorage.setItem('services', JSON.stringify(arr));
    form.reset();
    alert('Servicio añadido localmente.');
  }
}
