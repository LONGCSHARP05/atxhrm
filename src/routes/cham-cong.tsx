import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/ui-bits";
import { seo } from "@/lib/nav";

export const Route = createFileRoute("/cham-cong")({
  head: () => seo("Bảng chấm công", "Bảng chấm công của nhân viên ATX Global."),
  component: ChamCongPage,
});

function ChamCongPage() {
  return <Placeholder title="Bảng chấm công" />;
}
