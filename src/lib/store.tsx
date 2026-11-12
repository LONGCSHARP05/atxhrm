import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { buildSeed } from "@/data/seed";
import type { AppState, CaId, DonTu, HopDong, NhanVien, Role } from "@/data/types";
import { caById } from "@/data/types";
import { fmtDate, now, nowHHMM, TODAY, workdays } from "./date";
import { caCua, kiemTraTuChoi, laTre, laVeSom, nextMaNV, roleOf, type DonInput } from "./rules";

const KEY = "atxhrm-state-v1";
const UKEY = "atxhrm-user";

type Result = string | null;
interface Store {
  state: AppState;
  me: NhanVien | null;
  role: Role;
  search: string;
  setSearch: (q: string) => void;
  login: (maNV: string) => void;
  logout: () => void;
  reset: () => void;
  themNV: (nv: Omit<NhanVien, "maNV">, hd: Pick<HopDong, "loai" | "luongCoBan">) => string;
  suaNV: (maNV: string, nv: Partial<NhanVien>, luong?: number) => void;
  nghiViec: (maNV: string) => void;
  chamCong: () => Result;
  xacNhanBangCong: (thang: string) => void;
  ganCa: (maNV: string, ca: CaId) => void;
  ganCaNgay: (maNV: string, ngay: string, ca: CaId | "OFF") => void;
  taoDon: (d: DonInput) => void;
  suaDon: (id: string, d: DonInput) => void;
  xoaDon: (id: string) => void;
  duyetDon: (id: string) => void;
  tuChoiDon: (id: string, lyDo: string) => Result;
  docTB: (id: string) => void;
  docTatCa: () => void;
}
const Ctx = createContext<Store | null>(null);

let seq = 0;
const uid = (p: string) => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let s: AppState;
    try {
      const raw = localStorage.getItem(KEY);
      s = raw ? JSON.parse(raw) : buildSeed();
    } catch {
      s = buildSeed();
    }
    setState(s);
    setUserId(localStorage.getItem(UKEY));
  }, []);
  useEffect(() => {
    if (state) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const mutate = useCallback(
    (fn: (d: AppState, log: (a: string) => void, notify: (to: string | string[], t: string) => void) => void) =>
      setState((prev) => {
        if (!prev) return prev;
        const d: AppState = structuredClone(prev);
        const t = now().toISOString();
        const actor = localStorage.getItem(UKEY) ?? "";
        fn(
          d,
          (hanhDong) => d.nhatKy.unshift({ id: uid("NK"), thoiGian: t, maNV: actor, hanhDong }),
          (to, noiDung) =>
            [to].flat().filter((m) => m && m !== actor).forEach((maNV) => d.thongBao.unshift({ id: uid("TB"), maNV, noiDung, thoiGian: t, daDoc: false })),
        );
        return d;
      }),
    [],
  );

  const value = useMemo<Store | null>(() => {
    if (!state) return null;
    const me = state.nhanVien.find((n) => n.maNV === userId) ?? null;
    const name = (m: string) => state.nhanVien.find((n) => n.maNV === m)?.hoTen ?? m;
    const byRole = (s: AppState, r: Role) => Object.keys(s.taiKhoan).filter((k) => s.taiKhoan[k] === r);
    const approvers = (s: AppState, maNV: string) => {
      const r = roleOf(s, maNV);
      if (r === "tp" || r === "bgd") return byRole(s, "hr");
      const pb = s.nhanVien.find((n) => n.maNV === maNV)!.maPB;
      return s.nhanVien.filter((n) => n.maPB === pb && n.laTruongPhong).map((n) => n.maNV);
    };
    return {
      state, me, role: me ? roleOf(state, me.maNV) : "nv", search, setSearch,
      login: (m) => { localStorage.setItem(UKEY, m); setUserId(m); },
      logout: () => { localStorage.removeItem(UKEY); setUserId(null); },
      reset: () => setState(buildSeed()),
      themNV: (nv, hd) => {
        const maNV = nextMaNV(state);
        mutate((d, log) => {
          d.nhanVien.push({ ...nv, maNV });
          d.taiKhoan[maNV] = "nv";
          d.caMacDinh[maNV] = "HC";
          d.phepDaDung[maNV] = 0;
          d.hopDong.push({ maHD: "HD" + maNV.slice(2), maNV, loai: hd.loai, ngayBatDau: nv.ngayVaoLam, ngayKetThuc: null, luongCoBan: hd.luongCoBan, phuCapAnTrua: 1_000_000, phuCapChucDanh: 500_000 });
          log(`Thêm hồ sơ nhân viên ${maNV} - ${nv.hoTen}`);
        });
        return maNV;
      },
      suaNV: (maNV, nv, luong) =>
        mutate((d, log) => {
          Object.assign(d.nhanVien.find((n) => n.maNV === maNV)!, nv);
          const hd = d.hopDong.find((h) => h.maNV === maNV);
          if (hd && luong) hd.luongCoBan = luong;
          log(`Cập nhật hồ sơ nhân viên ${maNV} - ${name(maNV)}`);
        }),
      nghiViec: (maNV) =>
        mutate((d, log) => {
          const n = d.nhanVien.find((x) => x.maNV === maNV)!;
          n.trangThai = "Đã nghỉ việc";
          n.ngayNghiViec = TODAY;
          log(`Chuyển ${maNV} - ${n.hoTen} sang trạng thái Đã nghỉ việc`);
        }),
      chamCong: () => {
        if (!me) return "Chưa đăng nhập";
        const rec = state.chamCong.find((c) => c.maNV === me.maNV && c.ngay === TODAY);
        if (rec && rec.loai !== "Làm việc") return `Hôm nay bạn đang ${rec.loai.toLowerCase()}`;
        if (rec?.gioVao && rec.gioRa) return "Bạn đã chấm công vào và ra hôm nay";
        const ca = caById(caCua(state, me.maNV, TODAY));
        const gio = nowHHMM();
        mutate((d, log) => {
          const r = d.chamCong.find((c) => c.maNV === me.maNV && c.ngay === TODAY);
          if (!r || !r.gioVao) {
            if (r) { r.gioVao = gio; r.tre = laTre(gio, ca); }
            else d.chamCong.push({ maNV: me.maNV, ngay: TODAY, loai: "Làm việc", gioVao: gio, gioRa: null, tre: laTre(gio, ca), veSom: false, ot: 0 });
            log(`Chấm công vào lúc ${gio}`);
          } else {
            r.gioRa = gio;
            r.veSom = laVeSom(gio, ca);
            log(`Chấm công ra lúc ${gio}`);
          }
        });
        return null;
      },
      xacNhanBangCong: (thang) =>
        mutate((d, log, notify) => {
          if (!d.bangCongDaXacNhan.includes(thang)) d.bangCongDaXacNhan.push(thang);
          const label = `${thang.slice(5)}/${thang.slice(0, 4)}`;
          log(`Xác nhận bảng công kỳ ${label}`);
          notify([...byRole(d, "kt"), ...byRole(d, "bgd")], `Bảng công kỳ ${label} đã được xác nhận`);
        }),
      ganCa: (maNV, ca) =>
        mutate((d, log, notify) => {
          d.caMacDinh[maNV] = ca;
          log(`Gán ca mặc định ${caById(ca).ten} cho ${name(maNV)}`);
          notify(maNV, `Ca làm việc mặc định của bạn được đổi sang ${caById(ca).ten}`);
        }),
      ganCaNgay: (maNV, ngay, ca) =>
        mutate((d, log, notify) => {
          d.caNgoaiLe[`${maNV}|${ngay}`] = ca;
          const t = ca === "OFF" ? "Nghỉ" : caById(ca).ten;
          log(`Đổi ca ngày ${fmtDate(ngay)} của ${name(maNV)} sang ${t}`);
          notify(maNV, `Lịch ngày ${fmtDate(ngay)} của bạn được cập nhật: ${t}`);
        }),
      taoDon: (input) =>
        mutate((d, log, notify) => {
          const id = "DT" + String(Math.max(0, ...d.donTu.map((x) => +x.id.slice(2) || 0)) + 1).padStart(3, "0");
          const don: DonTu = { ...input, soNgay: input.denNgay ? workdays(input.tuNgay, input.denNgay) : undefined, id, trangThai: "Chờ duyệt", ngayTao: TODAY };
          d.donTu.unshift(don);
          log(`Tạo đơn ${don.loai} ngày ${fmtDate(don.tuNgay)}`);
          notify(approvers(d, input.maNV), `Có đơn mới chờ duyệt: ${don.loai} của ${name(input.maNV)}`);
        }),
      suaDon: (id, input) =>
        mutate((d, log) => {
          const don = d.donTu.find((x) => x.id === id);
          if (!don || don.trangThai !== "Chờ duyệt") return;
          Object.assign(don, input, { soNgay: input.denNgay ? workdays(input.tuNgay, input.denNgay) : undefined });
          log(`Sửa đơn ${id} (${don.loai})`);
        }),
      xoaDon: (id) =>
        mutate((d, log) => {
          const don = d.donTu.find((x) => x.id === id);
          if (!don || don.trangThai !== "Chờ duyệt") return;
          d.donTu = d.donTu.filter((x) => x.id !== id);
          log(`Xóa đơn ${id} (${don.loai})`);
        }),
      duyetDon: (id) =>
        mutate((d, log, notify) => {
          const don = d.donTu.find((x) => x.id === id);
          if (!don || don.trangThai !== "Chờ duyệt") return;
          don.trangThai = "Đã duyệt";
          don.nguoiDuyet = userId ?? undefined;
          if (don.loai === "Nghỉ phép năm") d.phepDaDung[don.maNV] = (d.phepDaDung[don.maNV] ?? 0) + (don.soNgay ?? 0);
          if (don.loai === "Đổi ca" && don.caMoi) d.caNgoaiLe[`${don.maNV}|${don.tuNgay}`] = don.caMoi;
          if (don.loai === "Làm thêm giờ") {
            const r = d.chamCong.find((c) => c.maNV === don.maNV && c.ngay === don.tuNgay);
            if (r) r.ot += don.soGio ?? 0;
            else d.chamCong.push({ maNV: don.maNV, ngay: don.tuNgay, loai: "Làm việc", gioVao: null, gioRa: null, tre: false, veSom: false, ot: don.soGio ?? 0 });
          }
          log(`Duyệt đơn ${don.loai} của ${name(don.maNV)}`);
          notify(don.maNV, `Đơn ${don.loai} ngày ${fmtDate(don.tuNgay)} của bạn đã được duyệt`);
        }),
      tuChoiDon: (id, lyDo) => {
        const err = kiemTraTuChoi(lyDo);
        if (err) return err;
        mutate((d, log, notify) => {
          const don = d.donTu.find((x) => x.id === id);
          if (!don || don.trangThai !== "Chờ duyệt") return;
          don.trangThai = "Từ chối";
          don.lyDoTuChoi = lyDo.trim();
          don.nguoiDuyet = userId ?? undefined;
          log(`Từ chối đơn ${don.loai} của ${name(don.maNV)}`);
          notify(don.maNV, `Đơn ${don.loai} ngày ${fmtDate(don.tuNgay)} bị từ chối: ${lyDo.trim()}`);
        });
        return null;
      },
      docTB: (id) => mutate((d) => { const t = d.thongBao.find((x) => x.id === id); if (t) t.daDoc = true; }),
      docTatCa: () => mutate((d) => d.thongBao.forEach((t) => { if (t.maNV === userId) t.daDoc = true; })),
    };
  }, [state, userId, search, mutate]);

  if (!value)
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Đang tải ATXhrm…</div>;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside provider");
  return v;
}
