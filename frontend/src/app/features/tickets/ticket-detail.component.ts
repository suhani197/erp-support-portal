import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService, AdminService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { TicketDetail } from '../../shared/models/models';

import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'statusFmt', standalone: true, pure: true })
export class StatusFmtPipe implements PipeTransform {
  transform(val: string) { return val?.replace(/_/g,' ') ?? val; }
}

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DatePipe, StatusFmtPipe],
  template: `
    @if (loading()) { <div class="loading">Loading…</div> }
    @else if (ticket()) {
      <div class="page-header">
        <div>
          <a routerLink="/tickets" class="back-link">← All Tickets</a>
          <h1>#{{ ticket()!.id }} — {{ ticket()!.title }}</h1>
        </div>
        <div class="header-badges">
          <span class="badge" [class]="'status-' + ticket()!.status">{{ ticket()!.status | statusFmt }}</span>
          <span class="badge" [class]="'priority-' + ticket()!.priority">{{ ticket()!.priority }}</span>
        </div>
      </div>

      <div class="detail-layout">
        <!-- Left: description + comments -->
        <div class="main-col">
          <div class="card">
            <div class="card-section">
              <div class="section-label">Description</div>
              <div class="description">{{ ticket()!.description }}</div>
            </div>
          </div>

          <!-- SLA card -->
          @if (ticket()!.sla) {
            <div class="card sla-card">
              <div class="sla-title">SLA Metrics</div>
              <div class="sla-grid">
                <div class="sla-item" [class.breached]="ticket()!.sla!.firstResponseBreached">
                  <div class="sla-label">First Response</div>
                  <div class="sla-value">
                    {{ ticket()!.sla!.firstResponseMinutes != null ? ticket()!.sla!.firstResponseMinutes + ' min' : '—' }}
                  </div>
                  <div class="sla-policy">Target: {{ ticket()!.sla!.policyFirstResponseMinutes }} min</div>
                  <div class="sla-status">
                    {{ ticket()!.sla!.firstResponseBreached ? '🔴 Breached' : '🟢 Within SLA' }}
                  </div>
                </div>
                <div class="sla-item" [class.breached]="ticket()!.sla!.resolutionBreached">
                  <div class="sla-label">Resolution</div>
                  <div class="sla-value">
                    {{ ticket()!.sla!.resolutionMinutes != null ? ticket()!.sla!.resolutionMinutes + ' min' : '—' }}
                  </div>
                  <div class="sla-policy">Target: {{ ticket()!.sla!.policyResolutionMinutes }} min</div>
                  <div class="sla-status">
                    {{ ticket()!.sla!.resolutionBreached ? '🔴 Breached' : ticket()!.sla!.resolutionMinutes ? '🟢 Within SLA' : '⏳ In progress' }}
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Comments -->
          <div class="card">
            <div class="section-label">Activity</div>
            @if (ticket()!.comments.length === 0) {
              <p class="no-comments">No comments yet.</p>
            }
            @for (c of ticket()!.comments; track c.id) {
              <div class="comment" [class.internal]="c.commentType === 'INTERNAL'">
                <div class="comment-meta">
                  <span class="comment-author">{{ c.author.fullName }}</span>
                  @if (c.commentType === 'INTERNAL') {
                    <span class="internal-badge">Internal note</span>
                  }
                  <span class="comment-date">{{ c.createdAt | date:'dd MMM yyyy HH:mm' }}</span>
                </div>
                <div class="comment-body">{{ c.body }}</div>
              </div>
            }

            <!-- Add comment -->
            <div class="add-comment">
              <textarea [(ngModel)]="commentBody" rows="3"
                        placeholder="Add a comment…"></textarea>
              @if (auth.hasRole('AGENT', 'ADMIN')) {
                <div class="comment-type-toggle">
                  <label class="toggle-label">
                    <input type="checkbox" [(ngModel)]="isInternal" />
                    Internal note (not visible to requester)
                  </label>
                </div>
              }
              <button class="btn-primary" (click)="submitComment()" [disabled]="!commentBody.trim()">
                Add Comment
              </button>
            </div>
          </div>
        </div>

        <!-- Right: metadata + actions -->
        <div class="side-col">
          <div class="card meta-card">
            <div class="meta-row">
              <span class="meta-label">Module</span>
              <span class="meta-value">{{ ticket()!.module }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Created by</span>
              <span class="meta-value">{{ ticket()!.createdBy.fullName }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Assigned to</span>
              <span class="meta-value">{{ ticket()!.assignedTo?.fullName ?? 'Unassigned' }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Created</span>
              <span class="meta-value">{{ ticket()!.createdAt | date:'dd MMM yyyy HH:mm' }}</span>
            </div>
            @if (ticket()!.resolvedAt) {
              <div class="meta-row">
                <span class="meta-label">Resolved</span>
                <span class="meta-value">{{ ticket()!.resolvedAt | date:'dd MMM yyyy HH:mm' }}</span>
              </div>
            }
          </div>

          <!-- Agent/Admin actions -->
          @if (auth.hasRole('AGENT', 'ADMIN')) {
            <div class="card actions-card">
              <div class="section-label">Actions</div>

              <!-- Assign controls (admin only) -->
              @if (auth.hasRole('ADMIN')) {
                <div class="assign-row">
                  <select [(ngModel)]="selectedAgent" class="assign-select">
                    <option [ngValue]="null">— Assign to agent —</option>
                    @for (a of agents(); track a.id) {
                      <option [ngValue]="a.id">{{ a.fullName }} ({{ a.role }})</option>
                    }
                  </select>
                  <button class="btn-action" [disabled]="!selectedAgent" (click)="assignToAgent()">Assign</button>
                </div>
                @if (ticket()!.assignedTo) {
                  <button class="btn-action unassign" (click)="unassign()">Unassign</button>
                }
              }

              <!-- Status transitions -->
              @for (next of allowedTransitions(); track next) {
                <button class="btn-action" [class.resolve]="next === 'RESOLVED'"
                        (click)="changeStatus(next)">
                  → {{ next | statusFmt }}
                </button>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .loading { padding: 3rem; text-align: center; color: #888; }
    .back-link { font-size: 13px; color: #888; text-decoration: none; display: block; margin-bottom: 6px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    h1 { margin: 0; font-size: 20px; font-weight: 600; color: #1a1a2e; max-width: 600px; line-height: 1.3; }
    .header-badges { display: flex; gap: 8px; margin-top: 4px; }

    .detail-layout { display: grid; grid-template-columns: 1fr 280px; gap: 1.25rem; }
    .card { background: white; border-radius: 12px; border: 1px solid #e5e5e0; padding: 1.25rem; margin-bottom: 1rem; }
    .section-label { font-size: 12px; font-weight: 600; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.75rem; }
    .description { font-size: 14px; color: #333; line-height: 1.7; white-space: pre-wrap; }

    .sla-card { }
    .sla-title { font-size: 13px; font-weight: 600; color: #444; margin-bottom: 12px; }
    .sla-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .sla-item { padding: 12px; border-radius: 8px; background: #f8f8f5; }
    .sla-item.breached { background: #fef2f2; }
    .sla-label { font-size: 11px; color: #888; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }
    .sla-value { font-size: 20px; font-weight: 600; color: #1a1a2e; }
    .sla-policy { font-size: 11px; color: #aaa; margin-top: 2px; }
    .sla-status { font-size: 12px; margin-top: 6px; }

    .no-comments { color: #bbb; font-size: 14px; text-align: center; padding: 1rem 0; }
    .comment { padding: 12px 0; border-bottom: 1px solid #f5f5f0; }
    .comment:last-of-type { border-bottom: none; }
    .comment.internal { background: #fffbeb; border-radius: 6px; padding: 10px; margin-bottom: 6px; }
    .comment-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
    .comment-author { font-size: 13px; font-weight: 600; color: #1a1a2e; }
    .comment-date { font-size: 12px; color: #aaa; }
    .internal-badge { font-size: 10px; background: #fef3c7; color: #92400e; padding: 2px 7px; border-radius: 4px; font-weight: 600; }
    .comment-body { font-size: 14px; color: #444; line-height: 1.6; white-space: pre-wrap; }

    .add-comment { margin-top: 1rem; border-top: 1px solid #f0f0ec; padding-top: 1rem; }
    .add-comment textarea {
      width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 7px;
      font-size: 14px; font-family: inherit; box-sizing: border-box; resize: vertical;
    }
    .comment-type-toggle { margin: 8px 0; }
    .toggle-label { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #666; cursor: pointer; }
    .btn-primary {
      margin-top: 8px; padding: 8px 18px; background: #1a1a2e; color: white;
      border: none; border-radius: 7px; font-size: 13px; cursor: pointer;
    }
    .btn-primary:disabled { opacity: 0.4; cursor: default; }

    .meta-card { }
    .meta-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #f5f5f0; }
    .meta-row:last-child { border-bottom: none; }
    .meta-label { font-size: 12px; color: #aaa; }
    .meta-value { font-size: 13px; color: #333; font-weight: 500; text-align: right; max-width: 150px; }

    .actions-card { }
    .btn-action {
      display: block; width: 100%; padding: 9px 14px; margin-bottom: 8px;
      background: white; border: 1px solid #ddd; border-radius: 7px;
      font-size: 13px; cursor: pointer; text-align: left; transition: all 0.15s;
    }
    .btn-action:hover { background: #f8f8f5; }
    .assign-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
    .assign-select { flex: 1; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; }
    .btn-action:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-action.unassign { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
    .btn-action.unassign:hover { background: #fef2f2; }
    .btn-action.resolve { background: #dcfce7; border-color: #bbf7d0; color: #166534; }

    .badge { display: inline-block; padding: 3px 10px; border-radius: 5px; font-size: 11px; font-weight: 600; }
    .status-NEW              { background: #f0f0ff; color: #4040a0; }
    .status-ASSIGNED         { background: #dbeafe; color: #1d4ed8; }
    .status-IN_PROGRESS      { background: #fef3c7; color: #92400e; }
    .status-WAITING_CUSTOMER { background: #fce7f3; color: #9d174d; }
    .status-RESOLVED         { background: #dcfce7; color: #166534; }
    .status-CLOSED           { background: #f3f4f6; color: #6b7280; }
    .priority-P1 { background: #fef2f2; color: #dc2626; }
    .priority-P2 { background: #fff7ed; color: #c2410c; }
    .priority-P3 { background: #f0fdf4; color: #15803d; }

    @media (max-width: 800px) { .detail-layout { grid-template-columns: 1fr; } }
  `]
})
export class TicketDetailComponent implements OnInit {
  private route     = inject(ActivatedRoute);
  private ticketSvc = inject(TicketService);
  private adminSvc  = inject(AdminService);
  auth              = inject(AuthService);

  ticket  = signal<TicketDetail | null>(null);
  loading = signal(true);
  commentBody  = '';
  isInternal   = false;
  agents       = signal<any[]>([]);
  selectedAgent: number | null = null;

  private readonly TRANSITIONS: Record<string, string[]> = {
    NEW:              ['ASSIGNED'],
    ASSIGNED:         ['IN_PROGRESS'],
    IN_PROGRESS:      ['WAITING_CUSTOMER','RESOLVED'],
    WAITING_CUSTOMER: ['IN_PROGRESS'],
    RESOLVED:         ['CLOSED'],
    CLOSED:           ['IN_PROGRESS'],
  };

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);
    if (this.auth.hasRole('ADMIN')) {
      this.adminSvc.getUsers().subscribe(users =>
        this.agents.set(users.filter(u => u.role === 'AGENT' || u.role === 'ADMIN'))
      );
    }
  }

  load(id: number) {
    this.ticketSvc.get(id).subscribe({
      next: t => { this.ticket.set(t); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  allowedTransitions() {
    const status = this.ticket()?.status ?? '';
    return this.TRANSITIONS[status] ?? [];
  }

  changeStatus(newStatus: string) {
    const id = this.ticket()!.id;
    this.ticketSvc.updateStatus(id, newStatus).subscribe(t => this.ticket.set(t));
  }

  assignToSelf() {
    const id      = this.ticket()!.id;
    const agentId = this.auth.currentUser()!.id;
    this.ticketSvc.assign(id, agentId).subscribe(t => { this.ticket.set(t); this.selectedAgent = null; });
  }

  assignToAgent() {
    if (!this.selectedAgent) return;
    const id = this.ticket()!.id;
    this.ticketSvc.assign(id, this.selectedAgent).subscribe(t => { this.ticket.set(t); this.selectedAgent = null; });
  }

  unassign() {
    const id = this.ticket()!.id;
    this.ticketSvc.unassign(id).subscribe(t => this.ticket.set(t));
  }

  submitComment() {
    if (!this.commentBody.trim()) return;
    const id   = this.ticket()!.id;
    const type = this.isInternal ? 'INTERNAL' : 'PUBLIC';
    this.ticketSvc.addComment(id, this.commentBody, type).subscribe(() => {
      this.commentBody = '';
      this.isInternal  = false;
      this.load(id);
    });
  }
}
