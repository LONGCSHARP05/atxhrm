import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";

export const DEFAULT_CONFIG = {
  gioLamNgay: 8, congChuan: 26, anHan: 15,
  otThuong: 1.5, otCuoiTuan: 2, otLe: 3, phepNam: 12, otToiDa: 40,
  bhxh: 0.08, bhyt: 0.015, bhtn: 0.01,
  giamTruBanThan: 15500000, giamTruPhuThuoc: 6200000, tranAnTrua: 1200000,
  kpiA: 0.15, kpiB: 0.1, kpiC: 0.05, kpiD: 0,
  nguongA: 90, nguongB: 75, nguongC: 60,
  ngayChotCong: 25, ngayPhatLuong: 5,
  thue: [{ den: 10000000, tyLe: 0.05 }, { den: 30000000, tyLe: 0.1 }, { den: 60000000, tyLe: 0.2 }, { den: 100000000, tyLe: 0.3 }, { den: null, tyLe: 0.35 }],
};
export type AppConfig = typeof DEFAULT_CONFIG;
export const CONFIG_KEY = "atxhrm-config";
const ConfigContext = createContext<{ config: AppConfig; saveConfig: (v: AppConfig) => void }>({ config: DEFAULT_CONFIG, saveConfig: () => {} });
export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  useEffect(() => {
    try { const raw = localStorage.getItem(CONFIG_KEY); if (raw) setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(raw) }); } catch { /* Use defaults for invalid saved data. */ }
  }, []);
  const saveConfig = (v: AppConfig) => { localStorage.setItem(CONFIG_KEY, JSON.stringify(v)); setConfig(v); };
  return createElement(ConfigContext.Provider, { value: { config, saveConfig } }, children);
}
export const useConfig = () => useContext(ConfigContext);