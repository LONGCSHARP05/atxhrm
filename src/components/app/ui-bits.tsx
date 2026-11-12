import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function PageHeader({ title, desc, actions }: { title: string; desc?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, icon, children, className, actions }: { title?: string; icon?: ReactNode; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("card-surface p-5", className)}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">{icon}{title}</h2>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const MAP: Record<string, "success" | "warning" | "danger" | "info" | "muted"> = {
  "Đã duyệt": "success", "Chính thức": "success", "Đúng giờ": "success", "Đã xác nhận": "success",
  "Chờ duyệt": "warning", "Thử việc": "info", "Trễ": "warning", "Về sớm": "warning", "Nghỉ phép": "info", "Nghỉ ốm": "muted",
  "Từ chối": "danger", "Đã nghỉ việc": "muted", "Chưa xác nhận": "warning",
};
export function StatusBadge({ value }: { value: string }) {
  return <Badge variant={MAP[value] ?? "muted"}>{value}</Badge>;
}

export function Initials({ name, className }: { name: string; className?: string }) {
  const p = name.trim().split(" ");
  const ini = (p.length > 1 ? p[p.length - 2][0] : "") + p[p.length - 1][0];
  return (
    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-primary-foreground", className)}>
      {ini.toUpperCase()}
    </div>
  );
}

export function StatCard({ label, value, icon, tone = "primary", hint }: { label: string; value: ReactNode; icon: ReactNode; tone?: "primary" | "accent" | "warning" | "danger" | "success"; hint?: string }) {
  const tones = {
    primary: "bg-primary/10 text-primary", accent: "bg-accent/15 text-accent", warning: "bg-warning/15 text-warning-foreground",
    danger: "bg-destructive/10 text-destructive", success: "bg-success/12 text-success",
  };
  return (
    <div className="card-surface flex items-start gap-4 p-5">
      <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg", tones[tone])}>{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

export function Placeholder({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} desc="Phân hệ này sẽ được triển khai ở bước tiếp theo." />
      <div className="card-surface flex flex-col items-center justify-center gap-2 p-16 text-center">
        <div className="rounded-full bg-secondary px-4 py-1 text-xs font-medium text-secondary-foreground">Đang phát triển</div>
        <p className="max-w-md text-sm text-muted-foreground">Màn hình {title.toLowerCase()} đã có đường dẫn và phân quyền; chức năng chi tiết sẽ được bổ sung sau.</p>
      </div>
    </>
  );
}

export const thCls = "bg-table-head text-foreground font-semibold";
