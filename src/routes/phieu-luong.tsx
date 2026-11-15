import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Printer, Wallet, Eye } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatCard, StatusBadge, thCls } from "@/components/app/ui-bits";
import { Choice, FormField } from "@/components/app/hr-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { tenPB } from "@/data/phongBan";
import { useConfig } from "@/data/config";
import { useCompensation } from "@/lib/compensation-store";
import { useStore } from "@/lib/store";
import { fmtDate, fmtMoney, fmtMonth, TODAY } from "@/lib/date";
import { seo } from "@/lib/nav";
import { calculatePayroll, type PayrollRow } from "@/lib/compensation";
import { PayrollDetail } from "@/components/app/payroll-detail";

export const Route = createFileRoute("/phieu-luong")({
  head: () => seo("Phiếu lương", "Xem phiếu lương cá nhân."),
  component: PhieuLuongPage,
});

function PhieuLuongPage() {
  const { state, me, role } = useStore();
  const { config } = useConfig();
  const { data, change } = useCompensation();
  const [month, setMonth] = useState("2026-10");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<string | null>(null);

  if (!me) return null;

  const isStaff = role === "nv";
  const scope = isStaff ? [me.maNV] : role === "tp" ? state.nhanVien.filter((n) => n.maPB === me.maPB).map((n) => n.maNV) : state.nhanVien.map((n) => n.maNV);

  const ensurePeriod = (m: string) => {
    if (!data.payroll[m]) {
      change((d) => { d.payroll[m] = { status: d.payroll[m]?.status ?? "Nháp", rows: calculatePayroll(state, d, m, config) }; });
    }
  };
  ensurePeriod(month);

  const period = data.payroll[month];
  const allRows = period?.rows.filter((r) => scope.includes(r.maNV)) ?? [];
  const rows = allRows.filter((r) => {
    const nv = state.nhanVien.find((n) => n.maNV === r.maNV);
    return `${nv?.hoTen} ${r.maNV}`.toLowerCase().includes(q.toLowerCase().trim());
  });

  const selected = allRows.find((r) => r.maNV === detail);
  const selectedNV = selected ? state.nhanVien.find((n) => n.maNV === selected.maNV) : null;

  const myRow = allRows.find((r) => r.maNV === me.maNV);

  const printPayslip = (row: PayrollRow) => {
    const nv = state.nhanVien.find((n) => n.maNV === row.maNV);
    const hd = state.hopDong.find((h) => h.maNV === row.maNV);
    const printWin = window.open("", "_blank", "width=800,height=600");
    if (!printWin) { toast.error("Vui lòng cho phép cửa sổ pop-up"); return; }
    const fields: [string, string][] = [
      ["Lương cơ bản", fmtMoney(row.base)],
      ["Lương theo công", fmtMoney(row.salary)],
      ["Làm thêm giờ", fmtMoney(row.overtime)],
      ["Thưởng KPI " + (row.grade || "—"), fmtMoney(row.bonus)],
      ["Phụ cấp", fmtMoney(row.allowances)],
      ["Tổng thu nhập", fmtMoney(row.gross)],
      ["Bảo hiểm xã hội", fmtMoney(row.bhxh)],
      ["Bảo hiểm y tế", fmtMoney(row.bhyt)],
      ["Bảo hiểm thất nghiệp", fmtMoney(row.bhtn)],
      ["Tổng bảo hiểm", fmtMoney(row.insurance)],
      ["Thuế TNCN", fmtMoney(row.tax)],
      ["Thực lĩnh", fmtMoney(row.net)],
    ];
    const rowsHtml = fields.map(([k, v]) => `<tr><td>${k}</td><td style="text-align:right"><b>${v}</b></td></tr>`).join("");
    printWin.document.write(`<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>Phiếu lương ${nv?.hoTen} ${fmtMonth(month)}</title><style>body{font-family:Arial,sans-serif;font-size:13px;margin:30px}h2{text-align:center}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #999;padding:6px 10px}th{background:#f0f0f0}.info{margin:10px 0}.info p{margin:2px 0}</style></head><body><p style="text-align:center;font-weight:bold">CÔNG TY TNHH ATX GLOBAL</p><h2>PHIẾU LƯƠNG</h2><p style="text-align:center">Kỳ ${fmtMonth(month)}</p><div class="info"><p><b>Họ tên:</b> ${nv?.hoTen ?? ""}</p><p><b>Mã NV:</b> ${row.maNV}</p><p><b>Phòng ban:</b> ${tenPB(nv?.maPB ?? "")}</p><p><b>Chức vụ:</b> ${nv?.chucVu ?? ""}</p><p><b>Số công:</b> ${row.days} · <b>Giờ OT:</b> ${row.otHours}</p></div><table><thead><tr><th>Khoản</th><th style="text-align:right">Số tiền</th></tr></thead><tbody>${rowsHtml}</tbody></table><p style="margin-top:20px;font-size:11px;color:#666">Ngày ${fmtDate(TODAY)} · Phiếu lương điện tử ATXhrm</p></body></html>`);
    printWin.document.close();
    printWin.print();
  };

  if (isStaff) {
    return (
      <>
        <PageHeader title="Phiếu lương" desc="Xem phiếu lương cá nhân theo kỳ" />
        <div className="mb-4 flex items-end gap-3">
          <Choice label="Kỳ lương" value={month} onChange={(v) => { ensurePeriod(v); setMonth(v); }} options={[["2026-10", "10/2026"], ["2026-11", "11/2026"]]} />
        </div>
        {myRow ? (
          <>
            <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Tổng thu nhập" value={fmtMoney(myRow.gross)} icon={<Wallet className="h-5 w-5" />} />
              <StatCard label="Tổng bảo hiểm" value={fmtMoney(myRow.insurance)} icon={<Wallet className="h-5 w-5" />} tone="warning" />
              <StatCard label="Thuế TNCN" value={fmtMoney(myRow.tax)} icon={<Wallet className="h-5 w-5" />} tone="danger" />
              <StatCard label="Thực lĩnh" value={fmtMoney(myRow.net)} icon={<Wallet className="h-5 w-5" />} tone="success" />
            </div>
            <div className="card-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{me.hoTen} · {me.maNV}</p>
                  <p className="text-sm text-muted-foreground">{me.chucVu} · {tenPB(me.maPB)} · {myRow.days} công · {myRow.otHours} giờ OT</p>
                </div>
                <Button variant="outline" onClick={() => printPayslip(myRow)}><Printer className="h-4 w-4" />In phiếu lương</Button>
              </div>
              <PayrollDetail row={myRow} />
            </div>
          </>
        ) : (
          <div className="card-surface flex flex-col items-center gap-2 p-12 text-center">
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu lương cho kỳ {fmtMonth(month)}</p>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <PageHeader title="Phiếu lương" desc={role === "tp" ? `Phòng ${tenPB(me.maPB)}` : "Tất cả nhân viên"} />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Choice label="Kỳ lương" value={month} onChange={(v) => { ensurePeriod(v); setMonth(v); }} options={[["2026-10", "10/2026"], ["2026-11", "11/2026"]]} />
        <div className="min-w-48 flex-1"><FormField label="Tìm nhân viên"><Input placeholder="Họ tên / Mã NV" value={q} onChange={(e) => setQ(e.target.value)} /></FormField></div>
      </div>
      <div className="card-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {["Mã NV", "Họ tên", "Phòng ban", "Công", "OT (h)", "Tổng thu nhập", "Bảo hiểm", "Thuế", "Thực lĩnh", ""].map((h) => <TableHead key={h} className={thCls}>{h}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={10} className="py-10 text-center text-muted-foreground">Không có dữ liệu</TableCell></TableRow>}
            {rows.map((r) => {
              const nv = state.nhanVien.find((n) => n.maNV === r.maNV);
              return (
                <TableRow key={r.maNV}>
                  <TableCell className="font-mono text-xs">{r.maNV}</TableCell>
                  <TableCell className="font-medium">{nv?.hoTen}</TableCell>
                  <TableCell className="text-xs">{tenPB(nv?.maPB ?? "")}</TableCell>
                  <TableCell>{r.days}</TableCell>
                  <TableCell>{r.otHours}</TableCell>
                  <TableCell className="text-xs font-semibold">{fmtMoney(r.gross)}</TableCell>
                  <TableCell className="text-xs">{fmtMoney(r.insurance)}</TableCell>
                  <TableCell className="text-xs">{fmtMoney(r.tax)}</TableCell>
                  <TableCell className="text-xs font-semibold text-primary">{fmtMoney(r.net)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" aria-label="Xem chi tiết" onClick={() => setDetail(r.maNV)}><Eye className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="In phiếu lương" onClick={() => printPayslip(r)}><Printer className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <Sheet open={!!selected} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader><SheetTitle>Phiếu lương · {selectedNV?.hoTen}</SheetTitle></SheetHeader>
          {selected && (
            <div className="p-4">
              <div className="mb-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => printPayslip(selected)}><Printer className="h-4 w-4" />In</Button>
              </div>
              <PayrollDetail row={selected} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
