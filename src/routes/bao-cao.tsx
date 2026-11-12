import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/ui-bits";
import { seo } from "@/lib/nav";

export const Route = createFileRoute("/bao-cao")({
  head: () => seo("Báo cáo tổng hợp", "Báo cáo nhân sự và quỹ lương."),
  component: BaoCaoPage,
});

function BaoCaoPage() {
  return <Placeholder title="Báo cáo tổng hợp" />;
}
