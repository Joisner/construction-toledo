import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
  showWhatsAppChat = false;
  whatsappNumber = '+34667161300'; // Reemplaza con tu número
  currentUrl = ''; // <- Aquí guardaremos la URL actual
  showMobileMenu = false;

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Detectar cambios de ruta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        debugger
        this.currentUrl = event.urlAfterRedirects;
        console.log('URL actual:', this.currentUrl);
      });
  }

  toggleWhatsAppChat(): void {
    this.showWhatsAppChat = !this.showWhatsAppChat;
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }
  sendWhatsAppMessage(message: string): void {
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${this.whatsappNumber}?text=${encodedMessage}`;
    window.open(url, '_blank');
    this.showWhatsAppChat = false;
  }
}