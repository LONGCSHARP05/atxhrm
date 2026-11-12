import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/ui-bits";
import { seo } from "@/lib/nav";

export const Route = createFileRoute("/phan-quyen")({
  head: () => seo("Phân quyền tài khoản", "Quản lý vai trò tài khoản."),
  component: PhanQuyenPage,
});

function PhanQuyenPage() {
  return <Placeholder title="Phân quyền tài khoản" />;
}
