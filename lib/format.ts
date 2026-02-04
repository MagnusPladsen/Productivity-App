export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
}

export function formatDate(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium'
  }).format(date);
}
