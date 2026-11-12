export const TODAY = "2026-11-12";
export const pad = (n: number) => String(n).padStart(2, "0");
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (s: string, n: number) => {
  const d = parseISO(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
export const addMonths = (s: string, n: number) => {
  const d = parseISO(s);
  d.setMonth(d.getMonth() + n);
  return toISO(d);
};
export const dow = (s: string) => parseISO(s).getDay();
export const isWeekend = (s: string) => dow(s) === 0 || dow(s) === 6;
export const fmtDate = (s?: string | null) => (s ? s.split("-").reverse().join("/") : "—");
export const monthOf = (s: string) => s.slice(0, 7);
export const fmtMonth = (m: string) => `${m.slice(5, 7)}/${m.slice(0, 4)}`;
export function daysBetween(from: string, to: string) {
  const out: string[] = [];
  let d = from;
  while (d <= to) {
    out.push(d);
    d = addDays(d, 1);
  }
  return out;
}
export const workdays = (from: string, to: string) =>
  from && to && from <= to ? daysBetween(from, to).filter((d) => !isWeekend(d)).length : 0;
/** System clock: date pinned to 12/11/2026, real time of day. */
export const now = () => {
  const r = new Date();
  return new Date(2026, 10, 12, r.getHours(), r.getMinutes(), r.getSeconds());
};
export const nowHHMM = () => {
  const d = now();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const fmtMoney = (n: number) => n.toLocaleString("vi-VN") + " đ";
export function timeAgo(iso: string) {
  const m = Math.max(0, Math.floor((now().getTime() - new Date(iso).getTime()) / 60000));
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút trước`;
  if (m < 1440) return `${Math.floor(m / 60)} giờ trước`;
  return `${Math.floor(m / 1440)} ngày trước`;
}
export const WEEKDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
export function mondayOf(s: string) {
  const d = dow(s);
  return addDays(s, d === 0 ? -6 : 1 - d);
}
