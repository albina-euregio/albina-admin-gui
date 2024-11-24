export function newDate(delta: { days: number }): Date {
  const date = new Date();
  date.setSeconds(0, 0);
  date.setDate(date.getDate() + delta.days);
  return date;
}
