import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Wallet, Lock, Eye, Printer, Calculator } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatCard, thCls } from "@/components/app/ui-bits";
import { Choice, DepartmentFilter, FormField } from "@/components/app/hr-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { tenPB } from "@/data/phongBan";
import { useConfig } from "@/data/config";
import { useCompensation } from "@/lib/compensation-store";
import { useStore } from "@/lib/store";
import { fmtMoney, fmtMonth } from "@/lib/date";
import { seo } from "@/lib/nav";
import { calculatePayroll, type PayrollRow } from "@/lib/compensation";
import { PayrollDetail } from "@/components/app/payroll-detail";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bang-luong")({
  head: () => seo("Bảng lương", "Tính và chốt lương theo kỳ."),
  component: BangLuongPage,
});

function BangLuongPage() {
  const { state, role, me, updateData } = useStore();
  const { config } = useConfig();
  const { data, change } = useCompensation();
  const [month, setMonth] = useState("2026-10");
  const [pb, setPb] = useState("all");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<string | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);

  if (!me) return null;
  const canEdit = role === "kt" || role === "admin";

  const period = data.payroll[month];
  const rows = useMemo(() => {
    if (!period) return [];
    return period.rows.filter((r) => {
      const nv = state.nhanVien.find((n) => n.maNV === r.maNV);
      return (pb === "all" || nv?.maPB === pb) && `${nv?.hoTen} ${r.maNV}`.toLowerCase().includes(q.toLowerCase().trim());
    });
  }, [period, pb, q, state.nhanVien]);

  const totals = rows.reduce((t, r) => ({
    gross: t.gross + r.gross, insurance: t.insurance + r.insurance, tax: t.tax + r.tax, net: t.net + r.net, ot: t.ot + r.overtime, bonus: t.bonus + r.bonus,
  }), { gross: 0, insurance: 0, tax: 0, net: 0, ot: 0, bonus: 0 });

  const recalculate = () => {
    change((d) => {
      d.payroll[month] = { status: d.payroll[month]?.status ?? "Nháp", rows: calculatePayroll(state, d, month, config) };
    });
    toast.success(`Đã tính lại lương kỳ ${fmtMonth(month)}`);
  };

  const closePayroll = () => {
    change((d) => {
      const p = d.payroll[month];
      if (!p) return;
      p.status = "Đã chốt";
      p.closedBy = me.maNV;
      p.closedAt = new Date().toISOString();
    });
    updateData(`Chốt lương kỳ ${fmtMonth(month)}`, month, () => {});
    toast.success(`Đã chốt lương kỳ ${fmtMonth(month)}`);
    setCloseOpen(false);
  };

  const openPeriod = (m: string) => {
    if (!data.payroll[m]) {
      change((d) => { d.payroll[m] = { status: "Nháp", rows: calculatePayroll(state, d, m, config) }; });
    }
    setMonth(m);
  };

  const selected = rows.find((r) => r.maNV === detail);
  const selectedNV = selected ? state.nhanVien.find((n) => n.maNV === selected.maNV) : null;

  const printPayroll = () => {
    const printWin = window.open("", "_blank", "width=1000,height=700");
    if (!printWin) { toast.error("Vui lòng cho phép cửa sổ pop-up"); return; }
    const html = buildPrintHTML(rows, state.nhanVien, month);
    printWin.document.write(html);
    printWin.document.close();
    printWin.print();
  };

  return (
    <>
      <PageHeader
        title="Bảng lương"
        desc={`${rows.length} nhân viên · Kỳ ${fmtMonth(month)} · ${period?.status ?? "Chưa tính"}`}
        actions={canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={recalculate}><Calculator className="h-4 w-4" />Tính lương</Button>
            {period?.status !== "Đã chốt" && <Button onClick={() => setCloseOpen(true)}><Lock className="h-4 w-4" />Chốt lương</Button>}
          </div>
        )}
      />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Choice label="Kỳ lương" value={month} onChange={openPeriod} options={[
          ["2026-10", "10/2026"], ["2026-11", "11/2026"],
        ]} />
        {role !== "tp" && <DepartmentFilter value={pb} onChange={setPb} />}
        <div className="min-w-48 flex-1"><FormField label="Tìm nhân viên"><Input placeholder="Họ tên / Mã NV" value={q} onChange={(e) => setQ(e.target.value)} /></FormField></div>
        <Button variant="outline" onClick={printPayroll}><Printer className="h-4 w-4" />In bảng lương</Button>
      </div>

      {period && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Tổng quỹ lương" value={fmtMoney(totals.gross)} icon={<Wallet className="h-5 w-5" />} />
          <StatCard label="Tổng bảo hiểm" value={fmtMoney(totals.insurance)} icon={<Wallet className="h-5 w-5" />} tone="warning" />
          <StatCard label="Tổng thuế TNCN" value={fmtMoney(totals.tax)} icon={<Wallet className="h-5 w-5" />} tone="danger" />
          <StatCard label="Tổng thực lĩnh" value={fmtMoney(totals.net)} icon={<Wallet className="h-5 w-5" />} tone="success" />
        </div>
      )}

      <div className="card-surface overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {["Mã NV", "Họ tên", "Phòng ban", "Công", "Lương cơ bản", "Lương theo công", "OT", "Thưởng", "Tổng thu nhập", "Bảo hiểm", "Thuế", "Thực lĩnh", ""].map((h) => (
                <TableHead key={h} className={cn(thCls, "whitespace-nowrap")}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={13} className="py-10 text-center text-muted-foreground">{period ? "Không có dữ liệu" : "Nhấn \"Tính lương\" để tạo bảng lương cho kỳ này"}</TableCell></TableRow>}
            {rows.map((r) => {
              const nv = state.nhanVien.find((n) => n.maNV === r.maNV);
              return (
                <TableRow key={r.maNV} className="cursor-pointer" onClick={() => setDetail(r.maNV)}>
                  <TableCell className="font-mono text-xs">{r.maNV}</TableCell>
                  <TableCell className="whitespace-nowrap font-medium">{nv?.hoTen}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{tenPB(nv?.maPB ?? "")}</TableCell>
                  <TableCell>{r.days}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{fmtMoney(r.base)}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{fmtMoney(r.salary)}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{fmtMoney(r.overtime)}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{r.grade ? `${fmtMoney(r.bonus)} (${r.grade})` : "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs font-semibold">{fmtMoney(r.gross)}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{fmtMoney(r.insurance)}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{fmtMoney(r.tax)}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs font-semibold text-primary">{fmtMoney(r.net)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}><Button size="icon" variant="ghost" aria-label="Xem chi tiết" onClick={() => setDetail(r.maNV)}><Eye className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              );
            })}
            {rows.length > 0 && (
              <TableRow className="bg-secondary font-semibold">
                <TableCell colSpan={4}>Tổng cộng · {rows.length} NV</TableCell>
                <TableCell>—</TableCell>
                <TableCell>—</TableCell>
                <TableCell className="whitespace-nowrap text-xs">{fmtMoney(totals.ot)}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">{fmtMoney(totals.bonus)}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">{fmtMoney(totals.gross)}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">{fmtMoney(totals.insurance)}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">{fmtMoney(totals.tax)}</TableCell>
                <TableCell className="whitespace-nowrap text-xs text-primary">{fmtMoney(totals.net)}</TableCell>
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {period?.status === "Đã chốt" && (
        <p className="mt-3 text-sm text-muted-foreground">
          Kỳ này đã chốt bởi {state.nhanVien.find((n) => n.maNV === period.closedBy)?.hoTen ?? period.closedBy} · {period.closedAt ? new Date(period.closedAt).toLocaleString("vi-VN") : ""}
        </p>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader><SheetTitle>Chi tiết lương · {selectedNV?.hoTen}</SheetTitle></SheetHeader>
          {selected && <div className="p-4"><PayrollDetail row={selected} /></div>}
        </SheetContent>
      </Sheet>

      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Chốt lương kỳ {fmtMonth(month)}</DialogTitle></DialogHeader>
          <p>Sau khi chốt, bảng lương sẽ bị khóa và không thể tính lại. {rows.length} nhân viên · Tổng quỹ {fmtMoney(totals.gross)}.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseOpen(false)}>Hủy</Button>
            <Button onClick={closePayroll}><Lock className="h-4 w-4" />Chốt lương</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function buildPrintHTML(rows: PayrollRow[], nhanVien: import("@/data/types").NhanVien[], month: string): string {
  const body = rows.map((r) => {
    const nv = nhanVien.find((n) => n.maNV === r.maNV);
    return `<tr><td>${r.maNV}</td><td>${nv?.hoTen ?? ""}</td><td>${tenPB(nv?.maPB ?? "")}</td><td style="text-align:right">${r.days}</td><td style="text-align:right">${r.gross.toLocaleString("vi-VN")}</td><td style="text-align:right">${r.insurance.toLocaleString("vi-VN")}</td><td style="text-align:right">${r.tax.toLocaleString("vi-VN")}</td><td style="text-align:right"><b>${r.net.toLocaleString("vi-VN")}</b></td></tr>`;
  }).join("");
  const total = rows.reduce((t, r) => ({ gross: t.gross + r.gross, net: t.net + r.net, ins: t.ins + r.insurance, tax: t.tax + r.tax }), { gross: 0, net: 0, ins: 0, tax: 0 });
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>Bảng lương ${fmtMonth(month)}</title><style>body{font-family:Arial,sans-serif;font-size:12px;margin:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:4px 8px}th{background:#f0f0f0;text-align:left}tr:nth-child(even){background:#fafafa}tr:last-child{font-weight:bold;background:#e8e8e8}h2{text-align:center}p{text-align:center}</style></head><body><p><b>CÔNG TY TNHH ATX GLOBAL</b></p><h2>BẢNG LƯƠNG</h2><p>Kỳ ${fmtMonth(month)}</p><table><thead><tr><th>Mã NV</th><th>Họ tên</th><th>Phòng ban</th><th style="text-align:right">Công</th><th style="text-align:right">Tổng thu nhập</th><th style="text-align:right">Bảo hiểm</th><th style="text-align:right">Thuế</th><th style="text-align:right">Thực lĩnh</th></tr></thead><tbody>${body}<tr><td colspan="4">Tổng cộng</td><td style="text-align:right">${total.gross.toLocaleString("vi-VN")}</td><td style="text-align:right">${total.ins.toLocaleString("vi-VN")}</td><td style="text-align:right">${total.tax.toLocaleString("vi-VN")}</td><td style="text-align:right">${total.net.toLocaleString("vi-VN")}</td></tr></tbody></table></body></html>`;
}
