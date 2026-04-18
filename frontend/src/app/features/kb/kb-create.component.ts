import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { KbService } from '../../core/services/api.services';

@Component({
  selector: 'app-kb-create',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <a routerLink="/kb" class="back-link">← Back to KB</a>
        <h1>New KB Article</h1>
      </div>
    </div>

    <div class="card">
      <div class="field">
        <label>Title *</label>
        <input type="text" [(ngModel)]="form.title" placeholder="Concise, searchable title" />
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
          <label>Tags (comma-separated)</label>
          <input type="text" [(ngModel)]="tagsRaw" placeholder="e.g. login, password, access" />
        </div>
      </div>
      <div class="field">
        <label>Symptoms</label>
        <textarea [(ngModel)]="form.symptoms" rows="2"
                  placeholder="What does the user experience? Error messages, screens affected…"></textarea>
      </div>
      <div class="field">
        <label>Root Cause</label>
        <textarea [(ngModel)]="form.rootCause" rows="2"
                  placeholder="What typically causes this issue?"></textarea>
      </div>
      <div class="field">
        <label>Resolution Steps *</label>
        <textarea [(ngModel)]="form.resolutionSteps" rows="6"
                  placeholder="Step-by-step instructions to resolve the issue…"></textarea>
      </div>

      @if (error()) { <div class="alert-error">{{ error() }}</div> }

      <div class="form-actions">
        <a routerLink="/kb" class="btn-ghost">Cancel</a>
        <button class="btn-secondary" (click)="submit(false)" [disabled]="submitting()">Save as Draft</button>
        <button class="btn-primary" (click)="submit(true)" [disabled]="submitting()">Publish</button>
      </div>
    </div>
  `,
  styles: [`
    .back-link { font-size: 13px; color: #888; text-decoration: none; display: block; margin-bottom: 6px; }
    h1 { margin: 0; font-size: 24px; font-weight: 600; color: #1a1a2e; }
    .card { background: white; border-radius: 12px; border: 1px solid #e5e5e0; padding: 1.75rem; }
    .field { margin-bottom: 1.25rem; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    label { display: block; font-size: 13px; font-weight: 500; color: #444; margin-bottom: 6px; }
    input, select, textarea {
      width: 100%; padding: 9px 12px; border: 1px solid #ddd; border-radius: 7px;
      font-size: 14px; box-sizing: border-box; font-family: inherit;
    }
    input:focus, select:focus, textarea:focus { outline: none; border-color: #7c6fcd; }
    textarea { resize: vertical; }
    .alert-error { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 12px; color: #dc2626; font-size: 13px; margin-bottom: 1rem; }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; }
    .btn-primary { padding: 9px 20px; background: #1a1a2e; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.6; }
    .btn-secondary { padding: 9px 20px; background: white; color: #1a1a2e; border: 1px solid #1a1a2e; border-radius: 8px; font-size: 14px; cursor: pointer; }
    .btn-ghost { padding: 9px 18px; background: white; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; cursor: pointer; text-decoration: none; color: #555; }
  `]
})
export class KbCreateComponent {
  private kbSvc  = inject(KbService);
  private router = inject(Router);

  form = { title: '', AppModule: '', symptoms: '', rootCause: '', resolutionSteps: '' };
  tagsRaw  = '';
  submitting = signal(false);
  error      = signal('');
  modules    = ['FINANCE','INVENTORY','SALES','TECHNICAL','HR','PROCUREMENT'];

  submit(publish: boolean) {
    if (!this.form.title || !this.form.AppModule || !this.form.resolutionSteps) {
      this.error.set('Title, module, and resolution steps are required.'); return;
    }
    this.submitting.set(true);
    const tags = this.tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
    this.kbSvc.create({ ...this.form, tags }).subscribe({
      next: article => {
        if (publish) {
          this.kbSvc.publish(article.id).subscribe(a => this.router.navigate(['/kb', a.id]));
        } else {
          this.router.navigate(['/kb', article.id]);
        }
      },
      error: err => { this.error.set(err.error?.message ?? 'Failed to save.'); this.submitting.set(false); }
    });
  }
}
