import type { AppState, Ca, CaId, ChamCong, DonTu, NhanVien, Role } from "@/data/types";
import { DEFAULT_CONFIG, type AppConfig } from "@/data/config";
import { addDays, isWeekend, monthOf, TODAY, workdays } from "./date";

export const toMin = (h: string) => +h.slice(0, 2) * 60 + +h.slice(3, 5);
/** Check-in more than 15 minutes after shift start is "Trễ". */
export const laTre = (gio: string, ca: Ca, grace = DEFAULT_CONFIG.anHan) => toMin(gio) > toMin(ca.batDau) + grace;
/** Check-out before shift end is "Về sớm". */
export const laVeSom = (gio: string, ca: Ca) => toMin(gio) < toMin(ca.ketThuc);

export function tongHop(recs: ChamCong[]) {
  const cong = recs.filter((r) => (r.loai === "Làm việc" && r.gioVao && r.gioRa) || r.loai === "Nghỉ phép").length;
  return {
    cong,
    diMuon: recs.filter((r) => r.tre).length,
    veSom: recs.filter((r) => r.veSom).length,
    nghiPhep: recs.filter((r) => r.loai === "Nghỉ phép").length,
    nghiOm: recs.filter((r) => r.loai === "Nghỉ ốm").length,
    ot: recs.reduce((s, r) => s + r.ot, 0),
  };
}

export const caCua = (s: AppState, maNV: string, ngay: string): CaId => {
  const o = s.caNgoaiLe[`${maNV}|${ngay}`];
  return o && o !== "OFF" ? o : s.caMacDinh[maNV] ?? "HC";
};
export const caHienThi = (s: AppState, maNV: string, ngay: string): CaId | "OFF" =>
  s.caNgoaiLe[`${maNV}|${ngay}`] ?? (isWeekend(ngay) ? "OFF" : s.caMacDinh[maNV] ?? "HC");

export const dangLam = (n: NhanVien) => n.trangThai !== "Đã nghỉ việc";
export const roleOf = (s: AppState, maNV: string): Role => s.taiKhoan[maNV] ?? "nv";

export const phepConLai = (s: AppState, maNV: string, boQuaDon?: string, config: AppConfig = DEFAULT_CONFIG) =>
  config.phepNam - (s.phepDaDung[maNV] ?? 0) -
  s.donTu.filter((d) => d.maNV === maNV && d.loai === "Nghỉ phép năm" && d.trangThai === "Chờ duyệt" && d.id !== boQuaDon)
    .reduce((t, d) => t + (d.soNgay ?? 0), 0);

export const otTrongThang = (s: AppState, maNV: string, thang: string, boQuaDon?: string) =>
  s.chamCong.filter((c) => c.maNV === maNV && monthOf(c.ngay) === thang).reduce((t, c) => t + c.ot, 0) +
  s.donTu.filter((d) => d.maNV === maNV && d.loai === "Làm thêm giờ" && d.trangThai === "Chờ duyệt" && monthOf(d.tuNgay) === thang && d.id !== boQuaDon)
    .reduce((t, d) => t + (d.soGio ?? 0), 0);

export type DonInput = Omit<DonTu, "id" | "trangThai" | "ngayTao" | "nguoiDuyet" | "lyDoTuChoi">;
export interface DonCtx { phepConLai: number; caHienTai: CaId; otThang: number }

/** Returns an error message, or null when the request is valid. */
export function kiemTraDon(d: DonInput, ctx: DonCtx): string | null {
  if (!d.tuNgay) return "Vui lòng chọn ngày";
  if (!d.lyDo.trim()) return "Vui lòng nhập lý do";
  if (d.loai === "Nghỉ phép năm" || d.loai === "Nghỉ ốm") {
    if (!d.denNgay || d.denNgay < d.tuNgay) return "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu";
    const n = workdays(d.tuNgay, d.denNgay);
    if (n <= 0) return "Khoảng nghỉ không có ngày làm việc nào";
    if (d.loai === "Nghỉ phép năm" && n > ctx.phepConLai) return `Số ngày nghỉ (${n}) vượt số dư phép còn lại (${ctx.phepConLai})`;
  }
  if (d.loai === "Đổi ca") {
    if (!d.caMoi) return "Vui lòng chọn ca mới";
    if (d.caMoi === ctx.caHienTai) return "Ca mới phải khác ca hiện tại";
  }
  if (d.loai === "Làm thêm giờ") {
    if (!d.soGio || d.soGio <= 0) return "Số giờ làm thêm phải lớn hơn 0";
    if (ctx.otThang + d.soGio > DEFAULT_CONFIG.otToiDa) return `Tổng OT tháng vượt ${DEFAULT_CONFIG.otToiDa} giờ (đã có ${ctx.otThang} giờ)`;
  }
  if (d.loai === "Đi trễ/về sớm" && (!d.soPhut || d.soPhut <= 0)) return "Vui lòng nhập số phút";
  return null;
}

export function kiemTraTuChoi(lyDo: string): string | null {
  return lyDo.trim().length >= 5 ? null : "Từ chối bắt buộc nhập lý do";
}

/** Who approves: department head for staff; HR for heads and board members. */
export function coTheDuyet(s: AppState, user: string, d: DonTu) {
  if (d.trangThai !== "Chờ duyệt" || d.maNV === user) return false;
  const nguoiTao = s.nhanVien.find((n) => n.maNV === d.maNV);
  const u = s.nhanVien.find((n) => n.maNV === user);
  if (!nguoiTao || !u) return false;
  const r = roleOf(s, d.maNV);
  if (roleOf(s, user) === "admin") return true;
  if (r === "tp" || r === "admin") return roleOf(s, user) === "hr";
  return roleOf(s, user) === "tp" && u.maPB === nguoiTao.maPB;
}

export const hdSapHetHan = (s: AppState) =>
  s.hopDong.filter((h) => {
    const nv = s.nhanVien.find((n) => n.maNV === h.maNV);
    return nv && dangLam(nv) && h.ngayKetThuc && h.ngayKetThuc >= TODAY && h.ngayKetThuc <= addDays(TODAY, 30);
  });

export const nghiHomNay = (s: AppState) =>
  s.donTu.filter((d) => d.trangThai === "Đã duyệt" && (d.loai === "Nghỉ phép năm" || d.loai === "Nghỉ ốm") && d.tuNgay <= TODAY && (d.denNgay ?? d.tuNgay) >= TODAY);

export const nextMaNV = (s: AppState) =>
  "NV" + String(Math.max(...s.nhanVien.map((n) => +n.maNV.slice(2))) + 1).padStart(4, "0");
