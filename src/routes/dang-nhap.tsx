import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Initials } from "@/components/app/ui-bits";
import { tenPB } from "@/data/phongBan";
import { ROLE_LABEL, type Role } from "@/data/types";
import { seo } from "@/lib/nav";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/dang-nhap")({
  head: () => seo("Đăng nhập", "Chọn tài khoản demo để trải nghiệm ATXhrm theo từng vai trò."),
  component: LoginPage,
});

const ORDER: { role: Role; mo: string }[] = [
  { role: "bgd", mo: "Xem Tổng quan và Báo cáo" },
  { role: "tp", mo: "Duyệt đơn, xem nhân sự phòng mình" },
  { role: "hr", mo: "Toàn quyền hồ sơ, ca, bảng công" },
  { role: "kt", mo: "Bảng công đã xác nhận, lương" },
  { role: "nv", mo: "Chấm công, tạo đơn, hồ sơ cá nhân" },
];

function LoginPage() {
  const { state, login } = useStore();
  const navigate = useNavigate();
  const [open,setOpen]=useState(false), [username,setUsername]=useState(""), [password,setPassword]=useState("123456"), [show,setShow]=useState(false), [error,setError]=useState("");
  const demo = (r: Role) => {
    const ids = Object.keys(state.taiKhoan).filter((k) => state.taiKhoan[k] === r);
    const pref = r === "tp" ? ids.find((i) => state.nhanVien.find((n) => n.maNV === i)?.maPB === "CNSP") : r === "bgd" ? ids.find((i) => state.nhanVien.find((n) => n.maNV === i)?.laTruongPhong) : ids[0];
    return state.nhanVien.find((n) => n.maNV === (pref ?? ids[0]));
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand text-2xl font-black text-primary-foreground">A</div>
          <h1 className="text-3xl font-bold tracking-tight">ATX<span className="text-primary">hrm</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">CÔNG TY TNHH ATX GLOBAL · Đăng nhập hệ thống quản lý nhân sự</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {ORDER.map(({ role, mo }) => {
            const nv = demo(role);
            if (!nv) return null;
            return (
              <Button variant="outline"
                key={role}
                onClick={() => { setUsername(nv.maNV.toLowerCase());setPassword("123456");setError("");setOpen(true); }}
                className="h-auto whitespace-normal card-surface group flex items-center gap-4 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary"
              >
                <Initials name={nv.hoTen} className="h-12 w-12 text-sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-primary">{ROLE_LABEL[role]}</div>
                  <div className="truncate font-semibold">{nv.hoTen}</div>
                  <div className="truncate text-xs text-muted-foreground">{nv.chucVu} · {tenPB(nv.maPB)}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{mo}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </Button>
            );
          })}
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Đăng nhập ATXhrm</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={e=>{e.preventDefault();if(!login(username,password)){setError("Tên đăng nhập hoặc mật khẩu không đúng");return;}setOpen(false);navigate({to:"/"});}}><div className="space-y-2"><Label htmlFor="username">Tên đăng nhập</Label><Input id="username" autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="password">Mật khẩu</Label><div className="flex gap-2"><Input id="password" autoComplete="current-password" type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} /><Button type="button" variant="outline" size="icon" aria-label={show?"Ẩn mật khẩu":"Hiện mật khẩu"} onClick={()=>setShow(!show)}>{show?<EyeOff/>:<Eye/>}</Button></div></div>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" className="w-full">Đăng nhập<ArrowRight className="h-4 w-4"/></Button></form></DialogContent></Dialog>
    </div>
  );
}
