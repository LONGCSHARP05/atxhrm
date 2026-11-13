import { BarChart3, Clock, LayoutDashboard, Settings, Target, Users, Wallet, type LucideIcon } from "lucide-react";
import type { Role } from "@/data/types";

export type AppPath =
  | "/" | "/ho-so" | "/cham-cong" | "/lich-lam-viec" | "/don-tu" | "/kpi" | "/bang-luong"
  | "/phieu-luong" | "/bao-cao" | "/phan-quyen" | "/cau-hinh" | "/nhat-ky";
export interface NavLeaf { title: string; to: AppPath; roles: Role[]; icon?: LucideIcon }
export interface NavGroup { title: string; icon: LucideIcon; children: NavLeaf[] }
export type NavItem = NavLeaf | NavGroup;

const ALL: Role[] = ["nv", "tp", "hr", "kt", "bgd"];
const STAFF: Role[] = ["nv", "tp", "hr"];
export const NAV: NavItem[] = [
  { title: "Tổng quan", to: "/", icon: LayoutDashboard, roles: ALL },
  { title: "Hồ sơ nhân sự", to: "/ho-so", icon: Users, roles: STAFF },
  {
    title: "Chấm công & Nghỉ phép", icon: Clock,
    children: [
      { title: "Bảng chấm công", to: "/cham-cong", roles: ["nv", "tp", "hr", "kt"] },
      { title: "Lịch làm việc", to: "/lich-lam-viec", roles: STAFF },
      { title: "Đơn từ", to: "/don-tu", roles: ["nv", "tp", "hr", "kt"] },
    ],
  },
  { title: "Đánh giá KPI", to: "/kpi", icon: Target, roles: STAFF },
  {
    title: "Lương", icon: Wallet,
    children: [
      { title: "Bảng lương", to: "/bang-luong", roles: ["kt"] },
      { title: "Phiếu lương", to: "/phieu-luong", roles: ["nv", "tp", "hr", "kt"] },
    ],
  },
  { title: "Báo cáo tổng hợp", to: "/bao-cao", icon: BarChart3, roles: ["hr", "kt", "bgd"] },
  {
    title: "Quản trị hệ thống", icon: Settings,
    children: [
      { title: "Phân quyền tài khoản", to: "/phan-quyen", roles: ["hr"] },
      { title: "Cấu hình tham số", to: "/cau-hinh", roles: ["hr"] },
      { title: "Nhật ký hoạt động", to: "/nhat-ky", roles: ["hr"] },
    ],
  },
];
export const LEAVES: NavLeaf[] = NAV.flatMap((i) => ("children" in i ? i.children : [i]));
export const canSee = (path: string, role: Role) => {
  const leaf = LEAVES.find((l) => l.to === path);
  return !leaf || leaf.roles.includes(role);
};

export const seo = (title: string, description: string) => ({
  meta: [
    { title: `${title} | ATXhrm` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} | ATXhrm` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});
