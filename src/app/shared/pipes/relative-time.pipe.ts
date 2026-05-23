import { Pipe, PipeTransform } from '@angular/core';

type RelativeTimeMode = 'relative' | 'absolute';

function plural(count: number, singular: string, pluralForm: string): string {
  return count === 1 ? `hace 1 ${singular}` : `hace ${count} ${pluralForm}`;
}

function relativeTimeEs(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 45_000) return 'hace un momento';

  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 60) return plural(minutes, 'minuto', 'minutos');

  const hours = Math.round(minutes / 60);
  if (hours < 24) return plural(hours, 'hora', 'horas');

  const days = Math.round(hours / 24);
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} días`;

  const weeks = Math.round(days / 7);
  if (weeks < 5) return plural(weeks, 'semana', 'semanas');

  const months = Math.round(days / 30);
  if (months < 12) return plural(months, 'mes', 'meses');

  const years = Math.round(days / 365);
  return plural(years, 'año', 'años');
}

function absoluteDateTimeEs(date: Date): string {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

@Pipe({ name: 'relativeTime', standalone: true })
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | null | undefined, mode: RelativeTimeMode = 'relative'): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return mode === 'absolute' ? absoluteDateTimeEs(date) : relativeTimeEs(date);
  }
}
