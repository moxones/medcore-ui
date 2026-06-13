import { ApiResponse } from './api-response.model';

export type ClinicProcess = 'TRIAGE' | 'PAYMENT' | 'CALLED';

export type ProcessConfig = Record<ClinicProcess, boolean>;

export interface UpdateProcessConfigRequest {
  processes: Partial<ProcessConfig>;
}

export type ProcessConfigApiResponse = ApiResponse<ProcessConfig>;

export const DEFAULT_PROCESS_CONFIG: ProcessConfig = {
  TRIAGE: true,
  PAYMENT: true,
  CALLED: true,
};
