const month = new Intl.DateTimeFormat('en-GB', { month: 'short' });

/** "Aug–Sep 2022", "Dec 2022 – Feb 2023", "Oct 2026 – now" */
export function span(start: Date, end?: Date) {
  const m = (d: Date) => month.format(d);
  if (!end) return `${m(start)} ${start.getFullYear()} – now`;
  if (start.getFullYear() === end.getFullYear()) {
    return start.getMonth() === end.getMonth()
      ? `${m(start)} ${start.getFullYear()}`
      : `${m(start)}–${m(end)} ${end.getFullYear()}`;
  }
  return `${m(start)} ${start.getFullYear()} – ${m(end)} ${end.getFullYear()}`;
}
