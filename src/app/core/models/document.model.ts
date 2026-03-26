export interface Document {
  id: string;
  name: string;
  originalFilename: string;
  fileType: FileType;
  fileSize: number;
  status: DocumentStatus;
  category: string;
  tags: string[];
  tenantId: string;
  uploadedBy: string;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}

export type FileType = 'PDF' | 'WORD' | 'TXT' | 'URL';
export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

export interface DocumentPage {
  content: Document[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface UpdateCategoryRequest {
  category: string;
  tags: string[];
}
