export function formatNumber(value: number, fractionDigits = 2): string {
  return Intl.NumberFormat('en-US', { maximumFractionDigits: fractionDigits }).format(value);
}

export function asUTCDateString(value?: string | number | Date, includeTime = false, shortYear = false): string {
  return value != null
    ? new Date(value).toLocaleDateString(undefined, {
        timeZone: 'UTC',
        year: shortYear ? '2-digit' : 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: includeTime ? '2-digit' : undefined,
        minute: includeTime ? '2-digit' : undefined,
        second: includeTime ? '2-digit' : undefined
      })
    : '-';
}
