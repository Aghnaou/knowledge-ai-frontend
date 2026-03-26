import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AnalyticsOverview, DailyQuestions, TopDocument, TopTopic, UserActivity } from '../models/analytics.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/api/analytics`;

  getOverview(): Observable<ApiResponse<AnalyticsOverview>> {
    return this.http.get<ApiResponse<AnalyticsOverview>>(`${this.API}/overview`);
  }

  getDailyQuestions(): Observable<ApiResponse<DailyQuestions[]>> {
    return this.http.get<ApiResponse<DailyQuestions[]>>(`${this.API}/questions`);
  }

  getTopTopics(): Observable<ApiResponse<TopTopic[]>> {
    return this.http.get<ApiResponse<TopTopic[]>>(`${this.API}/top-topics`);
  }

  getTopDocuments(): Observable<ApiResponse<TopDocument[]>> {
    return this.http.get<ApiResponse<TopDocument[]>>(`${this.API}/documents`);
  }

  getUserActivity(): Observable<ApiResponse<UserActivity[]>> {
    return this.http.get<ApiResponse<UserActivity[]>>(`${this.API}/users`);
  }
}
