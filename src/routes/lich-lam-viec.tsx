import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/ui-bits";
import { seo } from "@/lib/nav";

export const Route = createFileRoute("/lich-lam-viec")({
  head: () => seo("Lịch làm việc", "Lịch làm việc của nhân viên ATX Global."),
  component: LichLamViecPage,
});

function LichLamViecPage() {
  return <Placeholder title="Lịch làm việc" />;
}
