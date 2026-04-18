import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { KbService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { KbArticle } from '../../shared/models/models';

@Component({
  selector: 'app-kb-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Knowledge Base</h1>
        <p class="subtitle">{{ articles().length }} articles</p>
      </div>
      @if (auth.hasRole('AGENT','ADMIN')) {
        <a routerLink="/kb/new" class="btn-primary">+ New Article</a>
      }
    </div>

    <div class="filters">
      <input type="text" [(ngModel)]="keyword" (input)="load()"
             placeholder="Search articles…" class="search-input" />
      <select [(ngModel)]="module" (change)="load()">
        <option value="">All Modules</option>
        @for (m of modules; track m) { <option [value]="m">{{ m }}</option> }
      </select>
      @if (auth.hasRole('AGENT','ADMIN')) {
        <select [(ngModel)]="status" (change)="load()">
          <option value="">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
        </select>
      }
    </div>

    <div class="kb-grid">
      @for (a of articles(); track a.id) {
        <a [routerLink]="['/kb', a.id]" class="kb-card">
          <div class="kb-card-header">
            <span class="module-badge">{{ a.appModule ?? a.module }}</span>
            <span class="status-badge" [class.published]="a.status === 'PUBLISHED'">
              {{ a.status }}
            </span>
          </div>
          <div class="kb-title">{{ a.title }}</div>
          @if (a.symptoms) {
            <div class="kb-symptoms">{{ a.symptoms | slice:0:100 }}…</div>
          }
          <div class="kb-tags">
            @for (tag of (a.tags ?? []).slice(0,3); track tag) {
              <span class="tag">{{ tag }}</span>
            }
          </div>
        </a>
      }
    </div>

    @if (!loading() && articles().length === 0) {
      <div class="empty">No KB articles found.</div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    h1 { margin: 0; font-size: 24px; font-weight: 600; color: #1a1a2e; }
    .subtitle { margin: 4px 0 0; color: #888; font-size: 14px; }
    .btn-primary {
      padding: 9px 18px; background: #1a1a2e; color: white; border: none;
      border-radius: 8px; font-size: 14px; font-weight: 500; text-decoration: none;
    }
    .filters { display: flex; gap: 10px; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .search-input { flex: 1; min-width: 200px; }
    .filters input, .filters select {
      padding: 8px 12px; border: 1px solid #ddd; border-radius: 7px; font-size: 13px;
    }
    .kb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
    .kb-card {
      background: white; border-radius: 12px; border: 1px solid #e5e5e0;
      padding: 1.25rem; text-decoration: none; display: block; transition: all 0.15s;
    }
    .kb-card:hover { border-color: #7c6fcd; box-shadow: 0 2px 12px rgba(124,111,205,0.1); }
    .kb-card-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .module-badge {
      font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 4px;
      background: #ede9fe; color: #5b21b6; text-transform: uppercase;
    }
    .status-badge { font-size: 10px; padding: 2px 8px; border-radius: 4px; background: #f3f4f6; color: #6b7280; font-weight: 600; }
    .status-badge.published { background: #dcfce7; color: #166534; }
    .kb-title { font-size: 14px; font-weight: 600; color: #1a1a2e; line-height: 1.4; margin-bottom: 8px; }
    .kb-symptoms { font-size: 13px; color: #888; line-height: 1.5; margin-bottom: 10px; }
    .kb-tags { display: flex; gap: 6px; flex-wrap: wrap; }
    .tag { font-size: 11px; background: #f5f5f0; color: #666; padding: 2px 8px; border-radius: 4px; }
    .empty { text-align: center; padding: 3rem; color: #888; }
  `]
})
export class KbListComponent implements OnInit {
  private kbSvc = inject(KbService);
  auth = inject(AuthService);

  articles = signal<KbArticle[]>([]);
  loading  = signal(false);
  keyword  = '';
  module   = '';
  status   = 'PUBLISHED';
  modules  = ['FINANCE','INVENTORY','SALES','TECHNICAL','HR','PROCUREMENT'];

  ngOnInit() { this.load(); }

  load() {
    const p: any = {};
    if (this.keyword) p['query']  = this.keyword;
    if (this.module)  p['module'] = this.module;
    if (this.status)  p['status'] = this.status;

    this.kbSvc.search(p).subscribe(a => this.articles.set(a));
  }
}
