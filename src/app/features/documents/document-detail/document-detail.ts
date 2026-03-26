import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { DatePipe, DecimalPipe } from '@angular/common';
import { DocumentService } from '../../../core/services/document.service';
import { Document } from '../../../core/models/document.model';

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressBarModule, MatDividerModule, DatePipe, DecimalPipe],
  template: `
    <div style="max-width:760px">
      <a routerLink="/documents" class="back-link">
        <mat-icon style="font-size:16px;width:16px;height:16px">arrow_back</mat-icon>
        Back to Documents
      </a>

      @if (doc()) {
        <!-- Header card -->
        <div class="detail-card">
          <div class="doc-header">
            <div class="doc-icon-lg" [class]="fileTypeClass()">
              <mat-icon style="font-size:24px;width:24px;height:24px">{{ fileTypeIcon() }}</mat-icon>
            </div>
            <div class="doc-header-info">
              <h1 class="doc-name">{{ doc()!.name }}</h1>
              <p class="doc-filename">{{ doc()!.originalFilename }}</p>
              <div class="doc-meta-row">
                <div class="status-cell">
                  <div class="pulse-dot" [class]="statusDot()"></div>
                  <span class="status-text" [class]="statusClass()">{{ doc()!.status }}</span>
                </div>
                <span class="meta-sep">·</span>
                <span class="meta-chip">{{ doc()!.fileType }}</span>
                <span class="meta-sep">·</span>
                <span class="meta-chip">{{ doc()!.fileSize | number }} bytes</span>
              </div>
            </div>
          </div>

          @if (doc()!.status === 'PROCESSING' || doc()!.status === 'PENDING') {
            <div class="processing-banner">
              <mat-icon style="font-size:16px;width:16px;height:16px;color:var(--sky)">hourglass_empty</mat-icon>
              <div>
                <div style="font-size:0.82rem;font-weight:600;color:var(--sky);margin-bottom:6px">Processing document...</div>
                <div class="loading-bar"><div class="loading-bar-inner"></div></div>
              </div>
            </div>
          }
        </div>

        <!-- Details card -->
        <div class="detail-card" style="margin-top:16px">
          <h2 class="detail-section-title">Details</h2>
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Category</div>
              <div class="detail-value">{{ doc()!.category || 'Uncategorized' }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Chunks</div>
              <div class="detail-value" style="color:var(--violet-light);font-weight:700">{{ doc()!.chunkCount }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Uploaded</div>
              <div class="detail-value">{{ doc()!.createdAt | date:'MMM d, y, h:mm a' }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Last Updated</div>
              <div class="detail-value">{{ doc()!.updatedAt | date:'MMM d, y, h:mm a' }}</div>
            </div>
          </div>

          @if (doc()!.tags && doc()!.tags.length) {
            <mat-divider style="margin:20px 0;border-color:var(--border-xs)"></mat-divider>
            <div class="detail-label" style="margin-bottom:10px">Tags</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              @for (tag of doc()!.tags; track tag) {
                <span class="badge badge-info">{{ tag }}</span>
              }
            </div>
          }
        </div>
      } @else {
        <div class="detail-card">
          <div class="skeleton" style="height:20px;width:40%;margin-bottom:12px"></div>
          <div class="skeleton" style="height:14px;width:60%;margin-bottom:8px"></div>
          <div class="skeleton" style="height:14px;width:30%"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .back-link { display:inline-flex;align-items:center;gap:6px;color:var(--text-400);text-decoration:none;font-size:0.82rem;font-weight:500;margin-bottom:20px;transition:color var(--transition); &:hover{color:var(--violet-light);} }
    .detail-card { background:rgba(255,255,255,0.02);border:1px solid var(--border-sm);border-radius:var(--radius-xl);padding:28px; }
    .doc-header { display:flex;align-items:flex-start;gap:16px; }
    .doc-icon-lg { width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .icon-pdf    { background:rgba(251,113,133,0.15);border:1px solid rgba(251,113,133,0.25); mat-icon{color:var(--rose)!important} }
    .icon-word   { background:rgba(96,165,250,0.15);border:1px solid rgba(96,165,250,0.25);   mat-icon{color:var(--sky)!important} }
    .icon-txt    { background:rgba(255,255,255,0.07);border:1px solid var(--border-sm);        mat-icon{color:var(--text-300)!important} }
    .icon-url    { background:rgba(52,211,153,0.15);border:1px solid rgba(52,211,153,0.25);   mat-icon{color:var(--emerald)!important} }
    .icon-default{ background:rgba(255,255,255,0.07);border:1px solid var(--border-sm);        mat-icon{color:var(--text-300)!important} }
    .doc-header-info { flex:1; }
    .doc-name { font-size:1.3rem;font-weight:700;color:var(--text-100);margin:0 0 4px;letter-spacing:-0.02em; }
    .doc-filename { font-size:0.8rem;color:var(--text-500);margin:0 0 12px; }
    .doc-meta-row { display:flex;align-items:center;gap:10px;flex-wrap:wrap; }
    .status-cell { display:flex;align-items:center;gap:6px; }
    .status-text { font-size:0.78rem;font-weight:600; }
    .status-ready{color:var(--emerald)} .status-processing,.status-pending{color:var(--sky)} .status-failed{color:var(--rose)}
    .meta-sep { color:var(--text-500); }
    .meta-chip { font-size:0.75rem;font-weight:500;color:var(--text-400);background:rgba(255,255,255,0.05);border:1px solid var(--border-xs);padding:2px 10px;border-radius:var(--radius-pill); }
    .processing-banner { display:flex;align-items:flex-start;gap:10px;margin-top:20px;padding:14px 16px;background:rgba(56,189,248,0.06);border:1px solid rgba(56,189,248,0.2);border-radius:var(--radius-md); }
    .loading-bar { width:100%;height:3px;overflow:hidden;border-radius:99px;background:rgba(255,255,255,0.08); }
    .loading-bar-inner { height:100%;background:var(--grad-secondary);animation:loading-slide 1.5s ease-in-out infinite; }
    @keyframes loading-slide{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
    .detail-section-title { font-size:0.875rem;font-weight:700;color:var(--text-200);margin:0 0 20px;letter-spacing:-0.01em; }
    .details-grid { display:grid;grid-template-columns:1fr 1fr;gap:20px; }
    .detail-item {}
    .detail-label { font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-500);margin-bottom:5px; }
    .detail-value { font-size:0.9rem;font-weight:500;color:var(--text-200); }
  `],
})
export class DocumentDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private svc = inject(DocumentService);

  doc = signal<Document | null>(null);
  private timer: any;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.load(id);
  }

  ngOnDestroy(): void { clearInterval(this.timer); }

  load(id: string): void {
    this.svc.getById(id).subscribe({ next: r => {
      if (r.success) {
        this.doc.set(r.data);
        if (r.data.status === 'PROCESSING' || r.data.status === 'PENDING') this.startPoll(id);
      }
    }});
  }

  startPoll(id: string): void {
    this.timer = setInterval(() => {
      this.svc.getStatus(id).subscribe({ next: r => {
        if (r.success) {
          const d = this.doc();
          if (d) this.doc.set({ ...d, status: r.data.status as any, chunkCount: r.data.chunkCount });
          if (r.data.status === 'READY' || r.data.status === 'FAILED') clearInterval(this.timer);
        }
      }});
    }, 3000);
  }

  fileTypeIcon(): string { const m: Record<string,string>={PDF:'picture_as_pdf',WORD:'article',TXT:'text_snippet',URL:'link'}; return m[this.doc()?.fileType??'']??'description'; }
  fileTypeClass(): string { const m: Record<string,string>={PDF:'icon-pdf',WORD:'icon-word',TXT:'icon-txt',URL:'icon-url'}; return m[this.doc()?.fileType??'']??'icon-default'; }
  statusDot(): string { const m: Record<string,string>={READY:'pulse-dot-green',PROCESSING:'pulse-dot-blue',PENDING:'pulse-dot-amber',FAILED:'pulse-dot-red'}; return m[this.doc()?.status??'']??''; }
  statusClass(): string { const m: Record<string,string>={READY:'status-ready',PROCESSING:'status-processing',PENDING:'status-pending',FAILED:'status-failed'}; return m[this.doc()?.status??'']??''; }
}
