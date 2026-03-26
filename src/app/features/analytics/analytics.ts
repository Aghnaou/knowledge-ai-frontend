import { Component, inject, OnInit, signal, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AnalyticsOverview, DailyQuestions, TopDocument, TopTopic, UserActivity } from '../../core/models/analytics.model';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [MatIconModule, DatePipe, DecimalPipe],
  template: `
    <div class="analytics-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Analytics</h1>
          <p class="page-sub">Usage trends and team insights</p>
        </div>
      </div>

      <!-- KPI row -->
      @if (overview()) {
        <div class="kpi-row">
          <div class="kpi-card">
            <div class="kpi-icon kpi-violet"><mat-icon>forum</mat-icon></div>
            <div class="kpi-value">{{ overview()!.totalQuestions | number }}</div>
            <div class="kpi-label">Total Questions</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon kpi-cyan"><mat-icon>description</mat-icon></div>
            <div class="kpi-value">{{ overview()!.totalDocuments | number }}</div>
            <div class="kpi-label">Documents</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon kpi-emerald"><mat-icon>people</mat-icon></div>
            <div class="kpi-value">{{ overview()!.activeUsers | number }}</div>
            <div class="kpi-label">Active Users</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon kpi-amber"><mat-icon>bolt</mat-icon></div>
            <div class="kpi-value">{{ overview()!.avgResponseTimeMs | number:'1.0-0' }}<span style="font-size:1rem;color:var(--text-400)">ms</span></div>
            <div class="kpi-label">Avg Response</div>
          </div>
        </div>
      }

      <!-- Charts row -->
      <div class="charts-row">
        <div class="chart-card chart-wide">
          <div class="chart-header">
            <h3 class="chart-title">Questions per Day</h3>
            <span class="chart-period">Last 30 days</span>
          </div>
          <canvas #questionsChart></canvas>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Top Topics</h3>
          </div>
          <canvas #topicsChart></canvas>
        </div>
      </div>

      <!-- Tables row -->
      <div class="tables-row">
        <!-- Top documents -->
        <div class="list-card">
          <div class="list-header">
            <h3 class="chart-title">Top Documents</h3>
          </div>
          @for (doc of topDocuments(); track doc.documentId; let i = $index) {
            <div class="list-row">
              <div class="list-rank">{{ i + 1 }}</div>
              <div class="list-main">
                <div class="list-icon"><mat-icon style="font-size:14px;width:14px;height:14px">description</mat-icon></div>
                <span class="list-name">{{ doc.documentName }}</span>
              </div>
              <div class="list-count">{{ doc.referenceCount }} refs</div>
            </div>
          }
          @if (topDocuments().length === 0) {
            <div class="list-empty">No data yet</div>
          }
        </div>

        <!-- User activity -->
        <div class="list-card">
          <div class="list-header">
            <h3 class="chart-title">User Activity</h3>
          </div>
          @for (u of userActivity(); track u.userId) {
            <div class="list-row">
              <div class="ua-avatar">{{ u.firstName[0] }}{{ u.lastName[0] }}</div>
              <div class="ua-info">
                <div class="ua-name">{{ u.firstName }} {{ u.lastName }}</div>
                <div class="ua-last">Last active {{ u.lastActive | date:'MMM d' }}</div>
              </div>
              <span class="badge badge-info">{{ u.questionCount }}q</span>
            </div>
          }
          @if (userActivity().length === 0) {
            <div class="list-empty">No data yet</div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-page { max-width:1100px; }
    .page-header { margin-bottom:28px; }
    .page-title { font-size:1.8rem;font-weight:700;color:var(--text-100);letter-spacing:-0.04em;margin:0 0 4px; }
    .page-sub { color:var(--text-400);font-size:0.875rem;margin:0; }

    .kpi-row { display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px; }
    @media(max-width:900px){.kpi-row{grid-template-columns:repeat(2,1fr);}}
    .kpi-card { background:rgba(255,255,255,0.03);border:1px solid var(--border-sm);border-radius:var(--radius-lg);padding:20px; }
    .kpi-icon { width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:14px; mat-icon{font-size:18px!important;width:18px!important;height:18px!important;} }
    .kpi-violet { background:rgba(139,92,246,0.18);border:1px solid rgba(139,92,246,0.3); mat-icon{color:var(--violet-light)!important} }
    .kpi-cyan   { background:rgba(34,211,238,0.15);border:1px solid rgba(34,211,238,0.25); mat-icon{color:var(--cyan)!important} }
    .kpi-emerald{ background:rgba(52,211,153,0.15);border:1px solid rgba(52,211,153,0.25); mat-icon{color:var(--emerald)!important} }
    .kpi-amber  { background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.25); mat-icon{color:var(--amber)!important} }
    .kpi-value { font-size:1.9rem;font-weight:700;color:var(--text-100);letter-spacing:-0.04em;line-height:1;margin-bottom:6px; }
    .kpi-label { font-size:0.78rem;color:var(--text-400);font-weight:500; }

    .charts-row { display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:16px; }
    @media(max-width:900px){.charts-row{grid-template-columns:1fr;}}
    .chart-card { background:rgba(255,255,255,0.02);border:1px solid var(--border-sm);border-radius:var(--radius-xl);padding:24px; }
    .chart-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:20px; }
    .chart-title { font-size:0.875rem;font-weight:600;color:var(--text-200);margin:0;letter-spacing:-0.01em; }
    .chart-period { font-size:0.72rem;color:var(--text-500);background:rgba(255,255,255,0.04);border:1px solid var(--border-xs);padding:3px 10px;border-radius:var(--radius-pill); }

    .tables-row { display:grid;grid-template-columns:1fr 1fr;gap:16px; }
    @media(max-width:768px){.tables-row{grid-template-columns:1fr;}}
    .list-card { background:rgba(255,255,255,0.02);border:1px solid var(--border-sm);border-radius:var(--radius-xl);overflow:hidden; }
    .list-header { padding:18px 20px 14px;border-bottom:1px solid var(--border-xs); }
    .list-row { display:flex;align-items:center;gap:12px;padding:12px 20px;border-bottom:1px solid var(--border-xs);transition:background var(--transition); &:last-child{border-bottom:none;} &:hover{background:rgba(255,255,255,0.02);} }
    .list-rank { width:20px;font-size:0.75rem;font-weight:700;color:var(--text-500);flex-shrink:0;text-align:center; }
    .list-main { flex:1;display:flex;align-items:center;gap:8px;min-width:0; }
    .list-icon { width:28px;height:28px;border-radius:7px;background:rgba(255,255,255,0.05);border:1px solid var(--border-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0; mat-icon{color:var(--text-400)!important} }
    .list-name { font-size:0.825rem;font-weight:500;color:var(--text-200);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
    .list-count { font-size:0.75rem;font-weight:600;color:var(--text-400);flex-shrink:0; }
    .list-empty { padding:32px;text-align:center;font-size:0.82rem;color:var(--text-500); }

    .ua-avatar { width:32px;height:32px;border-radius:9px;background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.25);display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;color:var(--violet-light);flex-shrink:0; }
    .ua-info { flex:1;min-width:0; }
    .ua-name { font-size:0.825rem;font-weight:500;color:var(--text-200); }
    .ua-last { font-size:0.72rem;color:var(--text-500); }
  `],
})
export class AnalyticsComponent implements OnInit, AfterViewInit {
  private svc = inject(AnalyticsService);

  @ViewChild('questionsChart') questionsRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topicsChart')   topicsRef!:   ElementRef<HTMLCanvasElement>;

  overview      = signal<AnalyticsOverview | null>(null);
  topDocuments  = signal<TopDocument[]>([]);
  userActivity  = signal<UserActivity[]>([]);
  private qData: DailyQuestions[] = [];
  private tData:  TopTopic[] = [];
  private ready = false;

  ngOnInit(): void {
    this.svc.getOverview().subscribe({ next: r => { if (r.success) this.overview.set(r.data); } });
    this.svc.getTopDocuments().subscribe({ next: r => { if (r.success) this.topDocuments.set(r.data); } });
    this.svc.getUserActivity().subscribe({ next: r => { if (r.success) this.userActivity.set(r.data); } });
    this.svc.getDailyQuestions().subscribe({ next: r => { if (r.success) { this.qData = r.data; if (this.ready) this.renderQ(); } } });
    this.svc.getTopTopics().subscribe({ next: r => { if (r.success) { this.tData = r.data; if (this.ready) this.renderT(); } } });
  }

  ngAfterViewInit(): void {
    this.ready = true;
    setTimeout(() => { this.renderQ(); this.renderT(); }, 0);
  }

  renderQ(): void {
    if (!this.questionsRef) return;
    new Chart(this.questionsRef.nativeElement, {
      type: 'line',
      data: {
        labels: this.qData.map(d => d.date),
        datasets: [{
          data: this.qData.map(d => d.count),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139,92,246,0.08)',
          fill: true, tension: 0.4, pointRadius: 3,
          pointBackgroundColor: '#8b5cf6',
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#64748b', font: { family: 'Inter' } }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { beginAtZero: true, ticks: { color: '#64748b', font: { family: 'Inter' } }, grid: { color: 'rgba(255,255,255,0.04)' } },
        },
      },
    });
  }

  renderT(): void {
    if (!this.topicsRef) return;
    const colors = ['#8b5cf6','#6366f1','#22d3ee','#34d399','#fbbf24','#fb7185','#f59e0b','#60a5fa'];
    new Chart(this.topicsRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: this.tData.map(t => t.topic),
        datasets: [{ data: this.tData.map(t => t.count), backgroundColor: colors, borderWidth: 0, hoverBorderWidth: 2, hoverBorderColor: 'rgba(255,255,255,0.3)' }],
      },
      options: {
        responsive: true,
        cutout: '68%',
        plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 }, padding: 12, boxWidth: 10, borderRadius: 3 } } },
      },
    });
  }
}
