import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3, Users, TrendingUp, Wallet, Target, Printer } from "lucide-react";
import { PageHeader, StatCard, thCls } from "@/components/app/ui-bits";
import { Choice } from "@/components/app/hr-controls";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from "recharts";
import { PHONG_BAN, tenPB } from "@/data/phongBan";
import { useConfig } from "@/data/config";
import { useCompensation } from "@/lib/compensation-store";
import { useStore } from "@/lib/store";
import { fmtDate, fmtMoney, fmtMonth, TODAY } from "@/lib/date";
import { seo } from "@/lib/nav";
import { attendanceMonth } from "@/lib/hrm";
import { personnelMovement, kpiResult } from "@/lib/compensation";
import { dangLam } from "@/lib/rules";
import { toast } from "sonner";

export const Route = createFileRoute("/bao-cao")({
  head: () => seo("Báo cáo tổng hợp", "Báo cáo nhân sự và quỹ lương."),
  component: BaoCaoPage,
});

const PIE_COLORS = ["#2563EB", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

function BaoCaoPage() {
  const [tab, setTab] = useState("headcount");
  return (
    <>
      <PageHeader title="Báo cáo tổng hợp" desc={`Dữ liệu tính đến ${fmtDate(TODAY)}`} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="headcount"><Users className="h-4 w-4" />Cơ cấu nhân sự</TabsTrigger>
          <TabsTrigger value="movement"><TrendingUp className="h-4 w-4" />Biến động nhân sự</TabsTrigger>
          <TabsTrigger value="payroll"><Wallet className="h-4 w-4" />Quỹ lương</TabsTrigger>
          <TabsTrigger value="kpi"><Target className="h-4 w-4" />Kết quả KPI</TabsTrigger>
        </TabsList>
        <TabsContent value="headcount" className="mt-4"><HeadcountReport /></TabsContent>
        <TabsContent value="movement" className="mt-4"><MovementReport /></TabsContent>
        <TabsContent value="payroll" className="mt-4"><PayrollReport /></TabsContent>
        <TabsContent value="kpi" className="mt-4"><KpiReport /></TabsContent>
      </Tabs>
    </>
  );
}

/* ───────── Headcount Report ───────── */

function HeadcountReport() {
  const { state } = useStore();
  const active = state.nhanVien.filter(dangLam);
  const byDept = PHONG_BAN.map((p) => {
    const staff = active.filter((n) => n.maPB === p.maPB);
    return {
      maPB: p.maPB, tenPB: p.tenPB, total: staff.length,
      thuViec: staff.filter((n) => n.trangThai === "Thử việc").length,
      chinhThuc: staff.filter((n) => n.trangThai === "Chính thức").length,
      nam: staff.filter((n) => n.gioiTinh === "Nam").length,
      nu: staff.filter((n) => n.gioiTinh === "Nữ").length,
    };
  });
  const chartData = byDept.map((d) => ({ name: d.tenPB, "Chính thức": d.chinhThuc, "Thử việc": d.thuViec }));
  const genderData = [
    { name: "Nam", value: active.filter((n) => n.gioiTinh === "Nam").length },
    { name: "Nữ", value: active.filter((n) => n.gioiTinh === "Nữ").length },
  ];

  const print = () => doPrint("BÁO CÁO CƠ CẤU NHÂN SỰ", () => `
    <p>Tổng nhân sự: ${active.length} · Chính thức: ${active.filter(n=>n.trangThai==="Chính thức").length} · Thử việc: ${active.filter(n=>n.trangThai==="Thử việc").length}</p>
    <table><thead><tr><th>Phòng ban</th><th>Tổng</th><th>Chính thức</th><th>Thử việc</th><th>Nam</th><th>Nữ</th></tr></thead><tbody>
    ${byDept.map(d=>`<tr><td>${d.tenPB}</td><td>${d.total}</td><td>${d.chinhThuc}</td><td>${d.thuViec}</td><td>${d.nam}</td><td>${d.nu}</td></tr>`).join("")}
    <tr style="font-weight:bold"><td>Tổng cộng</td><td>${active.length}</td><td>${active.filter(n=>n.trangThai==="Chính thức").length}</td><td>${active.filter(n=>n.trangThai==="Thử việc").length}</td><td>${active.filter(n=>n.gioiTinh==="Nam").length}</td><td>${active.filter(n=>n.gioiTinh==="Nữ").length}</td></tr>
    </tbody></table>`);

  return (
    <>
      <div className="mb-4 flex justify-end"><Button variant="outline" onClick={print}><Printer className="h-4 w-4" />In báo cáo</Button></div>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Tổng nhân sự" value={active.length} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Chính thức" value={active.filter((n) => n.trangThai === "Chính thức").length} icon={<Users className="h-5 w-5" />} tone="success" />
        <StatCard label="Thử việc" value={active.filter((n) => n.trangThai === "Thử việc").length} icon={<Users className="h-5 w-5" />} tone="warning" />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card-surface p-5 xl:col-span-2">
          <h2 className="mb-4 font-semibold">Nhân sự theo phòng ban</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <Tooltip cursor={{ fill: "var(--secondary)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Chính thức" stackId="a" fill="#2563EB" radius={[0, 0, 0, 0]} maxBarSize={60} />
                <Bar dataKey="Thử việc" stackId="a" fill="#F59E0B" radius={[6, 6, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card-surface p-5">
          <h2 className="mb-4 font-semibold">Tỷ lệ giới tính</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e: { name: string; value: number }) => `${e.name}: ${e.value}`}>
                  {genderData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="card-surface mt-6 overflow-hidden">
        <Table>
          <TableHeader><TableRow>{["Phòng ban", "Tổng", "Chính thức", "Thử việc", "Nam", "Nữ"].map((h) => <TableHead key={h} className={thCls}>{h}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {byDept.map((d) => (
              <TableRow key={d.maPB}>
                <TableCell className="font-medium">{d.tenPB}</TableCell>
                <TableCell className="font-semibold">{d.total}</TableCell>
                <TableCell>{d.chinhThuc}</TableCell>
                <TableCell>{d.thuViec}</TableCell>
                <TableCell>{d.nam}</TableCell>
                <TableCell>{d.nu}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-secondary font-semibold">
              <TableCell>Tổng cộng</TableCell>
              <TableCell>{active.length}</TableCell>
              <TableCell>{active.filter((n) => n.trangThai === "Chính thức").length}</TableCell>
              <TableCell>{active.filter((n) => n.trangThai === "Thử việc").length}</TableCell>
              <TableCell>{active.filter((n) => n.gioiTinh === "Nam").length}</TableCell>
              <TableCell>{active.filter((n) => n.gioiTinh === "Nữ").length}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </>
  );
}

/* ───────── Movement Report ───────── */

function MovementReport() {
  const { state } = useStore();
  const [month, setMonth] = useState(TODAY.slice(0, 7));
  const rows = PHONG_BAN.map((p) => ({ ...p, ...personnelMovement(state, month, p.maPB) }));
  const totals = rows.reduce((t, r) => ({ start: t.start + r.start, joined: t.joined + r.joined, left: t.left + r.left, end: t.end + r.end }), { start: 0, joined: 0, left: 0, end: 0 });

  const print = () => doPrint(`BÁO CÁO BIẾN ĐỘNG NHÂN SỰ · ${fmtMonth(month)}`, () => `
    <table><thead><tr><th>Phòng ban</th><th>Đầu kỳ</th><th>Thử việc mới</th><th>Nghỉ việc</th><th>Cuối kỳ</th></tr></thead><tbody>
    ${rows.map(r=>`<tr><td>${r.tenPB}</td><td>${r.start}</td><td>${r.joined}</td><td>${r.left}</td><td>${r.end}</td></tr>`).join("")}
    <tr style="font-weight:bold"><td>Tổng</td><td>${totals.start}</td><td>${totals.joined}</td><td>${totals.left}</td><td>${totals.end}</td></tr>
    </tbody></table>`);

  return (
    <>
      <div className="mb-4 flex items-end gap-3">
        <Choice label="Kỳ" value={month} onChange={setMonth} options={[["2026-10", "10/2026"], ["2026-11", "11/2026"]]} />
        <div className="ml-auto"><Button variant="outline" onClick={print}><Printer className="h-4 w-4" />In báo cáo</Button></div>
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        <StatCard label="Đầu kỳ" value={totals.start} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Thử việc mới" value={totals.joined} icon={<TrendingUp className="h-5 w-5" />} tone="success" />
        <StatCard label="Nghỉ việc" value={totals.left} icon={<TrendingUp className="h-5 w-5" />} tone="danger" />
        <StatCard label="Cuối kỳ" value={totals.end} icon={<Users className="h-5 w-5" />} tone="accent" />
      </div>
      <div className="card-surface overflow-hidden">
        <Table>
          <TableHeader><TableRow>{["Phòng ban", "Đầu kỳ", "Thử việc mới", "Nghỉ việc", "Cuối kỳ"].map((h) => <TableHead key={h} className={thCls}>{h}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.maPB}>
                <TableCell className="font-medium">{r.tenPB}</TableCell>
                <TableCell>{r.start}</TableCell>
                <TableCell className="text-success">{r.joined > 0 ? `+${r.joined}` : "—"}</TableCell>
                <TableCell className="text-destructive">{r.left > 0 ? `−${r.left}` : "—"}</TableCell>
                <TableCell className="font-semibold">{r.end}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-secondary font-semibold">
              <TableCell>Tổng cộng</TableCell>
              <TableCell>{totals.start}</TableCell>
              <TableCell className="text-success">{totals.joined}</TableCell>
              <TableCell className="text-destructive">{totals.left}</TableCell>
              <TableCell>{totals.end}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </>
  );
}

/* ───────── Payroll Report ───────── */

function PayrollReport() {
  const { state } = useStore();
  const { config } = useConfig();
  const { data } = useCompensation();
  const [month, setMonth] = useState("2026-10");
  const period = data.payroll[month];
  const rows = PHONG_BAN.map((p) => {
    const deptRows = period?.rows.filter((r) => state.nhanVien.find((n) => n.maNV === r.maNV)?.maPB === p.maPB) ?? [];
    return {
      ...p,
      count: deptRows.length,
      gross: deptRows.reduce((t, r) => t + r.gross, 0),
      insurance: deptRows.reduce((t, r) => t + r.insurance, 0),
      tax: deptRows.reduce((t, r) => t + r.tax, 0),
      net: deptRows.reduce((t, r) => t + r.net, 0),
      ot: deptRows.reduce((t, r) => t + r.overtime, 0),
      bonus: deptRows.reduce((t, r) => t + r.bonus, 0),
    };
  });
  const totals = rows.reduce((t, r) => ({ count: t.count + r.count, gross: t.gross + r.gross, insurance: t.insurance + r.insurance, tax: t.tax + r.tax, net: t.net + r.net, ot: t.ot + r.ot, bonus: t.bonus + r.bonus }), { count: 0, gross: 0, insurance: 0, tax: 0, net: 0, ot: 0, bonus: 0 });
  const chartData = rows.filter((r) => r.count > 0).map((r) => ({ name: r.tenPB, "Quỹ lương": r.net }));

  const print = () => doPrint(`BÁO CÁO QUỸ LƯƠNG · ${fmtMonth(month)}`, () => `
    <table><thead><tr><th>Phòng ban</th><th>SL NV</th><th>Tổng thu nhập</th><th>OT</th><th>Thưởng</th><th>Bảo hiểm</th><th>Thuế</th><th>Thực lĩnh</th></tr></thead><tbody>
    ${rows.map(r=>`<tr><td>${r.tenPB}</td><td>${r.count}</td><td>${r.gross.toLocaleString("vi-VN")}</td><td>${r.ot.toLocaleString("vi-VN")}</td><td>${r.bonus.toLocaleString("vi-VN")}</td><td>${r.insurance.toLocaleString("vi-VN")}</td><td>${r.tax.toLocaleString("vi-VN")}</td><td><b>${r.net.toLocaleString("vi-VN")}</b></td></tr>`).join("")}
    <tr style="font-weight:bold"><td>Tổng</td><td>${totals.count}</td><td>${totals.gross.toLocaleString("vi-VN")}</td><td>${totals.ot.toLocaleString("vi-VN")}</td><td>${totals.bonus.toLocaleString("vi-VN")}</td><td>${totals.insurance.toLocaleString("vi-VN")}</td><td>${totals.tax.toLocaleString("vi-VN")}</td><td>${totals.net.toLocaleString("vi-VN")}</td></tr>
    </tbody></table>`);

  return (
    <>
      <div className="mb-4 flex items-end gap-3">
        <Choice label="Kỳ" value={month} onChange={setMonth} options={[["2026-10", "10/2026"], ["2026-11", "11/2026"]]} />
        <div className="ml-auto"><Button variant="outline" onClick={print}><Printer className="h-4 w-4" />In báo cáo</Button></div>
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tổng quỹ lương" value={fmtMoney(totals.gross)} icon={<Wallet className="h-5 w-5" />} />
        <StatCard label="Tổng OT" value={fmtMoney(totals.ot)} icon={<Wallet className="h-5 w-5" />} tone="accent" />
        <StatCard label="Tổng bảo hiểm" value={fmtMoney(totals.insurance)} icon={<Wallet className="h-5 w-5" />} tone="warning" />
        <StatCard label="Tổng thực lĩnh" value={fmtMoney(totals.net)} icon={<Wallet className="h-5 w-5" />} tone="success" />
      </div>
      <div className="card-surface mb-6 p-5">
        <h2 className="mb-4 font-semibold">Thực lĩnh theo phòng ban</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v) => (v >= 1e6 ? `${(v / 1e6).toFixed(0)}tr` : String(v))} />
              <Tooltip formatter={(v: number) => fmtMoney(v)} />
              <Bar dataKey="Quỹ lương" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={72} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card-surface overflow-hidden">
        <Table>
          <TableHeader><TableRow>{["Phòng ban", "SL NV", "Tổng thu nhập", "OT", "Thưởng", "Bảo hiểm", "Thuế", "Thực lĩnh"].map((h) => <TableHead key={h} className={thCls}>{h}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.maPB}>
                <TableCell className="font-medium">{r.tenPB}</TableCell>
                <TableCell>{r.count}</TableCell>
                <TableCell className="text-xs">{fmtMoney(r.gross)}</TableCell>
                <TableCell className="text-xs">{fmtMoney(r.ot)}</TableCell>
                <TableCell className="text-xs">{fmtMoney(r.bonus)}</TableCell>
                <TableCell className="text-xs">{fmtMoney(r.insurance)}</TableCell>
                <TableCell className="text-xs">{fmtMoney(r.tax)}</TableCell>
                <TableCell className="text-xs font-semibold text-primary">{fmtMoney(r.net)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-secondary font-semibold">
              <TableCell>Tổng cộng</TableCell>
              <TableCell>{totals.count}</TableCell>
              <TableCell className="text-xs">{fmtMoney(totals.gross)}</TableCell>
              <TableCell className="text-xs">{fmtMoney(totals.ot)}</TableCell>
              <TableCell className="text-xs">{fmtMoney(totals.bonus)}</TableCell>
              <TableCell className="text-xs">{fmtMoney(totals.insurance)}</TableCell>
              <TableCell className="text-xs">{fmtMoney(totals.tax)}</TableCell>
              <TableCell className="text-xs text-primary">{fmtMoney(totals.net)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </>
  );
}

/* ───────── KPI Report ───────── */

function KpiReport() {
  const { state } = useStore();
  const { config } = useConfig();
  const { data } = useCompensation();
  const [month, setMonth] = useState("2026-10");
  const evals = data.evaluations.filter((e) => e.month === month && e.status === "Hoàn tất");
  const byDept = PHONG_BAN.filter((p) => p.maPB !== "BGD").map((p) => {
    const deptEvals = evals.filter((e) => state.nhanVien.find((n) => n.maNV === e.maNV)?.maPB === p.maPB);
    const results = deptEvals.map((e) => kpiResult(e, config));
    return {
      ...p, count: deptEvals.length,
      avgScore: results.length ? results.reduce((t, r) => t + r.score, 0) / results.length : 0,
      A: results.filter((r) => r.grade === "A").length,
      B: results.filter((r) => r.grade === "B").length,
      C: results.filter((r) => r.grade === "C").length,
      D: results.filter((r) => r.grade === "D").length,
    };
  });
  const totalAvg = evals.length ? evals.reduce((t, e) => t + kpiResult(e, config).score, 0) / evals.length : 0;
  const gradeData = [
    { name: "A", value: byDept.reduce((t, d) => t + d.A, 0) },
    { name: "B", value: byDept.reduce((t, d) => t + d.B, 0) },
    { name: "C", value: byDept.reduce((t, d) => t + d.C, 0) },
    { name: "D", value: byDept.reduce((t, d) => t + d.D, 0) },
  ].filter((d) => d.value > 0);

  const print = () => doPrint(`BÁO CÁO KẾT QUẢ KPI · ${fmtMonth(month)}`, () => `
    <table><thead><tr><th>Phòng ban</th><th>SL</th><th>Điểm TB</th><th>A</th><th>B</th><th>C</th><th>D</th></tr></thead><tbody>
    ${byDept.map(d=>`<tr><td>${d.tenPB}</td><td>${d.count}</td><td>${d.avgScore.toFixed(1)}</td><td>${d.A}</td><td>${d.B}</td><td>${d.C}</td><td>${d.D}</td></tr>`).join("")}
    <tr style="font-weight:bold"><td>Tổng</td><td>${evals.length}</td><td>${totalAvg.toFixed(1)}</td><td>${gradeData[0]?.value??0}</td><td>${gradeData[1]?.value??0}</td><td>${gradeData[2]?.value??0}</td><td>${gradeData[3]?.value??0}</td></tr>
    </tbody></table>`);

  return (
    <>
      <div className="mb-4 flex items-end gap-3">
        <Choice label="Kỳ" value={month} onChange={setMonth} options={data.opened.map((m) => [m, fmtMonth(m)] as [string, string])} />
        <div className="ml-auto"><Button variant="outline" onClick={print}><Printer className="h-4 w-4" />In báo cáo</Button></div>
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        <StatCard label="Số NV đánh giá" value={evals.length} icon={<Target className="h-5 w-5" />} />
        <StatCard label="Điểm trung bình" value={totalAvg.toFixed(1)} icon={<BarChart3 className="h-5 w-5" />} tone="primary" />
        <StatCard label="Xếp loại A+B" value={gradeData.filter((d) => d.name === "A" || d.name === "B").reduce((t, d) => t + d.value, 0)} icon={<Target className="h-5 w-5" />} tone="success" />
        <StatCard label="Xếp loại C+D" value={gradeData.filter((d) => d.name === "C" || d.name === "D").reduce((t, d) => t + d.value, 0)} icon={<Target className="h-5 w-5" />} tone="warning" />
      </div>
      {gradeData.length > 0 && (
        <div className="card-surface mb-6 p-5">
          <h2 className="mb-4 font-semibold">Phân bố xếp loại</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={gradeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e: { name: string; value: number }) => `${e.name}: ${e.value}`}>
                  {gradeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      <div className="card-surface overflow-hidden">
        <Table>
          <TableHeader><TableRow>{["Phòng ban", "SL NV", "Điểm TB", "A", "B", "C", "D"].map((h) => <TableHead key={h} className={thCls}>{h}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {byDept.map((d) => (
              <TableRow key={d.maPB}>
                <TableCell className="font-medium">{d.tenPB}</TableCell>
                <TableCell>{d.count}</TableCell>
                <TableCell className="font-semibold">{d.count ? d.avgScore.toFixed(1) : "—"}</TableCell>
                <TableCell className="text-success">{d.A || "—"}</TableCell>
                <TableCell className="text-primary">{d.B || "—"}</TableCell>
                <TableCell className="text-warning-foreground">{d.C || "—"}</TableCell>
                <TableCell className="text-destructive">{d.D || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

/* ───────── Print Helper ───────── */

function doPrint(title: string, bodyFn: () => string) {
  const win = window.open("", "_blank", "width=1000,height=700");
  if (!win) { toast.error("Vui lòng cho phép cửa sổ pop-up"); return; }
  win.document.write(`<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;font-size:12px;margin:30px}h2{text-align:center}p{text-align:center}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #999;padding:5px 8px}th{background:#f0f0f0;text-align:left}tr:nth-child(even){background:#fafafa}tr:last-child{font-weight:bold;background:#e8e8e8}</style></head><body><p><b>CÔNG TY TNHH ATX GLOBAL</b></p><h2>${title}</h2>${bodyFn()}<p style="margin-top:20px;font-size:10px;color:#999">In ngày ${fmtDate(TODAY)} · ATXhrm</p></body></html>`);
  win.document.close();
  win.print();
}
