import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/ui-bits";
import { seo } from "@/lib/nav";

export const Route = createFileRoute("/bang-luong")({
  head: () => seo("Bảng lương", "Tính và chốt lương theo kỳ."),
  component: BangLuongPage,
});

function BangLuongPage() {
  return <Placeholder title="Bảng lương" />;
}
