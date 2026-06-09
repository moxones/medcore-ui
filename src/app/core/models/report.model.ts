import { ApiResponse } from '@core/models/api-response.model';
import { Role } from '@core/models/role.model';

export type ReportFormat = 'PDF' | 'XLSX';

export type ReportFilterKey = 'dateRange' | 'branch' | 'doctor' | 'specialty' | 'status';

export type ReportAccent = 'doctor' | 'assistant' | 'primary';

export interface ReportDefinition {
  key: string;
  slug: string;
  icon: string;
  title: string;
  description: string;
  filters: ReportFilterKey[];
}

export interface ReportFilters {
  from?: string;
  to?: string;
  branchId?: number | null;
  doctorId?: number | null;
  specialtyId?: number | null;
  status?: string | null;
}

export type ReportTrendDirection = 'up' | 'down' | 'flat';

export interface ReportTrend {
  direction: ReportTrendDirection;
  label: string;
}

export type ReportKpiVariant = 'blue' | 'green' | 'orange' | 'purple' | 'red';

export interface ReportKpi {
  label: string;
  value: string;
  icon: string;
  hint?: string;
  trend?: ReportTrend;
  variant?: ReportKpiVariant;
}

export type ReportCellFormat = 'text' | 'number' | 'currency' | 'percent' | 'date';

export interface ReportColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  format?: ReportCellFormat;
}

export type ReportCell = string | number | null;

export type ReportRow = Record<string, ReportCell>;

export interface ReportBar {
  label: string;
  value: number;
  display: string;
}

export interface ReportListItem {
  label: string;
  value: string;
  hint?: string;
}

export interface ReportTableSection {
  type: 'table';
  title: string;
  columns: ReportColumn[];
  rows: ReportRow[];
}

export interface ReportBarsSection {
  type: 'bars';
  title: string;
  unit?: string;
  bars: ReportBar[];
}

export interface ReportListSection {
  type: 'list';
  title: string;
  items: ReportListItem[];
}

export type ReportSection = ReportTableSection | ReportBarsSection | ReportListSection;

export interface ReportRange {
  from: string;
  to: string;
}

export interface ReportResult {
  key: string;
  title: string;
  subtitle?: string;
  generatedAt: string;
  range?: ReportRange;
  kpis: ReportKpi[];
  sections: ReportSection[];
}

export type ReportResultApiResponse = ApiResponse<ReportResult>;

export type ReportCatalog = Record<Role, ReportDefinition[]>;
