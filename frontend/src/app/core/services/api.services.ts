import { map } from 'rxjs/operators';
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  TicketDetail, TicketSummary, Page, KbArticle, KbSuggestion,
  SlaPolicy, DashboardSummary, AgentWorkload
} from '../../shared/models/models';

const API = 'http://localhost:8080/api';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private http = inject(HttpClient);

  list(filters: Record<string, any> = {}) {
    // Backend expects parameter name 'AppModule' (enum). Accept 'module' from UI and map.
    if (filters['page'] == null) filters['page'] = 0;
    if (filters['size'] == null) filters['size'] = 10;
    if (filters['module'] && !filters['AppModule']) { filters['AppModule'] = filters['module']; delete filters['module']; }
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => { if (v != null) params = params.set(k, v); });
    return this.http.get<Page<TicketSummary>>(`${API}/tickets`, { params }).pipe(
      map(page => ({
        ...page,
        content: (page.content || []).map((t: any) => ({
          ...t,
          AppModule: t.AppModule ?? t.appModule
        }))
      }))
    );
  }

  get(id: number) {
    return this.http.get<TicketDetail>(`${API}/tickets/${id}`).pipe(
      map((t: any) => ({
        ...t,
        AppModule: t.AppModule ?? t.appModule
      }))
    );
  }

  create(body: { title: string; description: string; priority: string; AppModule: string }) {
    return this.http.post<TicketDetail>(`${API}/tickets`, body);
  }

  updateStatus(id: number, status: string) {
    return this.http.post<TicketDetail>(`${API}/tickets/${id}/status`, { status });
  }

  assign(id: number, agentId: number) {
    return this.http.post<TicketDetail>(`${API}/tickets/${id}/assign`, { agentId });
  }

  addComment(id: number, body: string, commentType: string = 'PUBLIC') {
    return this.http.post<Comment>(`${API}/tickets/${id}/comments`, { body, commentType });
  }
}

@Injectable({ providedIn: 'root' })
export class KbService {
  private http = inject(HttpClient);

  search(params: Record<string, any> = {}) {
    // Backend expects parameter name 'AppModule'. Accept 'module' and map.
    // Accept multiple names from UI and normalize to what backend expects
    if (params['appModule'] && !params['AppModule']) {
      params['AppModule'] = params['appModule'];
      delete params['appModule'];
    }
    if (params['module'] && !params['AppModule']) {
      params['AppModule'] = params['module'];
      delete params['module'];
    }

    // Search text key mapping (UI might send q/search/keyword, backend might expect query)
    if (params['q'] && !params['query']) { params['query'] = params['q']; delete params['q']; }
    if (params['search'] && !params['query']) { params['query'] = params['search']; delete params['search']; }
    if (params['keyword'] && !params['query']) { params['query'] = params['keyword']; delete params['keyword']; }
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) p = p.set(k, String(v));
    });
    return this.http.get<KbArticle[]>(`${API}/kb/articles`, { params: p }).pipe(
      map(list => (list || []).map((a: any) => ({
        ...a,
        AppModule: a.AppModule ?? a.appModule
      })))
    );
  }

  get(id: number) {
    return this.http.get<KbArticle>(`${API}/kb/articles/${id}`).pipe(
      map((a: any) => ({
        ...a,
        AppModule: a.AppModule ?? a.appModule
      }))
    );
  }

  create(body: any) {
    return this.http.post<KbArticle>(`${API}/kb/articles`, body);
  }

  update(id: number, body: any) {
    return this.http.put<KbArticle>(`${API}/kb/articles/${id}`, body);
  }

  publish(id: number) {
    return this.http.post<KbArticle>(`${API}/kb/articles/${id}/publish`, {});
  }

  unpublish(id: number) {
    return this.http.post<KbArticle>(`${API}/kb/articles/${id}/unpublish`, {});
  }

  suggest(query: string, topK = 5) {
    return this.http.get<KbSuggestion[]>(`${API}/recommendations/kb`, {
      params: { query, topK }
    });
  }
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  getDashboard()    { return this.http.get<DashboardSummary>(`${API}/admin/dashboard/summary`); }
  getAgentWorkload(){ return this.http.get<AgentWorkload[]>(`${API}/admin/dashboard/agent-workload`); }
  getSlaPolicies()  { return this.http.get<SlaPolicy[]>(`${API}/admin/sla-policies`); }

  updateSlaPolicy(priority: string, body: { firstResponseMinutes: number; resolutionMinutes: number }) {
    return this.http.put<SlaPolicy>(`${API}/admin/sla-policies/${priority}`, body);
  }

  getUsers() {
    return this.http.get<any[]>(`${API}/admin/users`);
  }
}
