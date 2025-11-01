import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  username = '';
  password = '';
  error = '';

  constructor(private router: Router) {}

  onSubmit(e: Event) {
    e.preventDefault();
    // Simple local auth: match username against stored admins
    const admins = JSON.parse(localStorage.getItem('admins') || '[]');
    const found = admins.find((a: any) => a.username === this.username || a.email === this.username);
    if (found) {
      // store auth token (admin id)
      localStorage.setItem('authAdminId', found.id);
      this.router.navigate(['/admin']);
      return;
    }

    this.error = 'Credenciales inválidas';
  }

  logoutAny() {
    localStorage.removeItem('authAdminId');
    this.router.navigate(['/']);
  }
}
