import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'tickets', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },

  {
    path: 'tickets',
    canActivate: [authGuard],
    loadComponent: () => import('./features/tickets/ticket-list.component').then(m => m.TicketListComponent)
  },
  {
    path: 'tickets/new',
    canActivate: [authGuard],
    loadComponent: () => import('./features/tickets/ticket-create.component').then(m => m.TicketCreateComponent)
  },
  {
    path: 'tickets/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/tickets/ticket-detail.component').then(m => m.TicketDetailComponent)
  },

  {
    path: 'kb',
    canActivate: [authGuard],
    loadComponent: () => import('./features/kb/kb-list.component').then(m => m.KbListComponent)
  },
  {
    path: 'kb/new',
    canActivate: [authGuard, roleGuard(['AGENT','ADMIN'])],
    loadComponent: () => import('./features/kb/kb-create.component').then(m => m.KbCreateComponent)
  },
  {
    path: 'kb/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/kb/kb-detail.component').then(m => m.KbDetailComponent)
  },

  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    loadComponent: () => import('./features/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },

  { path: '**', redirectTo: 'tickets' }
];
