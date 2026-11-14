import type { Role } from '@/data/types';
import type { AppConfig } from '@/data/config';
export function accountChangeAllowed(actor: string, target: string, role: Role, locked: boolean) {
  return actor !== target || (role === 'admin' && !locked);
}
export function configError(c: AppConfig): string | null {
  if ([c.gioLamNgay,c.congChuan,c.phepNam,c.otToiDa,c.giamTruBanThan,c.giamTruPhuThuoc,c.tranAnTrua].some(v=>!Number.isFinite(v)||v<=0)) return 'Các giá trị phải là số dương';
  if ([c.otThuong,c.otCuoiTuan,c.otLe].some(v=>v<1)) return 'Hệ số OT phải từ 1 trở lên';
  if (![c.ngayChotCong,c.ngayPhatLuong].every(v=>Number.isInteger(v)&&v>=1&&v<=31)) return 'Ngày phải từ 1 đến 31';
  if (!Number.isFinite(c.anHan)||c.anHan<0) return 'Ân hạn không được âm';
  if ([c.bhxh,c.bhyt,c.bhtn,c.kpiA,c.kpiB,c.kpiC,c.kpiD].some(v=>!Number.isFinite(v)||v<0||v>1)) return 'Tỷ lệ phải từ 0 đến 100%';
  if (!(100>=c.nguongA&&c.nguongA>c.nguongB&&c.nguongB>c.nguongC&&c.nguongC>=0)) return 'Ngưỡng điểm phải theo thứ tự A > B > C, từ 0 đến 100';
  let last=0;
  for(const [i,b] of c.thue.entries()) { if(!Number.isFinite(b.tyLe)||b.tyLe<0||b.tyLe>1 || (b.den===null?i!==c.thue.length-1:!Number.isFinite(b.den)||b.den<=last)) return 'Các bậc thuế phải tăng liên tục, bậc cuối không giới hạn'; last=b.den??last; }
  return c.thue.at(-1)?.den===null?null:'Bậc cuối phải không giới hạn';
}