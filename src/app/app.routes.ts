import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // Redirect root
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Guest-only auth routes
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent),
  },
  {
    path: 'accept-invite',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/accept-invite/accept-invite').then(m => m.AcceptInviteComponent),
  },

  // Protected routes inside main layout
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/layout/main-layout/main-layout').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent),
      },
      {
        path: 'documents',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
        loadComponent: () => import('./features/documents/documents').then(m => m.DocumentsComponent),
      },
      {
        path: 'documents/:id',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
        loadComponent: () => import('./features/documents/document-detail/document-detail').then(m => m.DocumentDetailComponent),
      },
      {
        path: 'chat',
        loadComponent: () => import('./features/chat/chat').then(m => m.ChatComponent),
      },
      {
        path: 'chat/:id',
        loadComponent: () => import('./features/chat/chat').then(m => m.ChatComponent),
      },
      {
        path: 'analytics',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'MANAGER'] },
        loadComponent: () => import('./features/analytics/analytics').then(m => m.AnalyticsComponent),
      },
      {
        path: 'users',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () => import('./features/users/users').then(m => m.UsersComponent),
      },
      {
        path: 'settings',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () => import('./features/settings/settings').then(m => m.SettingsComponent),
      },
    ],
  },

  // Fallback
  { path: '**', redirectTo: 'dashboard' },
];
