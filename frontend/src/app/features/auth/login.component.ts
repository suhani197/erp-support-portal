import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-header">
          <div class="login-logo">⚙</div>
          <h1>ERP Support Portal</h1>
          <p>Sign in to your account</p>
        </div>

        <form (ngSubmit)="submit()">
          <div class="field">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email"
                   placeholder="you@company.com" required />
          </div>
          <div class="field">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password"
                   placeholder="••••••••" required />
          </div>

          @if (error()) {
            <div class="alert-error">{{ error() }}</div>
          }

          <button type="submit" class="btn-primary" [disabled]="loading()">
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: #f5f5f0; padding: 1rem;
    }
    .login-card {
      background: white; border-radius: 16px; border: 1px solid #e5e5e0;
      padding: 2.5rem 2rem; width: 100%; max-width: 400px;
    }
    .login-header { text-align: center; margin-bottom: 2rem; }
    .login-logo { font-size: 36px; margin-bottom: 0.75rem; }
    h1 { margin: 0 0 0.5rem; font-size: 22px; font-weight: 600; color: #1a1a2e; }
    p { margin: 0; color: #888; font-size: 14px; }

    .field { margin-bottom: 1rem; }
    label { display: block; font-size: 13px; font-weight: 500; color: #444; margin-bottom: 6px; }
    input {
      width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px;
      font-size: 14px; box-sizing: border-box; transition: border-color 0.15s;
    }
    input:focus { outline: none; border-color: #7c6fcd; }

    .alert-error {
      background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;
      padding: 10px 12px; color: #dc2626; font-size: 13px; margin-bottom: 1rem;
    }

    .btn-primary {
      width: 100%; padding: 11px; background: #1a1a2e; color: white;
      border: none; border-radius: 8px; font-size: 14px; font-weight: 500;
      cursor: pointer; transition: background 0.15s;
    }
    .btn-primary:hover:not(:disabled) { background: #2d2d4e; }
    .btn-primary:disabled { opacity: 0.6; cursor: default; }

    .demo-creds {
      margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #f0f0ec;
    }
    .demo-title { font-size: 12px; color: #aaa; font-weight: 500; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .cred-row {
      display: flex; align-items: center; gap: 10px; padding: 8px;
      border-radius: 6px; cursor: pointer; transition: background 0.1s; margin-bottom: 4px;
    }
    .cred-row:hover { background: #f8f8f5; }
    .cred-badge {
      font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 4px;
      text-transform: uppercase; letter-spacing: 0.3px;
    }
    .badge-admin    { background: #ede9fe; color: #5b21b6; }
    .badge-agent    { background: #dbeafe; color: #1d4ed8; }
    .badge-requester{ background: #dcfce7; color: #166534; }
    .cred-email { font-size: 13px; color: #555; }
    .cred-note { font-size: 12px; color: #aaa; margin-top: 8px; }
    code { background: #f5f5f0; padding: 1px 5px; border-radius: 4px; }
  `]
})
export class LoginComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  email    = '';
  password = '';
  loading  = signal(false);
  error    = signal('');

  demoCreds = [
    { role: 'ADMIN',     email: 'admin@erp.com' },
    { role: 'AGENT',     email: 'agent@erp.com' },
    { role: 'REQUESTER', email: 'requester@erp.com' },
  ];

  fillCred(cred: { email: string }) {
    this.email    = cred.email;
    this.password = 'password123';
  }

  submit() {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/tickets']),
      error: (err) => {
        this.error.set(err.error?.message ?? 'Invalid credentials');
        this.loading.set(false);
      }
    });
  }
}
