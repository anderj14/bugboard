import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CreateBugDto } from '../models/create-bug-dto';
import { Observable } from 'rxjs';
import { Bug } from '../models/bug';

@Injectable({
  providedIn: 'root',
})

export class BugService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000/api';

  createBug(dto: CreateBugDto): Observable<Bug> {
    return this.http.post<Bug>(this.apiUrl + '/bugs', dto);
  }

  getBugs(filters?: {
    severity?: string;
    status?: string;
    module?: string;
  }): Observable<Bug[]> {
    let params = new HttpParams();

    if (filters?.severity) params = params.set('severity', filters.severity);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.module) params = params.set('module', filters.module);

    return this.http.get<Bug[]>(this.apiUrl + '/bugs', { params });
  }

  getBugById(id: string): Observable<Bug> {
    return this.http.get<Bug>(`${this.apiUrl}/bugs/${id}`);
  }

  updateBug(id: string, status: string): Observable<Bug> {
    return this.http.patch<Bug>(`${this.apiUrl}/bugs/${id}/status`, { status });
  }

  classifyPreview(description: string): Observable<Bug> {
    return this.http.post<Bug>(this.apiUrl + '/bugs/preview', { raw_description: description });
  }

  updateStatus(id: string, status: string): Observable<Bug> {
    return this.http.patch<Bug>(`${this.apiUrl}/bugs/${id}/status`, { status });
  }

  getMetricsSummary(): Observable<any> {
    return this.http.get(`${this.apiUrl}/metrics/summary`);
  }

  getMetricsBySeverity(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/metrics/by-severity`);
  }

  getMetricsByModule(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/metrics/by-module`);
  }

  getMetricsByStatus(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/metrics/by-status`);
  }

  getMetricsTimeline(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/metrics/timeline`);
  }
}
