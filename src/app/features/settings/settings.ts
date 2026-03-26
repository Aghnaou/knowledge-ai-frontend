import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { SettingsService, TenantSettings } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule, MatSnackBarModule, MatDividerModule],
  template: `
    <div class="settings-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Settings</h1>
          <p class="page-sub">Configure your workspace</p>
        </div>
      </div>

      <div class="settings-layout">
        <!-- Sidebar nav -->
        <div class="settings-nav">
          @for (s of sections; track s.id) {
            <button class="settings-nav-item" [class.active]="activeSection() === s.id" (click)="activeSection.set(s.id)">
              <mat-icon class="settings-nav-icon">{{ s.icon }}</mat-icon>
              {{ s.label }}
            </button>
          }
        </div>

        <!-- Content -->
        <div class="settings-content">

          @if (activeSection() === 'workspace') {
            <div class="settings-section">
              <h2 class="section-heading">Workspace</h2>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Company Name</div>
                  <div class="info-value">{{ user()?.tenantName }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Plan</div>
                  <div class="info-value">
                    <span class="badge badge-info">{{ settings()?.planType ?? 'FREE' }}</span>
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">Max Documents</div>
                  <div class="info-value">{{ settings()?.maxDocuments ?? '—' }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Your Role</div>
                  <div class="info-value">{{ user()?.role }}</div>
                </div>
              </div>
            </div>
          }

          @if (activeSection() === 'ai') {
            <div class="settings-section">
              <h2 class="section-heading">AI Model</h2>
              <p class="section-desc">Choose which AI model powers your knowledge assistant.</p>

              <div class="settings-field">
                <label class="field-label">Provider</label>
                <mat-form-field appearance="outline" class="w-full" style="max-width:380px">
                  <mat-select [(value)]="selectedProvider">
                    <mat-option value="GEMINI">Google Gemini</mat-option>
                    <mat-option value="OPENAI">OpenAI</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="settings-field">
                <label class="field-label">Model</label>
                <mat-form-field appearance="outline" class="w-full" style="max-width:380px">
                  <mat-select [(value)]="selectedModel">
                    @if (selectedProvider === 'GEMINI') {
                      <mat-option value="gemini-2.0-flash">Gemini 2.0 Flash</mat-option>
                      <mat-option value="gemini-1.5-pro">Gemini 1.5 Pro</mat-option>
                    } @else {
                      <mat-option value="gpt-4o">GPT-4o</mat-option>
                      <mat-option value="gpt-4o-mini">GPT-4o Mini</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>

              <button class="save-btn" (click)="saveLlm()" [disabled]="savingLlm()">
                @if (savingLlm()) { <mat-spinner diameter="16" style="display:inline-block;margin-right:8px"></mat-spinner> }
                Save changes
              </button>
            </div>
          }

          @if (activeSection() === 'language') {
            <div class="settings-section">
              <h2 class="section-heading">Response Language</h2>
              <p class="section-desc">The AI will respond in the selected language.</p>

              <div class="settings-field">
                <label class="field-label">Language</label>
                <mat-form-field appearance="outline" class="w-full" style="max-width:380px">
                  <mat-select [(value)]="selectedLanguage">
                    <mat-option value="en">English</mat-option>
                    <mat-option value="fr">French</mat-option>
                    <mat-option value="es">Spanish</mat-option>
                    <mat-option value="de">German</mat-option>
                    <mat-option value="pt">Portuguese</mat-option>
                    <mat-option value="ar">Arabic</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <button class="save-btn" (click)="saveLang()" [disabled]="savingLang()">
                @if (savingLang()) { <mat-spinner diameter="16" style="display:inline-block;margin-right:8px"></mat-spinner> }
                Save changes
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-page { max-width:900px; }
    .page-header { margin-bottom:28px; }
    .page-title { font-size:1.8rem;font-weight:700;color:var(--text-100);letter-spacing:-0.04em;margin:0 0 4px; }
    .page-sub { color:var(--text-400);font-size:0.875rem;margin:0; }

    .settings-layout { display:flex;gap:20px; }
    @media(max-width:700px){.settings-layout{flex-direction:column;}}

    .settings-nav { width:200px;flex-shrink:0;display:flex;flex-direction:column;gap:2px;padding-top:4px; }
    .settings-nav-item {
      display:flex;align-items:center;gap:10px;
      padding:9px 12px;border-radius:10px;
      background:transparent;border:none;
      cursor:pointer;text-align:left;
      font-size:0.85rem;font-weight:500;color:var(--text-400);
      transition:all var(--transition);
      &:hover { background:rgba(255,255,255,0.05);color:var(--text-200); }
    }
    .settings-nav-item.active { background:rgba(139,92,246,0.12);color:var(--violet-light);box-shadow:inset 0 0 0 1px rgba(139,92,246,0.2); .settings-nav-icon{color:var(--violet-light)!important;} }
    .settings-nav-icon { font-size:18px!important;width:18px!important;height:18px!important;color:var(--text-500);flex-shrink:0; }

    .settings-content { flex:1;min-width:0; }
    .settings-section { background:rgba(255,255,255,0.02);border:1px solid var(--border-sm);border-radius:var(--radius-xl);padding:28px; }
    .section-heading { font-size:1.05rem;font-weight:700;color:var(--text-100);margin:0 0 6px;letter-spacing:-0.02em; }
    .section-desc { font-size:0.85rem;color:var(--text-400);margin:0 0 24px;line-height:1.6; }

    .info-grid { display:grid;grid-template-columns:1fr 1fr;gap:20px; }
    .info-item {}
    .info-label { font-size:0.72rem;font-weight:600;color:var(--text-500);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px; }
    .info-value { font-size:0.9rem;font-weight:500;color:var(--text-200); }

    .settings-field { margin-bottom:18px; }
    .field-label { display:block;font-size:0.78rem;font-weight:600;color:var(--text-300);margin-bottom:8px; }

    .save-btn { display:inline-flex;align-items:center;padding:10px 22px;border-radius:var(--radius-md);font-size:0.875rem;font-weight:600;background:var(--grad-primary);color:white;border:none;cursor:pointer;box-shadow:0 4px 16px rgba(139,92,246,0.3);transition:all var(--transition);margin-top:4px; &:disabled{opacity:0.4;cursor:not-allowed;} &:hover:not(:disabled){box-shadow:0 6px 24px rgba(139,92,246,0.5);} }
  `],
})
export class SettingsComponent implements OnInit {
  private svc = inject(SettingsService);
  private snack = inject(MatSnackBar);
  private authService = inject(AuthService);
  user = this.authService.currentUser;

  settings      = signal<TenantSettings | null>(null);
  activeSection = signal('workspace');
  savingLlm     = signal(false);
  savingLang    = signal(false);

  selectedProvider = 'GEMINI';
  selectedModel    = 'gemini-2.0-flash';
  selectedLanguage = 'en';

  sections = [
    { id: 'workspace', label: 'Workspace', icon: 'business' },
    { id: 'ai',        label: 'AI Model',  icon: 'smart_toy' },
    { id: 'language',  label: 'Language',  icon: 'translate' },
  ];

  ngOnInit(): void {
    this.svc.getSettings().subscribe({ next: r => { if (r.success) { this.settings.set(r.data); this.selectedProvider = r.data.llmProvider; this.selectedModel = r.data.llmModel; this.selectedLanguage = r.data.responseLanguage; } } });
  }

  saveLlm(): void {
    this.savingLlm.set(true);
    this.svc.updateLlm(this.selectedProvider, this.selectedModel).subscribe({ next: () => { this.savingLlm.set(false); this.snack.open('AI settings saved.', 'OK', { duration: 2000 }); }, error: () => { this.savingLlm.set(false); this.snack.open('Save failed.', 'Close', { duration: 2000 }); } });
  }

  saveLang(): void {
    this.savingLang.set(true);
    this.svc.updateLanguage(this.selectedLanguage).subscribe({ next: () => { this.savingLang.set(false); this.snack.open('Language saved.', 'OK', { duration: 2000 }); }, error: () => { this.savingLang.set(false); this.snack.open('Save failed.', 'Close', { duration: 2000 }); } });
  }
}
