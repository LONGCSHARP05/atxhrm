import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { ClipboardList, CheckCircle, XCircle, CalendarOff, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatCard, StatusBadge, thCls } from "@/components/app/ui-bits";
import { Choice, FormField } from "@/components/app/hr-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { LOAI_DON, type LoaiDon, type DonTu } from "@/data/types";
import { CA, caById, type CaId } from "@/data/types";
import { useConfig } from "@/data/config";
import { fmtDate, fmtMonth, monthOf, TODAY, workdays } from "@/lib/date";
import { phepConLai, otTrongThang, coTheDuyet, kiemTraTuChoi, type DonInput } from "@/lib/rules";
import { shiftFor, approverIds } from "@/lib/hrm";
import { cn } from "@/lib/utils";
import { tenPB } from "@/data/phongBan";
import { seo } from "@/lib/nav";
import { useStore } from "@/lib/store";


export const Route = createFileRoute("/don-tu")({
  head: () => seo("Đơn từ", "Quản lý đơn từ nhân sự ATX Global."),
  component: DonTuPage,
  validateSearch: (search: Record<string, unknown>): {mo?:string;loai?:string;ngay?:string;caCu?:string} => ({
    mo: (search['mo'] as string) || undefined,
    loai: (search['loai'] as string) || undefined,
    ngay: (search['ngay'] as string) || undefined,
    caCu: (search['caCu'] as string) || undefined,
  }),
});

function DonTuPage() {
  const { state, me, role, taoDon, duyetDon, tuChoiDon, xoaDon } = useStore();
  const { config } = useConfig();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [tab, setTab] = useState("mine");
  const [fLoai, setFLoai] = useState("all");
  const [fTrangThai, setFTrangThai] = useState("all");
  const [fThang, setFThang] = useState(monthOf(TODAY));
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [viewDon, setViewDon] = useState<DonTu | null>(null);
  const [rejectOpen, setRejectOpen] = useState<DonTu | null>(null);
  const [rejectLyDo, setRejectLyDo] = useState("");
  const [preselectLoai, setPreselectLoai] = useState<LoaiDon | undefined>(undefined);
  const [preselectNgay, setPreselectNgay] = useState<string | undefined>(undefined);
  const [preselectCaCu, setPreselectCaCu] = useState<string | undefined>(undefined);

  if (!me) return null;

  const name = (m: string) => state.nhanVien.find((n) => n.maNV === m)?.hoTen ?? m;
  const approver = (d: DonTu) => state.nhanVien.find((n) => n.maNV === d.nguoiDuyet)?.hoTen ?? "—";

  // Auto-open view dialog from ?mo=
  useEffect(() => {
    if (search['mo']) {
      const d = state.donTu.find((x) => x.id === search['mo']);
      if (d) setViewDon(d);
    }
  }, [search['mo'], state.donTu]);

  // Auto-open create dialog from ?loai=
  useEffect(() => {
    if (search['loai']) {
      setPreselectLoai(search['loai'] as LoaiDon);
      setPreselectNgay(search['ngay']);
      setPreselectCaCu(search['caCu']);
      setCreateOpen(true);
      navigate({ to: "/don-tu", search: {} });
    }
  }, [search['loai']]);

  // Tabs by role
  const tabs = useMemo(() => {
    if (role === "nv") return [{ key: "mine", label: "Đơn của tôi" }];
    if (role === "tp") return [
      { key: "approve", label: "Chờ tôi duyệt" },
      { key: "dept", label: "Đơn phòng ban" },
      { key: "mine", label: "Đơn của tôi" },
    ];
    if ((role === "hr" || role === "admin")) return [
      { key: "approve", label: "Chờ tôi duyệt" },
      { key: "all", label: "Tất cả đơn" },
      { key: "mine", label: "Đơn của tôi" },
    ];
    return [{ key: "mine", label: "Đơn của tôi" }];
  }, [role]);

  useEffect(() => {
    if (!tabs.find((t) => t.key === tab)) setTab(tabs[0].key);
  }, [tabs, tab]);

  const pendingForMe = state.donTu.filter((d) => coTheDuyet(state, me.maNV, d));
  const deptNVs = new Set(state.nhanVien.filter((n) => n.maPB === me.maPB).map((n) => n.maNV));

  const filtered = useMemo(() => {
    let list = state.donTu;
    if (tab === "approve") list = list.filter((d) => coTheDuyet(state, me.maNV, d));
    else if (tab === "mine") list = list.filter((d) => d.maNV === me.maNV);
    else if (tab === "dept") list = list.filter((d) => deptNVs.has(d.maNV));
    else if (tab === "all") list = list; // HR sees all

    if (fLoai !== "all") list = list.filter((d) => d.loai === fLoai);
    if (fTrangThai !== "all") list = list.filter((d) => d.trangThai === fTrangThai);
    if (fThang !== "all") list = list.filter((d) => monthOf(d.tuNgay) === fThang);
    if (q.trim()) list = list.filter((d) => {
      const nv = state.nhanVien.find((n) => n.maNV === d.maNV);
      return `${d.id} ${nv?.hoTen ?? ""} ${d.maNV}`.toLowerCase().includes(q.toLowerCase().trim());
    });
    return list.sort((a, b) => b.ngayTao.localeCompare(a.ngayTao));
  }, [state, tab, fLoai, fTrangThai, fThang, q, me.maNV]);

  // Stats
  const thisMonth = monthOf(TODAY);
  const stats = {
    choDuyet: state.donTu.filter((d) => d.trangThai === "Chờ duyệt").length,
    daDuyet: state.donTu.filter((d) => d.trangThai === "Đã duyệt" && monthOf(d.ngayTao) === thisMonth).length,
    tuChoi: state.donTu.filter((d) => d.trangThai === "Từ chối" && monthOf(d.ngayTao) === thisMonth).length,
    phepCon: phepConLai(state, me.maNV, undefined, config),
  };

  const pendingCount = pendingForMe.length;

  const handleDuyet = (d: DonTu) => {
    const err = duyetDon(d.id);
    if (err) toast.error(err);
    else { toast.success(`Đã duyệt đơn ${d.id}`); setViewDon(null); }
  };

  const handleTuChoi = () => {
    if (!rejectOpen) return;
    const err = tuChoiDon(rejectOpen.id, rejectLyDo);
    if (err) toast.error(err);
    else { toast.success(`Đã từ chối đơn ${rejectOpen.id}`); setRejectOpen(null); setRejectLyDo(""); setViewDon(null); }
  };

  const handleRutDon = (d: DonTu) => {
    xoaDon(d.id);
    toast.success(`Đã rút đơn ${d.id}`);
    setViewDon(null);
  };

  return (
    <>
      <PageHeader title="Đơn từ" />
      {/* Stat cards */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Chờ duyệt" value={stats.choDuyet} icon={<ClipboardList className="h-5 w-5" />} tone="warning" />
        <StatCard label="Đã duyệt tháng này" value={stats.daDuyet} icon={<CheckCircle className="h-5 w-5" />} tone="success" />
        <StatCard label="Từ chối tháng này" value={stats.tuChoi} icon={<XCircle className="h-5 w-5" />} tone="danger" />
        <StatCard label="Phép năm còn lại" value={`${stats.phepCon}/${config.phepNam} ngày`} icon={<CalendarOff className="h-5 w-5" />} tone="accent" />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
              {t.key === "approve" && pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingCount}</Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <Choice label="Loại đơn" value={fLoai} onChange={setFLoai} options={[["all", "Tất cả"], ...LOAI_DON.map((l) => [l, l] as [string, string])]} />
            <Choice label="Trạng thái" value={fTrangThai} onChange={setFTrangThai} options={[["all", "Tất cả"], ["Chờ duyệt", "Chờ duyệt"], ["Đã duyệt", "Đã duyệt"], ["Từ chối", "Từ chối"]]} />
            <Choice label="Tháng" value={fThang} onChange={setFThang} options={[["all", "Tất cả"], ["2026-10", "10/2026"], ["2026-11", "11/2026"]]} />
            <div className="min-w-48 flex-1"><FormField label="Tìm tên/mã"><Input placeholder="Họ tên / Mã NV / Mã đơn" value={q} onChange={(e) => setQ(e.target.value)} /></FormField></div>
            <Button onClick={() => { setPreselectLoai(undefined); setPreselectNgay(undefined); setPreselectCaCu(undefined); setCreateOpen(true); }}>
              <Plus className="h-4 w-4" />Tạo đơn
            </Button>
          </div>

          {/* Table */}
          <div className="card-surface overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
              {["Mã đơn", "Người gửi", "Loại đơn", "Thời gian", "Lý do", "Ngày gửi", "Trạng thái", "Người duyệt", "Thao tác"].map((h) => (
                <TableHead key={h} className={thCls}>{h}</TableHead>
              ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => {
                  const nv = state.nhanVien.find((n) => n.maNV === d.maNV);
                  const canApprove = coTheDuyet(state, me.maNV, d);
                  const isMine = d.maNV === me.maNV;
                  const timeStr = d.denNgay
                    ? `${fmtDate(d.tuNgay)} → ${fmtDate(d.denNgay)} (${d.soNgay ?? 0} ngày)`
                    : d.loai === "Làm thêm giờ"
                      ? `${fmtDate(d.tuNgay)} (${d.soGio} giờ)`
                      : d.loai === "Đi trễ/về sớm"
                        ? `${fmtDate(d.tuNgay)} (${d.kieu})`
                        : fmtDate(d.tuNgay);
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">{d.id}</TableCell>
                      <TableCell className="whitespace-nowrap">{nv?.hoTen} <span className="text-xs text-muted-foreground">{d.maNV}</span></TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{d.loai}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{timeStr}</TableCell>
                      <TableCell className="max-w-40">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="block truncate text-xs">{d.lyDo}</span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm"><p>{d.lyDo}</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{fmtDate(d.ngayTao)}</TableCell>
                      <TableCell><StatusBadge value={d.trangThai} /></TableCell>
                      <TableCell className="text-xs">{d.nguoiDuyet ? approver(d) : "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setViewDon(d)}>Xem</Button>
                          {canApprove && d.trangThai === "Chờ duyệt" && (
                            <>
                              <Button variant="outline" size="sm" className="text-success" onClick={() => handleDuyet(d)}>Duyệt</Button>
                              <Button variant="outline" size="sm" className="text-destructive" onClick={() => { setRejectOpen(d); setRejectLyDo(""); }}>Từ chối</Button>
                            </>
                          )}
                          {isMine && d.trangThai === "Chờ duyệt" && (
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleRutDon(d)}>Rút đơn</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!filtered.length && (
                  <TableRow><TableCell colSpan={9} className="py-12 text-center text-muted-foreground">Không có đơn nào</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <CreateDonDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        preselectLoai={preselectLoai}
        preselectNgay={preselectNgay}
        preselectCaCu={preselectCaCu}
        onCreate={(input) => {
          const err = taoDon(input);
          if (err) return err;
          toast.success("Đã gửi đơn");
          setCreateOpen(false);
          return null;
        }}
      />

      {/* View Dialog */}
      <ViewDonDialog
        don={viewDon}
        onOpenChange={(o) => !o && setViewDon(null)}
        onDuyet={handleDuyet}
        onTuChoi={(d) => { setRejectOpen(d); setRejectLyDo(""); }}
        onRutDon={handleRutDon}
        canApprove={(d) => coTheDuyet(state, me.maNV, d)}
        isMine={(d) => d.maNV === me.maNV}
        approverName={approver}
        userName={name}
      />

      {/* Reject Dialog */}
      <Dialog open={!!rejectOpen} onOpenChange={(o) => { if (!o) { setRejectOpen(null); setRejectLyDo(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Từ chối đơn {rejectOpen?.id}</DialogTitle></DialogHeader>
          <FormField label="Lý do từ chối (≥ 5 ký tự)" error={rejectLyDo.trim() && rejectLyDo.trim().length < 5 ? "Lý do phải có ít nhất 5 ký tự" : undefined}>
            <Textarea value={rejectLyDo} onChange={(e) => setRejectLyDo(e.target.value)} placeholder="Nhập lý do từ chối..." rows={3} />
          </FormField>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectOpen(null); setRejectLyDo(""); }}>Hủy</Button>
            <Button variant="destructive" disabled={rejectLyDo.trim().length < 5} onClick={handleTuChoi}>Từ chối đơn</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─── Create Dialog ─── */

function CreateDonDialog({
  open, onOpenChange, preselectLoai, preselectNgay, preselectCaCu, onCreate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  preselectLoai?: LoaiDon;
  preselectNgay?: string;
  preselectCaCu?: string;
  onCreate: (input: DonInput) => string | null;
}) {
  const { state, me } = useStore();
  const { config } = useConfig();
  const [loai, setLoai] = useState<LoaiDon>(preselectLoai ?? "Nghỉ phép năm");
  const [tuNgay, setTuNgay] = useState(preselectNgay ?? TODAY);
  const [denNgay, setDenNgay] = useState(TODAY);
  const [lyDo, setLyDo] = useState("");
  const [kieu, setKieu] = useState<"Đi trễ" | "Về sớm">("Đi trễ");
  const [gioDuKien, setGioDuKien] = useState("08:30");
  const [caMoi, setCaMoi] = useState<CaId>("SANG");
  const [soGio, setSoGio] = useState("2");
  const [loaiNgayOT, setLoaiNgayOT] = useState<"Thường" | "Cuối tuần" | "Lễ">("Thường");
  const [error, setError] = useState("");

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setLoai(preselectLoai ?? "Nghỉ phép năm");
      setTuNgay(preselectNgay ?? TODAY);
      setDenNgay(preselectNgay ?? TODAY);
      setLyDo("");
      setKieu("Đi trễ");
      setGioDuKien("08:30");
      setCaMoi("SANG");
      setSoGio("2");
      setLoaiNgayOT("Thường");
      setError("");
    }
  }, [open, preselectLoai, preselectNgay]);

  if (!me) return null;

  const remaining = phepConLai(state, me.maNV, undefined, config);
  const caHien = shiftFor(state, me.maNV, tuNgay);
  const caCuId = preselectCaCu ? (preselectCaCu as CaId) : caHien?.id;
  const otThang = otTrongThang(state, me.maNV, monthOf(tuNgay));
  const otHeSo = loaiNgayOT === "Thường" ? config.otThuong : loaiNgayOT === "Cuối tuần" ? config.otCuoiTuan : config.otLe;

  const workDays = denNgay && tuNgay <= denNgay ? workdays(tuNgay, denNgay) : 0;

  const submit = () => {
    const input: DonInput = {
      maNV: me.maNV,
      loai,
      tuNgay,
      lyDo,
      ...(loai === "Nghỉ phép năm" || loai === "Nghỉ ốm" ? { denNgay } : {}),
      ...(loai === "Đi trễ/về sớm" ? { kieu, gioDuKien, soPhut: 30 } : {}),
      ...(loai === "Đổi ca" ? { caCu: caCuId, caMoi } : {}),
      ...(loai === "Làm thêm giờ" ? { soGio: Number(soGio), loaiNgayOT } : {}),
    };
    const err = onCreate(input);
    if (err) setError(err);
  };

  const isValid = () => {
    if (!lyDo.trim()) return false;
    if (loai === "Nghỉ phép năm" && lyDo.trim().length < 10) return false;
    if (loai === "Nghỉ phép năm" || loai === "Nghỉ ốm") {
      if (!denNgay || denNgay < tuNgay) return false;
      if (loai === "Nghỉ phép năm" && workDays > remaining) return false;
    }
    if (loai === "Đổi ca" && (!caMoi || caMoi === caCuId)) return false;
    if (loai === "Làm thêm giờ") {
      const sg = Number(soGio);
      if (!sg || sg < 0.5 || sg > 8 || sg % 0.5 !== 0) return false;
      if (otThang + sg > config.otToiDa) return false;
    }
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Tạo đơn</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <FormField label="Loại đơn">
            <Choice value={loai} onChange={(v) => setLoai(v as LoaiDon)} options={LOAI_DON.map((l) => [l, l] as [string, string])} />
          </FormField>

          {(loai === "Nghỉ phép năm" || loai === "Nghỉ ốm") && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Từ ngày"><Input type="date" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} /></FormField>
                <FormField label="Đến ngày"><Input type="date" value={denNgay} onChange={(e) => setDenNgay(e.target.value)} /></FormField>
              </div>
              <p className="text-sm text-muted-foreground">
                Số ngày làm việc: <strong>{workDays}</strong>
                {loai === "Nghỉ phép năm" && <> · Phép còn lại: <strong>{remaining} ngày</strong> → sau khi nghỉ còn <strong>{remaining - workDays}</strong></>}
              </p>
              {loai === "Nghỉ phép năm" && workDays > remaining && (
                <p className="text-sm text-destructive">Số ngày nghỉ vượt số dư phép còn lại</p>
              )}
            </>
          )}

          {loai === "Đi trễ/về sớm" && (
            <>
              <FormField label="Ngày"><Input type="date" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} /></FormField>
              <FormField label="Loại">
                <Choice value={kieu} onChange={(v) => setKieu(v as "Đi trễ" | "Về sớm")} options={[["Đi trễ", "Đi trễ"], ["Về sớm", "Về sớm"]]} />
              </FormField>
              <FormField label="Giờ dự kiến"><Input type="time" value={gioDuKien} onChange={(e) => setGioDuKien(e.target.value)} /></FormField>
            </>
          )}

          {loai === "Đổi ca" && (
            <>
              <FormField label="Ngày"><Input type="date" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} /></FormField>
              <FormField label="Ca hiện tại">
                <Input value={caHien ? `${caHien.ten} (${caHien.batDau}–${caHien.ketThuc})` : "Không có ca"} disabled />
              </FormField>
              <FormField label="Ca mới">
                <Choice value={caMoi} onChange={(v) => setCaMoi(v as CaId)} options={CA.map((c) => [c.id, `${c.ten} (${c.batDau}–${c.ketThuc})`] as [string, string])} />
              </FormField>
              {caMoi === caCuId && <p className="text-sm text-destructive">Ca mới phải khác ca hiện tại</p>}
            </>
          )}

          {loai === "Làm thêm giờ" && (
            <>
              <FormField label="Ngày"><Input type="date" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} /></FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Số giờ (0,5–8)"><Input type="number" step="0.5" min="0.5" max="8" value={soGio} onChange={(e) => setSoGio(e.target.value)} /></FormField>
                <FormField label="Loại ngày">
                  <Choice value={loaiNgayOT} onChange={(v) => setLoaiNgayOT(v as "Thường" | "Cuối tuần" | "Lễ")} options={[["Thường", `Thường (×${config.otThuong})`], ["Cuối tuần", `Cuối tuần (×${config.otCuoiTuan})`], ["Lễ", `Lễ (×${config.otLe})`]]} />
                </FormField>
              </div>
              <p className="text-sm text-muted-foreground">OT tháng này: {otThang} giờ / tối đa {config.otToiDa} giờ</p>
            </>
          )}

          <FormField label={`Lý do${loai === "Nghỉ phép năm" ? " (≥ 10 ký tự)" : ""}`} error={error || undefined}>
            <Textarea value={lyDo} onChange={(e) => { setLyDo(e.target.value); setError(""); }} placeholder="Nhập lý do..." rows={3} />
          </FormField>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button disabled={!isValid()} onClick={submit}>Gửi đơn</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── View Dialog ─── */

function ViewDonDialog({
  don, onOpenChange, onDuyet, onTuChoi, onRutDon, canApprove, isMine, approverName, userName,
}: {
  don: DonTu | null;
  onOpenChange: (o: boolean) => void;
  onDuyet: (d: DonTu) => void;
  onTuChoi: (d: DonTu) => void;
  onRutDon: (d: DonTu) => void;
  canApprove: (d: DonTu) => boolean;
  isMine: (d: DonTu) => boolean;
  approverName: (d: DonTu) => string;
  userName: (m: string) => string;
}) {
  const { state } = useStore();
  if (!don) return null;
  const nv = state.nhanVien.find((n) => n.maNV === don.maNV);
  const approver = state.nhanVien.find((n) => n.maNV === approverIds(state, don.maNV)[0]);

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex gap-2 py-1.5 text-sm"><span className="w-32 shrink-0 text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>
  );

  return (
    <Dialog open={!!don} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Đơn {don.id} · {don.loai}</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Row label="Người gửi" value={`${nv?.hoTen ?? don.maNV} (${don.maNV})`} />
          <Row label="Phòng ban" value={nv ? tenPB(nv.maPB) : "—"} />
          <Row label="Thời gian" value={
            don.denNgay ? `${fmtDate(don.tuNgay)} → ${fmtDate(don.denNgay)} (${don.soNgay ?? 0} ngày)`
              : don.loai === "Làm thêm giờ" ? `${fmtDate(don.tuNgay)} · ${don.soGio} giờ (${don.loaiNgayOT})`
              : don.loai === "Đi trễ/về sớm" ? `${fmtDate(don.tuNgay)} · ${don.kieu} lúc ${don.gioDuKien}`
              : don.loai === "Đổi ca" ? `${fmtDate(don.tuNgay)} · ${don.caCu ? caById(don.caCu).ten : "—"} → ${don.caMoi ? caById(don.caMoi).ten : "—"}`
              : fmtDate(don.tuNgay)
          } />
          <Row label="Lý do" value={don.lyDo} />
          <Row label="Ngày gửi" value={fmtDate(don.ngayTao)} />
          <Row label="Trạng thái" value={<StatusBadge value={don.trangThai} />} />
          {don.nguoiDuyet && <Row label="Người duyệt" value={approverName(don)} />}
          {don.lyDoTuChoi && <Row label="Lý do từ chối" value={<span className="text-destructive">{don.lyDoTuChoi}</span>} />}

          {/* Timeline */}
          <div className="mt-4 border-t pt-4">
            <p className="mb-3 font-semibold text-sm">Tiến trình</p>
            <div className="space-y-3">
              <TimelineStep label={`Đã gửi · ${fmtDate(don.ngayTao)}`} done />
              <TimelineStep label={`Chờ ${approver?.hoTen ?? "người duyệt"} duyệt`} done={don.trangThai !== "Chờ duyệt"} current={don.trangThai === "Chờ duyệt"} />
              {don.trangThai === "Đã duyệt" && <TimelineStep label={`Đã duyệt${don.thoiGianDuyet ? " · " + new Date(don.thoiGianDuyet).toLocaleString("vi-VN") : ""}`} done />}
              {don.trangThai === "Từ chối" && <TimelineStep label={`Từ chối${don.thoiGianDuyet ? " · " + new Date(don.thoiGianDuyet).toLocaleString("vi-VN") : ""}`} rejected />}
            </div>
          </div>
        </div>

        {(canApprove(don) || isMine(don)) && don.trangThai === "Chờ duyệt" && (
          <DialogFooter>
            {isMine(don) && (
              <Button variant="ghost" className="text-destructive mr-auto" onClick={() => onRutDon(don)}>Rút đơn</Button>
            )}
            {canApprove(don) && (
              <>
                <Button variant="outline" className="text-destructive" onClick={() => onTuChoi(don)}>Từ chối</Button>
                <Button className="text-success" onClick={() => onDuyet(don)}>Duyệt</Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TimelineStep({ label, done, current, rejected }: { label: string; done?: boolean; current?: boolean; rejected?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={
        rejected ? "h-2.5 w-2.5 rounded-full bg-destructive" :
        done ? "h-2.5 w-2.5 rounded-full bg-success" :
        current ? "h-2.5 w-2.5 rounded-full bg-warning animate-pulse" :
        "h-2.5 w-2.5 rounded-full bg-muted"
      } />
      <span className={cn("text-sm", rejected && "text-destructive", !done && !current && !rejected && "text-muted-foreground")}>{label}</span>
    </div>
  );
}
