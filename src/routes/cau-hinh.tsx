import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/ui-bits";
import { useEffect, useState } from 'react';
import { useConfig, DEFAULT_CONFIG, type AppConfig } from '@/data/config';
import { useStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/app/hr-controls';
import { configError } from '@/lib/admin-rules';
import { toast } from 'sonner';
import { seo } from "@/lib/nav";

export const Route = createFileRoute("/cau-hinh")({
  head: () => seo("Cấu hình tham số", "Thiết lập tham số hệ thống."),
  component: CauHinhPage,
});

function CauHinhPage() {
  const {config,saveConfig}=useConfig();const {role,updateData}=useStore();const [draft,setDraft]=useState(config),[effective,setEffective]=useState('2026-01-01');useEffect(()=>setDraft(config),[config]);
  if(!['hr','admin'].includes(role))return null;
  type Key=Exclude<keyof AppConfig,'thue'>;
  const groups:{title:string;fields:[Key,string,boolean?][]}[]=[{title:'Kỳ lương · Hàng tháng',fields:[['ngayChotCong','Ngày chốt công'],['ngayPhatLuong','Ngày phát lương']]},{title:'Quy tắc tính công',fields:[['gioLamNgay','Giờ làm / ngày'],['congChuan','Công chuẩn'],['anHan','Ân hạn đi muộn (phút)'],['otThuong','Hệ số OT thường'],['otCuoiTuan','Hệ số OT cuối tuần'],['otLe','Hệ số OT lễ'],['phepNam','Phép năm'],['otToiDa','OT tối đa / tháng']]},{title:'Bảo hiểm và giảm trừ',fields:[['bhxh','BHXH (%)',true],['bhyt','BHYT (%)',true],['bhtn','BHTN (%)',true],['giamTruBanThan','Giảm trừ bản thân (đ)'],['giamTruPhuThuoc','Giảm trừ người phụ thuộc (đ)'],['tranAnTrua','Trần ăn trưa miễn thuế (đ)']]},{title:'Thưởng KPI',fields:[['kpiA','Thưởng A (%)',true],['kpiB','Thưởng B (%)',true],['kpiC','Thưởng C (%)',true],['kpiD','Thưởng D (%)',true],['nguongA','Ngưỡng A'],['nguongB','Ngưỡng B'],['nguongC','Ngưỡng C']]}];
  const save=(keys:(keyof AppConfig)[])=>{const next={...config};for(const key of keys)Object.assign(next,{[key]:draft[key]});const error=configError(next);if(error)return toast.error(error);saveConfig(next);updateData('Đổi cấu hình: '+keys.map(k=>`${k}: ${JSON.stringify(config[k])} → ${JSON.stringify(next[k])}`).join('; '),'cau-hinh',()=>{});toast.success('Đã lưu');};
  return <><PageHeader title="Cấu hình tham số"/>{groups.map(g=><section key={g.title} className="border-b py-6"><h2 className="mb-4 text-lg font-semibold">{g.title}</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{g.fields.map(([k,label,percent])=><FormField key={k} label={label}><Input aria-label={label} type="number" step="any" value={percent?Math.round(draft[k]*10000)/100:draft[k]} onChange={e=>setDraft({...draft,[k]:Number(e.target.value)/(percent?100:1)})}/></FormField>)}{g.title==='Bảo hiểm và giảm trừ'&&<FormField label="Hiệu lực từ"><Input type="date" value={effective} onChange={e=>setEffective(e.target.value)}/></FormField>}</div><Button className="mt-4" onClick={()=>save(g.fields.map(f=>f[0]))}>Lưu thay đổi</Button></section>)}<section className="py-6"><h2 className="mb-4 text-lg font-semibold">Biểu thuế TNCN</h2><div className="space-y-3">{draft.thue.map((b,i)=><div key={i} className="grid grid-cols-4 items-end gap-3"><span>Bậc {i+1} · Từ {(i?draft.thue[i-1].den??0:0).toLocaleString('vi-VN')}</span><FormField label="Đến (đ)"><Input type="number" disabled={b.den===null} value={b.den??''} placeholder="Không giới hạn" onChange={e=>setDraft({...draft,thue:draft.thue.map((x,j)=>j===i?{...x,den:Number(e.target.value)}:x)})}/></FormField><FormField label="Thuế suất (%)"><Input type="number" value={b.tyLe*100} onChange={e=>setDraft({...draft,thue:draft.thue.map((x,j)=>j===i?{...x,tyLe:Number(e.target.value)/100}:x)})}/></FormField></div>)}</div><div className="mt-4 flex gap-3"><Button onClick={()=>save(['thue'])}>Lưu thay đổi</Button><Button variant="outline" onClick={()=>setDraft({...draft,thue:structuredClone(DEFAULT_CONFIG.thue)})}>Khôi phục mặc định</Button></div></section></>;
}
