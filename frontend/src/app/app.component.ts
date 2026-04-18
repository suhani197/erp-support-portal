import { Component, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
  <div class="app-shell">
    <aside class="sidebar" *ngIf="auth.isLoggedIn()">
      <div class="brand">
        <div class="brand-title">ERP Support</div>
        <div class="brand-sub">Portal</div>
      </div>

      <nav class="nav">
        <a routerLink="/tickets" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Tickets</a>
        <a routerLink="/tickets/new" routerLinkActive="active">New Ticket</a>
        <a routerLink="/kb" routerLinkActive="active">Knowledge Base</a>

        <a *ngIf="isAdmin()" routerLink="/admin" routerLinkActive="active">Admin Dashboard</a>
      </nav>

      <div class="sidebar-footer">
        <div class="userbox">
          <div class="user-name">{{ auth.currentUser()?.fullName }}</div>
          <div class="user-role">{{ auth.currentUser()?.role }}</div>
        </div>
        <button class="btn-logout" (click)="auth.logout()">Logout</button>
      </div>
    </aside>

    <main class="content">
      <header class="topbar" *ngIf="auth.isLoggedIn()">
        <div class="crumb">
          <span class="muted">ERP Support Portal</span>
        </div>
        <div class="top-actions">
          <div class="logo">
            <img src="assets/images/logo.svg" alt="ERP Support Logo" width="24" height="24" />
          </div>
          <a class="btn" routerLink="/tickets">My Work</a>
          <a class="btn" routerLink="/kb">Search KB</a>
        </div>
      </header>

      <section class="page">
        <router-outlet></router-outlet>
      </section>
    </main>
  </div>
  `,
  styles: [`
    :host { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
    .app-shell { display: grid; grid-template-columns: 240px 1fr; min-height: 100vh; background:#f7f7f9; }
    .sidebar { background:#111827; color:#e5e7eb; display:flex; flex-direction:column; padding:18px 14px; }
    .brand { padding: 6px 10px 18px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 14px; }
    .brand-title { font-weight: 700; letter-spacing: .3px; }
    .brand-sub { font-size: 12px; color:#9ca3af; margin-top:2px; }
    .nav { display:flex; flex-direction:column; gap:6px; padding: 6px; }
    .nav a { color:#e5e7eb; text-decoration:none; padding:10px 10px; border-radius:10px; font-size:14px; }
    .nav a:hover { background: rgba(255,255,255,0.06); }
    .nav a.active { background: rgba(255,255,255,0.10); }
    .sidebar-footer { margin-top:auto; padding: 12px 6px 6px; border-top: 1px solid rgba(255,255,255,0.08); }
    .userbox { padding: 10px; border-radius: 10px; background: rgba(255,255,255,0.06); margin-bottom: 10px; }
    .user-name { font-weight: 600; font-size: 13px; }
    .user-role { font-size: 12px; color:#cbd5e1; margin-top:2px; }
    .btn-logout { width:100%; border:1px solid rgba(255,255,255,0.18); background: transparent; color:#e5e7eb; padding:10px; border-radius:10px; cursor:pointer; font-size:13px; }
    .btn-logout:hover { background: rgba(255,255,255,0.08); }

    .content { display:flex; flex-direction:column; }
    .topbar { display:flex; justify-content:space-between; align-items:center; padding:14px 18px; background:#ffffff; border-bottom:1px solid #e5e7eb; }
    .crumb { font-size: 13px; }
    .muted { color:#6b7280; }
    .top-actions { display:flex; gap:10px; align-items: center; }
    .logo { margin-right: 8px; }
    .btn { border:1px solid #e5e7eb; background:#fff; padding:8px 12px; border-radius:10px; text-decoration:none; color:#111827; font-size:13px; }
    .btn:hover { background:#f9fafb; }
    .page { padding: 18px; }

    @media (max-width: 900px) {
      .app-shell { grid-template-columns: 1fr; }
      .sidebar { display:none; }
    }
  `]
})
export class AppComponent {
  auth = inject(AuthService);
  isAdmin = computed(() => this.auth.currentUser()?.role === 'ADMIN');
}
