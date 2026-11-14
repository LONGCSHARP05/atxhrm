import type { AppState, Ca, CaId, DonTu, NhanVien, Role } from '@/data/types';
import { DEFAULT_CONFIG, type AppConfig } from '@/data/config';
import { addDays, daysBetween, dow, isWeekend, monthOf, TODAY, workdays } from './date';
import type { DonInput } from './rules';
export const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
export const visibleEmployees = (s: AppState, me: NhanVien, role: Role, allForAccounting = false) => s.nhanVien.filter(n => role === 'admin' || role === 'hr' || (role === 'kt' && allForAccounting) || (role === 'tp' ? n.maPB === me.maPB : n.maNV === me.maNV));
export const shiftFor = (s: AppState, id: string, day: string): Ca | undefined => {
  const n = s.nhanVien.find(n => n.maNV === id);
  if (!n || day < n.ngayVaoLam || (n.ngayNghiViec && day > n.ngayNghiViec)) return;
  const override = s.caNgoaiLe[`${id}|${day}`];
  const ca = override ?? (isWeekend(day) ? 'OFF' : s.caMacDinh[id] ?? 'HC');
  return ca === 'OFF' ? undefined : s.ca.find(c => c.id === ca);
};
export const approvedOn = (s: AppState, id: string, day: string) => s.donTu.filter(d => d.maNV === id && d.trangThai === 'Đã duyệt' && d.tuNgay <= day && (d.denNgay ?? d.tuNgay) >= day);
const minutes = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));
export function dailyAttendance(s: AppState, id: string, day: string, cfg = DEFAULT_CONFIG) {
  const ca = shiftFor(s, id, day), rec = s.chamCong.find(c => c.maNV === id && c.ngay === day);
  const requests = approvedOn(s, id, day), leave = requests.find(d => d.loai === 'Nghỉ phép năm' || d.loai === 'Nghỉ ốm');
  const paidLeave = !!ca && leave?.loai === 'Nghỉ phép năm', sick = !!ca && leave?.loai === 'Nghỉ ốm';
  const late = !!ca && !leave && !!rec?.gioVao && minutes(rec.gioVao) > minutes(ca.batDau) + cfg.anHan && !requests.some(d => d.loai === 'Đi trễ/về sớm' && d.kieu === 'Đi trễ');
  const early = !!ca && !leave && !!rec?.gioRa && minutes(rec.gioRa) < minutes(ca.ketThuc) && !requests.some(d => d.loai === 'Đi trễ/về sớm' && d.kieu === 'Về sớm');
  const absence = !!ca && !leave && !rec?.gioVao && day < TODAY;
  const cong = paidLeave || (!!ca && !sick && !!rec?.gioVao && !!rec.gioRa) ? 1 : 0;
  const statuses = paidLeave ? ['Nghỉ phép'] : sick ? ['Nghỉ ốm'] : !ca ? ['Không làm việc'] : absence ? ['Vắng'] : day > TODAY ? ['Chưa đến ngày'] : !rec?.gioVao ? ['Chưa chấm công'] : [late ? 'Trễ' : 'Đúng giờ', ...(early ? ['Về sớm'] : [])];
  return { day, ca, rec, requests, cong, late: +late, early: +early, leave: +paidLeave, sick: +sick, absence: +absence, ot: Math.max(rec?.ot ?? 0, requests.filter(d => d.loai === 'Làm thêm giờ').reduce((t,d) => t + (d.soGio ?? 0), 0)), statuses, note: [rec?.ghiChu, ...requests.map(d => `Có đơn ${d.loai.toLowerCase()} ${d.id}`)].filter(Boolean).join('; ') };
}
export const monthDays = (m: string) => daysBetween(m + '-01', addDays(new Date(Number(m.slice(0,4)), Number(m.slice(5)), 1).toLocaleDateString('en-CA').split('/').reverse().join('-'), -1));
export function daysInMonth(m: string) { const end = new Date(Number(m.slice(0,4)), Number(m.slice(5)), 0).getDate(); return daysBetween(`${m}-01`, `${m}-${end}`); }
export function attendanceMonth(s: AppState, id: string, m: string, cfg = DEFAULT_CONFIG) {
  const days = daysInMonth(m).map(d => dailyAttendance(s, id, d, cfg));
  return { days, cong: days.reduce((t,d)=>t+d.cong,0), diMuon: days.reduce((t,d)=>t+d.late,0), veSom: days.reduce((t,d)=>t+d.early,0), nghiPhep: days.reduce((t,d)=>t+d.leave,0), vang: days.reduce((t,d)=>t+d.absence,0), ot: days.reduce((t,d)=>t+d.ot,0) };
}
export const approverIds = (s: AppState, id: string) => {
  const n = s.nhanVien.find(n => n.maNV === id);
  return s.nhanVien.filter(x => n && (s.taiKhoan[id] === 'tp' ? s.taiKhoan[x.maNV] === 'hr' : s.taiKhoan[x.maNV] === 'tp' && x.maPB === n.maPB)).map(n=>n.maNV);
};
export function validateRequest(s: AppState, d: DonInput, cfg: AppConfig = DEFAULT_CONFIG): Record<string,string> {
  const errors: Record<string,string> = {}, end = d.denNgay ?? d.tuNgay;
  if (!d.tuNgay) errors['tuNgay'] = 'Vui lòng chọn ngày';
  if (!d.lyDo.trim() || (d.loai === 'Nghỉ phép năm' && d.lyDo.trim().length < 10)) errors['lyDo'] = d.loai === 'Nghỉ phép năm' ? 'Lý do phải có ít nhất 10 ký tự' : 'Vui lòng nhập lý do';
  if (d.loai === 'Nghỉ phép năm' || d.loai === 'Nghỉ ốm') {
    if (!d.denNgay || end < d.tuNgay) errors['denNgay'] = 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu';
    const count = workdays(d.tuNgay, end);
    if (!count) errors['denNgay'] = 'Khoảng nghỉ không có ngày làm việc';
    const remaining = cfg.phepNam - (s.phepDaDung[d.maNV] ?? 0) - s.donTu.filter(x=>x.maNV===d.maNV && x.loai==='Nghỉ phép năm' && x.trangThai==='Chờ duyệt').reduce((t,x)=>t+(x.soNgay??0),0);
    if (d.loai === 'Nghỉ phép năm' && count > remaining) errors['denNgay'] = 'Số ngày nghỉ vượt số dư phép còn lại';
  }
  if (d.tuNgay && end >= d.tuNgay) {
    if (daysBetween(d.tuNgay,end).some(day => s.bangCongDaXacNhan.includes(monthOf(day)))) errors['tuNgay'] = 'Kỳ chấm công đã xác nhận, không thể tạo đơn';
    if (s.donTu.some(x=>x.maNV===d.maNV && x.trangThai!=='Từ chối' && x.tuNgay<=end && (x.denNgay??x.tuNgay)>=d.tuNgay)) errors['tuNgay'] = 'Khoảng thời gian trùng với đơn hiện có';
  }
  if (d.loai === 'Đổi ca') {
    const ca = shiftFor(s,d.maNV,d.tuNgay);
    if (!ca) errors['tuNgay'] = 'Ngày đã chọn không có ca làm việc';
    if (!d.caMoi || d.caMoi===ca?.id) errors['caMoi'] = 'Ca mới phải khác ca hiện tại';
  }
  if (d.loai === 'Đi trễ/về sớm' && !d.gioDuKien) errors['gioDuKien'] = 'Vui lòng chọn giờ dự kiến';
  if (d.loai === 'Làm thêm giờ') {
    if (!d.soGio || d.soGio<0.5 || d.soGio>8 || d.soGio%0.5!==0) errors['soGio']='Số giờ từ 0,5 đến 8, bước 0,5';
    const total = s.donTu.filter(x=>x.maNV===d.maNV && x.loai==='Làm thêm giờ' && x.trangThai!=='Từ chối' && monthOf(x.tuNgay)===monthOf(d.tuNgay)).reduce((t,x)=>t+(x.soGio??0),0);
    if (total+(d.soGio??0)>cfg.otToiDa) errors['soGio']=`Tổng OT tháng vượt ${cfg.otToiDa} giờ`;
  }
  return errors;
}
export const credentialsValid = (s: AppState, username: string, password: string) => password === '123456' && !s.taiKhoanKhoa[username.trim().toUpperCase()] && s.nhanVien.some(n=>n.maNV.toLowerCase()===username.trim().toLowerCase() && n.trangThai!=='Đã nghỉ việc');
export const assignmentDays = (from: string,to: string,mode: string) => daysBetween(from,to).filter(d=>mode==='all' || (mode==='six' ? dow(d)!==0 : !isWeekend(d)));
export const shiftTone = (id?: CaId) => id === 'SANG' ? 'shift-morning' : id === 'CHIEU' ? 'shift-afternoon' : 'shift-office';
