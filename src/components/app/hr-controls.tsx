import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PHONG_BAN } from '@/data/phongBan';
export function Choice({value,onChange,options,label,disabled=false}: {value:string;onChange:(v:string)=>void;options:[string,string][];label?:string;disabled?:boolean}) {
 return <div className="min-w-0 space-y-1.5">{label&&<Label>{label}</Label>}<Select value={value} onValueChange={onChange} disabled={disabled}><SelectTrigger className="w-full min-w-36" aria-label={label}><SelectValue/></SelectTrigger><SelectContent>{options.map(([id,name])=><SelectItem key={id} value={id}>{name}</SelectItem>)}</SelectContent></Select></div>;
}
export function DepartmentFilter({value,onChange,disabled=false}: {value:string;onChange:(v:string)=>void;disabled?:boolean}) {return <Choice label="Phòng ban" value={value} onChange={onChange} disabled={disabled} options={[["all","Tất cả phòng ban"],...PHONG_BAN.map(p=>[p.maPB,p.tenPB] as [string,string])]}/>;}
export function FormField({label,error,children}: {label:string;error?:string;children:ReactNode}) {return <div className="space-y-1.5"><Label>{label}</Label>{children}{error&&<p className="text-xs text-destructive" role="alert">{error}</p>}</div>;}
