import { ApiResponse } from './api-response.model';
import { PagedResponse } from './pagination.model';

export interface Cie10Code {
  id: number;
  code: string;
  description: string;
  category: string | null;
}

export interface Cie10SearchParams {
  q?: string;
  page?: number;
  size?: number;
}

export type Cie10PageApiResponse = ApiResponse<PagedResponse<Cie10Code>>;
