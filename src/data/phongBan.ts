import type { PhongBan } from "./types";
export const PHONG_BAN: PhongBan[] = [
  { maPB: "BGD", tenPB: "Ban Giám đốc" },
  { maPB: "HCNS", tenPB: "Hành chính - Nhân sự" },
  { maPB: "TCKT", tenPB: "Tài chính - Kế toán" },
  { maPB: "CNSP", tenPB: "Công nghệ & Sản phẩm" },
  { maPB: "KDMKT", tenPB: "Kinh doanh & Marketing" },
];
export const tenPB = (ma: string) => PHONG_BAN.find((p) => p.maPB === ma)?.tenPB ?? ma;
