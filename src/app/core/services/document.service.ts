import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Document, DocumentPage, UpdateCategoryRequest } from '../models/document.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/api/documents`;

  upload(file: File, category?: string, tags?: string[]): Observable<ApiResponse<Document>> {
    const form = new FormData();
    form.append('file', file);
    if (category) form.append('category', category);
    if (tags?.length) form.append('tags', tags.join(','));
    return this.http.post<ApiResponse<Document>>(`${this.API}/upload`, form);
  }

  list(page = 0, size = 10): Observable<ApiResponse<DocumentPage>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<DocumentPage>>(this.API, { params });
  }

  getById(id: string): Observable<ApiResponse<Document>> {
    return this.http.get<ApiResponse<Document>>(`${this.API}/${id}`);
  }

  getStatus(id: string): Observable<ApiResponse<{ status: string; chunkCount: number }>> {
    return this.http.get<ApiResponse<{ status: string; chunkCount: number }>>(`${this.API}/${id}/status`);
  }

  updateCategory(id: string, req: UpdateCategoryRequest): Observable<ApiResponse<Document>> {
    return this.http.put<ApiResponse<Document>>(`${this.API}/${id}/category`, req);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API}/${id}`);
  }
}
