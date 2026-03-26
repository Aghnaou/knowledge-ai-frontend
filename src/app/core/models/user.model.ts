import { UserRole } from './auth.model';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  active: boolean;
  createdAt: string;
}

export interface InviteUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface InviteResponse {
  user: User;
  temporaryPassword: string;
}

export interface UpdateRoleRequest {
  role: UserRole;
}

export interface UserPage {
  content: User[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
