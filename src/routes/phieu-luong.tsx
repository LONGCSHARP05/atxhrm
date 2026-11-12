import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/ui-bits";
import { seo } from "@/lib/nav";

export const Route = createFileRoute("/phieu-luong")({
  head: () => seo("Phiếu lương", "Xem phiếu lương cá nhân."),
  component: PhieuLuongPage,
});

function PhieuLuongPage() {
  return <Placeholder title="Phiếu lương" />;
}
