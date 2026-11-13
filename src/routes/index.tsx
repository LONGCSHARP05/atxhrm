import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, BarChart3, CalendarClock, CalendarOff, ClipboardList, FileWarning, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, Panel, StatCard, StatusBadge } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { PHONG_BAN, tenPB } from "@/data/phongBan";
import { fmtDate, monthOf, timeAgo, TODAY } from "@/lib/date";
import { seo } from "@/lib/nav";
import { dangLam, hdSapHetHan, nghiHomNay, phepConLai, tongHop } from "@/lib/rules";
import { useConfig } from "@/data/config";
import { attendanceMonth } from "@/lib/hrm";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => seo("Tổng quan", "Bảng điều khiển nhân sự ATX Global: nhân sự, đơn chờ duyệt, nghỉ phép và hợp đồng."),
  component: Dashboard,
});

function Dashboard() {
  const { role } = useStore();
  return role === "nv" ? <Personal /> : <Overview />;
}

function Overview() {
  const { state, me } = useStore();
  const active = state.nhanVien.filter(dangLam);
  const pending = state.donTu.filter((d) => d.trangThai === "Chờ duyệt").length;
  const offToday = nghiHomNay(state);
  const expiring = hdSapHetHan(state);
  const chart = PHONG_BAN.map((p) => ({ name: p.tenPB, value: active.filter((n) => n.maPB === p.maPB).length }));
  const name = (m: string) => state.nhanVien.find((n) => n.maNV === m)?.hoTen ?? m;
  return (
    <>
      <PageHeader title="Tổng quan" desc={`Xin chào ${me?.hoTen} · Hôm nay ${fmtDate(TODAY)} · Kỳ lương 11/2026 đang diễn ra`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Nhân sự đang làm" value={active.length} icon={<Users className="h-5 w-5" />} hint={`${active.filter((n) => n.trangThai === "Thử việc").length} người đang thử việc`} />
        <StatCard label="Đơn chờ duyệt" value={pending} tone="warning" icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard label="Nghỉ phép hôm nay" value={offToday.length} tone="accent" icon={<CalendarOff className="h-5 w-5" />} hint={offToday.map((d) => name(d.maNV)).join(", ") || undefined} />
        <StatCard label="Hợp đồng sắp hết hạn" value={expiring.length} tone="danger" icon={<FileWarning className="h-5 w-5" />} hint="Trong 30 ngày tới" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Cơ cấu nhân sự theo phòng ban" icon={<BarChart3 className="h-4 w-4 text-primary" />} className="xl:col-span-2">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <Tooltip cursor={{ fill: "var(--secondary)" }} formatter={(v) => [v, "Số nhân viên"]} />
                <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={72} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Hoạt động gần đây" icon={<Activity className="h-4 w-4 text-primary" />}>
          <ul className="space-y-4">
            {state.nhatKy.slice(0, 7).map((l) => (
              <li key={l.id} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                <div>
                  <p className="text-sm"><span className="font-medium">{name(l.maNV)}</span> · {l.hanhDong}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(l.thoiGian)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      {expiring.length > 0 && (
        <Panel title="Hợp đồng sắp hết hạn" icon={<FileWarning className="h-4 w-4 text-destructive" />} className="mt-6">
          <div className="grid gap-3 md:grid-cols-3">
            {expiring.map((h) => {
              const nv = state.nhanVien.find((n) => n.maNV === h.maNV)!;
              return (
                <div key={h.maHD} className="rounded-lg border p-3">
                  <p className="font-medium">{nv.hoTen} <span className="text-xs text-muted-foreground">{nv.maNV}</span></p>
                  <p className="text-xs text-muted-foreground">{nv.chucVu} · {tenPB(nv.maPB)}</p>
                  <p className="mt-1 text-sm">Hết hạn: <span className="font-semibold text-destructive">{fmtDate(h.ngayKetThuc)}</span></p>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </>
  );
}

function Personal() {
  const { state, me } = useStore();
  const { config } = useConfig();
  if (!me) return null;
  const month = monthOf(TODAY);
  const sum = attendanceMonth(state,me.maNV,month,config);
  const dons = state.donTu.filter((d) => d.maNV === me.maNV).slice(0, 5);
  return (
    <>
      <PageHeader title={`Xin chào, ${me.hoTen}`} desc={`${me.chucVu} · ${tenPB(me.maPB)} · Hôm nay ${fmtDate(TODAY)}`}
        actions={<Button asChild><Link to="/cham-cong">Chấm công</Link></Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Phép năm còn lại" value={`${config.phepNam - (state.phepDaDung[me.maNV] ?? 0)} ngày`} icon={<CalendarOff className="h-5 w-5" />} hint={`Khả dụng để đăng ký: ${phepConLai(state, me.maNV, undefined, config)} ngày`} />
        <StatCard label="Công tháng 11/2026" value={sum.cong} tone="accent" icon={<CalendarClock className="h-5 w-5" />} hint={`Đi muộn ${sum.diMuon} lần · OT ${sum.ot} giờ`} />
        <StatCard label="Đơn chờ duyệt" value={dons.filter((d) => d.trangThai === "Chờ duyệt").length} tone="warning" icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard label="Ngày vào làm" value={fmtDate(me.ngayVaoLam)} tone="success" icon={<Users className="h-5 w-5" />} hint={me.trangThai} />
      </div>
      <Panel title="Đơn gần nhất" className="mt-6" actions={<Button variant="outline" size="sm" asChild><Link to="/don-tu">Xem tất cả</Link></Button>}>
        {dons.length === 0 ? <p className="text-sm text-muted-foreground">Bạn chưa có đơn nào.</p> : (
          <ul className="divide-y">
            {dons.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{d.loai}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(d.tuNgay)}{d.denNgay && d.denNgay !== d.tuNgay ? ` → ${fmtDate(d.denNgay)}` : ""} · {d.lyDo}</p>
                </div>
                <StatusBadge value={d.trangThai} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
