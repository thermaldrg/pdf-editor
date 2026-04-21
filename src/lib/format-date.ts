/**
 * Formats a date as DD/MM/YYYY using the machine's local time zone.
 */
export function formatDateDdMmYyyy(date: Date): string {
  const day: string = padTwoDigits(date.getDate());
  const month: string = padTwoDigits(date.getMonth() + 1);
  const year: string = date.getFullYear().toString().padStart(4, '0');
  return `${day}/${month}/${year}`;
}

function padTwoDigits(value: number): string {
  return value.toString().padStart(2, '0');
}
