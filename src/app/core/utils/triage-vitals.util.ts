import { TriagePrioritySystem, UrgencyLevel } from '@core/models/triage.model';

export interface ImcReading {
  value: number;
  category: string;
  level: 'low' | 'normal' | 'high' | 'very-high';
}

export function computeImc(weight: number | null, height: number | null): ImcReading | null {
  if (!weight || !height || height <= 0) return null;
  const meters = height / 100;
  const value = Math.round((weight / (meters * meters)) * 10) / 10;
  if (!Number.isFinite(value) || value <= 0) return null;
  if (value < 18.5) return { value, category: 'Bajo peso', level: 'low' };
  if (value < 25) return { value, category: 'Normal', level: 'normal' };
  if (value < 30) return { value, category: 'Sobrepeso', level: 'high' };
  return { value, category: 'Obesidad', level: 'very-high' };
}

export function parseBloodPressure(raw: string | null): { systolic: number | null; diastolic: number | null } {
  if (!raw) return { systolic: null, diastolic: null };
  const [sys, dia] = raw.split('/').map((part) => Number(part.trim()));
  return {
    systolic: Number.isFinite(sys) ? sys : null,
    diastolic: Number.isFinite(dia) ? dia : null,
  };
}

export interface VitalsInput {
  temperature: number | null;
  heartRate: number | null;
  systolic: number | null;
  diastolic: number | null;
  oxygenSaturation: number | null;
  respiratoryRate: number | null;
}

export function computeUrgency(vitals: VitalsInput): UrgencyLevel {
  const { temperature, heartRate, systolic, diastolic, oxygenSaturation, respiratoryRate } = vitals;
  const critical =
    (temperature != null && (temperature >= 39.5 || temperature <= 35)) ||
    (heartRate != null && (heartRate >= 130 || heartRate <= 40)) ||
    (systolic != null && (systolic >= 180 || systolic <= 90)) ||
    (diastolic != null && diastolic >= 120) ||
    (oxygenSaturation != null && oxygenSaturation <= 90) ||
    (respiratoryRate != null && (respiratoryRate >= 30 || respiratoryRate <= 8));
  if (critical) return 'CRITICAL';
  const urgent =
    (temperature != null && temperature >= 38) ||
    (heartRate != null && (heartRate >= 110 || heartRate <= 50)) ||
    (systolic != null && (systolic >= 140 || systolic <= 100)) ||
    (diastolic != null && diastolic >= 90) ||
    (oxygenSaturation != null && oxygenSaturation < 94) ||
    (respiratoryRate != null && respiratoryRate >= 22);
  return urgent ? 'URGENT' : 'NORMAL';
}

export function urgencyLabel(level: UrgencyLevel): string {
  const labels: Record<UrgencyLevel, string> = {
    NORMAL: 'Sin alertas',
    URGENT: 'Urgente',
    CRITICAL: 'Crítico',
  };
  return labels[level];
}

export function urgencyKey(level: UrgencyLevel): 'normal' | 'urgent' | 'critical' {
  return level.toLowerCase() as 'normal' | 'urgent' | 'critical';
}

const ESI_BY_URGENCY: Record<UrgencyLevel, string> = {
  CRITICAL: '2',
  URGENT: '3',
  NORMAL: '4',
};

export function urgencyToPriority(level: UrgencyLevel): {
  priorityLevel: string;
  prioritySystem: TriagePrioritySystem;
} {
  return { priorityLevel: ESI_BY_URGENCY[level], prioritySystem: 'ESI' };
}

export function priorityToUrgency(priorityLevel: string | null): UrgencyLevel {
  const level = Number(priorityLevel);
  if (!Number.isFinite(level)) return 'NORMAL';
  if (level <= 2) return 'CRITICAL';
  if (level === 3) return 'URGENT';
  return 'NORMAL';
}
