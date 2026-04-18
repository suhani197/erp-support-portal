export type UserRole = 'REQUESTER' | 'AGENT' | 'ADMIN';
export type TicketStatus = 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
export type Priority = 'P1' | 'P2' | 'P3';
export type Module = 'FINANCE' | 'INVENTORY' | 'SALES' | 'TECHNICAL' | 'HR' | 'PROCUREMENT';
export type KbStatus = 'DRAFT' | 'PUBLISHED';
export type CommentType = 'PUBLIC' | 'INTERNAL';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  active: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface TicketSummary {
  id: number;
  title: string;
  status: TicketStatus;
  priority: Priority;
  AppModule: Module;
  module?: Module;
  createdBy: User;
  assignedTo: User | null;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  author: User;
  body: string;
  commentType: CommentType;
  createdAt: string;
}

export interface SlaMetrics {
  firstResponseMinutes: number | null;
  resolutionMinutes: number | null;
  firstResponseBreached: boolean;
  resolutionBreached: boolean;
  computedAt: string;
  policyFirstResponseMinutes: number | null;
  policyResolutionMinutes: number | null;
}

export interface TicketDetail extends TicketSummary {
  description: string;
  firstAgentActionAt: string | null;
  resolvedAt: string | null;
  comments: Comment[];
  sla: SlaMetrics | null;
}

export interface Tag {
  id: number;
  name: string;
}


export interface KbArticle {
  id: number;
  title: string;
  appModule: Module;
  module?: Module;
  symptoms: string;
  rootCause: string;
  resolutionSteps: string;
  status: KbStatus;
  createdBy: User;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface KbSuggestion {
  articleId: number;
  title: string;
  appModule: Module;
  module?: Module;
  symptoms: string;
  score: number;
}

export interface SlaPolicy {
  priority: Priority;
  firstResponseMinutes: number;
  resolutionMinutes: number;
}

export interface DashboardSummary {
  ticketsByStatus: Record<string, number>;
  ticketsByPriority: Record<string, number>;
  totalOpen: number;
  slaBreachCount: number;
  slaCompliancePct: number;
  avgFirstResponseMinutes: number | null;
  avgResolutionMinutes: number | null;
}

export interface AgentWorkload {
  agentId: number;
  agentName: string;
  openTickets: number;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
