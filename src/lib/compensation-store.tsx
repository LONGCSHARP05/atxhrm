import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {useStore} from './store';
import {useConfig} from '@/data/config';
import {buildCompensation,type CompensationData} from './compensation';
const Context=createContext<{data:CompensationData;change:(fn:(d:CompensationData)=>void)=>void}|null>(null);
export function CompensationProvider({children}:{children:ReactNode}){const {state}=useStore(),{config}=useConfig();const [data,setData]=useState<CompensationData|null>(null);useEffect(()=>{try{const raw=localStorage.getItem('atxhrm-compensation-v1');setData(raw?JSON.parse(raw):buildCompensation(state,config));}catch{setData(buildCompensation(state,config));}},[]);useEffect(()=>{if(data)localStorage.setItem('atxhrm-compensation-v1',JSON.stringify(data));},[data]);if(!data)return <p className="p-6 text-muted-foreground">Đang tải…</p>;return <Context.Provider value={{data,change:fn=>setData(prev=>{if(!prev)return prev;const next=structuredClone(prev);fn(next);return next;})}}>{children}</Context.Provider>;}
export function useCompensation(){const ctx=useContext(Context);if(!ctx)throw new Error('Missing compensation provider');return ctx;}