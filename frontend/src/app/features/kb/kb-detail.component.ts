import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { KbService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { KbArticle } from '../../shared/models/models';

@Component({
  selector: 'app-kb-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  template: `
    @if (loading()) { <div class="loading">Loading…</div> }
    @else if (article()) {
      <div class="page-header">
        <div>
          <a routerLink="/kb" class="back-link">← Knowledge Base</a>
          <h1>{{ article()!.title }}</h1>
        </div>
        <div class="header-actions">
          <span class="module-badge">{{ article()!.module }}</span>
          <span class="status-badge" [class.published]="article()!.status === 'PUBLISHED'">
            {{ article()!.status }}
          </span>
          @if (auth.hasRole('AGENT','ADMIN')) {
            @if (article()!.status === 'DRAFT') {
              <button class="btn-publish" (click)="publish()">Publish</button>
            } @else {
              <button class="btn-unpublish" (click)="unpublish()">Unpublish</button>
            }
          }
        </div>
      </div>

      <div class="article-layout">
        <div class="article-body">
          @if (article()!.symptoms) {
            <div class="section">
              <div class="section-label">Symptoms</div>
              <p>{{ article()!.symptoms }}</p>
            </div>
          }
          @if (article()!.rootCause) {
            <div class="section">
              <div class="section-label">Root Cause</div>
              <p>{{ article()!.rootCause }}</p>
            </div>
          }
          <div class="section">
            <div class="section-label">Resolution Steps</div>
            <pre class="steps">{{ article()!.resolutionSteps }}</pre>
          </div>
        </div>

        <div class="article-meta">
          <div class="card">
            <div class="meta-row"><span class="ml">Author</span><span class="mv">{{ article()!.createdBy.fullName }}</span></div>
            <div class="meta-row"><span class="ml">Created</span><span class="mv">{{ article()!.createdAt | date:'dd MMM yyyy' }}</span></div>
            <div class="meta-row"><span class="ml">Updated</span><span class="mv">{{ article()!.updatedAt | date:'dd MMM yyyy' }}</span></div>
          </div>
          @if ((article()!.tags ?? []).length > 0) {
            <div class="card">
              <div class="section-label">Tags</div>
              <div class="tags">
                @for (t of article()!.tags; track t) {
                  <span class="tag">{{ t }}</span>
                }
              </div>
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
    h1 { margin: 0; font-size: 20px; font-weight: 600; color: #1a1a2e; max-width: 620px; line-height: 1.3; }
    .header-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .module-badge { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 5px; background: #ede9fe; color: #5b21b6; }
    .status-badge { font-size: 11px; padding: 3px 10px; border-radius: 5px; background: #f3f4f6; color: #6b7280; font-weight: 600; }
    .status-badge.published { background: #dcfce7; color: #166534; }
    .btn-publish   { padding: 6px 14px; background: #1a1a2e; color: white; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; }
    .btn-unpublish { padding: 6px 14px; background: white; color: #dc2626; border: 1px solid #fecaca; border-radius: 6px; font-size: 13px; cursor: pointer; }

    .article-layout { display: grid; grid-template-columns: 1fr 240px; gap: 1.25rem; }
    .article-body { background: white; border-radius: 12px; border: 1px solid #e5e5e0; padding: 1.75rem; }
    .section { margin-bottom: 1.75rem; }
    .section-label { font-size: 12px; font-weight: 600; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem; }
    p { margin: 0; font-size: 14px; color: #444; line-height: 1.7; }
    .steps { font-family: inherit; font-size: 14px; color: #333; line-height: 1.7; white-space: pre-wrap; margin: 0; }

    .article-meta { }
    .card { background: white; border-radius: 12px; border: 1px solid #e5e5e0; padding: 1rem; margin-bottom: 1rem; }
    .meta-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f5f5f0; }
    .meta-row:last-child { border-bottom: none; }
    .ml { font-size: 12px; color: #aaa; }
    .mv { font-size: 12px; color: #333; font-weight: 500; text-align: right; }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .tag { font-size: 11px; background: #f5f5f0; color: #666; padding: 3px 8px; border-radius: 4px; }

    @media (max-width: 800px) { .article-layout { grid-template-columns: 1fr; } }
  `]
})
export class KbDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private kbSvc = inject(KbService);
  auth          = inject(AuthService);

  article = signal<KbArticle | null>(null);
  loading = signal(true);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.kbSvc.get(id).subscribe({
      next: a => { this.article.set(a); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  publish() {
    this.kbSvc.publish(this.article()!.id).subscribe(a => this.article.set(a));
  }
  unpublish() {
    this.kbSvc.unpublish(this.article()!.id).subscribe(a => this.article.set(a));
  }
}
