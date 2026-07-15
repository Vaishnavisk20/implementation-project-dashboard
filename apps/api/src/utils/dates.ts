export function parseCsvDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(`${trimmed}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const target = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const normalized = new Date(target);
  normalized.setHours(0, 0, 0, 0);
  return Math.ceil((normalized.getTime() - today.getTime()) / 86_400_000);
}
