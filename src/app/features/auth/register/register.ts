import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

function slugify(v: string): string {
  return v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatStepperModule, MatSnackBarModule,
  ],
  template: `
    <div class="auth-shell">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>

      <div class="auth-card glass-elevated">
        <div class="auth-logo">
          <div class="logo-icon">K</div>
        </div>
        <h1 class="auth-title">Create workspace</h1>
        <p class="auth-sub">Set up your team's knowledge base</p>

        <!-- Step indicators -->
        <div class="steps-row">
          <div class="step-item" [class.step-active]="currentStep() === 0" [class.step-done]="currentStep() > 0">
            <div class="step-circle">{{ currentStep() > 0 ? '✓' : '1' }}</div>
            <span>Company</span>
          </div>
          <div class="step-line" [class.step-line-done]="currentStep() > 0"></div>
          <div class="step-item" [class.step-active]="currentStep() === 1">
            <div class="step-circle">2</div>
            <span>Personal</span>
          </div>
        </div>

        <!-- Step 1 -->
        @if (currentStep() === 0) {
          <form [formGroup]="companyForm" class="auth-form" (ngSubmit)="nextStep()">
            <div class="field-group">
              <label class="field-label">Company name</label>
              <mat-form-field appearance="outline" class="w-full">
                <input matInput formControlName="companyName" placeholder="Acme Corp" (input)="onNameChange($event)">
                <mat-icon matSuffix style="color:var(--text-500);font-size:18px">business</mat-icon>
              </mat-form-field>
            </div>
            <div class="field-group">
              <label class="field-label">Workspace URL</label>
              <mat-form-field appearance="outline" class="w-full">
                <input matInput formControlName="companySlug" placeholder="acme-corp">
                <mat-hint style="color:var(--text-500)">app.knowledgeai.io/{{ companyForm.value.companySlug || 'your-slug' }}</mat-hint>
              </mat-form-field>
            </div>
            <button mat-flat-button type="submit" class="btn-primary submit-btn" [disabled]="companyForm.invalid">
              Continue <mat-icon style="font-size:18px;margin-left:4px">arrow_forward</mat-icon>
            </button>
          </form>
        }

        <!-- Step 2 -->
        @if (currentStep() === 1) {
          <form [formGroup]="personalForm" class="auth-form" (ngSubmit)="onSubmit()">
            <div class="name-row">
              <div class="field-group flex-1">
                <label class="field-label">First name</label>
                <mat-form-field appearance="outline" class="w-full">
                  <input matInput formControlName="firstName" placeholder="Jane">
                </mat-form-field>
              </div>
              <div class="field-group flex-1">
                <label class="field-label">Last name</label>
                <mat-form-field appearance="outline" class="w-full">
                  <input matInput formControlName="lastName" placeholder="Doe">
                </mat-form-field>
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">Work email</label>
              <mat-form-field appearance="outline" class="w-full">
                <input matInput type="email" formControlName="email" placeholder="jane@acme.com">
              </mat-form-field>
            </div>
            <div class="field-group">
              <label class="field-label">Password</label>
              <mat-form-field appearance="outline" class="w-full">
                <input matInput [type]="showPwd() ? 'text' : 'password'" formControlName="password" placeholder="Min. 8 characters">
                <button mat-icon-button matSuffix type="button" (click)="showPwd.set(!showPwd())" style="color:var(--text-500)">
                  <mat-icon style="font-size:18px">{{ showPwd() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </mat-form-field>
            </div>
            @if (error()) {
              <div class="error-banner">
                <mat-icon style="font-size:16px;width:16px;height:16px">error_outline</mat-icon>
                {{ error() }}
              </div>
            }
            <div class="btn-row">
              <button mat-flat-button type="button" class="btn-ghost back-btn" (click)="currentStep.set(0)">
                <mat-icon style="font-size:18px">arrow_back</mat-icon> Back
              </button>
              <button mat-flat-button type="submit" class="btn-primary flex-1 submit-btn" [disabled]="loading() || personalForm.invalid">
                @if (loading()) { <mat-spinner diameter="18" style="display:inline-block;margin-right:8px"></mat-spinner>Creating... }
                @else { Create workspace }
              </button>
            </div>
          </form>
        }

        <p class="auth-footer">
          Already have an account? <a routerLink="/login" class="auth-link">Sign in</a>
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
    .orb-1 { width:500px;height:500px; background:radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 70%); top:-200px;left:-100px; }
    .orb-2 { width:400px;height:400px; background:radial-gradient(circle,rgba(34,211,238,0.08) 0%,transparent 70%); bottom:-150px;right:-100px; }

    .auth-card { width:100%;max-width:440px;padding:40px 36px;position:relative;z-index:1; }

    .auth-logo { display:flex;justify-content:center;margin-bottom:24px; }
    .logo-icon {
      width:52px;height:52px;border-radius:16px;
      background:var(--grad-primary);
      box-shadow:0 0 40px rgba(139,92,246,0.4);
      display:flex;align-items:center;justify-content:center;
      font-size:1.5rem;font-weight:800;color:white;
    }
    .auth-title { text-align:center;font-size:1.6rem;font-weight:700;color:var(--text-100);margin:0 0 8px;letter-spacing:-0.03em; }
    .auth-sub { text-align:center;color:var(--text-400);font-size:0.875rem;margin:0 0 24px; }

    .steps-row {
      display:flex;align-items:center;gap:8px;margin-bottom:28px;
    }
    .step-item {
      display:flex;align-items:center;gap:8px;
      font-size:0.78rem;font-weight:500;color:var(--text-500);
    }
    .step-item.step-active { color:var(--violet-light); }
    .step-item.step-done { color:var(--emerald); }
    .step-circle {
      width:24px;height:24px;border-radius:50%;
      border:1.5px solid var(--border-md);
      display:flex;align-items:center;justify-content:center;
      font-size:0.7rem;font-weight:700;
    }
    .step-active .step-circle { border-color:var(--violet);color:var(--violet-light);background:rgba(139,92,246,0.15); }
    .step-done .step-circle { border-color:var(--emerald);color:var(--emerald);background:rgba(52,211,153,0.15); }
    .step-line { flex:1;height:1px;background:var(--border-sm); }
    .step-line-done { background:var(--emerald); }

    .auth-form { display:flex;flex-direction:column;gap:4px; }
    .field-group { margin-bottom:8px; }
    .field-label { display:block;font-size:0.78rem;font-weight:600;color:var(--text-300);margin-bottom:6px; }
    .name-row { display:flex;gap:12px; }

    .error-banner {
      display:flex;align-items:center;gap:8px;
      padding:10px 14px;
      background:rgba(251,113,133,0.1);border:1px solid rgba(251,113,133,0.25);
      border-radius:var(--radius-md);color:var(--rose);font-size:0.82rem;
    }

    .submit-btn { width:100%!important;height:46px!important;font-size:0.9rem!important;margin-top:8px; }
    .btn-row { display:flex;gap:10px;margin-top:8px; }
    .back-btn { height:46px!important; }

    .auth-footer { text-align:center;color:var(--text-400);font-size:0.82rem;margin:20px 0 0; }
    .auth-link { color:var(--violet-light);font-weight:600;text-decoration:none; &:hover{text-decoration:underline;} }
  `],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  currentStep = signal(0);
  loading = signal(false);
  showPwd = signal(false);
  error = signal('');

  companyForm = this.fb.group({
    companyName: ['', Validators.required],
    companySlug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
  });

  personalForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  onNameChange(e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    this.companyForm.patchValue({ companySlug: slugify(v) });
  }

  nextStep(): void {
    if (this.companyForm.invalid) return;
    this.currentStep.set(1);
  }

  onSubmit(): void {
    if (this.personalForm.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const { companyName } = this.companyForm.value;
    const { firstName, lastName, email, password } = this.personalForm.value;
    this.auth.register({ firstName: firstName!, lastName: lastName!, email: email!, password: password!, companyName: companyName! }).subscribe({
      next: () => this.router.navigate([this.auth.defaultRoute()]),
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Registration failed. Please try again.');
      },
    });
  }
}
