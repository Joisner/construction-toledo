import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  error = '';
  formLogin: FormGroup = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required)
  })

  constructor(
    private router: Router,
    private authService: Auth
  ) { }

  onSubmit(e: Event): void {
    if (this.formLogin.valid) {
      e.preventDefault();
      const values = {
        username: this.formLogin.get('username')?.value,
        password: this.formLogin.get('password')?.value
      };
      this.authService.authValidation(values).subscribe({
        next: (res: any) => {
          // Store returned identifier/token so route guards can validate auth.
          // Backend may return different shapes; try common fields.
          const authId = res?.id || res?.admin?.id || res?.adminId || res?.token || res?.access_token;
          if (authId) {
            localStorage.setItem('authAdminId', String(authId));
          }
          this.error = '';
          this.router.navigate(['/admin']);
        },
        error: (err) => {
          // Show backend message when available, otherwise a generic message
          this.error = err?.error?.detail || 'Credenciales inválidas';
        }
      });
    }
  }

  logoutAny() {
    localStorage.removeItem('authAdminId');
    this.router.navigate(['/']);
  }
}
