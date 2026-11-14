import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown, LogOut, Search, ShieldAlert } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ROLE_LABEL } from "@/data/types";
import { tenPB } from "@/data/phongBan";
import { normalize, visibleEmployees } from "@/lib/hrm";
import { timeAgo } from "@/lib/date";
import { canSee, NAV, type NavLeaf } from "@/lib/nav";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Initials } from "./ui-bits";

function Sidebar() {
  const { me, role } = useStore();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const leafCls = (active: boolean) =>
    cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors", active ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground");
  const visible = (l: NavLeaf) => role === "admin" || l.roles.includes(role);
  return (
    <aside className="hidden md:flex sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-lg font-black text-primary-foreground">A</div>
        <div>
          <div className="text-lg font-bold leading-tight text-sidebar-accent-foreground">ATX<span className="text-accent">hrm</span></div>
          <div className="text-[11px] opacity-70">ATX Global</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map((item) => {
          if (!("children" in item)) {
            if (!visible(item)) return null;
            const Icon = item.icon;
            if(!Icon) return null;
            return (
              <Link key={item.to} to={item.to} className={leafCls(path === item.to)}>
                <Icon className="h-4 w-4" />{item.title}
              </Link>
            );
          }
          const kids = item.children.filter(visible);
          if (!kids.length) return null;
          const open = !closed[item.title];
          const Icon = item.icon;
          return (
            <div key={item.title}>
              <button onClick={() => setClosed((c) => ({ ...c, [item.title]: open }))} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <Icon className="h-4 w-4" /><span className="flex-1">{item.title}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", !open && "-rotate-90")} />
              </button>
              {open && (
                <div className="ml-7 mt-1 space-y-1">
                  {kids.map((k) => <Link key={k.to} to={k.to} className={leafCls(path === k.to)}>{k.title}</Link>)}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      {me && (
        <div className="m-3 flex items-center gap-3 rounded-lg bg-sidebar-accent p-3">
          <Initials name={me.hoTen} />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-sidebar-accent-foreground">{me.hoTen}</div>
            <div className="truncate text-xs opacity-75">{ROLE_LABEL[role]} · {me.maNV}</div>
          </div>
        </div>
      )}
    </aside>
  );
}

function Notifications() {
  const { state, me, docTB, docTatCa } = useStore();
  const navigate = useNavigate();
  const list = state.thongBao.filter((t) => t.maNV === me?.maNV).sort((a, b) => b.thoiGian.localeCompare(a.thoiGian));
  const unread = list.filter((t) => !t.daDoc).length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label="Thông báo">
          <Bell className="h-4 w-4" />
          {unread > 0 && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-card" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-semibold">Thông báo {unread > 0 && <span className="text-xs text-muted-foreground">({unread} chưa đọc)</span>}</span>
          <button onClick={docTatCa} className="text-xs font-medium text-primary hover:underline">Đánh dấu đã đọc tất cả</button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {list.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Không có thông báo</p>}
          {list.map((t) => (
            <button key={t.id} onClick={() => { docTB(t.id); if(t.donId) navigate({to:"/don-tu",search:{mo:t.donId}}); else if(t.trang==="cham-cong") navigate({to:"/cham-cong"}); else if(t.trang==="phieu-luong") navigate({to:"/phieu-luong"}); else if(t.trang==="kpi") navigate({to:"/kpi"}); else if(t.trang==="ho-so") navigate({to:"/ho-so"}); }} className={cn("flex w-full gap-3 border-b px-4 py-3 text-left last:border-0 hover:bg-muted", !t.daDoc && "bg-secondary/60")}>
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", t.daDoc ? "bg-transparent" : "bg-primary")} />
              <span>
                <span className="block text-sm text-foreground">{t.noiDung}</span>
                <span className="text-xs text-muted-foreground">{timeAgo(t.thoiGian)}</span>
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Topbar() {
  const { logout, setSearch, role, state, me } = useStore();
  const [q, setQ] = useState("");
  const results = me ? visibleEmployees(state,me,role).filter(n=>normalize(`${n.maNV} ${n.hoTen} ${tenPB(n.maPB)}`).includes(normalize(q))).slice(0,8) : [];
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-card/90 px-6 py-3 backdrop-blur">
      <form
        className="relative max-w-xl flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSee("/ho-so", role)) return toast.error("Bạn không có quyền tra cứu hồ sơ nhân sự");
          setSearch(q.trim());
          navigate({ to: "/ho-so" });
        }}
      >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm nhân viên, phòng ban, mã NV…" className="h-10 bg-background pl-9" />
        {q.trim().length>=2 && <div className="absolute left-0 right-0 top-full z-40 mt-2 rounded-lg border bg-popover shadow-card">{results.length?results.map(n=><Button variant="ghost" key={n.maNV} className="h-auto w-full justify-start whitespace-normal rounded-none p-3 text-left" onClick={()=>{setSearch(n.maNV);setQ("");navigate({to:"/ho-so",search:{nv:n.maNV}});}}><Initials name={n.hoTen}/><span>{n.hoTen}<span className="block text-xs text-muted-foreground">{n.maNV} · {tenPB(n.maPB)}</span></span></Button>):<p className="p-4 text-sm text-muted-foreground">Không tìm thấy</p>}</div>}
      </form>
      <div className="ml-auto flex items-center gap-2">
        <Notifications />
        <Button variant="outline" onClick={() => { logout(); navigate({ to: "/dang-nhap" }); }}>
          <LogOut className="h-4 w-4" />Đăng xuất
        </Button>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { me, role } = useStore();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const isLogin = path === "/dang-nhap";
  useEffect(() => {
    if (!me && !isLogin) navigate({ to: "/dang-nhap" });
  }, [me, isLogin, navigate]);
  if (isLogin) return <>{children}</>;
  if (!me) return null;
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <nav className="flex gap-2 overflow-x-auto border-b bg-card p-2 md:hidden">{NAV.flatMap(i=>"children" in i?i.children:[i]).filter(i=>role === "admin" || i.roles.includes(role)).map(i=><Button key={i.to} asChild variant={path===i.to?"default":"ghost"} size="sm"><Link to={i.to}>{i.title}</Link></Button>)}</nav>
        <main className="flex-1 p-3 sm:p-6 lg:p-8">
          {canSee(path, role) ? children : (
            <div className="card-surface mx-auto mt-10 flex max-w-md flex-col items-center gap-3 p-10 text-center">
              <ShieldAlert className="h-10 w-10 text-destructive" />
              <h2 className="text-lg font-semibold">Không có quyền truy cập</h2>
              <p className="text-sm text-muted-foreground">Vai trò {ROLE_LABEL[role]} không được phép xem trang này.</p>
              <Button asChild><Link to="/">Về Tổng quan</Link></Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
