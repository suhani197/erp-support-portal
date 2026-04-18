import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../core/services/api.services';
import { DashboardSummary, AgentWorkload, SlaPolicy } from '../../shared/models/models';
import { FormsModule } from '@angular/forms';

import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'statusFmt', standalone: true, pure: true })
export class AdminStatusFmtPipe implements PipeTransform {
  transform(val: string) { return val?.replace(/_/g,' ') ?? val; }
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, AdminStatusFmtPipe],
  template: `
    <div class="page-header">
      <h1>Admin Dashboard</h1>
    </div>

    @if (loading()) { <div class="loading">Loading dashboard…</div> }
    @else if (summary()) {
      <!-- Metric cards -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Open Tickets</div>
          <div class="metric-value">{{ summary()!.totalOpen }}</div>
        </div>
        <div class="metric-card" [class.breach]="summary()!.slaBreachCount > 0">
          <div class="metric-label">SLA Breaches</div>
          <div class="metric-value">{{ summary()!.slaBreachCount }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">SLA Compliance</div>
          <div class="metric-value">{{ summary()!.slaCompliancePct }}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Avg First Response</div>
          <div class="metric-value">
            {{ summary()!.avgFirstResponseMinutes != null ? summary()!.avgFirstResponseMinutes + ' min' : '—' }}
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Avg Resolution</div>
          <div class="metric-value">
            {{ summary()!.avgResolutionMinutes != null ? summary()!.avgResolutionMinutes + ' min' : '—' }}
          </div>
        </div>
      </div>

      <div class="dashboard-layout">
        <!-- Tickets by status -->
        <div class="card">
          <div class="card-title">Tickets by Status</div>
          @for (entry of statusEntries(); track entry[0]) {
            <div class="bar-row">
              <span class="bar-label">{{ entry[0] | statusFmt }}</span>
              <div class="bar-track">
                <div class="bar-fill" [style.width.%]="barPct(entry[1], maxStatus())"
                     [class]="'status-bar-' + entry[0]"></div>
              </div>
              <span class="bar-count">{{ entry[1] }}</span>
            </div>
          }
        </div>

        <!-- Agent workload -->
        <div class="card">
          <div class="card-title">Agent Workload (Open Tickets)</div>
          @if (agents().length === 0) {
            <p class="empty-msg">No agents with open tickets.</p>
          }
          @for (a of agents(); track a.agentId) {
            <div class="bar-row">
              <span class="bar-label">{{ a.agentName }}</span>
              <div class="bar-track">
                <div class="bar-fill agent-bar" [style.width.%]="barPct(a.openTickets, maxAgent())"></div>
              </div>
              <span class="bar-count">{{ a.openTickets }}</span>
            </div>
          }
        </div>
      </div>

      <!-- SLA Policies -->
      <div class="card sla-policies-card">
        <div class="card-title">SLA Policies</div>
        <table class="sla-table">
          <thead>
            <tr>
              <th>Priority</th>
              <th>First Response Target</th>
              <th>Resolution Target</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            @for (p of policies(); track p.priority) {
              <tr>
                <td><span class="badge priority-{{ p.priority }}">{{ p.priority }}</span></td>
                <td>{{ p.firstResponseMinutes }} min</td>
                <td>{{ p.resolutionMinutes }} min ({{ (p.resolutionMinutes / 60).toFixed(1) }}h)</td>
                <td>
                  <button class="btn-edit" (click)="editPolicy(p)">Edit</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Edit policy modal -->
      @if (editingPolicy()) {
        <div class="modal-overlay" (click)="cancelEdit()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-title">Edit SLA Policy – {{ editingPolicy()!.priority }}</div>
            <div class="field">
              <label>First Response (minutes)</label>
              <input type="number" [(ngModel)]="editFirstResponse" />
            </div>
            <div class="field">
              <label>Resolution (minutes)</label>
              <input type="number" [(ngModel)]="editResolution" />
            </div>
            <div class="modal-actions">
              <button class="btn-ghost" (click)="cancelEdit()">Cancel</button>
              <button class="btn-primary" (click)="savePolicy()">Save</button>
            </div>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    h1 { margin: 0 0 1.5rem; font-size: 24px; font-weight: 600; color: #1a1a2e; }
    .loading { padding: 3rem; text-align: center; color: #888; }

    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .metric-card { background: white; border-radius: 12px; border: 1px solid #e5e5e0; padding: 1.25rem; }
    .metric-card.breach { border-color: #fecaca; background: #fef2f2; }
    .metric-label { font-size: 12px; color: #888; font-weight: 500; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.3px; }
    .metric-value { font-size: 28px; font-weight: 700; color: #1a1a2e; }

    .dashboard-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem; }
    .card { background: white; border-radius: 12px; border: 1px solid #e5e5e0; padding: 1.25rem; }
    .card-title { font-size: 14px; font-weight: 600; color: #1a1a2e; margin-bottom: 1rem; }

    .bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .bar-label { font-size: 12px; color: #555; width: 130px; flex-shrink: 0; }
    .bar-track { flex: 1; height: 8px; background: #f0f0ec; border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; background: #7c6fcd; }
    .agent-bar { background: #3b82f6; }
    .status-bar-NEW              { background: #818cf8; }
    .status-bar-ASSIGNED         { background: #3b82f6; }
    .status-bar-IN_PROGRESS      { background: #f59e0b; }
    .status-bar-WAITING_CUSTOMER { background: #ec4899; }
    .status-bar-RESOLVED         { background: #22c55e; }
    .status-bar-CLOSED           { background: #9ca3af; }
    .bar-count { font-size: 12px; color: #888; width: 28px; text-align: right; }
    .empty-msg { font-size: 13px; color: #bbb; text-align: center; padding: 1rem 0; }

    .sla-policies-card { }
    .sla-table { width: 100%; border-collapse: collapse; }
    .sla-table th { font-size: 12px; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; padding: 8px 0; border-bottom: 1px solid #eee; text-align: left; }
    .sla-table td { padding: 10px 0; border-bottom: 1px solid #f5f5f0; font-size: 14px; color: #333; }
    .sla-table tr:last-child td { border-bottom: none; }

    .badge { display: inline-block; padding: 3px 9px; border-radius: 5px; font-size: 11px; font-weight: 700; }
    .priority-P1 { background: #fef2f2; color: #dc2626; }
    .priority-P2 { background: #fff7ed; color: #c2410c; }
    .priority-P3 { background: #f0fdf4; color: #15803d; }

    .btn-edit { padding: 4px 12px; background: white; border: 1px solid #ddd; border-radius: 5px; font-size: 12px; cursor: pointer; }
    .btn-edit:hover { background: #f8f8f5; }

    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.35);
      display: flex; align-items: center; justify-content: center; z-index: 100;
    }
    .modal { background: white; border-radius: 14px; padding: 1.75rem; width: 360px; }
    .modal-title { font-size: 16px; font-weight: 600; color: #1a1a2e; margin-bottom: 1.25rem; }
    .field { margin-bottom: 1rem; }
    label { display: block; font-size: 13px; font-weight: 500; color: #444; margin-bottom: 5px; }
    input { width: 100%; padding: 9px 12px; border: 1px solid #ddd; border-radius: 7px; font-size: 14px; box-sizing: border-box; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 1.25rem; }
    .btn-primary { padding: 9px 20px; background: #1a1a2e; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; }
    .btn-ghost { padding: 9px 18px; background: white; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; cursor: pointer; color: #555; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private adminSvc = inject(AdminService);

  summary  = signal<DashboardSummary | null>(null);
  agents   = signal<AgentWorkload[]>([]);
  policies = signal<SlaPolicy[]>([]);
  loading  = signal(true);

  editingPolicy    = signal<SlaPolicy | null>(null);
  editFirstResponse = 0;
  editResolution    = 0;

  ngOnInit() {
    this.adminSvc.getDashboard().subscribe(s => { this.summary.set(s); this.loading.set(false); });
    this.adminSvc.getAgentWorkload().subscribe(a => this.agents.set(a));
    this.adminSvc.getSlaPolicies().subscribe(p => this.policies.set(p));
  }

  statusEntries() {
    return Object.entries(this.summary()?.ticketsByStatus ?? {});
  }

  maxStatus() {
    return Math.max(1, ...Object.values(this.summary()?.ticketsByStatus ?? {}));
  }

  maxAgent() {
    return Math.max(1, ...this.agents().map(a => a.openTickets));
  }

  barPct(val: number, max: number) {
    return Math.round((val / max) * 100);
  }

  editPolicy(p: SlaPolicy) {
    this.editingPolicy.set(p);
    this.editFirstResponse = p.firstResponseMinutes;
    this.editResolution    = p.resolutionMinutes;
  }

  cancelEdit() { this.editingPolicy.set(null); }

  savePolicy() {
    const p = this.editingPolicy()!;
    this.adminSvc.updateSlaPolicy(p.priority, {
      firstResponseMinutes: this.editFirstResponse,
      resolutionMinutes: this.editResolution
    }).subscribe(updated => {
      this.policies.update(list => list.map(x => x.priority === updated.priority ? updated : x));
      this.editingPolicy.set(null);
    });
  }
}

