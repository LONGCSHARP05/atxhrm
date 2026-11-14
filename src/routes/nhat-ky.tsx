import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, thCls } from "@/components/app/ui-bits";
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { ROLE_LABEL } from '@/data/types';
import { Choice, FormField } from '@/components/app/hr-controls';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { seo } from "@/lib/nav";

export const Route = createFileRoute("/nhat-ky")({
  head: () => seo("Nhật ký hoạt động", "Lịch sử thao tác trong hệ thống."),
  component: NhatKyPage,
});

function NhatKyPage() {
  const {state,role}=useStore();const [from,setFrom]=useState(''),[to,setTo]=useState(''),[who,setWho]=useState('all'),[action,setAction]=useState(''),[page,setPage]=useState(0);
  if(role!=='admin')return null;
  const rows=state.activityLog.filter(l=>(!from||l.thoiGian.slice(0,10)>=from)&&(!to||l.thoiGian.slice(0,10)<=to)&&(who==='all'||l.maNV===who)&&l.hanhDong.toLowerCase().includes(action.toLowerCase())).sort((a,b)=>b.thoiGian.localeCompare(a.thoiGian));const max=Math.max(0,Math.ceil(rows.length/20)-1),current=Math.min(page,max);
  return <><PageHeader title="Nhật ký hoạt động"/><div className="mb-5 flex flex-wrap items-end gap-3"><FormField label="Từ ngày"><Input type="date" value={from} onChange={e=>{setFrom(e.target.value);setPage(0);}}/></FormField><FormField label="Đến ngày"><Input type="date" value={to} onChange={e=>{setTo(e.target.value);setPage(0);}}/></FormField><Choice label="Người thao tác" value={who} onChange={v=>{setWho(v);setPage(0);}} options={[["all","Tất cả"],...state.nhanVien.map(n=>[n.maNV,n.hoTen] as [string,string])]}/><FormField label="Hành động"><Input value={action} onChange={e=>{setAction(e.target.value);setPage(0);}} placeholder="Tìm hành động"/></FormField></div><Table><TableHeader><TableRow>{['Thời gian','Người thao tác','Vai trò','Hành động','Đối tượng','Chi tiết'].map(h=><TableHead key={h} className={thCls}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.slice(current*20,current*20+20).map((l,i)=><TableRow key={`${l.thoiGian}-${i}`}><TableCell className="whitespace-nowrap">{new Date(l.thoiGian).toLocaleString('vi-VN')}</TableCell><TableCell>{state.nhanVien.find(n=>n.maNV===l.maNV)?.hoTen??l.maNV}</TableCell><TableCell>{ROLE_LABEL[l.vaiTro]}</TableCell><TableCell className="min-w-48">{l.hanhDong}</TableCell><TableCell>{l.doiTuong}</TableCell><TableCell className="min-w-48">{l.chiTiet}</TableCell></TableRow>)}</TableBody></Table><div className="mt-4 flex items-center justify-between"><span className="text-sm text-muted-foreground">{rows.length} hoạt động · Trang {current+1}/{max+1}</span><div className="flex gap-2"><Button variant="outline" disabled={current===0} onClick={()=>setPage(current-1)}>Trước</Button><Button variant="outline" disabled={current===max} onClick={()=>setPage(current+1)}>Sau</Button></div></div></>;
}
