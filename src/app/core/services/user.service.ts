import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { InviteResponse, InviteUserRequest, UpdateRoleRequest, User, UserPage } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/api/users`;

  list(page = 0, size = 10): Observable<ApiResponse<UserPage>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<UserPage>>(this.API, { params });
  }

  invite(req: InviteUserRequest): Observable<ApiResponse<InviteResponse>> {
    return this.http.post<ApiResponse<InviteResponse>>(`${this.API}/invite`, req);
  }

  updateRole(id: string, req: UpdateRoleRequest): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.API}/${id}/role`, req);
  }

  deactivate(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API}/${id}`);
  }
}
