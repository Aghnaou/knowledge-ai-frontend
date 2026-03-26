export interface Conversation {
  id: string;
  title: string;
  userId: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  sources?: string[];
  feedback: MessageFeedback;
  tokensUsed?: number;
  createdAt: string;
}

export type MessageRole = 'USER' | 'ASSISTANT';
export type MessageFeedback = 'POSITIVE' | 'NEGATIVE' | 'NONE';

export interface ChatRequest {
  question: string;
  conversationId?: string;
}

export interface ConversationPage {
  content: Conversation[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
