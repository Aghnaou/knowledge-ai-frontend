import { Component, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { UserRole } from '../../../core/models/auth.model';

@Component({
  selector: 'app-invite-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatIconModule, ReactiveFormsModule],
  template: `
    <div class="invite-dialog">

      @if (tempPassword()) {
        <!-- SUCCESS STATE: show temp password -->
        <div class="dialog-header">
          <div class="dialog-icon success-icon">
            <mat-icon style="font-size:20px;width:20px;height:20px;color:#34d399">check_circle</mat-icon>
          </div>
          <div>
            <h2 class="dialog-title">Invite sent!</h2>
            <p class="dialog-sub">Share this temporary password with the new member</p>
          </div>
        </div>

        <div class="temp-password-box">
          <div class="temp-password-label">Temporary password</div>
          <div class="temp-password-value">{{ tempPassword() }}</div>
          <p class="temp-password-hint">
            The member will use this along with their email at
            <strong>/accept-invite</strong> to set a permanent password.
          </p>
        </div>

        <button class="copy-btn" (click)="copyPassword()">
          <mat-icon style="font-size:16px;margin-right:6px">{{ copied() ? 'check' : 'content_copy' }}</mat-icon>
          {{ copied() ? 'Copied!' : 'Copy password' }}
        </button>

        <div class="dialog-actions" style="margin-top:20px">
          <button class="send-btn" (click)="ref.close(true)">Done</button>
        </div>

      } @else {
        <!-- FORM STATE -->
        <div class="dialog-header">
          <div class="dialog-icon">
            <mat-icon style="font-size:20px;width:20px;height:20px;color:white">person_add</mat-icon>
          </div>
          <div>
            <h2 class="dialog-title">Invite team member</h2>
            <p class="dialog-sub">They'll join your workspace with the selected role</p>
          </div>
        </div>

        <form [formGroup]="form" class="dialog-form">
          <div class="name-row">
            <div class="field-group">
              <label class="field-label">First name</label>
              <mat-form-field appearance="outline" class="w-full">
                <input matInput formControlName="firstName" placeholder="Jane">
              </mat-form-field>
            </div>
            <div class="field-group">
              <label class="field-label">Last name</label>
              <mat-form-field appearance="outline" class="w-full">
                <input matInput formControlName="lastName" placeholder="Doe">
              </mat-form-field>
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">Email address</label>
            <mat-form-field appearance="outline" class="w-full">
              <input matInput type="email" formControlName="email" placeholder="jane@company.com">
            </mat-form-field>
          </div>

          <div class="field-group">
            <label class="field-label">Role</label>
            <mat-form-field appearance="outline" class="w-full">
              <mat-select formControlName="role">
                @for (r of roles; track r) {
                  <mat-option [value]="r">{{ r }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          @if (inviteError()) {
            <div class="error-banner">
              <mat-icon style="font-size:14px;width:14px;height:14px">error_outline</mat-icon>
              {{ inviteError() }}
            </div>
          }
        </form>

        <div class="dialog-actions">
          <button class="btn-ghost cancel-btn" mat-dialog-close>Cancel</button>
          <button class="send-btn" (click)="invite()" [disabled]="form.invalid || loading()">
            @if (loading()) { <mat-spinner diameter="16" style="display:inline-block;margin-right:8px"></mat-spinner> }
            Send Invite
          </button>
        </div>
      }

    </div>
  `,
  styles: [`
    .invite-dialog { padding:28px;min-width:420px; }
    .dialog-header { display:flex;align-items:center;gap:14px;margin-bottom:24px; }
    .dialog-icon { width:44px;height:44px;border-radius:12px;background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .success-icon { background:rgba(52,211,153,0.15);border-color:rgba(52,211,153,0.3); }
    .dialog-title { font-size:1.1rem;font-weight:700;color:var(--text-100);margin:0 0 2px; }
    .dialog-sub { font-size:0.8rem;color:var(--text-400);margin:0; }
    .dialog-form { display:flex;flex-direction:column;gap:4px; }
    .name-row { display:flex;gap:12px; }
    .field-group { flex:1;margin-bottom:4px; }
    .field-label { display:block;font-size:0.75rem;font-weight:600;color:var(--text-400);margin-bottom:5px; }
    .dialog-actions { display:flex;gap:10px;justify-content:flex-end;margin-top:20px; }
    .cancel-btn { padding:10px 18px!important;border-radius:var(--radius-md)!important;font-size:0.875rem!important;height:42px!important; }
    .send-btn { display:inline-flex;align-items:center;padding:10px 22px;border-radius:var(--radius-md);font-size:0.875rem;font-weight:600;background:var(--grad-primary);color:white;border:none;cursor:pointer;box-shadow:0 4px 16px rgba(139,92,246,0.3);height:42px;transition:all var(--transition); &:disabled{opacity:0.4;cursor:not-allowed;} &:hover:not(:disabled){box-shadow:0 6px 24px rgba(139,92,246,0.5);} }

    .temp-password-box {
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--border-sm);
      border-radius: var(--radius-md);
      padding: 18px 20px;
      margin-bottom: 14px;
    }
    .temp-password-label { font-size:0.72rem;font-weight:600;color:var(--text-400);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px; }
    .temp-password-value {
      font-size: 1.4rem;
      font-weight: 700;
      letter-spacing: 0.15em;
      color: var(--violet-light);
      font-family: monospace;
      margin-bottom: 10px;
    }
    .temp-password-hint { font-size:0.78rem;color:var(--text-500);margin:0;line-height:1.5; }

    .copy-btn {
      display:inline-flex;align-items:center;padding:8px 16px;border-radius:var(--radius-md);
      font-size:0.82rem;font-weight:600;border:1px solid var(--border-sm);
      background:rgba(255,255,255,0.04);color:var(--text-300);cursor:pointer;
      transition:all var(--transition);
      &:hover{background:rgba(255,255,255,0.08);}
    }

    .error-banner { display:flex;align-items:center;gap:6px;padding:8px 12px;background:rgba(251,113,133,.08);border:1px solid rgba(251,113,133,.2);border-radius:var(--radius-md);color:var(--rose);font-size:.78rem;margin-top:4px; }
  `],
})
export class InviteDialogComponent {
  private svc = inject(UserService);
  ref = inject(MatDialogRef<InviteDialogComponent>);
  private fb = inject(FormBuilder);

  loading = signal(false);
  tempPassword = signal('');
  copied = signal(false);
  inviteError = signal('');
  roles: UserRole[] = ['ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER'];

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    role:      ['EMPLOYEE' as UserRole, Validators.required],
  });

  invite(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.inviteError.set('');
    const v = this.form.value;
    this.svc.invite({ firstName: v.firstName!, lastName: v.lastName!, email: v.email!, role: v.role! }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.tempPassword.set(res.data.temporaryPassword);
      },
      error: (err) => {
        this.loading.set(false);
        this.inviteError.set(err.error?.message || 'Invite failed. The email may already be registered.');
      },
    });
  }

  copyPassword(): void {
    navigator.clipboard.writeText(this.tempPassword()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
