import { PHONG_BAN } from "./phongBan";
import type { AppState, CaId, ChamCong, DonTu, HopDong, NhanVien, NhatKy, Role, ThongBao } from "./types";
import { CA, caById } from "./types";
import { addDays, addMonths, daysBetween, dow, isWeekend, now, pad, TODAY, workdays } from "@/lib/date";

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Flag = { tp?: boolean; demo?: Role; moi?: string; nghi?: boolean; ca?: CaId };
const ROSTER: [string, string, Flag?][] = [
  ["BGD", "Tổng Giám đốc", { tp: true, demo: "bgd" }],
  ["BGD", "Phó Tổng Giám đốc"],
  ["BGD", "Giám đốc Tài chính (CFO)"],
  ["HCNS", "Trưởng phòng Hành chính - Nhân sự", { tp: true }],
  ["HCNS", "Chuyên viên HR", { demo: "hr" }],
  ["HCNS", "Chuyên viên Tuyển dụng"],
  ["HCNS", "Chuyên viên C&B"],
  ["HCNS", "Nhân viên Hành chính"],
  ["TCKT", "Kế toán trưởng", { tp: true }],
  ["TCKT", "Kế toán viên", { demo: "kt" }],
  ["TCKT", "Kế toán viên"],
  ["TCKT", "Chuyên viên Kiểm soát rủi ro"],
  ["CNSP", "Giám đốc Công nghệ", { tp: true, demo: "tp" }],
  ["CNSP", "Backend Developer"],
  ["CNSP", "Backend Developer"],
  ["CNSP", "Backend Developer"],
  ["CNSP", "Frontend Developer", { demo: "nv" }],
  ["CNSP", "Frontend Developer"],
  ["CNSP", "Frontend Developer"],
  ["CNSP", "Mobile Developer"],
  ["CNSP", "Mobile Developer"],
  ["CNSP", "QA Engineer", { ca: "SANG" }],
  ["CNSP", "Data Analyst"],
  ["CNSP", "Data Analyst"],
  ["CNSP", "Product Owner"],
  ["CNSP", "UI/UX Designer"],
  ["CNSP", "DevOps Engineer"],
  ["CNSP", "Security Engineer"],
  ["CNSP", "Business Analyst"],
  ["CNSP", "Backend Developer", { moi: "2026-10-19" }],
  ["CNSP", "QA Engineer", { moi: "2026-10-26" }],
  ["KDMKT", "Trưởng phòng Kinh doanh & Marketing", { tp: true }],
  ["KDMKT", "Chuyên viên Kinh doanh"],
  ["KDMKT", "Chuyên viên Kinh doanh"],
  ["KDMKT", "Chuyên viên Kinh doanh"],
  ["KDMKT", "Chuyên viên Kinh doanh"],
  ["KDMKT", "Chuyên viên Marketing"],
  ["KDMKT", "Chuyên viên Marketing"],
  ["KDMKT", "Content Marketing"],
  ["KDMKT", "Performance Marketing"],
  ["KDMKT", "Chuyên viên Chăm sóc khách hàng", { ca: "SANG" }],
  ["KDMKT", "Chuyên viên Chăm sóc khách hàng", { ca: "CHIEU" }],
  ["KDMKT", "Chuyên viên Phát triển đối tác"],
  ["KDMKT", "Chuyên viên Kinh doanh", { moi: "2026-10-19" }],
  ["KDMKT", "Chuyên viên Marketing", { moi: "2026-10-26" }],
  ["KDMKT", "Chuyên viên Kinh doanh", { nghi: true }],
  ["KDMKT", "Chuyên viên Marketing", { nghi: true }],
];

const HO = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý", "Phan", "Trịnh", "Đinh", "Mai", "Lương", "Cao", "Tạ"];
const NAM_DEM = ["Văn", "Minh", "Đức", "Quang", "Hữu", "Thành", "Tuấn", "Gia", "Hoàng", "Công"];
const NAM_TEN = ["An", "Bảo", "Cường", "Dũng", "Hải", "Hiếu", "Hùng", "Khánh", "Long", "Nam", "Phong", "Quân", "Sơn", "Tài", "Thắng", "Trung", "Tùng", "Việt", "Vinh", "Duy", "Khoa", "Lâm", "Nhật", "Phúc"];
const NU_DEM = ["Thị", "Thu", "Ngọc", "Thanh", "Minh", "Phương", "Khánh", "Hồng", "Mai", "Bảo"];
const NU_TEN = ["Anh", "Chi", "Diệp", "Giang", "Hà", "Hạnh", "Hương", "Lan", "Linh", "Ly", "Mai", "My", "Nga", "Ngân", "Nhung", "Oanh", "Phương", "Quyên", "Thảo", "Trang", "Uyên", "Vân", "Yến", "Hằng"];
const PHUONG = ["Cầu Giấy", "Đống Đa", "Ba Đình", "Thanh Xuân", "Hai Bà Trưng", "Hoàng Mai", "Tây Hồ", "Long Biên", "Nam Từ Liêm", "Hà Đông"];
const DUONG = ["Trần Duy Hưng", "Xuân Thủy", "Láng Hạ", "Nguyễn Trãi", "Kim Mã", "Giải Phóng", "Lạc Long Quân", "Phạm Hùng", "Hoàng Quốc Việt", "Tố Hữu"];
const BANK = ["Vietcombank", "Techcombank", "BIDV", "VPBank", "MB Bank", "ACB", "TPBank"];

const unaccent = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

export function buildSeed(): AppState {
  const r = rng(20240920);
  const ri = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const usedNames = new Set<string>();
  const usedEmails = new Set<string>();

  type Draft = Omit<NhanVien, "maNV"> & { flag: Flag };
  const drafts: Draft[] = ROSTER.map(([maPB, chucVu, flag = {}]) => {
    const gioiTinh: "Nam" | "Nữ" = r() < 0.55 ? "Nam" : "Nữ";
    let hoTen = "";
    do {
      hoTen = gioiTinh === "Nam" ? `${pick(HO)} ${pick(NAM_DEM)} ${pick(NAM_TEN)}` : `${pick(HO)} ${pick(NU_DEM)} ${pick(NU_TEN)}`;
    } while (usedNames.has(hoTen));
    usedNames.add(hoTen);
    const parts = unaccent(hoTen).split(" ");
    let email = `${parts.at(-1)}.${parts.slice(0, -1).map((p) => p[0]).join("")}`;
    let e = email, k = 1;
    while (usedEmails.has(e)) e = `${email}${++k}`;
    usedEmails.add(e);
    email = `${e}@atxglobal.vn`;
    const senior = flag.tp || maPB === "BGD";
    const ngayVaoLam = flag.moi ?? (senior ? "2024-09-20" : addDays("2024-09-20", ri(0, 740)));
    return {
      hoTen, gioiTinh, email,
      ngaySinh: `${senior ? ri(1975, 1988) : ri(1990, 2002)}-${pad(ri(1, 12))}-${pad(ri(1, 28))}`,
      sdt: `0${pick(["9", "8", "3"])}${ri(10000000, 99999999)}`,
      diaChi: `Số ${ri(1, 199)} ${pick(DUONG)}, ${pick(PHUONG)}, Hà Nội`,
      maPB, chucVu,
      trinhDo: senior ? pick(["Thạc sĩ", "Đại học"]) : pick(["Đại học", "Đại học", "Đại học", "Cao đẳng"]),
      ngayVaoLam,
      ngayNghiViec: flag.nghi ? "2026-10-31" : null,
      trangThai: flag.nghi ? "Đã nghỉ việc" : flag.moi ? "Thử việc" : "Chính thức",
      soTaiKhoanNH: String(ri(1000000000, 9999999999)),
      tenNganHang: pick(BANK),
      soNguoiPhuThuoc: ri(0, 3),
      laTruongPhong: !!flag.tp,
      flag,
    };
  });
  // Resigned staff joined in 2025 so they have a work history.
  drafts.filter((d) => d.flag.nghi).forEach((d, i) => (d.ngayVaoLam = i ? "2025-05-12" : "2025-02-17"));
  const deptOrder = (m: string) => PHONG_BAN.findIndex((p) => p.maPB === m);
  drafts.sort((a, b) =>
    a.ngayVaoLam !== b.ngayVaoLam ? a.ngayVaoLam.localeCompare(b.ngayVaoLam)
      : Number(b.laTruongPhong) - Number(a.laTruongPhong) || deptOrder(a.maPB) - deptOrder(b.maPB),
  );

  const nhanVien: NhanVien[] = [];
  const taiKhoan: Record<string, Role> = {};
  const caMacDinh: Record<string, CaId> = {};
  const hopDong: HopDong[] = [];
  const phepDaDung: Record<string, number> = {};
  drafts.forEach((d, i) => {
    const maNV = `NV${String(i + 1).padStart(4, "0")}`;
    const { flag, ...nv } = d;
    nhanVien.push({ maNV, ...nv });
    taiKhoan[maNV] = flag.demo ?? (nv.maPB === "BGD" ? "bgd" : nv.laTruongPhong ? "tp" : "nv");
    caMacDinh[maNV] = flag.ca ?? "HC";
    const role = nv.maPB === "BGD" ? "bgd" : nv.laTruongPhong ? "tp" : "nv";
    const luong = Math.round((role === "bgd" ? ri(60, 90) : role === "tp" ? ri(35, 55) : ri(12, 35) * 2) / (role === "nv" ? 2 : 1) * 1_000_000 / 500_000) * 500_000;
    const loai = nv.trangThai === "Thử việc" ? "Thử việc" : nv.ngayVaoLam < "2025-03-01" ? "Không thời hạn" : "Xác định thời hạn";
    hopDong.push({
      maHD: `HD${String(i + 1).padStart(4, "0")}`,
      maNV, loai,
      ngayBatDau: nv.ngayVaoLam,
      ngayKetThuc: nv.ngayNghiViec ?? (loai === "Thử việc" ? addDays(addMonths(nv.ngayVaoLam, 2), -1) : loai === "Xác định thời hạn" ? addDays(addMonths(nv.ngayVaoLam, 36), -1) : null),
      luongCoBan: luong,
      phuCapAnTrua: 1_000_000,
      phuCapChucDanh: role === "bgd" ? 10_000_000 : role === "tp" ? 5_000_000 : 500_000,
    });
    phepDaDung[maNV] = nv.trangThai === "Thử việc" ? 0 : ri(0, 5);
  });

  // Exactly 3 fixed-term contracts expiring within the next 30 days.
  const expiring = ["2026-11-25", "2026-12-03", "2026-12-09"];
  hopDong
    .filter((h) => h.loai === "Xác định thời hạn" && h.ngayBatDau >= "2025-03-01" && h.ngayBatDau <= "2025-12-31" && !nhanVien.find((n) => n.maNV === h.maNV)!.ngayNghiViec)
    .slice(0, 3)
    .forEach((h, i) => (h.ngayKetThuc = expiring[i]));

  const active = nhanVien.filter((n) => n.trangThai === "Chính thức" && !n.laTruongPhong);
  const who = (maPB: string, chucVu: string, nth = 0) => {
    const list = active.filter((n) => n.maPB === maPB && n.chucVu === chucVu && taiKhoan[n.maNV] === "nv" && n.maNV !== demo("nv"));
    return list[nth % list.length].maNV;
  };
  const demo = (role: Role) => nhanVien[drafts.findIndex((d) => d.flag.demo === role)].maNV;
  const demoNV = demo("nv");
  const tpOf = (maPB: string) => nhanVien.find((n) => n.maPB === maPB && n.laTruongPhong)!.maNV;
  const hrDemo = demo("hr");

  const A = who("CNSP", "Backend Developer", 0), B = who("CNSP", "Backend Developer", 1);
  const C = who("CNSP", "QA Engineer"), D = who("CNSP", "Data Analyst"), E = who("KDMKT", "Chuyên viên Kinh doanh");
  const F = who("KDMKT", "Chuyên viên Marketing"), G = who("HCNS", "Chuyên viên Tuyển dụng");
  const H = nhanVien.find((n) => n.chucVu === "Kế toán viên" && taiKhoan[n.maNV] === "nv")!.maNV;
  const I = nhanVien.find((n) => caMacDinh[n.maNV] === "SANG" && n.maPB === "KDMKT")!.maNV;
  const J = who("CNSP", "Mobile Developer"), K = who("CNSP", "UI/UX Designer");
  const pb = (m: string) => nhanVien.find((n) => n.maNV === m)!.maPB;
  const appr = (m: string) => tpOf(pb(m));

  let n = 0;
  const don = (maNV: string, loai: DonTu["loai"], tuNgay: string, extra: Partial<DonTu>, trangThai: DonTu["trangThai"], ngayTao: string): DonTu => ({
    id: `DT${String(++n).padStart(3, "0")}`, maNV, loai, tuNgay, lyDo: "", trangThai, ngayTao,
    ...(trangThai !== "Chờ duyệt" ? { nguoiDuyet: appr(maNV) } : {}), ...extra,
  });
  const donTu: DonTu[] = [
    don(A, "Nghỉ phép năm", "2026-10-14", { denNgay: "2026-10-15", soNgay: 2, lyDo: "Về quê có việc gia đình" }, "Đã duyệt", "2026-10-09"),
    don(E, "Nghỉ phép năm", "2026-10-22", { denNgay: "2026-10-22", soNgay: 1, lyDo: "Giải quyết thủ tục hành chính cá nhân" }, "Đã duyệt", "2026-10-19"),
    don(G, "Nghỉ ốm", "2026-10-08", { denNgay: "2026-10-08", soNgay: 1, lyDo: "Sốt, có giấy khám bệnh" }, "Đã duyệt", "2026-10-08"),
    don(D, "Làm thêm giờ", "2026-10-28", { soGio: 3, lyDo: "Hỗ trợ release ví điện tử v2.3" }, "Đã duyệt", "2026-10-27"),
    don(C, "Nghỉ phép năm", "2026-11-12", { denNgay: "2026-11-13", soNgay: 2, lyDo: "Đi đám cưới người thân" }, "Đã duyệt", "2026-11-05"),
    don(H, "Nghỉ phép năm", "2026-11-11", { denNgay: "2026-11-12", soNgay: 2, lyDo: "Nghỉ chăm con ốm" }, "Đã duyệt", "2026-11-10"),
    don(I, "Đổi ca", "2026-11-16", { caCu: "SANG", caMoi: "CHIEU", lyDo: "Có lịch khám bệnh buổi sáng" }, "Đã duyệt", "2026-11-09"),
    don(J, "Đi trễ/về sớm", "2026-10-20", { kieu: "Đi trễ", soPhut: 30, lyDo: "Hỏng xe trên đường đi làm", lyDoTuChoi: "Không có minh chứng, đã vượt số lần cho phép trong tháng" }, "Từ chối", "2026-10-20"),
    don(F, "Nghỉ phép năm", "2026-11-09", { denNgay: "2026-11-09", soNgay: 1, lyDo: "Việc cá nhân", lyDoTuChoi: "Trùng lịch sự kiện ra mắt sản phẩm" }, "Từ chối", "2026-11-04"),
    don(B, "Làm thêm giờ", "2026-11-07", { soGio: 8, lyDo: "Tối ưu truy vấn đối soát giao dịch", lyDoTuChoi: "OT ngày thứ Bảy chưa được lên kế hoạch trước" }, "Từ chối", "2026-11-06"),
    don(demoNV, "Nghỉ phép năm", "2026-11-20", { denNgay: "2026-11-20", soNgay: 1, lyDo: "Đưa bố mẹ đi khám sức khỏe" }, "Chờ duyệt", "2026-11-12"),
    don(A, "Làm thêm giờ", "2026-11-14", { soGio: 4, lyDo: "Triển khai tích hợp cổng thanh toán Napas" }, "Chờ duyệt", "2026-11-11"),
    don(K, "Đổi ca", "2026-11-18", { caCu: "HC", caMoi: "SANG", lyDo: "Họp với đối tác Singapore buổi sáng sớm" }, "Chờ duyệt", "2026-11-10"),
    don(J, "Đi trễ/về sớm", "2026-11-13", { kieu: "Về sớm", soPhut: 60, lyDo: "Đón con ở trường" }, "Chờ duyệt", "2026-11-12"),
    don(E, "Nghỉ phép năm", "2026-11-24", { denNgay: "2026-11-25", soNgay: 2, lyDo: "Du lịch cùng gia đình" }, "Chờ duyệt", "2026-11-11"),
  ];
  donTu.filter((d) => d.loai === "Nghỉ phép năm" && d.trangThai === "Đã duyệt").forEach((d) => (phepDaDung[d.maNV] += d.soNgay ?? 0));
  const caNgoaiLe: Record<string, CaId | "OFF"> = { [`${I}|2026-11-16`]: "CHIEU" };

  // Attendance
  const leave = new Map<string, "Nghỉ phép" | "Nghỉ ốm">();
  donTu.filter((d) => d.trangThai === "Đã duyệt" && (d.loai === "Nghỉ phép năm" || d.loai === "Nghỉ ốm"))
    .forEach((d) => daysBetween(d.tuNgay, d.denNgay!).forEach((day) => leave.set(`${d.maNV}|${day}`, d.loai === "Nghỉ ốm" ? "Nghỉ ốm" : "Nghỉ phép")));
  const demos = new Set(["nv", "tp", "hr", "kt", "bgd"].map((x) => (x === "nv" ? demoNV : demo(x as Role))));
  const heavyOT = new Set([A, D, who("CNSP", "DevOps Engineer"), who("KDMKT", "Performance Marketing")]);
  const toMin = (h: string) => +h.slice(0, 2) * 60 + +h.slice(3);
  const hm = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  const chamCong: ChamCong[] = [];
  const months = [["2026-10-01", "2026-10-31"], ["2026-11-01", "2026-11-11"]] as const;
  for (const nv of nhanVien) {
    const ca = caById(caMacDinh[nv.maNV]);
    for (const [from, to] of months) {
      const oct = from.startsWith("2026-10");
      const days = daysBetween(from, to).filter((d) => d >= nv.ngayVaoLam && (!nv.ngayNghiViec || d <= nv.ngayNghiViec));
      if (!days.length) continue;
      const sats = days.filter((d) => dow(d) === 6);
      const extraSat = oct && days.length > 25 ? ri(0, 4) : 0;
      const workDays = [...days.filter((d) => !isWeekend(d)), ...sats.slice(0, extraSat)].sort();
      const recs: ChamCong[] = [];
      for (const d of workDays) {
        const lv = leave.get(`${nv.maNV}|${d}`);
        if (d === TODAY) {
          if (lv) recs.push({ maNV: nv.maNV, ngay: d, loai: lv, gioVao: null, gioRa: null, tre: false, veSom: false, ot: 0 });
          else if (!demos.has(nv.maNV)) recs.push({ maNV: nv.maNV, ngay: d, loai: "Làm việc", gioVao: hm(toMin(ca.batDau) - ri(0, 20)), gioRa: null, tre: false, veSom: false, ot: 0 });
          continue;
        }
        if (lv) { recs.push({ maNV: nv.maNV, ngay: d, loai: lv, gioVao: null, gioRa: null, tre: false, veSom: false, ot: 0 }); continue; }
        recs.push({ maNV: nv.maNV, ngay: d, loai: "Làm việc", gioVao: hm(toMin(ca.batDau) - ri(0, 25) + ri(0, 10)), gioRa: hm(toMin(ca.ketThuc) + ri(0, 30)), tre: false, veSom: false, ot: 0 });
      }
      const working = recs.filter((x) => x.loai === "Làm việc" && x.gioRa);
      const late = ri(0, oct ? 4 : 2);
      for (let i = 0; i < late && working.length; i++) {
        const x = working[ri(0, working.length - 1)];
        x.tre = true;
        x.gioVao = hm(toMin(ca.batDau) + ri(16, 45));
      }
      let ot = oct ? (heavyOT.has(nv.maNV) ? ri(10, 20) : ri(0, 6)) : ri(0, 4);
      while (ot > 0 && working.length) {
        const x = working[ri(0, working.length - 1)];
        const h = Math.min(ot, ri(1, 3));
        x.ot += h; ot -= h;
        x.gioRa = hm(toMin(ca.ketThuc) + x.ot * 60 + ri(0, 10));
      }
      chamCong.push(...recs);
    }
  }
  const dRec = chamCong.find((c) => c.maNV === D && c.ngay === "2026-10-28");
  if (dRec) { dRec.ot += 3; dRec.gioRa = hm(toMin("17:00") + dRec.ot * 60); }

  const t = (min: number) => new Date(now().getTime() - min * 60000).toISOString();
  const name = (m: string) => nhanVien.find((x) => x.maNV === m)!.hoTen;
  const tpCN = tpOf("CNSP");
  const ktDemo = demo("kt"), bgd = demo("bgd");
  let tb = 0;
  const notif = (maNV: string, noiDung: string, min: number, daDoc = false): ThongBao => ({ id: `TB${++tb}`, maNV, noiDung, thoiGian: t(min), daDoc });
  const thongBao: ThongBao[] = [
    notif(tpCN, `Có đơn mới chờ duyệt: Nghỉ phép năm của ${name(demoNV)}`, 6),
    notif(tpCN, `Có đơn mới chờ duyệt: Đi trễ/về sớm của ${name(J)}`, 38),
    notif(tpCN, `Có đơn mới chờ duyệt: Làm thêm giờ của ${name(A)}`, 1500, true),
    notif(hrDemo, "3 hợp đồng lao động sắp hết hạn trong 30 ngày tới", 95),
    notif(hrDemo, "Bảng công kỳ 10/2026 đã được xác nhận", 2880, true),
    notif(ktDemo, "Bảng công kỳ 10/2026 đã được xác nhận — sẵn sàng tính lương", 2870),
    notif(bgd, "Bảng công kỳ 10/2026 đã được xác nhận", 2870),
    notif(bgd, "3 hợp đồng lao động sắp hết hạn trong 30 ngày tới", 95),
    notif(demoNV, "Đơn Nghỉ phép năm ngày 20/11/2026 của bạn đã được gửi, đang chờ duyệt", 7),
    notif(demoNV, "Bảng công kỳ 10/2026 đã được xác nhận", 2870, true),
    notif(tpOf("KDMKT"), `Có đơn mới chờ duyệt: Nghỉ phép năm của ${name(E)}`, 1410),
  ];
  let nk = 0;
  const log = (maNV: string, hanhDong: string, min: number): NhatKy => ({ id: `NK${++nk}`, maNV, hanhDong, thoiGian: t(min) });
  const nhatKy: NhatKy[] = [
    log(demoNV, "Tạo đơn Nghỉ phép năm ngày 20/11/2026", 7),
    log(J, "Tạo đơn Đi trễ/về sớm ngày 13/11/2026", 39),
    log(hrDemo, "Cập nhật hồ sơ nhân viên " + name(G), 180),
    log(tpCN, `Duyệt đơn Nghỉ phép năm của ${name(C)}`, 1600),
    log(A, "Tạo đơn Làm thêm giờ ngày 14/11/2026", 1505),
    log(hrDemo, "Xác nhận bảng công kỳ 10/2026", 2880),
    log(tpOf("KDMKT"), `Duyệt đơn Đổi ca của ${name(I)}`, 4300),
    log(hrDemo, "Thêm 2 nhân viên mới phòng Kinh doanh & Marketing", 25000),
  ];
  // Extend existing rows without replacing identities or existing requests.
  for (const request of donTu) request.id = "ĐT" + request.id.slice(2).padStart(4, "0");
  donTu.push(
    { id: "ĐT0016", maNV: tpCN, loai: "Nghỉ ốm", tuNgay: "2026-11-06", denNgay: "2026-11-06", soNgay: 1, lyDo: "Khám bệnh theo lịch hẹn", trangThai: "Đã duyệt", nguoiDuyet: hrDemo, ngayTao: "2026-11-05" },
    { id: "ĐT0017", maNV: demoNV, loai: "Nghỉ ốm", tuNgay: "2026-10-06", denNgay: "2026-10-06", soNgay: 1, lyDo: "Nghỉ khám sức khỏe", trangThai: "Từ chối", nguoiDuyet: tpCN, lyDoTuChoi: "Chưa có giấy khám bệnh", ngayTao: "2026-10-05" },
    { id: "ĐT0018", maNV: demoNV, loai: "Đi trễ/về sớm", tuNgay: "2026-11-04", kieu: "Đi trễ", gioDuKien: "08:30", soPhut: 30, lyDo: "Đưa người thân đi khám", trangThai: "Đã duyệt", nguoiDuyet: tpCN, ngayTao: "2026-11-03" },
  );
  const rotating = nhanVien.filter(n => n.maPB === "CNSP" && !n.laTruongPhong).slice(0, 8);
  for (const day of daysBetween("2026-10-01", "2026-12-31")) {
    rotating.forEach((nv, i) => { if (!isWeekend(day) && day >= nv.ngayVaoLam && (!nv.ngayNghiViec || day <= nv.ngayNghiViec)) caNgoaiLe[`${nv.maNV}|${day}`] = (Math.floor((new Date(day).getTime() - new Date("2026-10-05").getTime()) / 604800000) + i) % 2 === 0 ? "SANG" : "CHIEU"; });
  }
  // Existing Saturday attendance implies an assigned working shift.
  chamCong.forEach(c => { if (isWeekend(c.ngay)) caNgoaiLe[`${c.maNV}|${c.ngay}`] = caMacDinh[c.maNV]; });
  for (const request of donTu.filter(d=>d.trangThai === "Đã duyệt" && d.loai === "Đổi ca" && d.caMoi)) caNgoaiLe[`${request.maNV}|${request.tuNgay}`] = request.caMoi ?? "HC";
  thongBao.forEach(t => { if (t.noiDung.includes("đơn") || t.noiDung.includes("Đơn")) { const request = donTu.find(d=>t.noiDung.includes(name(d.maNV)) && t.noiDung.includes(d.loai)) ?? donTu.find(d=>d.maNV===t.maNV && t.noiDung.includes(d.loai)); t.donId=request?.id; } else t.trang=t.noiDung.includes("Bảng công")?"cham-cong":"ho-so"; });
  const ca = CA.map(c=>({...c, phuCap:0, mau:c.id==="HC"?"office":c.id==="SANG"?"morning":"afternoon"}));
  const activityLog = nhatKy.map(l=>({ thoiGian:l.thoiGian, maNV:l.maNV, vaiTro:taiKhoan[l.maNV], hanhDong:l.hanhDong, doiTuong:l.maNV, chiTiet:l.hanhDong }));
  const xacNhanCong = { "2026-10": { maNV:hrDemo, ngay:"2026-11-10" } };
  void workdays;
  return { nhanVien, hopDong, taiKhoan, caMacDinh, caNgoaiLe, chamCong, donTu, thongBao, nhatKy, phepDaDung, bangCongDaXacNhan: ["2026-10"], ca, activityLog, xacNhanCong };
}
