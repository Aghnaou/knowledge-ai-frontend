import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AcceptInviteRequest, AuthResponse, LoginRequest, RegisterRequest, UserInfo } from '../models/auth.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API = `${environment.apiUrl}/api/auth`;
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';

  currentUser = signal<UserInfo | null>(this.loadUser());

  login(req: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API}/login`, req).pipe(
      tap(res => {
        if (res.success) this.saveSession(res.data);
      })
    );
  }

  register(req: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API}/register`, req).pipe(
      tap(res => {
        if (res.success) this.saveSession(res.data);
      })
    );
  }

  refresh(): Observable<ApiResponse<AuthResponse>> {
    const token = this.getRefreshToken();
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API}/refresh`, { refreshToken: token }).pipe(
      tap(res => {
        if (res.success) this.saveSession(res.data);
      })
    );
  }

  acceptInvite(req: AcceptInviteRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API}/accept-invite`, req).pipe(
      tap(res => {
        if (res.success) this.saveSession(res.data);
      })
    );
  }

  logout(): void {
    this.http.post(`${this.API}/logout`, {}).subscribe();
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(...roles: string[]): boolean {
    const user = this.currentUser();
    return user ? roles.includes(user.role) : false;
  }

  /** Returns the default landing route for the current user's role. */
  defaultRoute(): string {
    const user = this.currentUser();
    if (!user) return '/login';
    if (user.role === 'EMPLOYEE' || user.role === 'VIEWER') return '/chat';
    return '/dashboard';
  }

  private saveSession(data: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, data.accessToken);
    localStorage.setItem(this.REFRESH_KEY, data.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
    this.currentUser.set(data.user);
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
  }

  private loadUser(): UserInfo | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
