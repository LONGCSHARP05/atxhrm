import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, thCls } from "@/components/app/ui-bits";
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { ROLE_LABEL, type Role } from '@/data/types';
import { tenPB } from '@/data/phongBan';
import { Choice } from '@/components/app/hr-controls';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { accountChangeAllowed } from '@/lib/admin-rules';
import { toast } from 'sonner';
import { seo } from "@/lib/nav";

export const Route = createFileRoute("/phan-quyen")({
  head: () => seo("Phân quyền tài khoản", "Quản lý vai trò tài khoản."),
  component: PhanQuyenPage,
});

function PhanQuyenPage() {
  const {state,me,role,updateData}=useStore();
  const [q,setQ]=useState(''),[filter,setFilter]=useState('all');
  const [pending,setPending]=useState<{id:string;role:Role}|null>(null);
  if(!me||role!=='admin')return null;
  const roles=Object.entries(ROLE_LABEL) as [Role,string][];
  const rows=state.nhanVien.filter(n=>(filter==='all'||state.taiKhoan[n.maNV]===filter)&&`${n.hoTen} ${n.maNV}`.toLowerCase().includes(q.toLowerCase()));
  const change=(id:string,next:Role,locked:boolean)=>{if(!accountChangeAllowed(me.maNV,id,next,locked)){toast.error('Không thể tự hạ quyền hoặc tự khóa tài khoản');return;}updateData(`Đổi tài khoản ${id}: ${ROLE_LABEL[state.taiKhoan[id]??'nv']} → ${ROLE_LABEL[next]}, ${locked?'Khóa':'Hoạt động'}`,id,d=>{d.taiKhoan[id]=next;d.taiKhoanKhoa[id]=locked;});};
  return <><PageHeader title="Phân quyền tài khoản"/><div className="mb-5 flex flex-wrap gap-3"><Input className="max-w-sm" placeholder="Tìm tên / mã nhân viên" value={q} onChange={e=>setQ(e.target.value)}/><Choice label="Vai trò" value={filter} onChange={setFilter} options={[["all","Tất cả"],...roles]}/></div><Table><TableHeader><TableRow>{['Tên đăng nhập','Nhân viên','Phòng ban','Vai trò','Trạng thái',''].map(h=><TableHead key={h} className={thCls}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map(n=><TableRow key={n.maNV}><TableCell>{n.maNV.toLowerCase()}</TableCell><TableCell className="min-w-44">{n.hoTen}<span className="block text-xs text-muted-foreground">{n.maNV}</span></TableCell><TableCell>{tenPB(n.maPB)}</TableCell><TableCell><Choice label={`Vai trò ${n.maNV}`} value={state.taiKhoan[n.maNV]??'nv'} options={roles} onChange={v=>{if(!accountChangeAllowed(me.maNV,n.maNV,v as Role,false))toast.error('Không thể tự hạ quyền');else setPending({id:n.maNV,role:v as Role});}}/></TableCell><TableCell><div className="flex items-center gap-2"><Switch aria-label={`Hoạt động ${n.maNV}`} checked={!state.taiKhoanKhoa[n.maNV]} disabled={n.maNV===me.maNV} onCheckedChange={v=>change(n.maNV,state.taiKhoan[n.maNV]??'nv',!v)}/>{state.taiKhoanKhoa[n.maNV]?'Khóa':'Hoạt động'}</div></TableCell><TableCell><Button variant="outline" size="sm" onClick={()=>{updateData(`Đặt lại mật khẩu ${n.maNV}`,n.maNV,()=>{});toast.success('Mật khẩu đã đặt lại: 123456');}}>Đặt lại mật khẩu</Button></TableCell></TableRow>)}</TableBody></Table><Dialog open={!!pending} onOpenChange={v=>!v&&setPending(null)}><DialogContent><DialogHeader><DialogTitle>Xác nhận đổi vai trò</DialogTitle></DialogHeader><p>{pending?.id} → {pending&&ROLE_LABEL[pending.role]}</p><DialogFooter><Button variant="outline" onClick={()=>setPending(null)}>Hủy</Button><Button onClick={()=>{if(pending)change(pending.id,pending.role,!!state.taiKhoanKhoa[pending.id]);setPending(null);}}>Xác nhận</Button></DialogFooter></DialogContent></Dialog></>;
}
