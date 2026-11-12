import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/ui-bits";
import { seo } from "@/lib/nav";

export const Route = createFileRoute("/don-tu")({
  head: () => seo("Đơn từ", "Đơn từ của nhân viên ATX Global."),
  component: DonTuPage,
});

function DonTuPage() {
  return <Placeholder title="Đơn từ" />;
}
