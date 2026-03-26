import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DecimalPipe, DatePipe, SlicePipe } from '@angular/common';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ChatService } from '../../core/services/chat.service';
import { DocumentService } from '../../core/services/document.service';
import { AuthService } from '../../core/services/auth.service';
import { AnalyticsOverview, TopDocument, TopTopic } from '../../core/models/analytics.model';
import { Conversation } from '../../core/models/chat.model';
import { Document as KnowledgeDocument } from '../../core/models/document.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatButtonModule, DecimalPipe, DatePipe, SlicePipe],
  template: `
    <div class="dash">

      <!-- ── Header ── -->
      <div class="dash-header">
        <div>
          <div class="greeting-badge">
            <span class="greeting-dot"></span>
            {{ dateStr() }}
          </div>
          <h1 class="page-title">
            Good {{ greeting() }},
            <span class="name-gradient">{{ user()?.firstName }}</span>
          </h1>
          <p class="page-sub">Here's your workspace overview. Your AI assistant is ready.</p>
        </div>
        <div class="header-actions">
          <a routerLink="/documents" class="btn-outline">
            <mat-icon>upload_file</mat-icon>
            Upload Doc
          </a>
          <a routerLink="/chat" class="btn-primary cta-btn">
            <mat-icon>auto_awesome</mat-icon>
            Ask AI
          </a>
        </div>
      </div>

      <!-- ── Stat Cards ── -->
      <div class="stats-grid">
        @if (overview(); as ov) {
          <div class="stat-card stat-violet">
            <div class="stat-top">
              <div class="stat-icon-wrap stat-icon-violet">
                <mat-icon>forum</mat-icon>
              </div>
              <div class="stat-badge badge-green">
                <mat-icon style="font-size:12px;width:12px;height:12px">trending_up</mat-icon>
                +{{ ov.questionsToday }} today
              </div>
            </div>
            <div class="stat-number">{{ ov.totalQuestions | number }}</div>
            <div class="stat-label">Total Questions Asked</div>
            <div class="stat-bar">
              <div class="stat-bar-fill stat-bar-violet" [style.width.%]="Math.min(ov.questionsToday * 10, 100)"></div>
            </div>
          </div>

          <div class="stat-card stat-cyan">
            <div class="stat-top">
              <div class="stat-icon-wrap stat-icon-cyan">
                <mat-icon>description</mat-icon>
              </div>
              <div class="stat-badge badge-cyan">Knowledge base</div>
            </div>
            <div class="stat-number">{{ ov.totalDocuments | number }}</div>
            <div class="stat-label">Documents Indexed</div>
            <div class="stat-bar">
              <div class="stat-bar-fill stat-bar-cyan" style="width:70%"></div>
            </div>
          </div>

          <div class="stat-card stat-emerald">
            <div class="stat-top">
              <div class="stat-icon-wrap stat-icon-emerald">
                <mat-icon>people</mat-icon>
              </div>
              <div class="stat-badge badge-emerald">{{ ov.activeUsers }} online</div>
            </div>
            <div class="stat-number">{{ ov.totalUsers | number }}</div>
            <div class="stat-label">Team Members</div>
            <div class="stat-bar">
              <div class="stat-bar-fill stat-bar-emerald"
                [style.width.%]="ov.totalUsers > 0 ? (ov.activeUsers / ov.totalUsers * 100) : 0"></div>
            </div>
          </div>

          <div class="stat-card stat-amber">
            <div class="stat-top">
              <div class="stat-icon-wrap stat-icon-amber">
                <mat-icon>bolt</mat-icon>
              </div>
              <div class="stat-badge badge-amber">GPT-4o mini</div>
            </div>
            <div class="stat-number">{{ ov.avgResponseTimeMs | number:'1.0-0' }}<span class="stat-unit">ms</span></div>
            <div class="stat-label">Avg AI Response Time</div>
            <div class="stat-bar">
              <div class="stat-bar-fill stat-bar-amber" [style.width.%]="Math.min(ov.avgResponseTimeMs / 50, 100)"></div>
            </div>
          </div>
        } @else {
          @for (i of [1,2,3,4]; track i) {
            <div class="stat-card">
              <div class="skeleton" style="height:40px;width:40px;border-radius:10px;margin-bottom:16px"></div>
              <div class="skeleton" style="height:36px;width:70%;margin-bottom:8px"></div>
              <div class="skeleton" style="height:14px;width:50%;margin-bottom:12px"></div>
              <div class="skeleton" style="height:4px;width:100%;border-radius:4px"></div>
            </div>
          }
        }
      </div>

      <!-- ── Main Grid ── -->
      <div class="main-grid">

        <!-- LEFT column -->
        <div class="left-col">

          <!-- Recent Conversations -->
          <div class="widget">
            <div class="widget-header">
              <div class="widget-title">
                <div class="widget-icon widget-icon-violet">
                  <mat-icon>chat_bubble</mat-icon>
                </div>
                Recent Conversations
              </div>
              <a routerLink="/chat" class="widget-action">
                View all <mat-icon>arrow_forward</mat-icon>
              </a>
            </div>
            <div class="widget-body">
              @if (conversations().length) {
                @for (conv of conversations() | slice:0:5; track conv.id) {
                  <a [routerLink]="['/chat', conv.id]" class="conv-row">
                    <div class="conv-icon">
                      <mat-icon>chat</mat-icon>
                    </div>
                    <div class="conv-info">
                      <div class="conv-title">{{ conv.title }}</div>
                      <div class="conv-meta">{{ conv.updatedAt | date:'MMM d, h:mm a' }}</div>
                    </div>
                    <mat-icon class="conv-arrow">chevron_right</mat-icon>
                  </a>
                }
              } @else if (loadingConversations()) {
                @for (i of [1,2,3]; track i) {
                  <div class="conv-row" style="pointer-events:none">
                    <div class="skeleton" style="width:36px;height:36px;border-radius:10px;flex-shrink:0"></div>
                    <div style="flex:1">
                      <div class="skeleton" style="height:14px;width:80%;margin-bottom:6px"></div>
                      <div class="skeleton" style="height:11px;width:50%"></div>
                    </div>
                  </div>
                }
              } @else {
                <div class="empty-state">
                  <div class="empty-icon">
                    <mat-icon>chat_bubble_outline</mat-icon>
                  </div>
                  <div class="empty-title">No conversations yet</div>
                  <div class="empty-sub">Start a new chat to get answers from your documents</div>
                  <a routerLink="/chat" class="btn-primary" style="margin-top:12px;font-size:0.8rem;padding:8px 16px">
                    Start chatting
                  </a>
                </div>
              }
            </div>
          </div>

          <!-- Recent Documents -->
          <div class="widget">
            <div class="widget-header">
              <div class="widget-title">
                <div class="widget-icon widget-icon-cyan">
                  <mat-icon>folder_open</mat-icon>
                </div>
                Recent Documents
              </div>
              <a routerLink="/documents" class="widget-action">
                View all <mat-icon>arrow_forward</mat-icon>
              </a>
            </div>
            <div class="widget-body">
              @if (documents().length) {
                @for (doc of documents() | slice:0:5; track doc.id) {
                  <div class="doc-row">
                    <div class="doc-icon" [class]="'doc-icon-' + doc.fileType.toLowerCase()">
                      <mat-icon>{{ docIcon(doc.fileType) }}</mat-icon>
                    </div>
                    <div class="doc-info">
                      <div class="doc-name">{{ doc.name }}</div>
                      <div class="doc-meta">
                        <span class="doc-type-badge">{{ doc.fileType }}</span>
                        @if (doc.category) { <span class="doc-cat">{{ doc.category }}</span> }
                        <span>{{ doc.createdAt | date:'MMM d' }}</span>
                      </div>
                    </div>
                    <div class="doc-status" [class]="'doc-status-' + doc.status.toLowerCase()">
                      <span class="doc-status-dot"></span>
                      {{ doc.status }}
                    </div>
                  </div>
                }
              } @else if (loadingDocuments()) {
                @for (i of [1,2,3]; track i) {
                  <div class="doc-row">
                    <div class="skeleton" style="width:36px;height:36px;border-radius:10px;flex-shrink:0"></div>
                    <div style="flex:1">
                      <div class="skeleton" style="height:14px;width:70%;margin-bottom:6px"></div>
                      <div class="skeleton" style="height:11px;width:45%"></div>
                    </div>
                  </div>
                }
              } @else {
                <div class="empty-state">
                  <div class="empty-icon">
                    <mat-icon>folder_open</mat-icon>
                  </div>
                  <div class="empty-title">No documents yet</div>
                  <div class="empty-sub">Upload your first document to power the AI</div>
                  <a routerLink="/documents" class="btn-primary" style="margin-top:12px;font-size:0.8rem;padding:8px 16px">
                    Upload now
                  </a>
                </div>
              }
            </div>
          </div>

        </div>

        <!-- RIGHT column -->
        <div class="right-col">

          <!-- AI Status Card -->
          <div class="widget ai-status-widget">
            <div class="ai-status-glow"></div>
            <div class="ai-status-header">
              <div class="ai-status-orb">
                <mat-icon>auto_awesome</mat-icon>
              </div>
              <div>
                <div class="ai-status-title">AI Assistant</div>
                <div class="ai-status-sub">Powered by OpenAI</div>
              </div>
              <div class="ai-live-badge">
                <span class="live-dot"></span>
                LIVE
              </div>
            </div>
            <div class="ai-model-info">
              <div class="ai-model-row">
                <span class="ai-model-label">LLM Model</span>
                <span class="ai-model-value">GPT-4o mini</span>
              </div>
              <div class="ai-model-row">
                <span class="ai-model-label">Embeddings</span>
                <span class="ai-model-value">text-embedding-3-small</span>
              </div>
              <div class="ai-model-row">
                <span class="ai-model-label">Vector Store</span>
                <span class="ai-model-value">PGVector (1536D)</span>
              </div>
              <div class="ai-model-row">
                <span class="ai-model-label">Context Window</span>
                <span class="ai-model-value">Last 10 messages</span>
              </div>
            </div>
            <div style="padding:0 18px 16px">
              <a routerLink="/chat" class="btn-primary" style="width:100%;justify-content:center;box-sizing:border-box">
                <mat-icon>auto_awesome</mat-icon>
                Start New Chat
              </a>
            </div>
          </div>

          <!-- Top Referenced Documents -->
          @if (topDocuments().length) {
            <div class="widget">
              <div class="widget-header">
                <div class="widget-title">
                  <div class="widget-icon widget-icon-amber">
                    <mat-icon>bar_chart</mat-icon>
                  </div>
                  Most Referenced
                </div>
              </div>
              <div class="widget-body">
                @for (doc of topDocuments() | slice:0:5; track doc.documentId; let i = $index) {
                  <div class="top-doc-row">
                    <div class="top-doc-rank">#{{ i + 1 }}</div>
                    <div class="top-doc-info">
                      <div class="top-doc-name">{{ doc.documentName }}</div>
                      <div class="top-doc-bar-wrap">
                        <div class="top-doc-bar">
                          <div class="top-doc-bar-fill"
                            [style.width.%]="topDocuments()[0].referenceCount > 0 ? (doc.referenceCount / topDocuments()[0].referenceCount * 100) : 0">
                          </div>
                        </div>
                        <span class="top-doc-count">{{ doc.referenceCount }}</span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Top Topics -->
          @if (topTopics().length) {
            <div class="widget">
              <div class="widget-header">
                <div class="widget-title">
                  <div class="widget-icon widget-icon-emerald">
                    <mat-icon>tag</mat-icon>
                  </div>
                  Trending Topics
                </div>
              </div>
              <div class="widget-body topics-body">
                @for (t of topTopics() | slice:0:8; track t.topic) {
                  <div class="topic-chip">
                    <mat-icon>trending_up</mat-icon>
                    {{ t.topic }}
                    <span class="topic-count">{{ t.count }}</span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Quick Actions -->
          <div class="widget">
            <div class="widget-header">
              <div class="widget-title">
                <div class="widget-icon" style="background:rgba(148,163,184,0.12);border-color:rgba(148,163,184,0.2)">
                  <mat-icon style="color:var(--text-300)!important">grid_view</mat-icon>
                </div>
                Quick Actions
              </div>
            </div>
            <div class="quick-actions">
              <a routerLink="/chat" class="qa-btn qa-btn-primary">
                <mat-icon>auto_awesome</mat-icon>
                New Chat
              </a>
              <a routerLink="/documents" class="qa-btn">
                <mat-icon>upload_file</mat-icon>
                Upload
              </a>
              <a routerLink="/analytics" class="qa-btn">
                <mat-icon>insights</mat-icon>
                Analytics
              </a>
              <a routerLink="/users" class="qa-btn">
                <mat-icon>manage_accounts</mat-icon>
                Team
              </a>
              <a routerLink="/settings" class="qa-btn">
                <mat-icon>settings</mat-icon>
                Settings
              </a>
              <a routerLink="/documents" class="qa-btn">
                <mat-icon>folder_open</mat-icon>
                Docs
              </a>
            </div>
          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    .dash { max-width: 1200px; }

    /* ── Header ── */
    .dash-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 28px;
      gap: 16px;
      flex-wrap: wrap;
    }
    .greeting-badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-500);
      margin-bottom: 8px;
    }
    .greeting-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--emerald);
      box-shadow: 0 0 8px var(--emerald);
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(0.85); }
    }
    .page-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-100);
      margin: 0 0 6px;
      letter-spacing: -0.04em;
    }
    .name-gradient {
      background: var(--grad-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .page-sub { color: var(--text-400); font-size: 0.875rem; margin: 0; }

    .header-actions { display: flex; gap: 10px; align-items: center; flex-shrink: 0; }

    .btn-outline {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 9px 16px; border-radius: var(--radius-md);
      font-size: 0.8rem; font-weight: 600; text-decoration: none;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--border-md);
      color: var(--text-200);
      transition: all var(--transition);
      mat-icon { font-size: 16px !important; width: 16px !important; height: 16px !important; }
      &:hover { background: rgba(255,255,255,0.08); border-color: var(--border-lg); color: var(--text-100); }
    }
    .cta-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 9px 18px; border-radius: var(--radius-md);
      font-size: 0.8rem; font-weight: 600; text-decoration: none;
      background: var(--grad-primary); color: white;
      box-shadow: 0 4px 20px rgba(139,92,246,0.35);
      transition: all var(--transition); flex-shrink: 0;
      mat-icon { font-size: 16px !important; width: 16px !important; height: 16px !important; }
      &:hover { box-shadow: 0 6px 28px rgba(139,92,246,0.5); transform: translateY(-1px); }
    }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 9px 16px; border-radius: var(--radius-md);
      font-size: 0.8rem; font-weight: 600; text-decoration: none;
      background: var(--grad-primary); color: white;
      transition: all var(--transition);
      mat-icon { font-size: 16px !important; width: 16px !important; height: 16px !important; }
      &:hover { opacity: 0.9; transform: translateY(-1px); }
    }

    /* ── Stats ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-bottom: 24px;
    }
    @media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) { .stats-grid { grid-template-columns: 1fr; } }

    .stat-card {
      background: rgba(255,255,255,0.025);
      border: 1px solid var(--border-sm);
      border-radius: var(--radius-lg);
      padding: 20px;
      position: relative; overflow: hidden;
      transition: all var(--transition);
      &::after {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 1px;
        opacity: 0;
        transition: opacity var(--transition);
      }
      &:hover { border-color: var(--border-md); transform: translateY(-2px); }
      &:hover::after { opacity: 1; }
    }
    .stat-violet::after { background: linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent); }
    .stat-cyan::after   { background: linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent); }
    .stat-emerald::after{ background: linear-gradient(90deg, transparent, rgba(52,211,153,0.5), transparent); }
    .stat-amber::after  { background: linear-gradient(90deg, transparent, rgba(251,191,36,0.5), transparent); }

    .stat-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }

    .stat-icon-wrap {
      width: 38px; height: 38px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 18px !important; width: 18px !important; height: 18px !important; }
    }
    .stat-icon-violet { background: rgba(139,92,246,0.18); border: 1px solid rgba(139,92,246,0.28); mat-icon { color: #a78bfa !important; } }
    .stat-icon-cyan   { background: rgba(34,211,238,0.14); border: 1px solid rgba(34,211,238,0.22); mat-icon { color: var(--cyan) !important; } }
    .stat-icon-emerald{ background: rgba(52,211,153,0.14); border: 1px solid rgba(52,211,153,0.22); mat-icon { color: var(--emerald) !important; } }
    .stat-icon-amber  { background: rgba(251,191,36,0.14); border: 1px solid rgba(251,191,36,0.22); mat-icon { color: var(--amber) !important; } }

    .stat-badge {
      font-size: 0.68rem; font-weight: 600;
      padding: 3px 8px; border-radius: var(--radius-pill);
      display: flex; align-items: center; gap: 3px;
    }
    .badge-green   { background: rgba(52,211,153,0.12); color: var(--emerald); border: 1px solid rgba(52,211,153,0.2); }
    .badge-cyan    { background: rgba(34,211,238,0.1); color: var(--cyan); border: 1px solid rgba(34,211,238,0.18); }
    .badge-emerald { background: rgba(52,211,153,0.12); color: var(--emerald); border: 1px solid rgba(52,211,153,0.2); }
    .badge-amber   { background: rgba(251,191,36,0.1); color: var(--amber); border: 1px solid rgba(251,191,36,0.18); }

    .stat-number {
      font-size: 1.9rem; font-weight: 700;
      color: var(--text-100); letter-spacing: -0.04em; line-height: 1;
      margin-bottom: 5px;
    }
    .stat-unit { font-size: 1rem; color: var(--text-400); margin-left: 2px; }
    .stat-label { font-size: 0.75rem; color: var(--text-400); font-weight: 500; margin-bottom: 12px; }

    .stat-bar {
      height: 3px; background: rgba(255,255,255,0.06);
      border-radius: 2px; overflow: hidden;
    }
    .stat-bar-fill {
      height: 100%; border-radius: 2px;
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .stat-bar-violet { background: linear-gradient(90deg, #7c3aed, #a78bfa); }
    .stat-bar-cyan   { background: linear-gradient(90deg, #0891b2, #22d3ee); }
    .stat-bar-emerald{ background: linear-gradient(90deg, #059669, #34d399); }
    .stat-bar-amber  { background: linear-gradient(90deg, #d97706, #fbbf24); }

    /* ── Main Grid ── */
    .main-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 16px;
      align-items: start;
    }
    @media (max-width: 1024px) { .main-grid { grid-template-columns: 1fr; } }

    .left-col, .right-col { display: flex; flex-direction: column; gap: 16px; }

    /* ── Widget ── */
    .widget {
      background: rgba(255,255,255,0.025);
      border: 1px solid var(--border-sm);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }
    .widget-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 18px;
      border-bottom: 1px solid var(--border-sm);
    }
    .widget-title {
      display: flex; align-items: center; gap: 10px;
      font-size: 0.8rem; font-weight: 700;
      color: var(--text-200); letter-spacing: 0.02em;
    }
    .widget-icon {
      width: 28px; height: 28px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 14px !important; width: 14px !important; height: 14px !important; }
    }
    .widget-icon-violet { background: rgba(139,92,246,0.18); border: 1px solid rgba(139,92,246,0.28); mat-icon { color: #a78bfa !important; } }
    .widget-icon-cyan   { background: rgba(34,211,238,0.14); border: 1px solid rgba(34,211,238,0.22); mat-icon { color: var(--cyan) !important; } }
    .widget-icon-amber  { background: rgba(251,191,36,0.14); border: 1px solid rgba(251,191,36,0.22); mat-icon { color: var(--amber) !important; } }
    .widget-icon-emerald{ background: rgba(52,211,153,0.14); border: 1px solid rgba(52,211,153,0.22); mat-icon { color: var(--emerald) !important; } }

    .widget-action {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.72rem; font-weight: 600;
      color: var(--violet-light); text-decoration: none;
      transition: gap var(--transition);
      mat-icon { font-size: 14px !important; width: 14px !important; height: 14px !important; }
      &:hover { gap: 7px; }
    }
    .widget-body { padding: 8px 0; }

    /* ── Conversation rows ── */
    .conv-row {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 18px;
      text-decoration: none;
      transition: background var(--transition);
      cursor: pointer;
      &:hover { background: rgba(255,255,255,0.04); .conv-arrow { opacity: 1; transform: translateX(3px); } }
    }
    .conv-icon {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.2);
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 16px !important; width: 16px !important; height: 16px !important; color: #a78bfa !important; }
    }
    .conv-info { flex: 1; min-width: 0; }
    .conv-title {
      font-size: 0.825rem; font-weight: 500; color: var(--text-100);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      margin-bottom: 3px;
    }
    .conv-meta { font-size: 0.72rem; color: var(--text-500); }
    .conv-arrow {
      font-size: 16px !important; width: 16px !important; height: 16px !important;
      color: var(--text-500); opacity: 0;
      transition: all var(--transition); flex-shrink: 0;
    }

    /* ── Document rows ── */
    .doc-row {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 18px;
      transition: background var(--transition);
      &:hover { background: rgba(255,255,255,0.03); }
    }
    .doc-icon {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 16px !important; width: 16px !important; height: 16px !important; }
    }
    .doc-icon-pdf  { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.2); mat-icon { color: #f87171 !important; } }
    .doc-icon-word { background: rgba(96,165,250,0.12); border: 1px solid rgba(96,165,250,0.2); mat-icon { color: var(--sky) !important; } }
    .doc-icon-txt  { background: rgba(148,163,184,0.1); border: 1px solid rgba(148,163,184,0.18); mat-icon { color: var(--text-300) !important; } }
    .doc-icon-url  { background: rgba(52,211,153,0.12); border: 1px solid rgba(52,211,153,0.2); mat-icon { color: var(--emerald) !important; } }

    .doc-info { flex: 1; min-width: 0; }
    .doc-name {
      font-size: 0.825rem; font-weight: 500; color: var(--text-100);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;
    }
    .doc-meta {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.7rem; color: var(--text-500);
    }
    .doc-type-badge {
      padding: 1px 6px; border-radius: 4px;
      background: rgba(255,255,255,0.06); border: 1px solid var(--border-sm);
      font-size: 0.65rem; font-weight: 600; color: var(--text-400);
      text-transform: uppercase; letter-spacing: 0.04em;
    }
    .doc-cat {
      padding: 1px 6px; border-radius: 4px;
      background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.18);
      font-size: 0.65rem; font-weight: 600; color: #a78bfa;
    }

    .doc-status {
      display: flex; align-items: center; gap: 5px;
      font-size: 0.68rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.05em; flex-shrink: 0;
    }
    .doc-status-dot { width: 6px; height: 6px; border-radius: 50%; }
    .doc-status-ready      { color: var(--emerald); .doc-status-dot { background: var(--emerald); box-shadow: 0 0 6px var(--emerald); } }
    .doc-status-processing { color: var(--amber);   .doc-status-dot { background: var(--amber); animation: pulse 1.5s ease-in-out infinite; } }
    .doc-status-pending    { color: var(--text-400); .doc-status-dot { background: var(--text-400); } }
    .doc-status-failed     { color: #f87171;         .doc-status-dot { background: #f87171; } }

    /* ── Empty state ── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 32px 20px; text-align: center;
    }
    .empty-icon {
      width: 48px; height: 48px; border-radius: 14px;
      background: rgba(255,255,255,0.04); border: 1px solid var(--border-sm);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 12px;
      mat-icon { font-size: 22px !important; width: 22px !important; height: 22px !important; color: var(--text-500) !important; }
    }
    .empty-title { font-size: 0.875rem; font-weight: 600; color: var(--text-300); margin-bottom: 6px; }
    .empty-sub   { font-size: 0.78rem; color: var(--text-500); line-height: 1.5; }

    /* ── AI Status Widget ── */
    .ai-status-widget {
      position: relative; overflow: hidden;
      border-color: rgba(139,92,246,0.2);
      background: rgba(139,92,246,0.04);
    }
    .ai-status-glow {
      position: absolute; top: -40px; right: -40px;
      width: 120px; height: 120px; border-radius: 50%;
      background: radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%);
      pointer-events: none;
    }
    .ai-status-header {
      display: flex; align-items: center; gap: 12px;
      padding: 16px 18px 14px;
      border-bottom: 1px solid rgba(139,92,246,0.15);
    }
    .ai-status-orb {
      width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
      background: rgba(139,92,246,0.2); border: 1px solid rgba(139,92,246,0.35);
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 18px !important; width: 18px !important; height: 18px !important; color: #a78bfa !important; }
    }
    .ai-status-title { font-size: 0.875rem; font-weight: 700; color: var(--text-100); margin-bottom: 2px; }
    .ai-status-sub   { font-size: 0.72rem; color: var(--text-400); }
    .ai-live-badge {
      margin-left: auto;
      display: flex; align-items: center; gap: 5px;
      font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em;
      color: var(--emerald); padding: 3px 8px; border-radius: var(--radius-pill);
      background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.2);
    }
    .live-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--emerald); box-shadow: 0 0 8px var(--emerald);
      animation: pulse 1.8s ease-in-out infinite;
    }

    .ai-model-info { padding: 14px 18px; display: flex; flex-direction: column; gap: 10px; }
    .ai-model-row { display: flex; align-items: center; justify-content: space-between; }
    .ai-model-label { font-size: 0.72rem; color: var(--text-500); }
    .ai-model-value {
      font-size: 0.72rem; font-weight: 600; color: var(--text-200);
      padding: 2px 8px; border-radius: 5px;
      background: rgba(255,255,255,0.05); border: 1px solid var(--border-sm);
    }

    /* ── Top Documents ── */
    .top-doc-row {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 18px;
    }
    .top-doc-rank {
      font-size: 0.7rem; font-weight: 700; color: var(--text-500);
      width: 20px; flex-shrink: 0;
    }
    .top-doc-info { flex: 1; min-width: 0; }
    .top-doc-name {
      font-size: 0.78rem; font-weight: 500; color: var(--text-200);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      margin-bottom: 5px;
    }
    .top-doc-bar-wrap { display: flex; align-items: center; gap: 8px; }
    .top-doc-bar {
      flex: 1; height: 3px; background: rgba(255,255,255,0.06);
      border-radius: 2px; overflow: hidden;
    }
    .top-doc-bar-fill {
      height: 100%; border-radius: 2px;
      background: linear-gradient(90deg, #d97706, #fbbf24);
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .top-doc-count { font-size: 0.68rem; color: var(--text-500); flex-shrink: 0; }

    /* ── Topics ── */
    .topics-body { padding: 12px 18px; display: flex; flex-wrap: wrap; gap: 8px; }
    .topic-chip {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 10px; border-radius: var(--radius-pill);
      font-size: 0.72rem; font-weight: 500; color: var(--text-300);
      background: rgba(255,255,255,0.04); border: 1px solid var(--border-sm);
      transition: all var(--transition);
      mat-icon { font-size: 11px !important; width: 11px !important; height: 11px !important; color: var(--emerald) !important; }
      &:hover { background: rgba(255,255,255,0.07); border-color: var(--border-md); color: var(--text-100); }
    }
    .topic-count {
      padding: 1px 5px; border-radius: 4px;
      background: rgba(255,255,255,0.07); font-size: 0.65rem;
      color: var(--text-400); font-weight: 600; margin-left: 2px;
    }

    /* ── Quick Actions ── */
    .quick-actions {
      padding: 14px;
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
    }
    .qa-btn {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 12px 8px;
      background: rgba(255,255,255,0.03); border: 1px solid var(--border-sm);
      border-radius: var(--radius-md); text-decoration: none;
      font-size: 0.68rem; font-weight: 600; color: var(--text-300);
      transition: all var(--transition);
      mat-icon { font-size: 18px !important; width: 18px !important; height: 18px !important; color: var(--text-400) !important; }
      &:hover {
        background: rgba(255,255,255,0.07); border-color: var(--border-md);
        color: var(--text-100); transform: translateY(-2px);
        mat-icon { color: var(--violet-light) !important; }
      }
    }
    .qa-btn-primary {
      background: rgba(139,92,246,0.1); border-color: rgba(139,92,246,0.25);
      color: #a78bfa;
      mat-icon { color: #a78bfa !important; }
      &:hover { background: rgba(139,92,246,0.18); border-color: rgba(139,92,246,0.4); }
    }

    /* ── Skeleton ── */
    .skeleton {
      background: linear-gradient(90deg,
        rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 6px;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  protected readonly Math = Math;

  private analytics = inject(AnalyticsService);
  private chat = inject(ChatService);
  private docService = inject(DocumentService);
  auth = inject(AuthService);

  user = this.auth.currentUser;

  overview            = signal<AnalyticsOverview | null>(null);
  conversations       = signal<Conversation[]>([]);
  documents           = signal<KnowledgeDocument[]>([]);
  topDocuments        = signal<TopDocument[]>([]);
  topTopics           = signal<TopTopic[]>([]);
  loadingConversations = signal(true);
  loadingDocuments     = signal(true);

  ngOnInit(): void {
    this.analytics.getOverview().subscribe({
      next: r => { if (r.success) this.overview.set(r.data); }
    });

    this.chat.listConversations(0, 5).subscribe({
      next: r => {
        if (r.success) this.conversations.set(r.data.content ?? []);
        this.loadingConversations.set(false);
      },
      error: () => this.loadingConversations.set(false)
    });

    this.docService.list(0, 5).subscribe({
      next: r => {
        if (r.success) this.documents.set(r.data.content ?? []);
        this.loadingDocuments.set(false);
      },
      error: () => this.loadingDocuments.set(false)
    });

    this.analytics.getTopDocuments().subscribe({
      next: r => { if (r.success) this.topDocuments.set(r.data ?? []); }
    });

    this.analytics.getTopTopics().subscribe({
      next: r => { if (r.success) this.topTopics.set(r.data ?? []); }
    });
  }

  greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 18) return 'afternoon';
    return 'evening';
  }

  dateStr(): string {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  docIcon(type: string | undefined): string {
    const map: Record<string, string> = {
      PDF: 'picture_as_pdf',
      WORD: 'description',
      TXT: 'text_snippet',
      URL: 'link',
    };
    return (type && map[type]) ? map[type] : 'insert_drive_file';
  }
}
