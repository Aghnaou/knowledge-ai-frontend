import { Component, inject, OnInit, signal, ViewChild, ElementRef, OnDestroy, AfterViewChecked, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { Conversation, Message, MessageFeedback } from '../../core/models/chat.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule, MatSnackBarModule, FormsModule, DatePipe],
  template: `
    <div class="chat-shell">

      <!-- ── Sidebar ─────────────────────────────── -->
      <div class="conv-sidebar">
        <div class="conv-header">
          <span class="conv-title">Conversations</span>
          <button class="new-chat-btn" (click)="newConversation()">
            <mat-icon>add</mat-icon>
            New
          </button>
        </div>

        <div class="conv-list">
          @for (conv of conversations(); track conv.id) {
            <div
              class="conv-item"
              [class.conv-item-active]="activeId() === conv.id"
              (click)="loadConversation(conv.id)">
              <div class="conv-item-icon">
                <mat-icon>chat_bubble_outline</mat-icon>
              </div>
              <div class="conv-item-body">
                <div class="conv-item-title">{{ conv.title || 'New conversation' }}</div>
                <div class="conv-item-date">{{ conv.updatedAt | date:'MMM d, h:mm a' }}</div>
              </div>
              <button class="conv-delete-btn" (click)="deleteConv($event, conv.id)" matTooltip="Delete">
                <mat-icon>delete_outline</mat-icon>
              </button>
            </div>
          }
          @if (conversations().length === 0) {
            <div class="conv-empty">
              <mat-icon>chat_bubble_outline</mat-icon>
              <p>No conversations yet</p>
              <button class="start-btn" (click)="newConversation()">Start chatting</button>
            </div>
          }
        </div>
      </div>

      <!-- ── Chat area ─────────────────────────── -->
      <div class="chat-main">

        @if (activeId()) {
          <!-- Top bar -->
          <div class="chat-topbar">
            <div class="chat-topbar-left">
              <div class="chat-topbar-icon">
                <mat-icon>auto_awesome</mat-icon>
              </div>
              <div>
                <div class="chat-topbar-title">{{ activeTitle() || 'New Conversation' }}</div>
                <div class="chat-topbar-sub">Powered by GPT-4o mini · RAG</div>
              </div>
            </div>
            <div class="chat-topbar-badges">
              <span class="topbar-badge topbar-badge-green">
                <span class="pulse-dot pulse-dot-green"></span> Live
              </span>
            </div>
          </div>

          <!-- Messages -->
          <div class="messages-area" #scrollEl>
            @if (messages().length === 0 && !streaming()) {
              <div class="chat-welcome">
                <div class="welcome-orb">
                  <mat-icon>auto_awesome</mat-icon>
                </div>
                <h2 class="welcome-title">How can I help you today?</h2>
                <p class="welcome-sub">Ask anything about your documents. I'll search through the knowledge base and give you precise, sourced answers.</p>
                <div class="suggestions-grid">
                  @for (s of suggestions; track s.text) {
                    <button class="suggestion-chip" (click)="useSuggestion(s.text)">
                      <mat-icon>{{ s.icon }}</mat-icon>
                      {{ s.text }}
                    </button>
                  }
                </div>
              </div>
            }

            @for (msg of messages(); track msg.id) {
              <div class="msg-row" [class.msg-row-user]="msg.role === 'USER'">
                @if (msg.role === 'ASSISTANT') {
                  <div class="ai-avatar"><mat-icon>auto_awesome</mat-icon></div>
                }
                <div class="msg-body" [class.msg-body-user]="msg.role === 'USER'">
                  <div class="bubble" [class.bubble-user]="msg.role === 'USER'" [class.bubble-ai]="msg.role === 'ASSISTANT'">
                    {{ msg.content }}
                  </div>
                  @if (msg.role === 'ASSISTANT') {
                    <div class="msg-meta">
                      <span class="msg-time">{{ msg.createdAt | date:'h:mm a' }}</span>
                      <div class="feedback-row">
                        <button class="fb-btn" [class.fb-pos]="msg.feedback === 'POSITIVE'" (click)="feedback(msg, 'POSITIVE')" matTooltip="Helpful">
                          <mat-icon>thumb_up</mat-icon>
                        </button>
                        <button class="fb-btn" [class.fb-neg]="msg.feedback === 'NEGATIVE'" (click)="feedback(msg, 'NEGATIVE')" matTooltip="Not helpful">
                          <mat-icon>thumb_down</mat-icon>
                        </button>
                      </div>
                    </div>
                  }
                </div>
                @if (msg.role === 'USER') {
                  <div class="user-avatar">{{ userInitials() }}</div>
                }
              </div>
            }

            <!-- Streaming bubble -->
            @if (streaming()) {
              <div class="msg-row">
                <div class="ai-avatar"><mat-icon>auto_awesome</mat-icon></div>
                <div class="msg-body">
                  <div class="bubble bubble-ai">
                    @if (streamContent()) {
                      {{ streamContent() }}<span class="cursor-blink" style="color:var(--violet-light)">▋</span>
                    } @else {
                      <div class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Input -->
          <div class="input-area">
            <div class="input-wrap" [class.input-wrap-focused]="inputFocused">
              <textarea
                class="chat-textarea"
                [(ngModel)]="inputMsg"
                placeholder="Ask anything about your documents…"
                rows="1"
                [disabled]="streaming()"
                (focus)="inputFocused = true"
                (blur)="inputFocused = false"
                (keydown)="onKey($event)"
                (input)="autoResize($event)">
              </textarea>
              <div class="input-footer">
                <span class="input-hint">
                  <kbd>↵</kbd> Send &nbsp;·&nbsp; <kbd>⇧↵</kbd> New line
                </span>
                <button
                  class="send-btn"
                  [class.send-active]="inputMsg.trim() && !streaming()"
                  [disabled]="!inputMsg.trim() || streaming()"
                  (click)="send()">
                  @if (streaming()) {
                    <span class="send-spinner"></span>
                  } @else {
                    <mat-icon>arrow_upward</mat-icon>
                  }
                </button>
              </div>
            </div>
            <p class="input-disclaimer">AI can make mistakes. Verify important information.</p>
          </div>

        } @else {
          <div class="empty-state">
            <div class="empty-orb">
              <mat-icon>auto_awesome</mat-icon>
            </div>
            <h2 class="empty-title">Your AI Knowledge Assistant</h2>
            <p class="empty-sub">Start a new conversation or select one from the sidebar to query your documents with AI.</p>
            <button class="btn-primary-lg" (click)="newConversation()">
              <mat-icon>add</mat-icon>
              New Conversation
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display:block; height:calc(100vh - 56px); }

    .chat-shell {
      display: flex;
      height: 100%;
      border-radius: var(--radius-xl);
      overflow: hidden;
      border: 1px solid var(--border-sm);
      background: var(--bg-000);
    }

    /* ─── Sidebar ──────────────────────────────── */
    .conv-sidebar {
      width: 268px; flex-shrink: 0;
      display: flex; flex-direction: column;
      background: var(--bg-100);
      border-right: 1px solid var(--border-sm);
    }

    .conv-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 12px 10px;
      border-bottom: 1px solid var(--border-xs);
    }
    .conv-title {
      font-size: 0.68rem; font-weight: 700;
      letter-spacing: 0.09em; text-transform: uppercase;
      color: var(--text-500);
    }

    /* ── New-chat button in sidebar header ── */
    .new-chat-btn {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 11px 5px 8px;
      border-radius: var(--radius-pill);
      border: 1px solid rgba(139,92,246,0.35);
      background: rgba(139,92,246,0.12);
      color: #c4b5fd;
      font-size: 0.72rem; font-weight: 700;
      cursor: pointer; transition: all var(--transition);
      mat-icon { font-size: 14px!important; width: 14px!important; height: 14px!important; }
      &:hover {
        background: rgba(139,92,246,0.22);
        border-color: rgba(139,92,246,0.55);
        color: #ddd6fe;
        box-shadow: 0 0 12px rgba(139,92,246,0.2);
      }
    }

    .conv-list { flex: 1; overflow-y: auto; padding: 6px; }

    .conv-item {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 9px; border-radius: 10px;
      cursor: pointer; transition: all var(--transition);
      margin-bottom: 1px; position: relative;
      &:hover {
        background: rgba(255,255,255,0.05);
        .conv-delete-btn { opacity: 1; transform: scale(1); }
      }
    }
    .conv-item-active {
      background: rgba(139,92,246,0.12) !important;
      box-shadow: inset 0 0 0 1px rgba(139,92,246,0.2);
      .conv-item-icon mat-icon { color: #a78bfa !important; }
      .conv-item-title { color: #c4b5fd; }
    }
    .conv-item-icon {
      flex-shrink: 0; width: 28px; height: 28px;
      border-radius: 8px; display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.04);
      mat-icon { font-size: 13px!important; width: 13px!important; height: 13px!important; color: var(--text-500) !important; }
    }
    .conv-item-active .conv-item-icon {
      background: rgba(139,92,246,0.15);
    }
    .conv-item-body { flex: 1; min-width: 0; }
    .conv-item-title {
      font-size: 0.8rem; font-weight: 500; color: var(--text-300);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .conv-item-date { font-size: 0.66rem; color: var(--text-500); margin-top: 1px; }

    /* ── Delete button — visible on hover ── */
    .conv-delete-btn {
      opacity: 0; transform: scale(0.8);
      flex-shrink: 0; width: 22px; height: 22px;
      border-radius: 6px; border: none;
      background: transparent; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-500); transition: all var(--transition);
      mat-icon { font-size: 13px!important; width: 13px!important; height: 13px!important; }
      &:hover { background: rgba(251,113,133,0.18); color: #fb7185 !important; }
    }

    .conv-empty {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 48px 16px; text-align: center; gap: 10px;
      mat-icon { font-size: 32px!important; width: 32px!important; height: 32px!important; color: var(--text-500); }
      p { font-size: 0.8rem; color: var(--text-500); margin: 0; line-height: 1.5; }
    }
    .start-btn {
      padding: 7px 18px; border-radius: var(--radius-pill);
      border: 1px solid rgba(139,92,246,0.35);
      background: rgba(139,92,246,0.12); color: #c4b5fd;
      font-size: 0.78rem; font-weight: 600; cursor: pointer;
      transition: all var(--transition);
      &:hover { background: rgba(139,92,246,0.22); border-color: rgba(139,92,246,0.5); }
    }

    /* ─── Chat main ────────────────────────────── */
    .chat-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    /* Top bar */
    .chat-topbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 11px 20px;
      border-bottom: 1px solid var(--border-xs);
      background: rgba(255,255,255,0.01); flex-shrink: 0;
    }
    .chat-topbar-left { display: flex; align-items: center; gap: 11px; }
    .chat-topbar-icon {
      width: 32px; height: 32px; border-radius: 9px;
      background: var(--grad-primary);
      box-shadow: 0 0 14px rgba(139,92,246,0.3);
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 15px!important; width: 15px!important; height: 15px!important; color: white!important; }
    }
    .chat-topbar-title { font-size: 0.85rem; font-weight: 600; color: var(--text-100); }
    .chat-topbar-sub { font-size: 0.68rem; color: var(--text-500); margin-top: 1px; }
    .chat-topbar-badges { display: flex; gap: 8px; }
    .topbar-badge {
      display: flex; align-items: center; gap: 5px;
      padding: 3px 10px; border-radius: var(--radius-pill);
      font-size: 0.68rem; font-weight: 600;
    }
    .topbar-badge-green {
      background: rgba(52,211,153,0.1); color: var(--emerald);
      border: 1px solid rgba(52,211,153,0.2);
    }
    .pulse-dot { width: 6px; height: 6px; border-radius: 50%; }
    .pulse-dot-green {
      background: var(--emerald); box-shadow: 0 0 6px var(--emerald);
      animation: pulse-anim 2s ease-in-out infinite;
    }
    @keyframes pulse-anim {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }

    /* Messages */
    .messages-area {
      flex: 1; overflow-y: auto; padding: 24px 6%;
      display: flex; flex-direction: column; gap: 4px;
    }

    /* Welcome screen */
    .chat-welcome {
      display: flex; flex-direction: column; align-items: center;
      text-align: center; padding: 36px 20px;
      flex: 1; justify-content: center;
    }
    .welcome-orb {
      width: 60px; height: 60px; border-radius: 18px;
      background: var(--grad-primary); box-shadow: var(--glow-violet);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 18px;
      mat-icon { font-size: 26px!important; width: 26px!important; height: 26px!important; color: white!important; }
    }
    .welcome-title { font-size: 1.4rem; font-weight: 700; color: var(--text-100); letter-spacing: -0.03em; margin: 0 0 10px; }
    .welcome-sub { font-size: 0.875rem; color: var(--text-400); max-width: 420px; line-height: 1.65; margin: 0 0 26px; }
    .suggestions-grid { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; max-width: 500px; }
    .suggestion-chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 14px; border-radius: 10px;
      background: rgba(255,255,255,0.03); border: 1px solid var(--border-sm);
      font-size: 0.78rem; color: var(--text-400);
      cursor: pointer; transition: all var(--transition);
      mat-icon { font-size: 14px!important; width: 14px!important; height: 14px!important; color: var(--text-500) !important; }
      &:hover {
        background: rgba(139,92,246,0.1); border-color: rgba(139,92,246,0.3);
        color: #c4b5fd;
        mat-icon { color: #a78bfa !important; }
      }
    }

    /* Message rows */
    .msg-row { display: flex; align-items: flex-start; gap: 10px; padding: 4px 0; }
    .msg-row-user { flex-direction: row-reverse; }
    .msg-body { max-width: 72%; display: flex; flex-direction: column; gap: 5px; }
    .msg-body-user { align-items: flex-end; }

    .ai-avatar {
      width: 30px; height: 30px; border-radius: 9px;
      background: var(--grad-primary); flex-shrink: 0; margin-top: 3px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 10px rgba(139,92,246,0.22);
      mat-icon { font-size: 14px!important; width: 14px!important; height: 14px!important; color: white!important; }
    }
    .user-avatar {
      width: 30px; height: 30px; border-radius: 9px;
      background: var(--bg-400); border: 1px solid var(--border-md);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.65rem; font-weight: 700; color: var(--text-300);
      flex-shrink: 0; margin-top: 3px;
    }

    .bubble {
      padding: 10px 15px; border-radius: 14px;
      font-size: 0.875rem; line-height: 1.7;
      white-space: pre-wrap; word-break: break-word;
    }
    .bubble-user {
      background: var(--grad-primary); color: white;
      border-radius: 14px 3px 14px 14px;
      box-shadow: 0 3px 14px rgba(139,92,246,0.2);
    }
    .bubble-ai {
      background: rgba(255,255,255,0.04); border: 1px solid var(--border-sm);
      color: var(--text-100); border-radius: 3px 14px 14px 14px;
    }

.msg-meta { display: flex; align-items: center; justify-content: space-between; padding: 0 2px; }
    .msg-time { font-size: 0.63rem; color: var(--text-500); }
    .feedback-row { display: flex; gap: 3px; }

    /* ── Feedback buttons ── */
    .fb-btn {
      width: 26px; height: 26px; border-radius: 7px;
      border: 1px solid var(--border-sm);
      background: rgba(255,255,255,0.03); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-500); transition: all var(--transition);
      mat-icon { font-size: 12px!important; width: 12px!important; height: 12px!important; }
      &:hover { background: rgba(255,255,255,0.08); border-color: var(--border-md); color: var(--text-200); }
    }
    .fb-pos { color: var(--emerald) !important; background: rgba(52,211,153,0.1) !important; border-color: rgba(52,211,153,0.25) !important; }
    .fb-neg { color: #fb7185 !important; background: rgba(251,113,133,0.1) !important; border-color: rgba(251,113,133,0.25) !important; }

    .typing-indicator { display: flex; gap: 4px; align-items: center; padding: 2px 0; }
    .typing-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--text-400);
      animation: bounce 1.2s ease-in-out infinite;
      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.4s; }
    }
    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-4px); }
    }
    .cursor-blink { animation: blink 1s step-start infinite; }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

    /* ─── Input area ────────────────────────────── */
    .input-area {
      padding: 10px 5% 8px;
      border-top: 1px solid var(--border-xs);
      background: var(--bg-000); flex-shrink: 0;
    }
    .input-wrap {
      background: rgba(255,255,255,0.035);
      border: 1px solid var(--border-md);
      border-radius: 14px; padding: 11px 12px 9px;
      transition: border-color var(--transition), box-shadow var(--transition);
    }
    .input-wrap-focused {
      border-color: rgba(139,92,246,0.45);
      box-shadow: 0 0 0 3px rgba(139,92,246,0.07);
    }
    .chat-textarea {
      width: 100%; background: transparent; border: none; outline: none;
      color: var(--text-100); font-size: 0.875rem;
      font-family: 'Inter', sans-serif; line-height: 1.6;
      resize: none; min-height: 22px; max-height: 160px; overflow-y: auto;
      &::placeholder { color: var(--text-500); }
    }
    .input-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 7px; }
    .input-hint {
      font-size: 0.65rem; color: var(--text-500);
      kbd {
        padding: 1px 5px;
        background: rgba(255,255,255,0.06); border: 1px solid var(--border-sm);
        border-radius: 4px; font-size: 0.62rem; font-family: inherit;
      }
    }

    /* ── Send button ── */
    .send-btn {
      width: 34px; height: 34px; border-radius: 10px;
      border: 1px solid var(--border-sm);
      background: rgba(255,255,255,0.05);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: var(--text-500); transition: all var(--transition);
      mat-icon { font-size: 17px!important; width: 17px!important; height: 17px!important; }
      &:disabled { opacity: 0.25; cursor: not-allowed; }
    }
    .send-active {
      background: var(--grad-primary) !important;
      border-color: transparent !important;
      color: white !important;
      box-shadow: 0 4px 14px rgba(139,92,246,0.45) !important;
      &:hover { box-shadow: 0 6px 20px rgba(139,92,246,0.6) !important; transform: scale(1.05); }
    }
    .send-spinner {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .input-disclaimer { font-size: 0.63rem; color: var(--text-500); text-align: center; margin: 5px 0 0; }

    /* ─── Empty state (no active conversation) ── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; flex: 1; padding: 40px; text-align: center;
    }
    .empty-orb {
      width: 68px; height: 68px; border-radius: 20px;
      background: var(--grad-primary); box-shadow: var(--glow-violet);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 18px;
      mat-icon { font-size: 30px!important; width: 30px!important; height: 30px!important; color: white!important; }
    }
    .empty-title { font-size: 1.3rem; font-weight: 700; color: var(--text-100); letter-spacing: -0.03em; margin: 0 0 10px; }
    .empty-sub { font-size: 0.875rem; color: var(--text-400); max-width: 340px; line-height: 1.6; margin: 0 0 22px; }

    /* ── Primary CTA button (large) ── */
    .btn-primary-lg {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 12px 24px; border-radius: var(--radius-md);
      background: var(--grad-primary); color: white;
      font-size: 0.875rem; font-weight: 600;
      border: none; cursor: pointer;
      box-shadow: 0 4px 18px rgba(139,92,246,0.38);
      transition: all var(--transition);
      mat-icon { font-size: 18px!important; width: 18px!important; height: 18px!important; }
      &:hover {
        box-shadow: 0 6px 26px rgba(139,92,246,0.55);
        transform: translateY(-2px);
      }
      &:active { transform: translateY(0); }
    }
  `],
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  private chatService = inject(ChatService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snack = inject(MatSnackBar);
  private authService = inject(AuthService);

  @ViewChild('scrollEl') scrollEl!: ElementRef<HTMLDivElement>;

  conversations = signal<Conversation[]>([]);
  messages = signal<Message[]>([]);
  activeId = signal<string | null>(null);
  streaming = signal(false);
  streamContent = signal('');
  inputMsg = '';
  inputFocused = false;
  private es: EventSource | null = null;
  private needsScroll = false;

  activeTitle = computed(() => {
    const id = this.activeId();
    return this.conversations().find(c => c.id === id)?.title ?? '';
  });

  suggestions = [
    { icon: 'summarize',   text: 'Summarize the key policies in my documents' },
    { icon: 'search',      text: 'What are the main topics covered?' },
    { icon: 'folder',      text: 'How many HR documents do I have?' },
    { icon: 'checklist',   text: 'What are the compliance requirements?' },
  ];

  ngOnInit(): void {
    this.loadConversations();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadConversation(id);
  }

  ngAfterViewChecked(): void {
    if (this.needsScroll) { this.scrollToBottom(); this.needsScroll = false; }
  }

  ngOnDestroy(): void { this.es?.close(); }

  userInitials(): string {
    const u = this.authService.currentUser();
    return u ? `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() : '?';
  }

  loadConversations(): void {
    this.chatService.listConversations().subscribe({ next: r => { if (r.success) this.conversations.set(r.data.content); } });
  }

  loadConversation(id: string): void {
    this.activeId.set(id);
    this.chatService.getConversation(id).subscribe({ next: r => { if (r.success) { this.messages.set(r.data.messages ?? []); this.needsScroll = true; } } });
  }

  newConversation(): void {
    this.chatService.createConversation().subscribe({ next: r => { if (r.success) { this.conversations.update(l => [r.data, ...l]); this.activeId.set(r.data.id); this.messages.set([]); } } });
  }

  deleteConv(e: Event, id: string): void {
    e.stopPropagation();
    e.preventDefault();
    this.chatService.deleteConversation(id).subscribe({
      next: r => {
        if (r.success) {
          this.conversations.update(l => l.filter(c => c.id !== id));
          if (this.activeId() === id) { this.activeId.set(null); this.messages.set([]); }
          this.snack.open('Conversation deleted', '', { duration: 2500 });
        }
      },
      error: () => this.snack.open('Failed to delete conversation', 'Close', { duration: 3000 })
    });
  }

  useSuggestion(s: string): void { this.inputMsg = s; this.send(); }

  onKey(e: Event): void {
    const ke = e as KeyboardEvent;
    if (ke.key === 'Enter' && !ke.shiftKey) { e.preventDefault(); this.send(); }
  }

  autoResize(e: Event): void {
    const el = e.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  }

  send(): void {
    const text = this.inputMsg.trim();
    if (!text || this.streaming()) return;
    const id = this.activeId();
    if (!id) return;

    const userMsg: Message = { id: 'u-' + Date.now(), conversationId: id, role: 'USER', content: text, feedback: 'NONE', createdAt: new Date().toISOString() };
    this.messages.update(m => [...m, userMsg]);
    this.inputMsg = '';
    this.streaming.set(true);
    this.streamContent.set('');
    this.needsScroll = true;

    this.es?.close();
    const es = this.chatService.streamMessage(id, text);
    this.es = es;
    let full = '';

    es.onmessage = (ev) => {
      let token: string;
      try { token = JSON.parse(ev.data); } catch { token = ev.data; }
      if (token === '[DONE]') {
        es.close();
        this.streaming.set(false);
        this.messages.update(m => [...m, { id: 'a-' + Date.now(), conversationId: id, role: 'ASSISTANT', content: full, feedback: 'NONE', createdAt: new Date().toISOString() }]);
        this.streamContent.set('');
        this.needsScroll = true;
        this.loadConversations();
        return;
      }
      full += token;
      this.streamContent.set(full);
      this.needsScroll = true;
    };

    es.onerror = () => {
      es.close();
      this.streaming.set(false);
      if (!full) this.snack.open('Failed to get a response. Please try again.', 'Close', { duration: 4000 });
    };
  }

  feedback(msg: Message, f: MessageFeedback): void {
    this.chatService.submitFeedback(msg.id, f).subscribe({ next: r => { if (r.success) this.messages.update(ms => ms.map(m => m.id === msg.id ? { ...m, feedback: f } : m)); } });
  }

  private scrollToBottom(): void {
    if (this.scrollEl?.nativeElement) this.scrollEl.nativeElement.scrollTop = this.scrollEl.nativeElement.scrollHeight;
  }
}
