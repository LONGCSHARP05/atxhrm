import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Target, CheckCircle, Clock, Star, Pencil, Eye } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatCard, StatusBadge, thCls } from "@/components/app/ui-bits";
import { Choice, FormField } from "@/components/app/hr-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PHONG_BAN, tenPB } from "@/data/phongBan";
import { useConfig } from "@/data/config";
import { useCompensation } from "@/lib/compensation-store";
import { useStore } from "@/lib/store";
import { fmtMonth, TODAY } from "@/lib/date";
import { seo } from "@/lib/nav";
import { eligibleKpi, kpiResult, scoresComplete, criteriaValid, type Criterion, type Evaluation } from "@/lib/compensation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/kpi")({
  head: () => seo("Đánh giá KPI", "Tự đánh giá và đánh giá KPI theo kỳ."),
  component: KpiPage,
});

function KpiPage() {
  const { role, me } = useStore();
  if (!me) return null;
  const isManager = role === "tp" || role === "hr" || role === "admin";
  return (
    <Tabs defaultValue={isManager ? "team" : "self"}>
      <TabsList>
        <TabsTrigger value="self">Đánh giá của tôi</TabsTrigger>
        {(isManager) && <TabsTrigger value="team">Đánh giá đội ngũ</TabsTrigger>}
        {(role === "hr" || role === "admin") && <TabsTrigger value="criteria">Tiêu chí phòng ban</TabsTrigger>}
      </TabsList>
      <TabsContent value="self" className="mt-4"><SelfEvalTab /></TabsContent>
      {isManager && <TabsContent value="team" className="mt-4"><TeamEvalTab /></TabsContent>}
      {(role === "hr" || role === "admin") && <TabsContent value="criteria" className="mt-4"><CriteriaTab /></TabsContent>}
    </Tabs>
  );
}

/* ───────── Self Evaluation ───────── */

function SelfEvalTab() {
  const { state, me } = useStore();
  const { config } = useConfig();
  const { data, change } = useCompensation();
  const [month, setMonth] = useState(TODAY.slice(0, 7));
  const [active, setActive] = useState<Evaluation | null>(null);

  if (!me) return null;

  const myEvals = data.evaluations.filter((e) => e.maNV === me.maNV);
  const current = myEvals.find((e) => e.month === month);

  const canSelfScore = (e: Evaluation) => e.status === "Chờ tự đánh giá";
  const canManagerScore = (e: Evaluation) => e.status === "Chờ quản lý đánh giá";

  const submitSelf = (e: Evaluation, scores: (number | null)[], comments: string[]) => {
    if (!scoresComplete(scores)) { toast.error("Vui lòng chấm tất cả tiêu chí từ 0–100"); return; }
    change((d) => {
      const ev = d.evaluations.find((x) => x.id === e.id);
      if (!ev) return;
      ev.self = scores;
      ev.comments = comments;
      ev.status = "Chờ quản lý đánh giá";
    });
    toast.success("Đã gửi tự đánh giá");
    setActive(null);
  };

  const submitManager = (e: Evaluation, scores: (number | null)[], comments: string[]) => {
    if (!scoresComplete(scores)) { toast.error("Vui lòng chấm tất cả tiêu chí từ 0–100"); return; }
    change((d) => {
      const ev = d.evaluations.find((x) => x.id === e.id);
      if (!ev) return;
      ev.manager = scores;
      ev.comments = comments;
      ev.status = "Hoàn tất";
    });
    toast.success("Đã lưu đánh giá quản lý");
    setActive(null);
  };

  return (
    <>
      <PageHeader title="Đánh giá KPI" desc={`Xin chào ${me.hoTen} · ${tenPB(me.maPB)}`} />
      <div className="mb-4 flex items-end gap-3">
        <Choice label="Kỳ đánh giá" value={month} onChange={setMonth} options={data.opened.map((m) => [m, fmtMonth(m)] as [string, string])} />
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Tổng số kỳ" value={myEvals.length} icon={<Target className="h-5 w-5" />} />
        <StatCard label="Đã hoàn tất" value={myEvals.filter((e) => e.status === "Hoàn tất").length} icon={<CheckCircle className="h-5 w-5" />} tone="success" />
        <StatCard label="Chờ đánh giá" value={myEvals.filter((e) => e.status !== "Hoàn tất").length} icon={<Clock className="h-5 w-5" />} tone="warning" />
      </div>
      <div className="card-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {["Kỳ", "Phòng ban", "Trạng thái", "Điểm", "Xếp loại", "Thao tác"].map((h) => <TableHead key={h} className={thCls}>{h}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {myEvals.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Bạn chưa có đánh giá KPI nào</TableCell></TableRow>}
            {myEvals.map((e) => {
              const result = e.status === "Hoàn tất" ? kpiResult(e, config) : null;
              return (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{fmtMonth(e.month)}</TableCell>
                  <TableCell>{tenPB(me.maPB)}</TableCell>
                  <TableCell><StatusBadge value={e.status} /></TableCell>
                  <TableCell>{result ? result.score.toFixed(1) : "—"}</TableCell>
                  <TableCell>{result ? <GradeBadge grade={result.grade} /> : "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setActive(e)}>
                      {canSelfScore(e) ? "Tự đánh giá" : canManagerScore(e) && (me.maNV !== e.maNV) ? "Đánh giá" : "Xem"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {active && (
        <EvalDialog
          evaluation={active}
          mode={canSelfScore(active) ? "self" : "view"}
          onClose={() => setActive(null)}
          onSubmitSelf={submitSelf}
          onSubmitManager={submitManager}
        />
      )}
    </>
  );
}

/* ───────── Team Evaluation ───────── */

function TeamEvalTab() {
  const { state, me, role } = useStore();
  const { config } = useConfig();
  const { data, change } = useCompensation();
  const [month, setMonth] = useState(TODAY.slice(0, 7));
  const [pb, setPb] = useState(role === "tp" ? me?.maPB ?? "all" : "all");
  const [q, setQ] = useState("");
  const [active, setActive] = useState<Evaluation | null>(null);

  if (!me) return null;

  const scope = useMemo(() => {
    if (role === "admin" || role === "hr") return state.nhanVien;
    return state.nhanVien.filter((n) => n.maPB === me.maPB);
  }, [state.nhanVien, role, me]);

  const scopedIds = new Set(scope.map((n) => n.maNV));
  const teamEvals = data.evaluations.filter((e) => e.month === month && scopedIds.has(e.maNV));
  const filtered = teamEvals.filter((e) => {
    const nv = state.nhanVien.find((n) => n.maNV === e.maNV);
    return (pb === "all" || nv?.maPB === pb) && `${nv?.hoTen} ${e.maNV}`.toLowerCase().includes(q.toLowerCase().trim());
  });

  const pendingManager = teamEvals.filter((e) => e.status === "Chờ quản lý đánh giá");
  const completed = teamEvals.filter((e) => e.status === "Hoàn tất");

  const submitManager = (e: Evaluation, scores: (number | null)[], comments: string[]) => {
    if (!scoresComplete(scores)) { toast.error("Vui lòng chấm tất cả tiêu chí từ 0–100"); return; }
    change((d) => {
      const ev = d.evaluations.find((x) => x.id === e.id);
      if (!ev) return;
      ev.manager = scores;
      ev.comments = comments;
      ev.status = "Hoàn tất";
    });
    toast.success("Đã lưu đánh giá");
    setActive(null);
  };

  return (
    <>
      <PageHeader title="Đánh giá đội ngũ" desc={role === "tp" ? `Phòng ${tenPB(me.maPB)}` : "Tất cả phòng ban"} />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Choice label="Kỳ" value={month} onChange={setMonth} options={data.opened.map((m) => [m, fmtMonth(m)] as [string, string])} />
        {role !== "tp" && <Choice label="Phòng ban" value={pb} onChange={setPb} options={[["all", "Tất cả"], ...PHONG_BAN.filter((p) => p.maPB !== "BGD").map((p) => [p.maPB, p.tenPB] as [string, string])]} />}
        <div className="min-w-48 flex-1"><FormField label="Tìm nhân viên"><Input placeholder="Họ tên / Mã NV" value={q} onChange={(e) => setQ(e.target.value)} /></FormField></div>
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Tổng nhân viên" value={teamEvals.length} icon={<Target className="h-5 w-5" />} />
        <StatCard label="Chờ đánh giá" value={pendingManager.length} icon={<Clock className="h-5 w-5" />} tone="warning" />
        <StatCard label="Đã hoàn tất" value={completed.length} icon={<CheckCircle className="h-5 w-5" />} tone="success" />
      </div>
      <div className="card-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {["Mã NV", "Họ tên", "Phòng ban", "Trạng thái", "Điểm", "Xếp loại", "Thao tác"].map((h) => <TableHead key={h} className={thCls}>{h}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Không có đánh giá trong kỳ này</TableCell></TableRow>}
            {filtered.map((e) => {
              const nv = state.nhanVien.find((n) => n.maNV === e.maNV);
              const result = e.status === "Hoàn tất" ? kpiResult(e, config) : null;
              return (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">{e.maNV}</TableCell>
                  <TableCell className="font-medium">{nv?.hoTen}</TableCell>
                  <TableCell>{tenPB(nv?.maPB ?? "")}</TableCell>
                  <TableCell><StatusBadge value={e.status} /></TableCell>
                  <TableCell>{result ? result.score.toFixed(1) : "—"}</TableCell>
                  <TableCell>{result ? <GradeBadge grade={result.grade} /> : "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setActive(e)}>
                      {e.status === "Chờ quản lý đánh giá" ? "Đánh giá" : "Xem"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {active && (
        <EvalDialog
          evaluation={active}
          mode={active.status === "Chờ quản lý đánh giá" ? "manager" : "view"}
          onClose={() => setActive(null)}
          onSubmitSelf={() => {}}
          onSubmitManager={submitManager}
        />
      )}
    </>
  );
}

/* ───────── Criteria Management ───────── */

function CriteriaTab() {
  const { state } = useStore();
  const { data, change } = useCompensation();
  const [pb, setPb] = useState(PHONG_BAN.find((p) => p.maPB !== "BGD")?.maPB ?? "HCNS");
  const [edit, setEdit] = useState<Criterion[] | null>(null);

  const criteria = data.criteria[pb] ?? [];

  const save = (next: Criterion[]) => {
    if (!criteriaValid(next)) { toast.error("Mỗi tiêu chí cần tên, phương pháp, trọng số > 0. Tổng trọng số phải = 100."); return; }
    change((d) => { d.criteria[pb] = next; });
    toast.success("Đã lưu tiêu chí");
    setEdit(null);
  };

  return (
    <>
      <PageHeader title="Tiêu chí đánh giá KPI" desc="Thiết lập tiêu chí cho từng phòng ban" />
      <div className="mb-4 flex items-end gap-3">
        <Choice label="Phòng ban" value={pb} onChange={setPb} options={PHONG_BAN.filter((p) => p.maPB !== "BGD").map((p) => [p.maPB, p.tenPB] as [string, string])} />
        <Button onClick={() => setEdit(structuredClone(criteria))}><Pencil className="h-4 w-4" />Sửa tiêu chí</Button>
      </div>
      <div className="card-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {["#", "Tên tiêu chí", "Phương pháp đo lường", "Trọng số (%)"].map((h) => <TableHead key={h} className={thCls}>{h}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {criteria.map((c, i) => (
              <TableRow key={c.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.method}</TableCell>
                <TableCell className="font-semibold">{c.weight}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-secondary font-semibold">
              <TableCell colSpan={3}>Tổng trọng số</TableCell>
              <TableCell>{criteria.reduce((t, c) => t + c.weight, 0)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      {edit && <CriteriaDialog criteria={edit} onClose={() => setEdit(null)} onSave={save} />}
    </>
  );
}

function CriteriaDialog({ criteria, onClose, onSave }: { criteria: Criterion[]; onClose: () => void; onSave: (c: Criterion[]) => void }) {
  const [list, setList] = useState<Criterion[]>(criteria);

  const update = (i: number, patch: Partial<Criterion>) => setList((l) => l.map((c, j) => j === i ? { ...c, ...patch } : c));
  const remove = (i: number) => setList((l) => l.filter((_, j) => j !== i));
  const add = () => setList((l) => [...l, { id: `new-${Date.now()}`, name: "", method: "", weight: 0 }]);

  const total = list.reduce((t, c) => t + (Number(c.weight) || 0), 0);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>Sửa tiêu chí đánh giá</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {list.map((c, i) => (
            <div key={c.id} className="grid grid-cols-12 gap-2">
              <div className="col-span-4"><Input value={c.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Tên tiêu chí" /></div>
              <div className="col-span-5"><Input value={c.method} onChange={(e) => update(i, { method: e.target.value })} placeholder="Phương pháp đo lường" /></div>
              <div className="col-span-2"><Input type="number" value={c.weight} onChange={(e) => update(i, { weight: Number(e.target.value) })} placeholder="Trọng số" /></div>
              <div className="col-span-1 flex items-center"><Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(i)}>✕</Button></div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={add}>+ Thêm tiêu chí</Button>
          <p className={cn("text-sm font-semibold", total === 100 ? "text-success" : "text-destructive")}>Tổng trọng số: {total} {total === 100 ? "✓" : "(phải = 100)"}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={() => onSave(list)}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────── Evaluation Dialog ───────── */

function EvalDialog({ evaluation, mode, onClose, onSubmitSelf, onSubmitManager }: {
  evaluation: Evaluation;
  mode: "self" | "manager" | "view";
  onClose: () => void;
  onSubmitSelf: (e: Evaluation, scores: (number | null)[], comments: string[]) => void;
  onSubmitManager: (e: Evaluation, scores: (number | null)[], comments: string[]) => void;
}) {
  const { state } = useStore();
  const { config } = useConfig();
  const nv = state.nhanVien.find((n) => n.maNV === evaluation.maNV);
  const [selfScores, setSelfScores] = useState<(number | null)[]>(evaluation.self);
  const [mgrScores, setMgrScores] = useState<(number | null)[]>(evaluation.manager);
  const [comments, setComments] = useState<string[]>(evaluation.comments);

  const editable = mode === "self" || mode === "manager";
  const scores = mode === "self" ? selfScores : mgrScores;
  const setScores = mode === "self" ? setSelfScores : setMgrScores;

  const result = evaluation.status === "Hoàn tất" ? kpiResult(evaluation, config) : null;

  const submit = () => {
    if (mode === "self") onSubmitSelf(evaluation, selfScores, comments);
    else if (mode === "manager") onSubmitManager(evaluation, mgrScores, comments);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đánh giá KPI · {fmtMonth(evaluation.month)}</DialogTitle>
        </DialogHeader>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-semibold">{nv?.hoTen} · {evaluation.maNV}</p>
            <p className="text-sm text-muted-foreground">{nv?.chucVu} · {tenPB(nv?.maPB ?? "")}</p>
          </div>
          <StatusBadge value={evaluation.status} />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={thCls}>Tiêu chí</TableHead>
              <TableHead className={thCls}>Trọng số</TableHead>
              <TableHead className={thCls}>Tự đánh giá</TableHead>
              <TableHead className={thCls}>QL đánh giá</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluation.criteria.map((c, i) => (
              <TableRow key={c.id}>
                <TableCell>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.method}</p>
                </TableCell>
                <TableCell>{c.weight}%</TableCell>
                <TableCell>
                  {mode === "self" ? (
                    <Input type="number" min={0} max={100} value={selfScores[i] ?? ""} onChange={(e) => setSelfScores((s) => s.map((v, j) => j === i ? (e.target.value === "" ? null : Number(e.target.value)) : v))} className="w-20" />
                  ) : selfScores[i] ?? "—"}
                </TableCell>
                <TableCell>
                  {mode === "manager" ? (
                    <Input type="number" min={0} max={100} value={mgrScores[i] ?? ""} onChange={(e) => setMgrScores((s) => s.map((v, j) => j === i ? (e.target.value === "" ? null : Number(e.target.value)) : v))} className="w-20" />
                  ) : mgrScores[i] ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {editable && (
          <FormField label="Nhận xét chung">
            <Textarea value={comments[0] ?? ""} onChange={(e) => setComments((c) => c.map((_, j) => j === 0 ? e.target.value : c[j]))} placeholder="Nhập nhận xét..." rows={2} />
          </FormField>
        )}
        {!editable && comments[0] && (
          <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Nhận xét</p><p className="mt-1 text-sm">{comments[0]}</p></div>
        )}
        {result && (
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-secondary p-4">
            <div><p className="text-xs text-muted-foreground">Tổng điểm</p><p className="text-2xl font-bold text-primary">{result.score.toFixed(1)}</p></div>
            <div><p className="text-xs text-muted-foreground">Xếp loại</p><p className="text-2xl font-bold">{result.grade}</p></div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{editable ? "Hủy" : "Đóng"}</Button>
          {editable && <Button onClick={submit}>{mode === "self" ? "Gửi tự đánh giá" : "Lưu đánh giá"}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = { A: "bg-success/15 text-success", B: "bg-primary/15 text-primary", C: "bg-warning/15 text-warning-foreground", D: "bg-destructive/15 text-destructive" };
  return <span className={cn("inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold", colors[grade])}><Star className="h-3 w-3" />{grade}</span>;
}
