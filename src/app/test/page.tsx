import { AdminOnlyNotFound } from "@/components/auth/admin-only-not-found";
import { AppShell } from "@/components/devtalk/app-shell";

const TEST_TITLE = "관리자 테스트";
const TEST_DESCRIPTION = "관리자 계정으로 접속했을 때만 볼 수 있는 페이지입니다.";
const TEST_READY = "테스트 페이지가 준비되었습니다.";
export default function TestPage() {
  return (
    <AdminOnlyNotFound>
      <AppShell title={TEST_TITLE} description={TEST_DESCRIPTION}>
        <section className="rounded-[28px] border border-(--border) bg-(--surface) p-6 text-sm font-semibold text-(--foreground) shadow-(--shadow)">
          {TEST_READY}
        </section>
      </AppShell>
    </AdminOnlyNotFound>
  );
}
