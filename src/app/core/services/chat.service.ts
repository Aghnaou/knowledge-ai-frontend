import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Conversation, ConversationPage, Message, MessageFeedback } from '../models/chat.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/api/chat`;

  createConversation(title?: string): Observable<ApiResponse<Conversation>> {
    return this.http.post<ApiResponse<Conversation>>(`${this.API}/conversations`, { title });
  }

  listConversations(page = 0, size = 20): Observable<ApiResponse<ConversationPage>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<ConversationPage>>(`${this.API}/conversations`, { params });
  }

  getConversation(id: string): Observable<ApiResponse<Conversation>> {
    return this.http.get<ApiResponse<Conversation>>(`${this.API}/conversations/${id}`);
  }

  getStreamUrl(conversationId: string, question: string): string {
    const token = localStorage.getItem('access_token');
    const encoded = encodeURIComponent(question);
    return `${environment.apiUrl}/api/chat/conversations/${conversationId}/stream?question=${encoded}&token=${token}`;
  }

  streamMessage(conversationId: string, question: string): EventSource {
    return new EventSource(this.getStreamUrl(conversationId, question));
  }

  deleteConversation(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API}/conversations/${id}`);
  }

  submitFeedback(messageId: string, feedback: MessageFeedback): Observable<ApiResponse<Message>> {
    return this.http.post<ApiResponse<Message>>(`${this.API}/messages/${messageId}/feedback`, { feedback });
  }
}
