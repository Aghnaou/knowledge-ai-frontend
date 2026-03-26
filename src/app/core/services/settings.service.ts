import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface TenantSettings {
  llmProvider: string;
  llmModel: string;
  responseLanguage: string;
  maxDocuments: number;
  planType: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/api/settings`;

  getSettings(): Observable<ApiResponse<TenantSettings>> {
    return this.http.get<ApiResponse<TenantSettings>>(this.API);
  }

  updateLlm(llmProvider: string, llmModel: string): Observable<ApiResponse<TenantSettings>> {
    return this.http.put<ApiResponse<TenantSettings>>(`${this.API}/llm`, { llmProvider, llmModel });
  }

  updateLanguage(language: string): Observable<ApiResponse<TenantSettings>> {
    return this.http.put<ApiResponse<TenantSettings>>(`${this.API}/language`, { language });
  }
}
