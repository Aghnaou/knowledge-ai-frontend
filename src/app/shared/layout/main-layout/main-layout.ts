import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatIconModule, MatButtonModule,
    MatMenuModule, MatTooltipModule, MatDividerModule,
  ],
  template: `
    <mat-sidenav-container class="h-screen" style="background:var(--bg-000)">

      <!-- ── Sidebar ─────────────────────────────────── -->
      <mat-sidenav
        #sidenav
        [mode]="isMobile() ? 'over' : 'side'"
        [opened]="!isMobile()"
        style="width:240px; border:none; background:transparent;">

        <div class="sidebar-inner h-full flex flex-col">

          <!-- Brand -->
          <div class="sidebar-brand">
            <div class="brand-icon">
              <span class="brand-icon-inner">K</span>
            </div>
            <div>
              <div class="brand-name">KnowledgeAI</div>
              <div class="brand-tenant">{{ user()?.tenantName }}</div>
            </div>
          </div>

          <!-- Nav -->
          <nav class="sidebar-nav flex-1">
            <div class="nav-section-label">WORKSPACE</div>
            @for (item of visibleNavItems(); track item.route) {
              <a
                [routerLink]="item.route"
                routerLinkActive="nav-item-active"
                [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
                class="nav-item">
                <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
                <span>{{ item.label }}</span>
              </a>
            }
          </nav>

          <!-- User footer -->
          <div class="sidebar-footer">
            <button [matMenuTriggerFor]="userMenu" class="user-pill">
              <div class="user-avatar">{{ userInitials() }}</div>
              <div class="user-info">
                <div class="user-name">{{ user()?.firstName }} {{ user()?.lastName }}</div>
                <div class="user-role">{{ user()?.role }}</div>
              </div>
              <mat-icon class="user-chevron">unfold_more</mat-icon>
            </button>
          </div>
        </div>

        <mat-menu #userMenu xPosition="after" yPosition="above">
          <div class="menu-header">
            <div class="menu-user-email">{{ user()?.email }}</div>
          </div>
          <mat-divider></mat-divider>
          <button mat-menu-item routerLink="/settings">
            <mat-icon>tune</mat-icon><span>Settings</span>
          </button>
          <button mat-menu-item (click)="logout()" style="color:var(--rose)">
            <mat-icon style="color:var(--rose)">logout</mat-icon><span>Sign out</span>
          </button>
        </mat-menu>
      </mat-sidenav>

      <!-- ── Main content ─────────────────────────────── -->
      <mat-sidenav-content style="background:var(--bg-000)">
        @if (isMobile()) {
          <div class="mobile-bar">
            <button mat-icon-button (click)="sidenav.toggle()" style="color:var(--text-200)">
              <mat-icon>menu</mat-icon>
            </button>
            <div class="brand-name" style="font-size:1rem">KnowledgeAI</div>
          </div>
        }
        <div class="page-content">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>

    </mat-sidenav-container>
  `,
  styles: [`
    :host { display:block; height:100vh; }

    .sidebar-inner {
      background: linear-gradient(180deg, #0f0f1d 0%, #0a0a15 100%);
      border-right: 1px solid var(--border-xs);
      padding: 0;
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 22px 18px 18px;
      border-bottom: 1px solid var(--border-xs);
      margin-bottom: 8px;
    }
    .brand-icon {
      width: 36px; height: 36px;
      border-radius: 10px;
      background: var(--grad-primary);
      box-shadow: var(--glow-violet);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .brand-icon-inner {
      color: white;
      font-weight: 800;
      font-size: 1rem;
      letter-spacing: -0.05em;
    }
    .brand-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-100);
      letter-spacing: -0.02em;
    }
    .brand-tenant {
      font-size: 0.7rem;
      color: var(--text-500);
      font-weight: 400;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 140px;
    }

    .sidebar-nav {
      padding: 8px 10px;
      overflow-y: auto;
    }
    .nav-section-label {
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: var(--text-500);
      padding: 12px 10px 6px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: 10px;
      text-decoration: none;
      color: var(--text-400);
      font-size: 0.85rem;
      font-weight: 500;
      transition: all var(--transition);
      margin-bottom: 2px;
      cursor: pointer;
      user-select: none;

      &:hover {
        background: rgba(255,255,255,0.05);
        color: var(--text-200);
      }
    }
    .nav-item-active {
      background: rgba(139,92,246,0.15) !important;
      color: var(--violet-light) !important;
      box-shadow: inset 0 0 0 1px rgba(139,92,246,0.25);

      .nav-icon { color: var(--violet-light) !important; }
    }
    .nav-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      color: var(--text-500);
      transition: color var(--transition);
      font-family: 'Material Icons Round' !important;
    }

    .sidebar-footer {
      padding: 12px 10px;
      border-top: 1px solid var(--border-xs);
    }
    .user-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 8px 10px;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--border-sm);
      border-radius: 10px;
      cursor: pointer;
      transition: all var(--transition);
      text-align: left;

      &:hover { background: rgba(255,255,255,0.07); }
    }
    .user-avatar {
      width: 30px; height: 30px;
      border-radius: 8px;
      background: var(--grad-primary);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.7rem; font-weight: 700; color: white;
      flex-shrink: 0;
    }
    .user-info { flex: 1; min-width: 0; }
    .user-name {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-200);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-role {
      font-size: 0.65rem;
      color: var(--text-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .user-chevron {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      color: var(--text-500) !important;
      flex-shrink: 0;
    }

    .menu-header {
      padding: 10px 16px 8px;
    }
    .menu-user-email {
      font-size: 0.75rem;
      color: var(--text-400);
    }

    .mobile-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--bg-100);
      border-bottom: 1px solid var(--border-xs);
    }

    .page-content {
      padding: 28px 32px;
      height: calc(100vh - 0px);
      overflow-y: auto;
    }
  `],
})
export class MainLayoutComponent {
  private auth = inject(AuthService);
  private breakpoint = inject(BreakpointObserver);

  user = this.auth.currentUser;
  isMobile = toSignal(
    this.breakpoint.observe([Breakpoints.Handset]).pipe(map(r => r.matches)),
    { initialValue: false }
  );

  navItems: NavItem[] = [
    { label: 'Dashboard',  icon: 'space_dashboard', route: '/dashboard' },
    { label: 'Documents',  icon: 'description',     route: '/documents', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { label: 'Chat',       icon: 'auto_awesome',    route: '/chat' },
    { label: 'Analytics',  icon: 'bar_chart',       route: '/analytics', roles: ['ADMIN', 'MANAGER'] },
    { label: 'Users',      icon: 'group',           route: '/users',     roles: ['ADMIN'] },
    { label: 'Settings',   icon: 'tune',            route: '/settings',  roles: ['ADMIN'] },
  ];

  visibleNavItems() {
    return this.navItems.filter(i => !i.roles || this.auth.hasRole(...i.roles));
  }

  userInitials(): string {
    const u = this.user();
    if (!u) return '?';
    return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();
  }

  logout(): void { this.auth.logout(); }
}
