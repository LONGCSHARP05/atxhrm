import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/ui-bits";
import { seo } from "@/lib/nav";

export const Route = createFileRoute("/nhat-ky")({
  head: () => seo("Nhật ký hoạt động", "Lịch sử thao tác trong hệ thống."),
  component: NhatKyPage,
});

function NhatKyPage() {
  return <Placeholder title="Nhật ký hoạt động" />;
}
