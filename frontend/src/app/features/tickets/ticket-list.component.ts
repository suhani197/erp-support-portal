import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService, AdminService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { TicketSummary } from '../../shared/models/models';

// Pipe inline since Angular 17 supports standalone pipes
import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'statusLabel', standalone: true, pure: true })
export class StatusLabelPipe implements PipeTransform {
  transform(val: string) {
    return val?.replace(/_/g, ' ') ?? val;
  }
}

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, StatusLabelPipe],
  template: `
    <div class="page-header">
      <div>
        <h1>Tickets</h1>
        <p class="subtitle">{{ total() }} total</p>
      </div>
      <a routerLink="/tickets/new" class="btn-primary">+ New Ticket</a>
    </div>

    <div class="filters">
      <select [(ngModel)]="filters.status" (change)="load()">
        <option value="">All Statuses</option>
        <option *ngFor="let s of statuses" [value]="s">{{ s | statusLabel }}</option>
      </select>
      <select [(ngModel)]="filters.priority" (change)="load()">
        <option value="">All Priorities</option>
        <option value="P1">P1 – Critical</option>
        <option value="P2">P2 – High</option>
        <option value="P3">P3 – Normal</option>
      </select>
      <select [(ngModel)]="filters.module" (change)="load()">
        <option value="">All Modules</option>
        <option *ngFor="let m of modules" [value]="m">{{ m }}</option>
      </select>
      <select *ngIf="auth.hasRole('ADMIN')" [(ngModel)]="filters.agentId" (change)="onAgentFilter()">
        <option value="">All Agents</option>
        <option *ngFor="let a of agents()" [value]="a.id">{{ a.fullName }}</option>
      </select>
      <button class="btn-ghost" (click)="clearFilters()">Clear</button>
    </div>

    <div class="filters" style="margin-top:-8px;">
      <button class="btn-ghost" (click)="showAll()" [disabled]="viewMode() === 'ALL'">All</button>
      <button class="btn-ghost" (click)="showMyAssigned()" [disabled]="viewMode() === 'MY'" *ngIf="auth.hasRole('ADMIN')">My Assigned</button>
      <button class="btn-ghost" (click)="showUnassigned()" [disabled]="viewMode() === 'UNASSIGNED'" *ngIf="auth.hasRole('ADMIN')">Unassigned</button>
    </div>

    @if (loading()) {
      <div class="loading">Loading tickets…</div>
    } @else if (tickets().length === 0) {
      <div class="empty">No tickets found.</div>
    } @else {
      <div class="ticket-table-wrap">
        <table class="ticket-table">
          <thead>
            <tr>
              <th class="sortable" (click)="setSort('id')">          # {{ sortIcon('id') }}</th>
              <th class="sortable" (click)="setSort('title')">       Title {{ sortIcon('title') }}</th>
              <th class="sortable" (click)="setSort('status')">      Status {{ sortIcon('status') }}</th>
              <th class="sortable" (click)="setSort('priority')">    Priority {{ sortIcon('priority') }}</th>
              <th class="sortable" (click)="setSort('AppModule')">   Module {{ sortIcon('AppModule') }}</th>
              <th>                                                    Assigned To</th>
              <th class="sortable" (click)="setSort('createdAt')">   Created {{ sortIcon('createdAt') }}</th>
            </tr>
          </thead>
          <tbody>
            @for (t of sortedTickets(); track t.id) {
              <tr [routerLink]="['/tickets', t.id]" class="clickable-row">
                <td class="id-col">{{ t.id }}</td>
                <td class="title-col">{{ t.title }}</td>
                <td><span class="badge" [class]="'status-' + t.status">{{ t.status | statusLabel }}</span></td>
                <td><span class="badge" [class]="'priority-' + t.priority">{{ t.priority }}</span></td>
                <td class="module-col">{{ t.AppModule ?? t.module }}</td>
                <td>{{ t.assignedTo?.fullName ?? '—' }}</td>
                <td class="date-col">{{ t.createdAt | date:'dd MMM HH:mm' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button class="btn-ghost" (click)="prevPage()" [disabled]="page() === 0">← Prev</button>
        <span>Page {{ page() + 1 }} of {{ totalPages() }}</span>
        <button class="btn-ghost" (click)="nextPage()" [disabled]="page() + 1 >= totalPages()">Next →</button>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    h1 { margin: 0; font-size: 24px; font-weight: 600; color: #1a1a2e; }
    .subtitle { margin: 4px 0 0; color: #888; font-size: 14px; }

    .btn-primary {
      padding: 9px 18px; background: #1a1a2e; color: white; border: none;
      border-radius: 8px; font-size: 14px; font-weight: 500; text-decoration: none;
      cursor: pointer; white-space: nowrap;
    }
    .btn-ghost {
      padding: 7px 14px; background: white; border: 1px solid #ddd; border-radius: 7px;
      font-size: 13px; cursor: pointer; color: #555;
    }
    .btn-ghost:disabled { opacity: 0.4; cursor: default; }

    .filters { display: flex; gap: 10px; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .filters select {
      padding: 8px 12px; border: 1px solid #ddd; border-radius: 7px;
      font-size: 13px; background: white; cursor: pointer;
    }

    .ticket-table-wrap { background: white; border-radius: 12px; border: 1px solid #e5e5e0; overflow: hidden; }
    .ticket-table { width: 100%; border-collapse: collapse; }
    .ticket-table th {
      background: #f8f8f5; padding: 11px 14px; text-align: left;
      font-size: 12px; font-weight: 600; color: #888; text-transform: uppercase;
      letter-spacing: 0.5px; border-bottom: 1px solid #eee;
    }
    .ticket-table th.sortable { cursor: pointer; user-select: none; white-space: nowrap; }
    .ticket-table th.sortable:hover { color: #1a1a2e; background: #f0f0eb; }
    .ticket-table td { padding: 12px 14px; border-bottom: 1px solid #f5f5f0; font-size: 14px; }
    .ticket-table tr:last-child td { border-bottom: none; }
    .clickable-row { cursor: pointer; transition: background 0.1s; }
    .clickable-row:hover td { background: #fafafa; }

    .id-col { color: #aaa; font-size: 12px; width: 50px; }
    .title-col { font-weight: 500; color: #1a1a2e; max-width: 300px; }
    .module-col { color: #666; text-transform: capitalize; }
    .date-col { color: #888; font-size: 13px; white-space: nowrap; }

    .badge {
      display: inline-block; padding: 3px 9px; border-radius: 5px;
      font-size: 11px; font-weight: 600; letter-spacing: 0.3px;
    }
    .status-NEW              { background: #f0f0ff; color: #4040a0; }
    .status-ASSIGNED         { background: #dbeafe; color: #1d4ed8; }
    .status-IN_PROGRESS      { background: #fef3c7; color: #92400e; }
    .status-WAITING_CUSTOMER { background: #fce7f3; color: #9d174d; }
    .status-RESOLVED         { background: #dcfce7; color: #166534; }
    .status-CLOSED           { background: #f3f4f6; color: #6b7280; }
    .priority-P1 { background: #fef2f2; color: #dc2626; }
    .priority-P2 { background: #fff7ed; color: #c2410c; }
    .priority-P3 { background: #f0fdf4; color: #15803d; }

    .pagination { display: flex; align-items: center; gap: 14px; justify-content: center; margin-top: 1.5rem; font-size: 14px; color: #888; }
    .loading, .empty { text-align: center; padding: 3rem; color: #888; }
  `]
})
export class TicketListComponent implements OnInit {
  private ticketSvc = inject(TicketService);
  private adminSvc  = inject(AdminService);
  auth = inject(AuthService);

  tickets    = signal<TicketSummary[]>([]);
  agents     = signal<any[]>([]);
  loading    = signal(true);
  total      = signal(0);
  totalPages = signal(1);
  page       = signal(0);
  sortField  = signal('createdAt');
  sortDir    = signal<'asc'|'desc'>('desc');
  viewMode   = signal<'ALL' | 'UNASSIGNED' | 'MY'>('ALL');

  filters: any = { status: '', priority: '', module: '', agentId: '' };
  statuses = ['NEW','ASSIGNED','IN_PROGRESS','WAITING_CUSTOMER','RESOLVED','CLOSED'];
  modules  = ['FINANCE','INVENTORY','SALES','TECHNICAL','HR','PROCUREMENT'];

  sortedTickets = computed(() => {
    const field = this.sortField();
    const dir   = this.sortDir() === 'asc' ? 1 : -1;
    return [...this.tickets()].sort((a, b) => {
      const av = (a as any)[field] ?? '';
      const bv = (b as any)[field] ?? '';
      return av < bv ? -dir : av > bv ? dir : 0;
    });
  });

  sortIcon(field: string): string {
    if (this.sortField() !== field) return '↕';
    return this.sortDir() === 'asc' ? '▲' : '▼';
  }

  private route = inject(ActivatedRoute);

  ngOnInit() {
    if (this.auth.hasRole('ADMIN')) {
      this.adminSvc.getUsers().subscribe(users =>
        this.agents.set(users.filter(u => u.role === 'AGENT' || u.role === 'ADMIN'))
      );
    }
    this.route.queryParams.subscribe(qp => {
      if (qp['assignedToId']) (this.filters as any)['assignedToId'] = qp['assignedToId'];
      this.load();
    });
  }

  onAgentFilter() {
    const id = this.filters.agentId;
    if (id) {
      (this.filters as any)['assignedToId'] = id;
    } else {
      delete (this.filters as any)['assignedToId'];
    }
    this.page.set(0);
    this.load();
  }

  load() {
    this.loading.set(true);
    const f: Record<string, any> = { page: this.page(), size: 10 };
    f['sort'] = `${this.sortField()},${this.sortDir()}`;
    Object.entries(this.filters).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) f[k] = v;
    });

    this.ticketSvc.list(f).subscribe({
      next: page => {
        this.tickets.set(page.content);
        this.total.set(page.totalElements);
        this.totalPages.set(page.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  showAll() {
    this.viewMode.set('ALL');
    delete (this.filters as any)['assignedToId'];
    this.page.set(0);
    this.load();
  }

  showUnassigned() {
    this.viewMode.set('UNASSIGNED');
    (this.filters as any)['assignedToId'] = -1;   // -1 means "unassigned queue"
    this.page.set(0);
    this.load();
  }

  showMyAssigned() {
    this.viewMode.set('MY');
    const me = this.auth.currentUser();
    if (!me) return;
    (this.filters as any)['assignedToId'] = me.id; // your user model uses id
    this.page.set(0);
    this.load();
  }

  clearFilters() { this.filters = { status: '', priority: '', module: '', agentId: '' }; this.page.set(0); this.load(); }
  prevPage() {
    if (this.page() === 0) return;
    this.page.update(p => p - 1);
    this.load();
  }

  setSort(field: string) {
    if (this.sortField() === field) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
  }

  nextPage() {
    if (this.page() + 1 >= this.totalPages()) return;
    this.page.update(p => p + 1);
    this.load();
  }
}
