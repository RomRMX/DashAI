export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function now(): string {
  return new Date().toISOString();
}

export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${months[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
}

export function zeroPad(count: number, label: string): string {
  return `${pad(count)} ${label.toUpperCase()}`;
}

export function relativeTime(isoString: string | null): string {
  if (!isoString) return 'never';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}
