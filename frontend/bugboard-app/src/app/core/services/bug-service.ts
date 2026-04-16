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
  private apiUrl = 'http://127.0.0.1:8000/api/bugs';

  createBug(dto: CreateBugDto): Observable<Bug> {
    return this.http.post<Bug>(this.apiUrl + '/', dto);
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

    return this.http.get<Bug[]>(this.apiUrl + '/', { params });
  }

  getBugById(id: string): Observable<Bug> {
    return this.http.get<Bug>(`${this.apiUrl}/${id}`);
  }

  updateBug(id: string, status: string): Observable<Bug> {
    return this.http.patch<Bug>(`${this.apiUrl}/${id}/status`, { status });
  }

  classifyPreview(description: string): Observable<Bug> {
    return this.http.post<Bug>(this.apiUrl + '/preview', { raw_description: description });
  }
}
