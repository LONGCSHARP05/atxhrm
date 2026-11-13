import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Lock, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/ui-bits";
import { Choice, DepartmentFilter, FormField } from "@/components/app/hr-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CA, caById, type CaId, type Ca } from "@/data/types";
import { PHONG_BAN, tenPB } from "@/data/phongBan";
import { addDays, daysBetween, dow, fmtDate, isWeekend, mondayOf, TODAY, WEEKDAY } from "@/lib/date";
import { shiftFor, shiftTone, visibleEmployees } from "@/lib/hrm";
import { caHienThi, dangLam, roleOf } from "@/lib/rules";
import { seo } from "@/lib/nav";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lich-lam-viec")({
  head: () => seo("Lịch làm việc", "Lịch làm việc và quản lý ca của ATX Global."),
  component: LichLamViecPage,
});

const CA_COLORS: Record<CaId, string> = { HC: "#2563EB", SANG: "#0EA5E9", CHIEU: "#6366F1" };
const WEEK_MODES = [["six", "T2–T6"], ["seven", "T2–T7"], ["all", "Cả tuần"]] as const;
const SHIFT_OPTIONS: { id: CaId | "OFF"; label: string }[] = [
  { id: "HC", label: "Hành chính" },
  { id: "SANG", label: "Ca sáng" },
  { id: "CHIEU", label: "Ca chiều" },
  { id: "OFF", label: "Nghỉ" },
];

function LichLamViecPage() {
  const { role } = useStore();
  const isHR = role === "hr";
  return (
    <Tabs defaultValue="lich">
      <TabsList>
        <TabsTrigger value="lich">Lịch làm việc</TabsTrigger>
        {isHR && <TabsTrigger value="ca">Quản lý ca</TabsTrigger>}
      </TabsList>
      <TabsContent value="lich" className="mt-4">
        <LichTab />
      </TabsContent>
      {isHR && (
        <TabsContent value="ca" className="mt-4">
          <QuanLyCaTab />
        </TabsContent>
      )}
    </Tabs>
  );
}

/* ──────────────── TAB: LỊCH LÀM VIỆC ──────────────── */

function LichTab() {
  const { state, me, role, ganCaNgay } = useStore();
  const navigate = useNavigate();
  const [view, setView] = useState<"week" | "month">("week");
  const [anchor, setAnchor] = useState(mondayOf(TODAY));
  const [pb, setPb] = useState(role === "nv" || role === "tp" ? me?.maPB ?? "all" : "all");
  const [q, setQ] = useState("");
  const [selectedNV, setSelectedNV] = useState<string>(me?.maNV ?? "");
  const [bulk, setBulk] = useState<Record<string, boolean>>({});
  const [bulkOpen, setBulkOpen] = useState(false);

  if (!me) return null;

  const employees = visibleEmployees(state, me, role)
    .filter((n) => dangLam(n))
    .filter((n) => pb === "all" || n.maPB === pb);

  const filtered = employees.filter((n) =>
    `${n.hoTen} ${n.maNV}`.toLowerCase().includes(q.toLowerCase().trim())
  );

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(anchor, i)), [anchor]);
  const todayISO = TODAY;

  const grouped = PHONG_BAN.map((p) => ({
    ...p,
    staff: filtered.filter((n) => n.maPB === p.maPB),
  })).filter((g) => g.staff.length > 0);

  const hasApprovedLeave = (maNV: string, day: string) =>
    state.donTu.some(
      (d) => d.maNV === maNV && d.trangThai === "Đã duyệt" &&
      (d.loai === "Nghỉ phép năm" || d.loai === "Nghỉ ốm") &&
      d.tuNgay <= day && (d.denNgay ?? d.tuNgay) >= day
    );

  const isLocked = (day: string) => state.bangCongDaXacNhan.includes(day.slice(0, 7));

  const canAssign = role === "hr";

  const prevWeek = () => setAnchor(addDays(anchor, -7));
  const nextWeek = () => setAnchor(addDays(anchor, 7));
  const goToday = () => { setAnchor(mondayOf(TODAY)); setView("week"); };

  const bulkSelected = Object.keys(bulk).filter((k) => bulk[k]);
  const toggleBulk = (key: string) => setBulk((b) => ({ ...b, [key]: !b[key] }));

  const assignShift = (maNV: string, day: string, ca: CaId | "OFF") => {
    if (isLocked(day)) { toast.error("Kỳ chấm công đã xác nhận, không thể thay đổi ca"); return; }
    ganCaNgay(maNV, day, ca);
  };

  return (
    <>
      <PageHeader title="Lịch làm việc" />
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={prevWeek}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={nextWeek}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={goToday}>Hôm nay</Button>
        </div>
        <span className="text-sm font-medium">
          {view === "week"
            ? `Tuần ${fmtDate(weekDays[0])} – ${fmtDate(weekDays[6])}`
            : `Tháng ${anchor.slice(5, 7)}/${anchor.slice(0, 4)}`}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <Choice label="Chế độ xem" value={view} onChange={(v) => setView(v as "week" | "month")} options={[["week", "Tuần"], ["month", "Tháng"]]} />
          {role !== "nv" && <DepartmentFilter value={pb} onChange={setPb} disabled={role === "tp"} />}
          <div className="min-w-40">
            <FormField label="Tìm nhân viên">
              <Input placeholder="Họ tên / Mã NV" value={q} onChange={(e) => setQ(e.target.value)} />
            </FormField>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
        {CA.map((c) => (
          <span key={c.id} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded" style={{ backgroundColor: CA_COLORS[c.id] }} />
            {c.ten} ({c.batDau}–{c.ketThuc})
          </span>
        ))}
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-slate-400" />Nghỉ</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border-2 border-dashed border-blue-500" />Nghỉ phép</span>
      </div>

      {view === "week" && role !== "nv" && (
        <>
          {/* Bulk assign bar */}
          {canAssign && bulkSelected.length > 0 && (
            <div className="mb-3 flex items-center gap-3 rounded-lg border bg-secondary/50 p-3">
              <span className="text-sm font-medium">Đã chọn {bulkSelected.length} ô</span>
              <Button size="sm" onClick={() => setBulkOpen(true)}>Gán ca hàng loạt</Button>
              <Button variant="outline" size="sm" onClick={() => setBulk({})}>Bỏ chọn</Button>
            </div>
          )}
          <WeeklyGrid
            weekDays={weekDays}
            grouped={grouped}
            todayISO={todayISO}
            canAssign={canAssign}
            isLocked={isLocked}
            hasApprovedLeave={hasApprovedLeave}
            assignShift={assignShift}
            bulk={bulk}
            toggleBulk={toggleBulk}
            canBulk={canAssign}
          />
        </>
      )}

      {view === "week" && role === "nv" && (
        <EmployeeWeekCards
          maNV={me.maNV}
          weekDays={weekDays}
          hasApprovedLeave={hasApprovedLeave}
          onRequestChange={(ngay: string, caHien: string) => {
            navigate({ to: "/don-tu", search: { loai: "Đổi ca", ngay, caCu: caHien } });
          }}
        />
      )}

      {view === "month" && (
        <MonthView
          maNV={selectedNV}
          anchor={anchor}
          employees={employees}
          setSelectedNV={setSelectedNV}
          canAssign={canAssign}
          isLocked={isLocked}
          hasApprovedLeave={hasApprovedLeave}
          assignShift={assignShift}
          role={role}
        />
      )}

      {canAssign && (
        <BulkAssignDialog
          open={bulkOpen}
          onOpenChange={setBulkOpen}
          bulkKeys={bulkSelected}
          onApply={(ca, fromDay, toDay, mode) => {
            const days = daysBetween(fromDay, toDay).filter((d) =>
              mode === "all" || (mode === "seven" ? dow(d) !== 0 : !isWeekend(d))
            );
            let count = 0;
            for (const key of bulkSelected) {
              const [maNV] = key.split("|");
              for (const day of days) {
                if (!isLocked(day)) { ganCaNgay(maNV, day, ca); count++; }
              }
            }
            setBulk({});
            setBulkOpen(false);
            toast.success(`Đã gán ${count} ô ca`);
          }}
        />
      )}
    </>
  );
}

/* ─── Weekly Grid (HR / Trưởng phòng) ─── */

function WeeklyGrid({
  weekDays, grouped, todayISO, canAssign, isLocked, hasApprovedLeave, assignShift, bulk, toggleBulk, canBulk,
}: {
  weekDays: string[];
  grouped: { maPB: string; tenPB: string; staff: import("@/data/types").NhanVien[] }[];
  todayISO: string;
  canAssign: boolean;
  isLocked: (day: string) => boolean;
  hasApprovedLeave: (maNV: string, day: string) => boolean;
  assignShift: (maNV: string, day: string, ca: CaId | "OFF") => void;
  bulk: Record<string, boolean>;
  toggleBulk: (key: string) => void;
  canBulk: boolean;
}) {
  const { state } = useStore();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [overrideCount, setOverrideCount] = useState(0);
  const [pendingAssign, setPendingAssign] = useState<{ maNV: string; day: string; ca: CaId | "OFF" } | null>(null);

  const confirmAssign = () => {
    if (!pendingAssign) return;
    assignShift(pendingAssign.maNV, pendingAssign.day, pendingAssign.ca);
    setPendingAssign(null);
  };

  const cellKey = (maNV: string, day: string) => `${maNV}|${day}`;
  const getCell = (maNV: string, day: string) => {
    const cs = caHienThi(state, maNV, day);
    if (cs === "OFF") return { type: "off" as const };
    const ca = caById(cs);
    return { type: "shift" as const, ca };
  };

  const countByShift = (staff: import("@/data/types").NhanVien[], day: string) => {
    const counts: Record<string, number> = { HC: 0, SANG: 0, CHIEU: 0, OFF: 0 };
    for (const n of staff) {
      const cs = caHienThi(state, n.maNV, day);
      counts[cs === "OFF" ? "OFF" : cs]++;
    }
    return counts;
  };

  return (
    <div className="card-surface overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-table-head">
            <th className="sticky left-0 z-10 bg-table-head px-3 py-2 text-left font-semibold min-w-40">
              {canBulk && "☐ "}Nhân viên
            </th>
            {weekDays.map((d) => (
              <th key={d} className={cn("px-2 py-2 text-center font-semibold min-w-28", d === todayISO && "bg-primary/15")}>
                <div>{WEEKDAY[dow(d)]}</div>
                <div className="text-xs font-normal text-muted-foreground">{fmtDate(d)}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grouped.map((g) => {
            const isOpen = !collapsed[g.maPB];
            return (
              <GroupRows
                key={g.maPB}
                group={g}
                weekDays={weekDays}
                todayISO={todayISO}
                isOpen={isOpen}
                onToggle={() => setCollapsed((c) => ({ ...c, [g.maPB]: isOpen }))}
                canAssign={canAssign}
                isLocked={isLocked}
                hasApprovedLeave={hasApprovedLeave}
                getCell={getCell}
                cellKey={cellKey}
                bulk={bulk}
                toggleBulk={toggleBulk}
                canBulk={canBulk}
                onAssign={(maNV, day, ca) => {
                  const existing = caHienThi(state, maNV, day);
                  if (existing !== "OFF" && existing !== ca) {
                    setOverrideCount(1);
                    setPendingAssign({ maNV, day, ca });
                  } else {
                    assignShift(maNV, day, ca);
                  }
                }}
                countByShift={countByShift}
              />
            );
          })}
        </tbody>
      </table>

      <OverrideDialog
        open={!!pendingAssign}
        count={overrideCount}
        onConfirm={confirmAssign}
        onCancel={() => setPendingAssign(null)}
      />
    </div>
  );
}

function GroupRows({
  group, weekDays, todayISO, isOpen, onToggle, canAssign, isLocked, hasApprovedLeave, getCell, cellKey, bulk, toggleBulk, canBulk, onAssign, countByShift,
}: any) {
  const { state } = useStore();
  return (
    <>
      <tr className="border-b bg-secondary/40">
        <td colSpan={8} className="px-3 py-2">
          <button onClick={onToggle} className="flex items-center gap-2 font-semibold">
            <ChevronRight className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")} />
            {group.tenPB} ({group.staff.length} người)
          </button>
        </td>
      </tr>
      {isOpen && group.staff.map((nv: import("@/data/types").NhanVien) => (
        <tr key={nv.maNV} className="border-b hover:bg-muted/30">
          <td className="sticky left-0 z-10 bg-card px-3 py-2 whitespace-nowrap">
            <div className="flex items-center gap-2">
              {canBulk && (
                <Checkbox
                  checked={!!bulk[cellKey(nv.maNV, weekDays[0])]}
                  onCheckedChange={() => toggleBulk(cellKey(nv.maNV, weekDays[0]))}
                />
              )}
              <span className="font-medium">{nv.hoTen}</span>
              <span className="text-xs text-muted-foreground">{nv.maNV}</span>
            </div>
          </td>
          {weekDays.map((day: string) => {
            const key = cellKey(nv.maNV, day);
            const cell = getCell(nv.maNV, day);
            const locked = isLocked(day);
            const leave = hasApprovedLeave(nv.maNV, day);
            const checked = !!bulk[key];
            return (
              <td key={day} className={cn("px-1 py-1 text-center", day === todayISO && "bg-primary/8")}>
                {canAssign ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={cn(
                        "flex w-full flex-col items-center gap-0.5 rounded-md border px-1 py-1.5 text-xs transition-colors",
                        locked ? "cursor-not-allowed opacity-60" : "hover:border-primary cursor-pointer",
                        checked && "ring-2 ring-primary"
                      )}>
                        {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                        {leave && !locked ? (
                          <span className="rounded border-2 border-dashed border-blue-500 px-1 py-0.5 text-xs text-blue-600">Nghỉ phép</span>
                        ) : cell.type === "off" ? (
                          <span className="text-slate-400">Nghỉ</span>
                        ) : (
                          <span
                            className="rounded px-1.5 py-0.5 text-xs font-medium text-white"
                            style={{ backgroundColor: CA_COLORS[cell.ca.id as CaId] }}
                          >
                            {cell.ca.ten}
                            <span className="block text-[10px] opacity-80">{cell.ca.batDau}</span>
                          </span>
                        )}
                      </button>
                    </PopoverTrigger>
                    {!locked && (
                      <PopoverContent className="w-48 p-2" align="center">
                        <div className="space-y-1">
                          {leave && (
                            <p className="rounded bg-warning/10 p-1.5 text-xs text-warning-foreground">
                              <AlertTriangle className="mr-1 inline h-3 w-3" />Ngày có đơn nghỉ phép đã duyệt
                            </p>
                          )}
                          {SHIFT_OPTIONS.map((opt) => (
                            <Button
                              key={opt.id}
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => {
                                onAssign(nv.maNV, day, opt.id);
                              }}
                            >
                              {opt.label}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    )}
                  </Popover>
                ) : (
                  <div className="flex flex-col items-center py-1.5">
                    {leave ? (
                      <span className="rounded border-2 border-dashed border-blue-500 px-1 py-0.5 text-xs text-blue-600">Nghỉ phép</span>
                    ) : cell.type === "off" ? (
                      <span className="text-slate-400">Nghỉ</span>
                    ) : (
                      <span
                        className="rounded px-1.5 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: CA_COLORS[cell.ca.id as CaId] }}
                      >
                        {cell.ca.ten}
                      </span>
                    )}
                  </div>
                )}
              </td>
            );
          })}
        </tr>
      ))}
      {isOpen && (
        <tr className="border-b bg-secondary/20 text-xs text-muted-foreground">
          <td className="sticky left-0 z-10 bg-secondary/20 px-3 py-1.5 font-medium">Số người / ca</td>
          {weekDays.map((day: string) => {
            const c = countByShift(group.staff, day);
            return (
              <td key={day} className="px-1 py-1.5 text-center">
                <span className="text-blue-600">HC:{c.HC}</span>{" "}
                <span className="text-sky-600">S:{c.SANG}</span>{" "}
                <span className="text-indigo-600">C:{c.CHIEU}</span>{" "}
                {c.OFF > 0 && <span className="text-slate-400">N:{c.OFF}</span>}
              </td>
            );
          })}
        </tr>
      )}
    </>
  );
}

function OverrideDialog({ open, count, onConfirm, onCancel }: { open: boolean; count: number; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Xác nhận ghi đè ca</DialogTitle></DialogHeader>
        <p className="text-sm">{count} ô đã có ca khác. Gán ca mới sẽ ghi đè ca hiện tại. Bạn có chắc?</p>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Hủy</Button>
          <Button onClick={onConfirm}>Ghi đè</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Employee Week Cards (Nhân viên) ─── */

function EmployeeWeekCards({
  maNV, weekDays, hasApprovedLeave, onRequestChange,
}: {
  maNV: string;
  weekDays: string[];
  hasApprovedLeave: (maNV: string, day: string) => boolean;
  onRequestChange: (ngay: string, caHien: string) => void;
}) {
  const { state } = useStore();
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {weekDays.map((day) => {
        const cs = caHienThi(state, maNV, day);
        const ca = cs === "OFF" ? null : caById(cs);
        const leave = hasApprovedLeave(maNV, day);
        const isToday = day === TODAY;
        return (
          <div key={day} className={cn("card-surface p-4", isToday && "ring-2 ring-primary")}>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="font-semibold">{fmtDate(day)}</p>
                <p className="text-xs text-muted-foreground">{WEEKDAY[dow(day)]}{isToday && " · Hôm nay"}</p>
              </div>
            </div>
            {leave ? (
              <span className="inline-block rounded border-2 border-dashed border-blue-500 px-2 py-1 text-xs text-blue-600">Nghỉ phép</span>
            ) : ca ? (
              <div className="flex items-center justify-between">
                <div>
                  <span
                    className="inline-block rounded px-2 py-1 text-xs font-medium text-white"
                    style={{ backgroundColor: CA_COLORS[ca.id as CaId] }}
                  >
                    {ca.ten}
                  </span>
                  <p className="mt-1 text-xs text-muted-foreground">{ca.batDau} – {ca.ketThuc}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRequestChange(day, ca.ten)}
                >
                  Yêu cầu đổi ca
                </Button>
              </div>
            ) : (
              <span className="text-sm text-slate-400">Nghỉ</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Month View ─── */

function MonthView({
  maNV, anchor, employees, setSelectedNV, canAssign, isLocked, hasApprovedLeave, assignShift, role,
}: any) {
  const { state } = useStore();
  const monthStart = `${anchor.slice(0, 7)}-01`;
  const year = Number(anchor.slice(0, 4));
  const month = Number(anchor.slice(5, 7));
  const dim = new Date(year, month, 0).getDate();
  const days = Array.from({ length: dim }, (_, i) => `${anchor.slice(0, 7)}-${String(i + 1).padStart(2, "0")}`);

  const firstDow = dow(monthStart);
  const cells: (string | null)[] = [...Array(firstDow).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);

  const nv = state.nhanVien.find((n) => n.maNV === maNV);

  return (
    <div className="space-y-4">
      {role !== "nv" && (
        <Choice
          label="Chọn nhân viên"
          value={maNV}
          onChange={setSelectedNV}
          options={employees.map((n: import("@/data/types").NhanVien) => [n.maNV, `${n.hoTen} (${n.maNV})`] as [string, string])}
        />
      )}
      <div className="card-surface overflow-x-auto p-4">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
                <th key={d} className="px-2 py-2 text-center font-semibold text-muted-foreground">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: cells.length / 7 }, (_, weekIdx) => (
              <tr key={weekIdx}>
                {cells.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, dayIdx) => (
                  <td key={dayIdx} className={cn("border p-1 align-top min-w-24", !day && "bg-muted/30", day === TODAY && "bg-primary/8")}>
                    {day && nv && <DayCell maNV={maNV} day={day} canAssign={canAssign} isLocked={isLocked} hasApprovedLeave={hasApprovedLeave} assignShift={assignShift} />}
                    {day && !nv && <p className="text-xs text-muted-foreground">{Number(day.slice(8))}</p>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DayCell({ maNV, day, canAssign, isLocked, hasApprovedLeave, assignShift }: any) {
  const { state } = useStore();
  const cs = caHienThi(state, maNV, day);
  const ca = cs === "OFF" ? null : caById(cs);
  const leave = hasApprovedLeave(maNV, day);
  const locked = isLocked(day);

  if (canAssign && !locked) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex w-full flex-col items-center gap-1 rounded p-1 text-xs hover:bg-accent/20">
            <span className="text-muted-foreground">{Number(day.slice(8))}</span>
            {leave ? (
              <span className="rounded border border-dashed border-blue-500 px-1 text-[10px] text-blue-600">NP</span>
            ) : ca ? (
              <span className="rounded px-1 text-[10px] font-medium text-white" style={{ backgroundColor: CA_COLORS[ca.id as CaId] }}>
                {ca.ten}
              </span>
            ) : (
              <span className="text-slate-400">Nghỉ</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-2" align="center">
          {SHIFT_OPTIONS.map((opt) => (
            <Button key={opt.id} variant="ghost" size="sm" className="w-full justify-start" onClick={() => assignShift(maNV, day, opt.id)}>
              {opt.label}
            </Button>
          ))}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 p-1 text-xs">
      <span className="text-muted-foreground">{Number(day.slice(8))}</span>
      {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
      {leave ? (
        <span className="rounded border border-dashed border-blue-500 px-1 text-[10px] text-blue-600">NP</span>
      ) : ca ? (
        <span className="rounded px-1 text-[10px] font-medium text-white" style={{ backgroundColor: CA_COLORS[ca.id as CaId] }}>
          {ca.ten}
        </span>
      ) : (
        <span className="text-slate-400">Nghỉ</span>
      )}
    </div>
  );
}

/* ─── Bulk Assign Dialog ─── */

function BulkAssignDialog({
  open, onOpenChange, bulkKeys, onApply,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  bulkKeys: string[];
  onApply: (ca: CaId | "OFF", from: string, to: string, mode: string) => void;
}) {
  const [ca, setCa] = useState<CaId | "OFF">("HC");
  const [from, setFrom] = useState(TODAY);
  const [to, setTo] = useState(addDays(TODAY, 6));
  const [mode, setMode] = useState("six");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Gán ca hàng loạt ({bulkKeys.length} nhân viên)</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <FormField label="Ca">
            <Choice value={ca} onChange={(v) => setCa(v as CaId | "OFF")} options={SHIFT_OPTIONS.map((s) => [s.id, s.label] as [string, string])} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Từ ngày"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></FormField>
            <FormField label="Đến ngày"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></FormField>
          </div>
          <FormField label="Ngày áp dụng">
            <Choice value={mode} onChange={setMode} options={WEEK_MODES as unknown as [string, string][]} />
          </FormField>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={() => onApply(ca, from, to, mode)}>Gán ca</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────── TAB: QUẢN LÝ CA ──────────────── */

function QuanLyCaTab() {
  const { state } = useStore();
  const [edit, setEdit] = useState<Ca | null>(null);
  const [open, setOpen] = useState(false);

  const caList = state.ca;
  const countInUse = (caId: CaId) =>
    Object.values(state.caMacDinh).filter((c) => c === caId).length +
    Object.values(state.caNgoaiLe).filter((c) => c === caId).length;

  return (
    <>
      <PageHeader title="Quản lý ca" actions={<Button onClick={() => { setEdit(null); setOpen(true); }}>+ Thêm ca</Button>} />
      <div className="card-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên ca</TableHead>
              <TableHead>Giờ bắt đầu</TableHead>
              <TableHead>Giờ kết thúc</TableHead>
              <TableHead>Phụ cấp ca</TableHead>
              <TableHead>Màu</TableHead>
              <TableHead>Số người đang dùng</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {caList.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.ten}</TableCell>
                <TableCell>{c.batDau}</TableCell>
                <TableCell>{c.ketThuc}</TableCell>
                <TableCell>{(c.phuCap ?? 0).toLocaleString("vi-VN")} đ</TableCell>
                <TableCell>
                  <span className="inline-block h-4 w-4 rounded" style={{ backgroundColor: c.id === "HC" ? "#2563EB" : c.id === "SANG" ? "#0EA5E9" : "#6366F1" }} />
                </TableCell>
                <TableCell>{countInUse(c.id)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => { setEdit(c); setOpen(true); }}>Sửa</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CaDialog
        open={open}
        onOpenChange={setOpen}
        existing={edit}
        caList={caList}
        inUseCount={(id) => countInUse(id)}
      />
    </>
  );
}

function CaDialog({
  open, onOpenChange, existing, caList, inUseCount,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  existing: Ca | null;
  caList: Ca[];
  inUseCount: (id: CaId) => number;
}) {
  const { state, updateData } = useStore();
  const [ten, setTen] = useState(existing?.ten ?? "");
  const [batDau, setBatDau] = useState(existing?.batDau ?? "08:00");
  const [ketThuc, setKetThuc] = useState(existing?.ketThuc ?? "17:00");
  const [phuCap, setPhuCap] = useState(String(existing?.phuCap ?? 0));
  const [error, setError] = useState("");

  // Reset form when dialog opens
  useMemo(() => {
    if (open) {
      setTen(existing?.ten ?? "");
      setBatDau(existing?.batDau ?? "08:00");
      setKetThuc(existing?.ketThuc ?? "17:00");
      setPhuCap(String(existing?.phuCap ?? 0));
      setError("");
    }
  }, [open, existing]);

  const save = () => {
    if (!ten.trim()) { setError("Tên ca không được để trống"); return; }
    if (caList.some((c) => c.ten === ten.trim() && c.id !== existing?.id)) { setError("Tên ca đã tồn tại"); return; }
    if (ketThuc <= batDau) { setError("Giờ kết thúc phải sau giờ bắt đầu"); return; }
    updateData(`Cập nhật ca ${ten}`, existing?.id ?? "ca", (d) => {
      const ca = d.ca.find((c) => c.id === existing?.id);
      if (ca) {
        ca.ten = ten.trim(); ca.batDau = batDau; ca.ketThuc = ketThuc; ca.phuCap = Number(phuCap) || 0;
      }
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{existing ? "Sửa ca" : "Thêm ca mới"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <FormField label="Tên ca" error={error}>
            <Input value={ten} onChange={(e) => setTen(e.target.value)} placeholder="vd: Ca đêm" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Giờ bắt đầu"><Input type="time" value={batDau} onChange={(e) => setBatDau(e.target.value)} /></FormField>
            <FormField label="Giờ kết thúc"><Input type="time" value={ketThuc} onChange={(e) => setKetThuc(e.target.value)} /></FormField>
          </div>
          <FormField label="Phụ cấp ca (đ)"><Input type="number" value={phuCap} onChange={(e) => setPhuCap(e.target.value)} /></FormField>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={save}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
