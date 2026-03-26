import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const pw = control.get('newPassword')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-accept-invite',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-shell">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>

      <div class="auth-card glass-elevated">

        <div class="auth-logo">
          <div class="logo-icon">K</div>
        </div>
        <h1 class="auth-title">Set up your account</h1>
        <p class="auth-sub">Enter the temporary password your admin shared, then choose a new one.</p>

        @if (success()) {
          <div class="success-banner">
            <mat-icon style="font-size:20px;width:20px;height:20px;color:var(--emerald)">check_circle</mat-icon>
            <span>Password set! Redirecting…</span>
          </div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">

            <div class="field-group">
              <label class="field-label">Your email address</label>
              <mat-form-field appearance="outline" class="w-full">
                <input matInput type="email" formControlName="email" placeholder="you@company.com">
                <mat-icon matSuffix style="color:var(--text-500);font-size:18px">alternate_email</mat-icon>
                @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
                  <mat-error>Email is required</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="field-group">
              <label class="field-label">Temporary password (from admin)</label>
              <mat-form-field appearance="outline" class="w-full">
                <input matInput [type]="showTemp() ? 'text' : 'password'" formControlName="temporaryPassword" placeholder="Paste temp password here">
                <button mat-icon-button matSuffix type="button" (click)="showTemp.set(!showTemp())" style="color:var(--text-500)">
                  <mat-icon style="font-size:18px">{{ showTemp() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (form.get('temporaryPassword')?.hasError('required') && form.get('temporaryPassword')?.touched) {
                  <mat-error>Temporary password is required</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="field-group">
              <label class="field-label">New password</label>
              <mat-form-field appearance="outline" class="w-full">
                <input matInput [type]="showNew() ? 'text' : 'password'" formControlName="newPassword" placeholder="Min. 6 characters">
                <button mat-icon-button matSuffix type="button" (click)="showNew.set(!showNew())" style="color:var(--text-500)">
                  <mat-icon style="font-size:18px">{{ showNew() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (form.get('newPassword')?.hasError('minlength') && form.get('newPassword')?.touched) {
                  <mat-error>At least 6 characters required</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="field-group">
              <label class="field-label">Confirm new password</label>
              <mat-form-field appearance="outline" class="w-full">
                <input matInput [type]="showNew() ? 'text' : 'password'" formControlName="confirmPassword" placeholder="Repeat new password">
                @if (form.hasError('mismatch') && form.get('confirmPassword')?.touched) {
                  <mat-error>Passwords do not match</mat-error>
                }
              </mat-form-field>
            </div>

            @if (error()) {
              <div class="error-banner">
                <mat-icon style="font-size:16px;width:16px;height:16px">error_outline</mat-icon>
                <span>{{ error() }}</span>
              </div>
            }

            <button
              mat-flat-button
              type="submit"
              class="btn-primary submit-btn"
              [disabled]="loading() || form.invalid">
              @if (loading()) {
                <mat-spinner diameter="18" style="display:inline-block;margin-right:8px"></mat-spinner>
                Activating account…
              } @else {
                Activate my account
              }
            </button>
          </form>
        }

        <p class="auth-footer" style="margin-top:20px">
          Already have a password?
          <a routerLink="/login" class="auth-link">Sign in</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-shell {
      min-height: 100vh;
      background: var(--bg-000);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      position: relative;
      overflow: hidden;
    }
    .orb { position:absolute; border-radius:50%; filter:blur(80px); pointer-events:none; }
    .orb-1 { width:500px;height:500px; background:radial-gradient(circle,rgba(139,92,246,.18) 0%,transparent 70%); top:-200px;left:-100px; }
    .orb-2 { width:400px;height:400px; background:radial-gradient(circle,rgba(99,102,241,.12) 0%,transparent 70%); bottom:-150px;right:-100px; }

    .auth-card { width:100%;max-width:460px;padding:40px 36px;position:relative;z-index:1; }

    .auth-logo { display:flex;justify-content:center;margin-bottom:24px; }
    .logo-icon {
      width:52px;height:52px;border-radius:16px;
      background:var(--grad-primary);
      box-shadow:0 0 40px rgba(139,92,246,.4),0 8px 24px rgba(139,92,246,.3);
      display:flex;align-items:center;justify-content:center;
      font-size:1.5rem;font-weight:800;color:white;letter-spacing:-.05em;
    }
    .auth-title { text-align:center;font-size:1.6rem;font-weight:700;color:var(--text-100);margin:0 0 8px;letter-spacing:-.03em; }
    .auth-sub { text-align:center;color:var(--text-400);font-size:0.875rem;margin:0 0 28px;line-height:1.5; }

    .auth-form { display:flex;flex-direction:column;gap:4px; }
    .field-group { margin-bottom:8px; }
    .field-label { display:block;font-size:.78rem;font-weight:600;color:var(--text-300);margin-bottom:6px;letter-spacing:.01em; }

    .error-banner {
      display:flex;align-items:center;gap:8px;padding:10px 14px;
      background:rgba(251,113,133,.1);border:1px solid rgba(251,113,133,.25);
      border-radius:var(--radius-md);color:var(--rose);font-size:.82rem;margin-bottom:4px;
    }
    .success-banner {
      display:flex;align-items:center;gap:10px;padding:14px 16px;
      background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.25);
      border-radius:var(--radius-md);color:var(--emerald);font-size:.9rem;margin-bottom:12px;
    }

    .submit-btn { width:100%!important;height:46px!important;font-size:.9rem!important;margin-top:8px; }

    .auth-footer { text-align:center;color:var(--text-400);font-size:.82rem;margin:0; }
    .auth-link { color:var(--violet-light);font-weight:600;text-decoration:none; &:hover{text-decoration:underline;} }
  `],
})
export class AcceptInviteComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  success = signal(false);
  error = signal('');
  showTemp = signal(false);
  showNew = signal(false);

  form = this.fb.group({
    email:             ['', [Validators.required, Validators.email]],
    temporaryPassword: ['', Validators.required],
    newPassword:       ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword:   ['', Validators.required],
  }, { validators: passwordsMatch });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const { email, temporaryPassword, newPassword } = this.form.value;
    this.auth.acceptInvite({ email: email!, temporaryPassword: temporaryPassword!, newPassword: newPassword! }).subscribe({
      next: () => {
        this.success.set(true);
        setTimeout(() => this.router.navigate([this.auth.defaultRoute()]), 1200);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Invalid email or temporary password.');
      },
    });
  }
}
