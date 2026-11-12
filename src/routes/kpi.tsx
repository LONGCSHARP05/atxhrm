import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/ui-bits";
import { seo } from "@/lib/nav";

export const Route = createFileRoute("/kpi")({
  head: () => seo("Đánh giá KPI", "Tự đánh giá và đánh giá KPI theo kỳ."),
  component: KpiPage,
});

function KpiPage() {
  return <Placeholder title="Đánh giá KPI" />;
}
