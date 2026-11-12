import { describe, expect, it } from "vitest";
import { buildSeed } from "@/data/seed";
import { caById } from "@/data/types";
import { coTheDuyet, hdSapHetHan, kiemTraDon, kiemTraTuChoi, laTre, laVeSom, nextMaNV, tongHop } from "@/lib/rules";

const ctx = { phepConLai: 2, caHienTai: "HC" as const, otThang: 30 };
const base = { maNV: "NV0001", tuNgay: "2026-11-16", lyDo: "x" };

describe("ATXhrm rules", () => {
  it("check-in more than 15 minutes late is Trễ", () => {
    expect(laTre("08:15", caById("HC"))).toBe(false);
    expect(laTre("08:16", caById("HC"))).toBe(true);
  });
  it("check-out before shift end is Về sớm", () => {
    expect(laVeSom("16:59", caById("HC"))).toBe(true);
    expect(laVeSom("17:00", caById("HC"))).toBe(false);
  });
  it("annual leave cannot exceed remaining balance", () => {
    expect(kiemTraDon({ ...base, loai: "Nghỉ phép năm", denNgay: "2026-11-18" }, ctx)).toMatch(/vượt số dư/);
    expect(kiemTraDon({ ...base, loai: "Nghỉ phép năm", denNgay: "2026-11-17" }, ctx)).toBeNull();
  });
  it("shift change must pick a different shift", () => {
    expect(kiemTraDon({ ...base, loai: "Đổi ca", caMoi: "HC" }, ctx)).toMatch(/khác ca hiện tại/);
    expect(kiemTraDon({ ...base, loai: "Đổi ca", caMoi: "SANG" }, ctx)).toBeNull();
  });
  it("overtime is capped at 40 hours per month", () => {
    expect(kiemTraDon({ ...base, loai: "Làm thêm giờ", soGio: 11 }, ctx)).toMatch(/40 giờ/);
    expect(kiemTraDon({ ...base, loai: "Làm thêm giờ", soGio: 10 }, ctx)).toBeNull();
  });
  it("rejecting requires a reason", () => {
    expect(kiemTraTuChoi("  ")).not.toBeNull();
    expect(kiemTraTuChoi("Trùng lịch")).toBeNull();
  });
  it("seed matches the company headcount spec", () => {
    const s = buildSeed();
    expect(s.nhanVien).toHaveLength(47);
    expect(s.nhanVien.filter((n) => n.trangThai !== "Đã nghỉ việc")).toHaveLength(45);
    expect(s.donTu).toHaveLength(15);
    expect(hdSapHetHan(s)).toHaveLength(3);
    expect(nextMaNV(s)).toBe("NV0048");
    for (const n of s.nhanVien.filter((x) => x.trangThai === "Chính thức")) {
      const c = tongHop(s.chamCong.filter((r) => r.maNV === n.maNV && r.ngay.startsWith("2026-10"))).cong;
      expect(c).toBeGreaterThanOrEqual(22);
      expect(c).toBeLessThanOrEqual(26);
    }
  });
  it("department head approves own department staff only", () => {
    const s = buildSeed();
    const pending = s.donTu.find((d) => d.trangThai === "Chờ duyệt" && s.nhanVien.find((n) => n.maNV === d.maNV)!.maPB === "CNSP")!;
    const tpCN = s.nhanVien.find((n) => n.maPB === "CNSP" && n.laTruongPhong)!.maNV;
    const tpKD = s.nhanVien.find((n) => n.maPB === "KDMKT" && n.laTruongPhong)!.maNV;
    expect(coTheDuyet(s, tpCN, pending)).toBe(true);
    expect(coTheDuyet(s, tpKD, pending)).toBe(false);
  });
});
