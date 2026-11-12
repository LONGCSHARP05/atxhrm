import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/ui-bits";
import { seo } from "@/lib/nav";

export const Route = createFileRoute("/cau-hinh")({
  head: () => seo("Cấu hình tham số", "Thiết lập tham số hệ thống."),
  component: CauHinhPage,
});

function CauHinhPage() {
  return <Placeholder title="Cấu hình tham số" />;
}
