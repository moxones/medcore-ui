import { ApiResponse } from './api-response.model';

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE';

export interface AuditLogEntry {
  id: number;
  tableName: string;
  recordId: number;
  action: AuditAction;
  oldValues: string | null;
  newValues: string | null;
  changedBy: number | null;
  changedAt: string;
  ipAddress: string | null;
}

export interface AuditLogParams {
  tableName?: string;
  recordId?: number;
}

export type AuditLogListApiResponse = ApiResponse<AuditLogEntry[]>;
