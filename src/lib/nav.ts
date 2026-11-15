import { BarChart3, Clock, LayoutDashboard, Settings, Target, Users, Wallet, type LucideIcon } from "lucide-react";
import type { Role } from "@/data/types";
import { canAccessRoute, type Resource } from "./permissions";

export type AppPath =
  | "/" | "/ho-so" | "/cham-cong" | "/lich-lam-viec" | "/don-tu" | "/kpi" | "/bang-luong"
  | "/phieu-luong" | "/bao-cao" | "/phan-quyen" | "/cau-hinh" | "/nhat-ky";
export interface NavLeaf { title: string; to: AppPath; icon?: LucideIcon }
export interface NavGroup { title: string; icon: LucideIcon; children: NavLeaf[] }
export type NavItem = NavLeaf | NavGroup;

export const NAV: NavItem[] = [
  { title: "Tổng quan", to: "/", icon: LayoutDashboard },
  { title: "Hồ sơ nhân sự", to: "/ho-so", icon: Users },
  {
    title: "Chấm công & Nghỉ phép", icon: Clock,
    children: [
      { title: "Bảng chấm công", to: "/cham-cong" },
      { title: "Lịch làm việc", to: "/lich-lam-viec" },
      { title: "Đơn từ", to: "/don-tu" },
    ],
  },
  { title: "Đánh giá KPI", to: "/kpi", icon: Target },
  {
    title: "Lương", icon: Wallet,
    children: [
      { title: "Bảng lương", to: "/bang-luong" },
      { title: "Phiếu lương", to: "/phieu-luong" },
    ],
  },
  { title: "Báo cáo tổng hợp", to: "/bao-cao", icon: BarChart3 },
  {
    title: "Quản trị hệ thống", icon: Settings,
    children: [
      { title: "Phân quyền tài khoản", to: "/phan-quyen" },
      { title: "Cấu hình tham số", to: "/cau-hinh" },
      { title: "Nhật ký hoạt động", to: "/nhat-ky" },
    ],
  },
];
export const LEAVES: NavLeaf[] = NAV.flatMap((i) => ("children" in i ? i.children : [i]));
export const canSee = (path: string, role: Role) => canAccessRoute(path, role);
export type { Resource };

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
