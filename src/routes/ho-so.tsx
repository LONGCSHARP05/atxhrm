import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Search, UserX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Initials, PageHeader, StatusBadge, thCls } from "@/components/app/ui-bits";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PHONG_BAN, tenPB } from "@/data/phongBan";
import { useConfig } from "@/data/config";
import { type LoaiHD, type NhanVien } from "@/data/types";
import { fmtDate, fmtMoney, TODAY } from "@/lib/date";
import { seo } from "@/lib/nav";
import { phepConLai } from "@/lib/rules";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/ho-so")({
  validateSearch: (search: Record<string, unknown>): {nv?: string} => ({nv:typeof search["nv"]==="string"?search["nv"]:undefined}),
  head: () => seo("Hồ sơ nhân sự", "Danh sách và chi tiết hồ sơ nhân viên ATX Global."),
  component: HoSoPage,
});

const unaccent = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase();

function HoSoPage() {
  const { state, me, role, search, setSearch } = useStore();
  const [pb, setPb] = useState("all");
  const [tt, setTt] = useState("all");
  const {nv} = Route.useSearch();
  const [detail, setDetail] = useState<string | null>(null);
  const [edit, setEdit] = useState<NhanVien | "new" | null>(null);
  const [del, setDel] = useState<NhanVien | null>(null);
  const { nghiViec } = useStore();

  const scope = useMemo(() => {
    if ((role === "hr" || role === "admin")) return state.nhanVien;
    if (role === "tp") return state.nhanVien.filter((n) => n.maPB === me!.maPB);
    return state.nhanVien.filter((n) => n.maNV === me!.maNV);
  }, [state.nhanVien, role, me]);
  useEffect(()=>{if(nv && scope.some(n=>n.maNV===nv))setDetail(nv);},[nv,scope]);
  const q = unaccent(search);
  const rows = scope.filter((n) =>
    (pb === "all" || n.maPB === pb) && (tt === "all" || n.trangThai === tt) &&
    (!q || unaccent(`${n.maNV} ${n.hoTen} ${n.email} ${n.chucVu} ${tenPB(n.maPB)}`).includes(q)),
  );

  if (role === "nv") {
    return (
      <>
        <PageHeader title="Hồ sơ của tôi" desc="Thông tin cá nhân, hợp đồng và phép năm" />
        <div className="card-surface p-6"><Detail maNV={me!.maNV} /></div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Hồ sơ nhân sự"
        desc={role === "tp" ? `Nhân sự phòng ${tenPB(me!.maPB)}` : `${state.nhanVien.length} hồ sơ · ${state.nhanVien.filter((n) => n.trangThai !== "Đã nghỉ việc").length} đang làm`}
        actions={(role === "hr" || role === "admin") && <Button onClick={() => setEdit("new")}><Plus className="h-4 w-4" />Thêm nhân viên</Button>}
      />
      <div className="card-surface">
        <div className="flex flex-wrap gap-3 border-b p-4">
          <div className="relative min-w-60 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên, mã NV, email, chức danh…" className="pl-9" />
          </div>
          {(role === "hr" || role === "admin") && (
            <Select value={pb} onValueChange={setPb}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả phòng ban</SelectItem>
                {PHONG_BAN.map((p) => <SelectItem key={p.maPB} value={p.maPB}>{p.tenPB}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={tt} onValueChange={setTt}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {["Thử việc", "Chính thức", "Đã nghỉ việc"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {["Mã NV", "Họ tên", "Phòng ban", "Chức danh", "Ngày vào làm", "Trạng thái", ""].map((h) => <TableHead key={h} className={thCls}>{h}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((n) => (
              <TableRow key={n.maNV} className="cursor-pointer" onClick={() => setDetail(n.maNV)}>
                <TableCell className="font-mono text-xs">{n.maNV}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Initials name={n.hoTen} className="h-8 w-8" />
                    <div><div className="font-medium">{n.hoTen}</div><div className="text-xs text-muted-foreground">{n.email}</div></div>
                  </div>
                </TableCell>
                <TableCell>{tenPB(n.maPB)}</TableCell>
                <TableCell>{n.chucVu}{n.laTruongPhong && <span className="ml-1 text-xs text-primary">(Trưởng phòng)</span>}</TableCell>
                <TableCell>{fmtDate(n.ngayVaoLam)}</TableCell>
                <TableCell><StatusBadge value={n.trangThai} /></TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  {(role === "hr" || role === "admin") && (
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" aria-label="Sửa" onClick={() => setEdit(n)}><Pencil className="h-4 w-4" /></Button>
                      {n.trangThai !== "Đã nghỉ việc" && <Button size="icon" variant="ghost" aria-label="Xóa" onClick={() => setDel(n)}><UserX className="h-4 w-4 text-destructive" /></Button>}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Không tìm thấy nhân viên phù hợp</TableCell></TableRow>}
          </TableBody>
        </Table>
        <div className="border-t px-4 py-3 text-xs text-muted-foreground">Hiển thị {rows.length} / {scope.length} hồ sơ</div>
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-3xl">{detail && <Detail maNV={detail} />}</DialogContent>
      </Dialog>
      {edit && <EditDialog nv={edit === "new" ? null : edit} onClose={() => setEdit(null)} />}
      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Chuyển sang "Đã nghỉ việc"?</AlertDialogTitle>
            <AlertDialogDescription>Hồ sơ {del?.hoTen} ({del?.maNV}) sẽ không bị xóa mà được chuyển trạng thái Đã nghỉ việc từ ngày {fmtDate(TODAY)}.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { nghiViec(del!.maNV); toast.success("Đã cập nhật trạng thái nghỉ việc"); setDel(null); }}>Xác nhận</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 text-sm font-medium">{value || "—"}</p></div>;
}

function Detail({ maNV }: { maNV: string }) {
  const { state } = useStore();
  const { config } = useConfig();
  const n = state.nhanVien.find((x) => x.maNV === maNV)!;
  const hd = state.hopDong.find((h) => h.maNV === maNV);
  const used = state.phepDaDung[maNV] ?? 0;
  const leaves = state.donTu.filter((d) => d.maNV === maNV && d.loai === "Nghỉ phép năm");
  return (
    <div>
      <div className="mb-5 flex items-center gap-4">
        <Initials name={n.hoTen} className="h-14 w-14 text-base" />
        <div>
          <h2 className="text-xl font-bold">{n.hoTen}</h2>
          <p className="text-sm text-muted-foreground">{n.maNV} · {n.chucVu} · {tenPB(n.maPB)}</p>
        </div>
        <div className="ml-auto"><StatusBadge value={n.trangThai} /></div>
      </div>
      <Tabs defaultValue="info">
        <TabsList><TabsTrigger value="info">Thông tin</TabsTrigger><TabsTrigger value="hd">Hợp đồng</TabsTrigger><TabsTrigger value="phep">Phép năm</TabsTrigger></TabsList>
        <TabsContent value="info" className="grid grid-cols-2 gap-4 pt-4 md:grid-cols-3">
          <Field label="Ngày sinh" value={fmtDate(n.ngaySinh)} /><Field label="Giới tính" value={n.gioiTinh} /><Field label="Trình độ" value={n.trinhDo} />
          <Field label="Email" value={n.email} /><Field label="Số điện thoại" value={n.sdt} /><Field label="Ngày vào làm" value={fmtDate(n.ngayVaoLam)} />
          <Field label="Địa chỉ" value={n.diaChi} /><Field label="Tài khoản ngân hàng" value={`${n.soTaiKhoanNH} · ${n.tenNganHang}`} /><Field label="Người phụ thuộc" value={String(n.soNguoiPhuThuoc)} />
          {n.ngayNghiViec && <Field label="Ngày nghỉ việc" value={fmtDate(n.ngayNghiViec)} />}
        </TabsContent>
        <TabsContent value="hd" className="pt-4">
          {hd ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Field label="Số hợp đồng" value={hd.maHD} /><Field label="Loại hợp đồng" value={hd.loai} /><Field label="Thời hạn" value={`${fmtDate(hd.ngayBatDau)} → ${hd.ngayKetThuc ? fmtDate(hd.ngayKetThuc) : "Không thời hạn"}`} />
              <Field label="Lương cơ bản" value={fmtMoney(hd.luongCoBan)} /><Field label="Phụ cấp ăn trưa" value={fmtMoney(hd.phuCapAnTrua)} /><Field label="Phụ cấp chức danh" value={fmtMoney(hd.phuCapChucDanh)} />
            </div>
          ) : <p className="text-sm text-muted-foreground">Chưa có hợp đồng.</p>}
        </TabsContent>
        <TabsContent value="phep" className="pt-4">
          <div className="grid grid-cols-3 gap-3">
            {[["Tổng phép năm", config.phepNam], ["Đã dùng", used], ["Còn lại", config.phepNam - used]].map(([l, v]) => (
              <div key={l} className="rounded-lg bg-secondary p-4 text-center"><p className="text-xs text-muted-foreground">{l}</p><p className="text-2xl font-bold text-primary">{v}</p></div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Khả dụng đăng ký mới (trừ đơn đang chờ): {phepConLai(state, maNV, undefined, config)} ngày</p>
          <ul className="mt-4 divide-y text-sm">
            {leaves.map((d) => <li key={d.id} className="flex justify-between py-2"><span>{fmtDate(d.tuNgay)} → {fmtDate(d.denNgay)} · {d.soNgay} ngày</span><StatusBadge value={d.trangThai} /></li>)}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EditDialog({ nv, onClose }: { nv: NhanVien | null; onClose: () => void }) {
  const { state, themNV, suaNV } = useStore();
  const hd = nv ? state.hopDong.find((h) => h.maNV === nv.maNV) : undefined;
  const [f, setF] = useState({
    hoTen: nv?.hoTen ?? "", email: nv?.email ?? "", sdt: nv?.sdt ?? "", ngaySinh: nv?.ngaySinh ?? "", gioiTinh: nv?.gioiTinh ?? "Nam",
    maPB: nv?.maPB ?? "", chucVu: nv?.chucVu ?? "", trinhDo: nv?.trinhDo ?? "Đại học", ngayVaoLam: nv?.ngayVaoLam ?? TODAY,
    trangThai: nv?.trangThai ?? "Thử việc", diaChi: nv?.diaChi ?? "", soTaiKhoanNH: nv?.soTaiKhoanNH ?? "", tenNganHang: nv?.tenNganHang ?? "",
    soNguoiPhuThuoc: String(nv?.soNguoiPhuThuoc ?? 0), luong: hd ? String(hd.luongCoBan) : "", loaiHD: (hd?.loai ?? "Thử việc") as LoaiHD,
  });
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const save = () => {
    if (!f.hoTen.trim() || !f.email.trim() || !f.maPB || !f.chucVu.trim() || !f.luong) return toast.error("Vui lòng nhập đủ: họ tên, email, phòng ban, chức danh, lương cơ bản");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return toast.error("Email không hợp lệ");
    if (state.nhanVien.some((n) => n.email.toLowerCase() === f.email.toLowerCase() && n.maNV !== nv?.maNV)) return toast.error("Email đã tồn tại");
    const luong = Number(f.luong.replace(/\D/g, ""));
    if (!luong) return toast.error("Lương cơ bản không hợp lệ");
    const data = {
      hoTen: f.hoTen.trim(), email: f.email.trim(), sdt: f.sdt, ngaySinh: f.ngaySinh, gioiTinh: f.gioiTinh as "Nam" | "Nữ", maPB: f.maPB, chucVu: f.chucVu.trim(),
      trinhDo: f.trinhDo, ngayVaoLam: f.ngayVaoLam, trangThai: f.trangThai as NhanVien["trangThai"], diaChi: f.diaChi, soTaiKhoanNH: f.soTaiKhoanNH,
      tenNganHang: f.tenNganHang, soNguoiPhuThuoc: Math.min(3, Math.max(0, Number(f.soNguoiPhuThuoc) || 0)),
    };
    if (nv) { suaNV(nv.maNV, data, luong); toast.success("Đã cập nhật hồ sơ"); }
    else { const id = themNV({ ...data, ngayNghiViec: null, laTruongPhong: false }, { loai: f.loaiHD, luongCoBan: luong }); toast.success(`Đã thêm nhân viên ${id}`); }
    onClose();
  };
  const T = (k: keyof typeof f, label: string, type = "text", req = false) => (
    <div className="space-y-1.5"><Label>{label}{req && <span className="text-destructive"> *</span>}</Label><Input type={type} value={f[k]} onChange={(e) => set(k)(e.target.value)} /></div>
  );
  const S = (k: keyof typeof f, label: string, opts: [string, string][], req = false) => (
    <div className="space-y-1.5"><Label>{label}{req && <span className="text-destructive"> *</span>}</Label>
      <Select value={f[k]} onValueChange={set(k)}><SelectTrigger><SelectValue placeholder="Chọn…" /></SelectTrigger>
        <SelectContent>{opts.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div>
  );
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>{nv ? `Sửa hồ sơ ${nv.maNV}` : `Thêm nhân viên mới · ${"NV" + String(Math.max(...state.nhanVien.map((n) => +n.maNV.slice(2))) + 1).padStart(4, "0")}`}</DialogTitle></DialogHeader>
        <div className="grid gap-4 md:grid-cols-3">
          {T("hoTen", "Họ tên", "text", true)}{T("email", "Email", "email", true)}{T("sdt", "Số điện thoại")}
          {S("maPB", "Phòng ban", PHONG_BAN.map((p) => [p.maPB, p.tenPB]), true)}{T("chucVu", "Chức danh", "text", true)}{T("luong", "Lương cơ bản (VNĐ)", "text", true)}
          {T("ngaySinh", "Ngày sinh", "date")}{S("gioiTinh", "Giới tính", [["Nam", "Nam"], ["Nữ", "Nữ"]])}{S("trinhDo", "Trình độ", ["Cao đẳng", "Đại học", "Thạc sĩ", "Tiến sĩ"].map((x) => [x, x]))}
          {T("ngayVaoLam", "Ngày vào làm", "date")}{S("trangThai", "Trạng thái", [["Thử việc", "Thử việc"], ["Chính thức", "Chính thức"]])}
          {!nv ? S("loaiHD", "Loại hợp đồng", ["Thử việc", "Xác định thời hạn", "Không thời hạn"].map((x) => [x, x])) : T("soNguoiPhuThuoc", "Số người phụ thuộc", "number")}
          {T("soTaiKhoanNH", "Số tài khoản")}{T("tenNganHang", "Ngân hàng")}{!nv && T("soNguoiPhuThuoc", "Số người phụ thuộc", "number")}
          <div className="md:col-span-3">{T("diaChi", "Địa chỉ")}</div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Hủy</Button><Button onClick={save}>Lưu</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
