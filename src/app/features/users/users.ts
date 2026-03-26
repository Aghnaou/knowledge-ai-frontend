import { Component, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { DatePipe } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user.model';
import { UserRole } from '../../core/models/auth.model';
import { InviteDialogComponent } from './invite-dialog/invite-dialog';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatMenuModule, MatDialogModule, MatSnackBarModule, MatProgressBarModule, MatTooltipModule, MatDividerModule, DatePipe],
  template: `
    <div class="users-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Team</h1>
          <p class="page-sub">Manage access and permissions</p>
        </div>
        <button class="invite-btn" (click)="openInvite()">
          <mat-icon style="font-size:18px;margin-right:6px">person_add</mat-icon>
          Invite Member
        </button>
      </div>

      <div class="table-card">
        @if (loading()) {
          <div class="loading-bar"><div class="loading-bar-inner"></div></div>
        }

        <table mat-table [dataSource]="users()" class="users-table">
          <ng-container matColumnDef="user">
            <th mat-header-cell *matHeaderCellDef>Member</th>
            <td mat-cell *matCellDef="let u">
              <div class="user-cell">
                <div class="user-av">{{ u.firstName[0] }}{{ u.lastName[0] }}</div>
                <div>
                  <div class="user-full">{{ u.firstName }} {{ u.lastName }}</div>
                  <div class="user-email">{{ u.email }}</div>
                </div>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Role</th>
            <td mat-cell *matCellDef="let u">
              <span class="badge" [class]="roleBadge(u.role)">{{ u.role }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let u">
              <div class="status-cell">
                <div class="pulse-dot" [class]="u.active ? 'pulse-dot-green' : 'pulse-dot-red'"></div>
                <span [style.color]="u.active ? 'var(--emerald)' : 'var(--rose)'" style="font-size:0.78rem;font-weight:500">
                  {{ u.active ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="joined">
            <th mat-header-cell *matHeaderCellDef>Joined</th>
            <td mat-cell *matCellDef="let u">
              <span style="font-size:0.8rem;color:var(--text-500)">{{ u.createdAt | date:'MMM d, y' }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let u">
              <button class="row-action-btn" [matMenuTriggerFor]="menu">
                <mat-icon style="font-size:16px;width:16px;height:16px">more_horiz</mat-icon>
              </button>
              <mat-menu #menu>
                @for (role of roles; track role) {
                  <button mat-menu-item (click)="changeRole(u, role)" [disabled]="u.role === role">
                    <mat-icon>{{ u.role === role ? 'check' : 'swap_horiz' }}</mat-icon> Set {{ role }}
                  </button>
                }
                <mat-divider></mat-divider>
                <button mat-menu-item (click)="deactivate(u)" [disabled]="!u.active" style="color:var(--rose)">
                  <mat-icon style="color:var(--rose)">person_off</mat-icon> Deactivate
                </button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let r; columns: cols;" class="table-row"></tr>

          @if (!loading() && users().length === 0) {
            <tr class="mat-row">
              <td [attr.colspan]="cols.length">
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:64px 24px;text-align:center;">
                  <mat-icon style="font-size:36px;width:36px;height:36px;color:var(--text-500);margin-bottom:12px">group</mat-icon>
                  <p style="font-size:0.9rem;color:var(--text-400);margin:0">No team members yet</p>
                </div>
              </td>
            </tr>
          }
        </table>
      </div>
    </div>
  `,
  styles: [`
    .users-page { max-width:1000px; }
    .page-header { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;gap:16px;flex-wrap:wrap; }
    .page-title { font-size:1.8rem;font-weight:700;color:var(--text-100);letter-spacing:-0.04em;margin:0 0 4px; }
    .page-sub { color:var(--text-400);font-size:0.875rem;margin:0; }
    .invite-btn { display:inline-flex;align-items:center;padding:10px 20px;border-radius:var(--radius-md);font-size:0.875rem;font-weight:600;background:var(--grad-primary);color:white;border:none;cursor:pointer;box-shadow:0 4px 20px rgba(139,92,246,0.35);transition:all var(--transition); &:hover{box-shadow:0 6px 28px rgba(139,92,246,0.5);transform:translateY(-1px);} }

    .table-card { background:rgba(255,255,255,0.02);border:1px solid var(--border-sm);border-radius:var(--radius-xl);overflow:hidden;position:relative; }
    .loading-bar { height:2px;overflow:hidden;position:absolute;top:0;left:0;right:0;z-index:2; }
    .loading-bar-inner { height:100%;background:var(--grad-primary);animation:loading-slide 1.5s ease-in-out infinite; }
    @keyframes loading-slide { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }

    .users-table { width:100%;background:transparent!important; }

    .user-cell { display:flex;align-items:center;gap:12px;padding:10px 0; }
    .user-av { width:36px;height:36px;border-radius:10px;background:rgba(139,92,246,0.18);border:1px solid rgba(139,92,246,0.25);display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:var(--violet-light);flex-shrink:0; }
    .user-full { font-size:0.875rem;font-weight:600;color:var(--text-200); }
    .user-email { font-size:0.75rem;color:var(--text-500);margin-top:1px; }

    .status-cell { display:flex;align-items:center;gap:8px; }
    .table-row { transition:background var(--transition); }
    .row-action-btn { width:30px;height:30px;border-radius:8px;background:transparent;border:1px solid transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-500);transition:all var(--transition); &:hover{background:rgba(255,255,255,0.06);border-color:var(--border-sm);color:var(--text-300);} }
  `],
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  cols = ['user', 'role', 'status', 'joined', 'actions'];
  users = signal<User[]>([]);
  loading = signal(false);
  roles: UserRole[] = ['ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER'];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.userService.list().subscribe({ next: r => { if (r.success) this.users.set(r.data.content); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  openInvite(): void {
    this.dialog.open(InviteDialogComponent, { width: '460px' }).afterClosed().subscribe(ok => { if (ok) { this.snack.open('Invitation sent.', 'OK', { duration: 2500 }); this.load(); } });
  }

  changeRole(u: User, role: UserRole): void {
    this.userService.updateRole(u.id, { role }).subscribe({ next: r => { if (r.success) { this.users.update(l => l.map(x => x.id === u.id ? { ...x, role } : x)); this.snack.open('Role updated.', 'OK', { duration: 2000 }); } } });
  }

  deactivate(u: User): void {
    if (!confirm(`Deactivate ${u.firstName}?`)) return;
    this.userService.deactivate(u.id).subscribe({ next: () => { this.users.update(l => l.map(x => x.id === u.id ? { ...x, active: false } : x)); this.snack.open('User deactivated.', 'OK', { duration: 2000 }); } });
  }

  roleBadge(r: UserRole): string { const m: Record<string,string> = {ADMIN:'badge-error',MANAGER:'badge-warning',EMPLOYEE:'badge-info',VIEWER:'badge-default'}; return m[r] ?? 'badge-default'; }
}
