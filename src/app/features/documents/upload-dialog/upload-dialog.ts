import { Component, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { DocumentService } from '../../../core/services/document.service';

@Component({
  selector: 'app-upload-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatProgressBarModule, FormsModule, DecimalPipe],
  template: `
    <div class="upload-dialog">
      <div class="dialog-header">
        <div class="dialog-icon">
          <mat-icon style="font-size:20px;width:20px;height:20px;color:white">upload_file</mat-icon>
        </div>
        <div>
          <h2 class="dialog-title">Upload Document</h2>
          <p class="dialog-sub">Add a file to your knowledge base</p>
        </div>
      </div>

      <!-- Drop zone -->
      <div
        class="drop-zone"
        [class.drop-zone-over]="dragOver()"
        [class.drop-zone-selected]="selectedFile()"
        (dragover)="onDragOver($event)"
        (dragleave)="dragOver.set(false)"
        (drop)="onDrop($event)"
        (click)="fileInput.click()">
        <input #fileInput type="file" style="display:none" accept=".pdf,.doc,.docx,.txt" (change)="onSelect($event)">

        @if (selectedFile()) {
          <div class="selected-file">
            <div class="file-icon-box">
              <mat-icon style="font-size:22px;width:22px;height:22px;color:var(--violet-light)">check_circle</mat-icon>
            </div>
            <div>
              <div class="file-name">{{ selectedFile()!.name }}</div>
              <div class="file-meta">{{ selectedFile()!.size | number }} bytes · Click to change</div>
            </div>
          </div>
        } @else {
          <div class="drop-placeholder">
            <div class="drop-icon">
              <mat-icon style="font-size:24px;width:24px;height:24px;color:var(--text-400)">cloud_upload</mat-icon>
            </div>
            <p class="drop-title">Drop file here or <span class="drop-link">browse</span></p>
            <p class="drop-hint">PDF, Word, TXT · max 50 MB</p>
          </div>
        }
      </div>

      <!-- Fields -->
      <div class="dialog-fields">
        <div class="field-group">
          <label class="field-label">Category</label>
          <mat-form-field appearance="outline" class="w-full">
            <input matInput [(ngModel)]="category" placeholder="e.g. HR, Legal, Engineering">
          </mat-form-field>
        </div>
        <div class="field-group">
          <label class="field-label">Tags (comma-separated)</label>
          <mat-form-field appearance="outline" class="w-full">
            <input matInput [(ngModel)]="tagsInput" placeholder="policy, 2024, onboarding">
          </mat-form-field>
        </div>
      </div>

      @if (uploading()) {
        <div class="upload-progress">
          <div class="loading-bar"><div class="loading-bar-inner"></div></div>
          <span>Uploading...</span>
        </div>
      }

      <!-- Actions -->
      <div class="dialog-actions">
        <button class="btn-ghost cancel-btn" mat-dialog-close>Cancel</button>
        <button
          class="btn-primary upload-btn"
          (click)="upload()"
          [disabled]="!selectedFile() || uploading()">
          @if (uploading()) { Uploading... } @else { Upload Document }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .upload-dialog { padding: 28px; min-width: 460px; }

    .dialog-header { display:flex;align-items:center;gap:14px;margin-bottom:24px; }
    .dialog-icon { width:44px;height:44px;border-radius:12px;background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .dialog-title { font-size:1.1rem;font-weight:700;color:var(--text-100);margin:0 0 2px; }
    .dialog-sub { font-size:0.8rem;color:var(--text-400);margin:0; }

    .drop-zone {
      border: 2px dashed var(--border-md);
      border-radius: var(--radius-lg);
      padding: 32px;
      text-align: center;
      cursor: pointer;
      transition: all var(--transition);
      margin-bottom: 20px;
      background: rgba(255,255,255,0.02);
      &:hover { border-color:var(--violet);background:rgba(139,92,246,0.04); }
    }
    .drop-zone-over { border-color:var(--violet)!important;background:rgba(139,92,246,0.08)!important; }
    .drop-zone-selected { border-style:solid;border-color:rgba(139,92,246,0.4);background:rgba(139,92,246,0.06); }

    .drop-icon { width:52px;height:52px;border-radius:14px;background:rgba(255,255,255,0.04);border:1px solid var(--border-sm);display:flex;align-items:center;justify-content:center;margin:0 auto 12px; }
    .drop-title { font-size:0.9rem;font-weight:500;color:var(--text-300);margin:0 0 4px; }
    .drop-link { color:var(--violet-light);font-weight:600; }
    .drop-hint { font-size:0.75rem;color:var(--text-500);margin:0; }

    .selected-file { display:flex;align-items:center;gap:14px;text-align:left; }
    .file-icon-box { width:44px;height:44px;border-radius:12px;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .file-name { font-size:0.875rem;font-weight:600;color:var(--text-200);margin-bottom:2px; }
    .file-meta { font-size:0.75rem;color:var(--text-500); }

    .dialog-fields { display:flex;flex-direction:column;gap:0; }
    .field-group { margin-bottom:4px; }
    .field-label { display:block;font-size:0.75rem;font-weight:600;color:var(--text-400);margin-bottom:5px;letter-spacing:0.02em; }

    .upload-progress { display:flex;align-items:center;gap:12px;margin:8px 0;font-size:0.8rem;color:var(--text-400); }
    .loading-bar { flex:1;height:3px;overflow:hidden;border-radius:99px;background:var(--border-sm); }
    .loading-bar-inner { height:100%;background:var(--grad-primary);animation:loading-slide 1.5s ease-in-out infinite; }
    @keyframes loading-slide { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }

    .dialog-actions { display:flex;gap:10px;justify-content:flex-end;margin-top:20px; }
    .cancel-btn { padding:10px 18px!important;border-radius:var(--radius-md)!important;font-size:0.875rem!important;height:42px!important; }
    .upload-btn { padding:10px 20px;border-radius:var(--radius-md);font-size:0.875rem;font-weight:600;background:var(--grad-primary);color:white;border:none;cursor:pointer;box-shadow:0 4px 16px rgba(139,92,246,0.35);transition:all var(--transition); height:42px; &:disabled{opacity:0.4;cursor:not-allowed;box-shadow:none;} &:hover:not(:disabled){box-shadow:0 6px 24px rgba(139,92,246,0.5);} }
  `],
})
export class UploadDialogComponent {
  private svc = inject(DocumentService);
  private ref = inject(MatDialogRef<UploadDialogComponent>);

  selectedFile = signal<File | null>(null);
  dragOver = signal(false);
  uploading = signal(false);
  category = '';
  tagsInput = '';

  onDragOver(e: DragEvent): void { e.preventDefault(); this.dragOver.set(true); }
  onDrop(e: DragEvent): void { e.preventDefault(); this.dragOver.set(false); const f = e.dataTransfer?.files[0]; if (f) this.selectedFile.set(f); }
  onSelect(e: Event): void { const f = (e.target as HTMLInputElement).files?.[0]; if (f) this.selectedFile.set(f); }

  upload(): void {
    const file = this.selectedFile();
    if (!file) return;
    this.uploading.set(true);
    const tags = this.tagsInput ? this.tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];
    this.svc.upload(file, this.category || undefined, tags).subscribe({
      next: () => this.ref.close(true),
      error: () => { this.uploading.set(false); alert('Upload failed. Please try again.'); },
    });
  }
}
