export interface AnalyticsOverview {
  totalQuestions: number;
  totalDocuments: number;
  totalUsers: number;
  activeUsers: number;
  avgResponseTimeMs: number;
  questionsToday: number;
}

export interface DailyQuestions {
  date: string;
  count: number;
}

export interface TopTopic {
  topic: string;
  count: number;
}

export interface TopDocument {
  documentId: string;
  documentName: string;
  referenceCount: number;
}

export interface UserActivity {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  questionCount: number;
  lastActive: string;
}
