import { Component, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { DocumentService } from '../../core/services/document.service';
import { Document, DocumentStatus } from '../../core/models/document.model';
import { UploadDialogComponent } from './upload-dialog/upload-dialog';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    MatTableModule, MatButtonModule, MatIconModule, MatProgressBarModule,
    MatProgressSpinnerModule, MatDialogModule, MatSnackBarModule,
    MatPaginatorModule, MatTooltipModule, RouterLink, DecimalPipe, DatePipe,
  ],
  template: `
    <div class="docs-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Documents</h1>
          <p class="page-sub">{{ totalElements() }} files in your knowledge base</p>
        </div>
        <button class="btn-primary upload-btn" (click)="openUpload()">
          <mat-icon style="font-size:18px;margin-right:6px">upload</mat-icon>
          Upload
        </button>
      </div>

      <!-- Table card -->
      <div class="table-card">
        @if (loading()) {
          <div class="loading-bar">
            <div class="loading-bar-inner"></div>
          </div>
        }

        <table mat-table [dataSource]="documents()" class="docs-table">

          <!-- Name -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let doc">
              <div class="doc-name-cell">
                <div class="doc-icon" [class]="fileTypeClass(doc.fileType)">
                  <mat-icon style="font-size:16px;width:16px;height:16px">{{ fileTypeIcon(doc.fileType) }}</mat-icon>
                </div>
                <div>
                  <a [routerLink]="['/documents', doc.id]" class="doc-link">{{ doc.name }}</a>
                  <div class="doc-size">{{ doc.fileSize | number }} bytes</div>
                </div>
              </div>
            </td>
          </ng-container>

          <!-- Status -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let doc">
              <div class="status-cell">
                <div class="pulse-dot" [class]="statusDot(doc.status)"></div>
                <span class="status-text" [class]="statusText(doc.status)">{{ doc.status }}</span>
              </div>
            </td>
          </ng-container>

          <!-- Category -->
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Category</th>
            <td mat-cell *matCellDef="let doc">
              <span class="category-tag">{{ doc.category || 'Uncategorized' }}</span>
            </td>
          </ng-container>

          <!-- Chunks -->
          <ng-container matColumnDef="chunks">
            <th mat-header-cell *matHeaderCellDef>Chunks</th>
            <td mat-cell *matCellDef="let doc">
              <span class="chunks-badge">{{ doc.chunkCount }}</span>
            </td>
          </ng-container>

          <!-- Date -->
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Added</th>
            <td mat-cell *matCellDef="let doc">
              <span class="date-text">{{ doc.createdAt | date:'MMM d, y' }}</span>
            </td>
          </ng-container>

          <!-- Actions -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let doc">
              <div class="actions-cell">
                <button class="row-action-btn" [routerLink]="['/documents', doc.id]" matTooltip="View details">
                  <mat-icon style="font-size:16px;width:16px;height:16px">open_in_new</mat-icon>
                </button>
                <button class="row-action-btn row-action-danger" (click)="deleteDoc(doc)" matTooltip="Delete">
                  <mat-icon style="font-size:16px;width:16px;height:16px">delete_outline</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let r; columns: cols;" class="table-row"></tr>

          @if (!loading() && documents().length === 0) {
            <tr class="mat-row">
              <td [attr.colspan]="cols.length">
                <div class="empty-table">
                  <div class="empty-table-icon">
                    <mat-icon style="font-size:28px;width:28px;height:28px;color:var(--text-500)">description</mat-icon>
                  </div>
                  <p class="empty-table-title">No documents yet</p>
                  <p class="empty-table-sub">Upload your first document to start building your knowledge base</p>
                  <button class="btn-primary" style="padding:10px 20px;border-radius:var(--radius-md);font-size:0.875rem;font-weight:600;background:var(--grad-primary);color:white;border:none;cursor:pointer;box-shadow:0 4px 20px rgba(139,92,246,0.35);" (click)="openUpload()">
                    Upload Document
                  </button>
                </div>
              </td>
            </tr>
          }
        </table>

        <mat-paginator
          [length]="totalElements()"
          [pageSize]="pageSize"
          [pageSizeOptions]="[10, 25, 50]"
          (page)="onPage($event)">
        </mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .docs-page { max-width:1100px; }
    .page-header { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;gap:16px;flex-wrap:wrap; }
    .page-title { font-size:1.8rem;font-weight:700;color:var(--text-100);letter-spacing:-0.04em;margin:0 0 4px; }
    .page-sub { color:var(--text-400);font-size:0.875rem;margin:0; }
    .upload-btn { display:inline-flex;align-items:center;padding:10px 20px;border-radius:var(--radius-md);font-size:0.875rem;font-weight:600;background:var(--grad-primary);color:white;border:none;cursor:pointer;box-shadow:0 4px 20px rgba(139,92,246,0.35);transition:all var(--transition); &:hover{box-shadow:0 6px 28px rgba(139,92,246,0.5);transform:translateY(-1px);} }

    .table-card {
      background:rgba(255,255,255,0.02);
      border:1px solid var(--border-sm);
      border-radius:var(--radius-xl);
      overflow:hidden;
      position:relative;
    }
    .loading-bar { height:2px;overflow:hidden;position:absolute;top:0;left:0;right:0;z-index:2; }
    .loading-bar-inner { height:100%;background:var(--grad-primary);animation:loading-slide 1.5s ease-in-out infinite; }
    @keyframes loading-slide { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }

    .docs-table { width:100%;background:transparent!important; }

    .doc-name-cell { display:flex;align-items:center;gap:12px;padding:12px 0; }
    .doc-icon {
      width:36px;height:36px;border-radius:9px;
      display:flex;align-items:center;justify-content:center;flex-shrink:0;
    }
    .icon-pdf    { background:rgba(251,113,133,0.15);border:1px solid rgba(251,113,133,0.25); mat-icon{color:var(--rose)!important} }
    .icon-word   { background:rgba(96,165,250,0.15);border:1px solid rgba(96,165,250,0.25);   mat-icon{color:var(--sky)!important} }
    .icon-txt    { background:rgba(255,255,255,0.07);border:1px solid var(--border-sm);        mat-icon{color:var(--text-300)!important} }
    .icon-url    { background:rgba(52,211,153,0.15);border:1px solid rgba(52,211,153,0.25);   mat-icon{color:var(--emerald)!important} }
    .icon-default{ background:rgba(255,255,255,0.07);border:1px solid var(--border-sm);        mat-icon{color:var(--text-300)!important} }

    .doc-link { font-size:0.875rem;font-weight:500;color:var(--text-200);text-decoration:none;display:block;transition:color var(--transition); &:hover{color:var(--violet-light);} }
    .doc-size { font-size:0.72rem;color:var(--text-500);margin-top:2px; }

    .status-cell { display:flex;align-items:center;gap:8px; }
    .status-text { font-size:0.78rem;font-weight:500; }
    .status-ready    { color:var(--emerald); }
    .status-processing,.status-pending { color:var(--sky); }
    .status-failed   { color:var(--rose); }

    .category-tag {
      font-size:0.75rem;font-weight:500;
      padding:3px 10px;border-radius:var(--radius-pill);
      background:rgba(255,255,255,0.05);border:1px solid var(--border-sm);
      color:var(--text-400);
    }
    .chunks-badge {
      font-size:0.78rem;font-weight:600;color:var(--text-400);
      background:rgba(255,255,255,0.04);padding:2px 8px;border-radius:6px;
    }
    .date-text { font-size:0.8rem;color:var(--text-500); }

    .actions-cell { display:flex;align-items:center;gap:4px;justify-content:flex-end; }
    .row-action-btn {
      width:30px;height:30px;border-radius:8px;
      background:transparent;border:1px solid transparent;
      cursor:pointer;display:flex;align-items:center;justify-content:center;
      color:var(--text-500);transition:all var(--transition);
      &:hover{background:rgba(255,255,255,0.06);border-color:var(--border-sm);color:var(--text-300);}
    }
    .row-action-danger:hover{background:rgba(251,113,133,0.1)!important;border-color:rgba(251,113,133,0.25)!important;color:var(--rose)!important;}

    .table-row { transition:background var(--transition); }

    .empty-table { display:flex;flex-direction:column;align-items:center;justify-content:center;padding:64px 24px;text-align:center; }
    .empty-table-icon { width:56px;height:56px;border-radius:16px;background:rgba(255,255,255,0.04);border:1px solid var(--border-sm);display:flex;align-items:center;justify-content:center;margin-bottom:16px; }
    .empty-table-title { font-size:1rem;font-weight:600;color:var(--text-200);margin:0 0 6px; }
    .empty-table-sub { font-size:0.82rem;color:var(--text-400);margin:0 0 20px;max-width:300px; }
  `],
})
export class DocumentsComponent implements OnInit {
  private svc = inject(DocumentService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  cols = ['name', 'status', 'category', 'chunks', 'date', 'actions'];
  documents = signal<Document[]>([]);
  totalElements = signal(0);
  loading = signal(false);
  pageIndex = 0;
  pageSize = 10;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.list(this.pageIndex, this.pageSize).subscribe({
      next: r => { if (r.success) { this.documents.set(r.data.content); this.totalElements.set(r.data.totalElements); } this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openUpload(): void {
    this.dialog.open(UploadDialogComponent, { width: '520px', panelClass: 'dark-dialog' })
      .afterClosed().subscribe(ok => { if (ok) { this.snack.open('Document queued for processing', 'OK', { duration: 3000 }); this.load(); } });
  }

  deleteDoc(doc: Document): void {
    if (!confirm(`Delete "${doc.name}"?`)) return;
    this.svc.delete(doc.id).subscribe({
      next: () => { this.snack.open('Document deleted.', 'OK', { duration: 2500 }); this.load(); },
      error: () => this.snack.open('Delete failed.', 'Close', { duration: 2500 }),
    });
  }

  onPage(e: PageEvent): void { this.pageIndex = e.pageIndex; this.pageSize = e.pageSize; this.load(); }

  fileTypeIcon(t: string): string { const m: Record<string,string> = {PDF:'picture_as_pdf',WORD:'article',TXT:'text_snippet',URL:'link'}; return m[t] ?? 'description'; }
  fileTypeClass(t: string): string { const m: Record<string,string> = {PDF:'icon-pdf',WORD:'icon-word',TXT:'icon-txt',URL:'icon-url'}; return m[t] ?? 'icon-default'; }
  statusDot(s: DocumentStatus): string { const m: Record<string,string> = {READY:'pulse-dot-green',PROCESSING:'pulse-dot-blue',PENDING:'pulse-dot-amber',FAILED:'pulse-dot-red'}; return m[s] ?? ''; }
  statusText(s: DocumentStatus): string { const m: Record<string,string> = {READY:'status-ready',PROCESSING:'status-processing',PENDING:'status-pending',FAILED:'status-failed'}; return m[s] ?? ''; }
}
