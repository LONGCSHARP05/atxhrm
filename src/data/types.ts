export type Role = "nv" | "tp" | "hr" | "kt" | "admin";
export const ROLE_LABEL: Record<Role, string> = {
  nv: "Nhân viên",
  tp: "Trưởng phòng",
  hr: "HR",
  kt: "Kế toán",
  admin: "Admin",
};
export type TrangThaiNV = "Thử việc" | "Chính thức" | "Đã nghỉ việc";
export interface PhongBan { maPB: string; tenPB: string }
export interface NhanVien {
  maNV: string; hoTen: string; ngaySinh: string; gioiTinh: "Nam" | "Nữ"; email: string; sdt: string;
  diaChi: string; maPB: string; chucVu: string; trinhDo: string; ngayVaoLam: string;
  ngayNghiViec: string | null; trangThai: TrangThaiNV; soTaiKhoanNH: string; tenNganHang: string;
  soNguoiPhuThuoc: number; laTruongPhong: boolean;
}
export type LoaiHD = "Thử việc" | "Xác định thời hạn" | "Không thời hạn";
export interface HopDong {
  maHD: string; maNV: string; loai: LoaiHD; ngayBatDau: string; ngayKetThuc: string | null;
  luongCoBan: number; phuCapAnTrua: number; phuCapChucDanh: number;
}
export type CaId = "HC" | "SANG" | "CHIEU";
export interface Ca { id: CaId; ten: string; batDau: string; ketThuc: string; phuCap?: number; mau?: string }
export const CA: Ca[] = [
  { id: "HC", ten: "Hành chính", batDau: "08:00", ketThuc: "17:00" },
  { id: "SANG", ten: "Ca sáng", batDau: "06:00", ketThuc: "14:00" },
  { id: "CHIEU", ten: "Ca chiều", batDau: "14:00", ketThuc: "22:00" },
];
export const caById = (id: CaId) => CA.find((c) => c.id === id) ?? CA[0];
export type LoaiNgay = "Làm việc" | "Nghỉ phép" | "Nghỉ ốm";
export interface ChamCong {
  maNV: string; ngay: string; loai: LoaiNgay; gioVao: string | null; gioRa: string | null;
  tre: boolean; veSom: boolean; ot: number; ghiChu?: string;
}
export type LoaiDon = "Nghỉ phép năm" | "Nghỉ ốm" | "Đi trễ/về sớm" | "Đổi ca" | "Làm thêm giờ";
export const LOAI_DON: LoaiDon[] = ["Nghỉ phép năm", "Nghỉ ốm", "Đi trễ/về sớm", "Đổi ca", "Làm thêm giờ"];
export type TrangThaiDon = "Chờ duyệt" | "Đã duyệt" | "Từ chối";
export interface DonTu {
  id: string; maNV: string; loai: LoaiDon; tuNgay: string; denNgay?: string; soNgay?: number;
  soGio?: number; caCu?: CaId; caMoi?: CaId; kieu?: "Đi trễ" | "Về sớm"; soPhut?: number;
  lyDo: string; trangThai: TrangThaiDon; nguoiDuyet?: string; lyDoTuChoi?: string; ngayTao: string;
  gioDuKien?: string; loaiNgayOT?: "Thường" | "Cuối tuần" | "Lễ"; thoiGianDuyet?: string;
}
export interface ThongBao { id: string; maNV: string; noiDung: string; thoiGian: string; daDoc: boolean; donId?: string; trang?: "cham-cong" | "phieu-luong" | "kpi" | "ho-so" }
export interface ActivityLog { thoiGian: string; maNV: string; vaiTro: Role; hanhDong: string; doiTuong: string; chiTiet: string }
export interface NhatKy { id: string; thoiGian: string; maNV: string; hanhDong: string }
export interface AppState {
  nhanVien: NhanVien[];
  hopDong: HopDong[];
  taiKhoan: Record<string, Role>;
  taiKhoanKhoa: Record<string, boolean>;
  caMacDinh: Record<string, CaId>;
  caNgoaiLe: Record<string, CaId | "OFF">;
  chamCong: ChamCong[];
  donTu: DonTu[];
  thongBao: ThongBao[];
  nhatKy: NhatKy[];
  phepDaDung: Record<string, number>;
  bangCongDaXacNhan: string[];
  activityLog: ActivityLog[];
  ca: Ca[];
  xacNhanCong: Record<string, { maNV: string; ngay: string }>;
}
export const PHEP_NAM = 12;
export const OT_TOI_DA_THANG = 40;
