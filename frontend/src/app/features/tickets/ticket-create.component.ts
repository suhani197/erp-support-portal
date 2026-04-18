import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { TicketService, KbService } from '../../core/services/api.services';
import { KbSuggestion } from '../../shared/models/models';

@Component({
  selector: 'app-ticket-create',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <a routerLink="/tickets" class="back-link">← Back to Tickets</a>
        <h1>New Ticket</h1>
      </div>
    </div>

    <div class="create-layout">
      <div class="form-card">
        <div class="field">
          <label>Title *</label>
          <input type="text" [(ngModel)]="form.title" (ngModelChange)="onTitleChange($event)"
                 placeholder="Brief description of the issue" />
        </div>

        <div class="field-row">
          <div class="field">
            <label>Module *</label>
            <select [(ngModel)]="form.AppModule">
              <option value="">Select module…</option>
              @for (m of modules; track m) { <option [value]="m">{{ m }}</option> }
            </select>
          </div>
          <div class="field">
            <label>Priority *</label>
            <select [(ngModel)]="form.priority">
              <option value="P3">P3 – Normal</option>
              <option value="P2">P2 – High</option>
              <option value="P1">P1 – Critical</option>
            </select>
          </div>
        </div>

        <div class="field">
          <label>Description *</label>
          <textarea [(ngModel)]="form.description" rows="6"
                    placeholder="Describe the issue in detail — steps to reproduce, error messages, affected users…"></textarea>
        </div>

        @if (error()) {
          <div class="alert-error">{{ error() }}</div>
        }

        <div class="form-actions">
          <a routerLink="/tickets" class="btn-ghost">Cancel</a>
          <button class="btn-primary" (click)="submit()" [disabled]="submitting()">
            {{ submitting() ? 'Submitting…' : 'Submit Ticket' }}
          </button>
        </div>
      </div>

      <div class="suggestions-panel">
        <div class="panel-title">
          <span>💡 Knowledge Base suggestions</span>
          @if (loadingSuggestions()) { <span class="spin">⟳</span> }
        </div>
        <p class="panel-hint">Suggestions update as you type the ticket title.</p>

        @if (suggestions().length === 0 && !loadingSuggestions()) {
          <p class="no-suggestions">Type a title to see relevant KB articles.</p>
        }

        @for (s of suggestions(); track s.articleId) {
          <a [routerLink]="['/kb', s.articleId]" target="_blank" class="suggestion-card">
            <div class="suggestion-header">
              <span class="suggestion-title">{{ s.title }}</span>
              <span class="suggestion-score">{{ (s.score * 100).toFixed(0) }}% match</span>
            </div>
            <div class="suggestion-meta">
              <span class="badge-module">{{ s.module }}</span>
              @if (s.symptoms) {
                <span class="suggestion-symptoms">{{ s.symptoms | slice:0:80 }}…</span>
              }
            </div>
          </a>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 1.5rem; }
    .back-link { font-size: 13px; color: #888; text-decoration: none; display: block; margin-bottom: 6px; }
    .back-link:hover { color: #555; }
    h1 { margin: 0; font-size: 24px; font-weight: 600; color: #1a1a2e; }

    .create-layout { display: grid; grid-template-columns: 1fr 340px; gap: 1.5rem; }

    .form-card {
      background: white; border-radius: 12px; border: 1px solid #e5e5e0;
      padding: 1.75rem;
    }
    .field { margin-bottom: 1.25rem; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    label { display: block; font-size: 13px; font-weight: 500; color: #444; margin-bottom: 6px; }
    input, select, textarea {
      width: 100%; padding: 9px 12px; border: 1px solid #ddd; border-radius: 7px;
      font-size: 14px; box-sizing: border-box; font-family: inherit; transition: border-color 0.15s;
    }
    input:focus, select:focus, textarea:focus { outline: none; border-color: #7c6fcd; }
    textarea { resize: vertical; }

    .alert-error {
      background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;
      padding: 10px 12px; color: #dc2626; font-size: 13px; margin-bottom: 1rem;
    }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 1rem; }
    .btn-primary {
      padding: 9px 20px; background: #1a1a2e; color: white; border: none;
      border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;
    }
    .btn-primary:disabled { opacity: 0.6; cursor: default; }
    .btn-ghost {
      padding: 9px 18px; background: white; border: 1px solid #ddd;
      border-radius: 8px; font-size: 14px; cursor: pointer; text-decoration: none; color: #555;
    }

    .suggestions-panel {
      background: white; border-radius: 12px; border: 1px solid #e5e5e0;
      padding: 1.25rem; height: fit-content;
    }
    .panel-title { font-size: 14px; font-weight: 600; color: #1a1a2e; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
    .panel-hint { font-size: 12px; color: #aaa; margin: 0 0 1rem; }
    .spin { display: inline-block; animation: spin 1s linear infinite; font-size: 14px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .no-suggestions { font-size: 13px; color: #bbb; text-align: center; padding: 1rem 0; }

    .suggestion-card {
      display: block; padding: 12px; border: 1px solid #e5e5e0; border-radius: 8px;
      text-decoration: none; margin-bottom: 8px; transition: all 0.15s;
    }
    .suggestion-card:hover { border-color: #7c6fcd; background: #faf9ff; }
    .suggestion-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 6px; }
    .suggestion-title { font-size: 13px; font-weight: 500; color: #1a1a2e; line-height: 1.4; }
    .suggestion-score { font-size: 11px; font-weight: 600; color: #7c6fcd; white-space: nowrap; }
    .badge-module {
      display: inline-block; font-size: 10px; padding: 2px 7px; border-radius: 4px;
      background: #ede9fe; color: #5b21b6; font-weight: 600; margin-right: 6px;
    }
    .suggestion-symptoms { font-size: 12px; color: #888; }
    .suggestion-meta { display: flex; align-items: baseline; flex-wrap: wrap; }

    @media (max-width: 900px) {
      .create-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class TicketCreateComponent {
  private ticketSvc = inject(TicketService);
  private kbSvc     = inject(KbService);
  private router    = inject(Router);

  form = { title: '', description: '', AppModule: '', priority: 'P3' };
  modules  = ['FINANCE','INVENTORY','SALES','TECHNICAL','HR','PROCUREMENT'];
  submitting       = signal(false);
  error            = signal('');
  suggestions      = signal<KbSuggestion[]>([]);
  loadingSuggestions = signal(false);

  private titleSubject = new Subject<string>();

  constructor() {
    this.titleSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.length < 4) { this.suggestions.set([]); return []; }
        this.loadingSuggestions.set(true);
        return this.kbSvc.suggest(q, 5);
      })
    ).subscribe({
      next: (results: any) => { this.suggestions.set(results ?? []); this.loadingSuggestions.set(false); },
      error: () => this.loadingSuggestions.set(false)
    });
  }

  onTitleChange(val: string) { this.titleSubject.next(val); }

  submit() {
    if (!this.form.title || !this.form.description || !this.form.AppModule) {
      this.error.set('Please fill in all required fields.'); return;
    }
    this.submitting.set(true);
    this.error.set('');
    this.ticketSvc.create(this.form).subscribe({
      next: t => this.router.navigate(['/tickets', t.id]),
      error: err => { this.error.set(err.error?.message ?? 'Failed to submit ticket.'); this.submitting.set(false); }
    });
  }
}
