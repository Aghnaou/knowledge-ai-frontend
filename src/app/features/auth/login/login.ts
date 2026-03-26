import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <div class="auth-shell">

      <!-- Background orbs -->
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>

      <div class="auth-card glass-elevated">

        <!-- Logo -->
        <div class="auth-logo">
          <div class="logo-icon">K</div>
        </div>
        <h1 class="auth-title">Welcome back</h1>
        <p class="auth-sub">Sign in to your workspace</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="field-group">
            <label class="field-label">Email address</label>
            <mat-form-field appearance="outline" class="w-full">
              <input matInput type="email" formControlName="email" placeholder="you@company.com">
              <mat-icon matSuffix style="color:var(--text-500);font-size:18px">alternate_email</mat-icon>
              @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
                <mat-error>Email is required</mat-error>
              }
              @if (form.get('email')?.hasError('email')) {
                <mat-error>Enter a valid email</mat-error>
              }
            </mat-form-field>
          </div>

          <div class="field-group">
            <label class="field-label">Password</label>
            <mat-form-field appearance="outline" class="w-full">
              <input matInput [type]="showPwd() ? 'text' : 'password'" formControlName="password" placeholder="••••••••">
              <button mat-icon-button matSuffix type="button" (click)="showPwd.set(!showPwd())" style="color:var(--text-500)">
                <mat-icon style="font-size:18px">{{ showPwd() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
                <mat-error>Password is required</mat-error>
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
              Signing in...
            } @else {
              Sign in
            }
          </button>
        </form>

        <div class="auth-footer-links">
          <p class="auth-footer">
            Don't have an account?
            <a routerLink="/register" class="auth-link">Create workspace</a>
          </p>
          <p class="auth-footer">
            Received an invite?
            <a routerLink="/accept-invite" class="auth-link">Set up your account</a>
          </p>
        </div>
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

    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
    }
    .orb-1 {
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%);
      top: -200px; left: -100px;
      animation: orb-float 8s ease-in-out infinite alternate;
    }
    .orb-2 {
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
      bottom: -150px; right: -100px;
      animation: orb-float 10s ease-in-out infinite alternate-reverse;
    }
    .orb-3 {
      width: 300px; height: 300px;
      background: radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%);
      top: 50%; left: 50%;
      transform: translate(-50%,-50%);
    }
    @keyframes orb-float {
      from { transform: translate(0,0) scale(1); }
      to   { transform: translate(30px, 20px) scale(1.05); }
    }

    .auth-card {
      width: 100%;
      max-width: 420px;
      padding: 40px 36px;
      position: relative;
      z-index: 1;
    }

    .auth-logo {
      display: flex;
      justify-content: center;
      margin-bottom: 24px;
    }
    .logo-icon {
      width: 52px; height: 52px;
      border-radius: 16px;
      background: var(--grad-primary);
      box-shadow: 0 0 40px rgba(139,92,246,0.4), 0 8px 24px rgba(139,92,246,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem;
      font-weight: 800;
      color: white;
      letter-spacing: -0.05em;
    }

    .auth-title {
      text-align: center;
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--text-100);
      margin: 0 0 8px;
      letter-spacing: -0.03em;
    }
    .auth-sub {
      text-align: center;
      color: var(--text-400);
      font-size: 0.875rem;
      margin: 0 0 28px;
    }

    .auth-form { display: flex; flex-direction: column; gap: 4px; }

    .field-group { margin-bottom: 8px; }
    .field-label {
      display: block;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-300);
      margin-bottom: 6px;
      letter-spacing: 0.01em;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: rgba(251,113,133,0.1);
      border: 1px solid rgba(251,113,133,0.25);
      border-radius: var(--radius-md);
      color: var(--rose);
      font-size: 0.82rem;
      margin-bottom: 4px;
    }

    .submit-btn {
      width: 100% !important;
      height: 46px !important;
      font-size: 0.9rem !important;
      margin-top: 8px;
    }

    .auth-footer-links {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .auth-footer {
      text-align: center;
      color: var(--text-400);
      font-size: 0.82rem;
      margin: 0;
    }
    .auth-link {
      color: var(--violet-light);
      font-weight: 600;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }
  `],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  loading = signal(false);
  showPwd = signal(false);
  error = signal('');

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.value;
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: () => this.router.navigate([this.auth.defaultRoute()]),
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Invalid credentials. Please try again.');
      },
    });
  }
}
