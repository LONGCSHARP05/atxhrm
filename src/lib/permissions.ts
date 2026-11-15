import type { AppState, NhanVien, Role } from "@/data/types";

export type Scope = "self" | "dept" | "all" | "none";
export type Resource = "dashboard" | "hoSo" | "chamCong" | "lichLamViec" | "donTu" | "kpi" | "bangLuong" | "phieuLuong" | "baoCao" | "cauHinh" | "phanQuyen" | "nhatKy";
export type ReportId = "nhanSu" | "bienDong" | "chamCong" | "kpi" | "quyLuong";
export type ConfigGroup = "cong" | "phep" | "ot" | "kpi" | "baoHiem" | "giamTru" | "thue";
export type Action =
  | "hoSo.edit" | "hoSo.viewSensitive" | "chamCong.confirm" | "chamCong.edit" | "chamCong.clock"
  | "lich.assign" | "lich.requestSwap" | "don.create" | "don.approveAll" | "don.viewAll"
  | "kpi.criteria" | "kpi.openPeriod" | "kpi.remind" | "kpi.scoreDept" | "kpi.scoreManagers" | "kpi.selfScore"
  | "luong.calculate" | "luong.close" | "search" | "dashboard.activity"
  | `config.${ConfigGroup}`;

// Matrix rows: [nv, tp, hr, kt, admin]
const ROLES: Role[] = ["nv", "tp", "hr", "kt", "admin"];
const row = (...s: Scope[]) => Object.fromEntries(ROLES.map((r, i) => [r, s[i]])) as Record<Role, Scope>;
const SCOPES: Record<Resource, Record<Role, Scope>> = {
  dashboard: row("self", "dept", "all", "all", "all"),
  hoSo: row("self", "dept", "all", "none", "all"),
  chamCong: row("self", "dept", "all", "all", "all"),
  lichLamViec: row("self", "dept", "all", "none", "all"),
  donTu: row("self", "dept", "all", "self", "all"),
  kpi: row("self", "dept", "all", "none", "all"),
  bangLuong: row("none", "none", "none", "all", "all"),
  phieuLuong: row("self", "self", "self", "all", "all"),
  baoCao: row("none", "dept", "all", "all", "all"),
  cauHinh: row("none", "none", "all", "all", "all"),
  phanQuyen: row("none", "none", "none", "none", "all"),
  nhatKy: row("none", "none", "none", "none", "all"),
};
export const scopeOf = (role: Role, resource: Resource): Scope => SCOPES[resource][role] ?? "none";

const ACTIONS: Record<Action, Role[]> = {
  "hoSo.edit": ["hr", "admin"], "hoSo.viewSensitive": ["hr", "admin"],
  "chamCong.confirm": ["hr", "admin"], "chamCong.edit": ["hr", "admin"], "chamCong.clock": ["nv", "tp", "hr", "admin"],
  "lich.assign": ["hr", "admin"], "lich.requestSwap": ["nv"],
  "don.create": ["nv", "tp", "hr", "kt"], "don.approveAll": ["admin"], "don.viewAll": ["hr", "admin"],
  "kpi.criteria": ["hr", "admin"], "kpi.openPeriod": ["hr", "admin"], "kpi.remind": ["hr", "admin"],
  "kpi.scoreDept": ["tp", "admin"], "kpi.scoreManagers": ["admin"], "kpi.selfScore": ["nv", "tp"],
  "luong.calculate": ["kt"], "luong.close": ["kt"], "search": ["tp", "hr", "admin"], "dashboard.activity": ["admin"],
  "config.cong": ["hr", "admin"], "config.phep": ["hr", "admin"], "config.ot": ["hr", "admin"], "config.kpi": ["hr", "admin"],
  "config.baoHiem": ["kt", "admin"], "config.giamTru": ["kt", "admin"], "config.thue": ["kt", "admin"],
};
export const can = (role: Role, action: Action) => ACTIONS[action]?.includes(role) ?? false;

const REPORTS: Record<ReportId, Role[]> = {
  nhanSu: ["tp", "hr", "admin"], bienDong: ["tp", "hr", "admin"], chamCong: ["tp", "hr", "admin"], kpi: ["tp", "hr", "admin"], quyLuong: ["kt", "admin"],
};
export const REPORT_IDS = Object.keys(REPORTS) as ReportId[];
export const canViewReport = (role: Role, id: ReportId) => REPORTS[id].includes(role);
/** Departments a role may see in reports: "dept" scope locks to own department. */
export const reportScope = (role: Role): Scope => scopeOf(role, "baoCao");

export function visibleEmployees(s: AppState, me: NhanVien, role: Role, resource: Resource): NhanVien[] {
  const scope = scopeOf(role, resource);
  return s.nhanVien.filter((n) => scope === "all" || (scope === "dept" && n.maPB === me.maPB) || (scope === "self" && n.maNV === me.maNV));
}
export const canSeeEmployee = (s: AppState, me: NhanVien, role: Role, resource: Resource, maNV: string) =>
  visibleEmployees(s, me, role, resource).some((n) => n.maNV === maNV);

export const ROUTE_RESOURCE: Record<string, Resource> = {
  "/": "dashboard", "/ho-so": "hoSo", "/cham-cong": "chamCong", "/lich-lam-viec": "lichLamViec", "/don-tu": "donTu",
  "/kpi": "kpi", "/bang-luong": "bangLuong", "/phieu-luong": "phieuLuong", "/bao-cao": "baoCao", "/cau-hinh": "cauHinh",
  "/phan-quyen": "phanQuyen", "/nhat-ky": "nhatKy",
};
export const canAccessRoute = (path: string, role: Role) => {
  const r = ROUTE_RESOURCE[path];
  return !r || scopeOf(role, r) !== "none";
};
