import { AdsenseBanner } from "@/components/ads/adsense-banner";
import { AdminOnlyNotFound } from "@/components/auth/admin-only-not-found";
import { AppShell } from "@/components/devtalk/app-shell";

const TEST_TITLE = "관리자 테스트";
const TEST_DESCRIPTION = "관리자 계정으로 접속했을 때만 볼 수 있는 페이지입니다.";
const TEST_READY = "테스트 페이지가 준비되었습니다.";
const ADSENSE_CLIENT_FALLBACK = "ca-pub-6481460578393836";
const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT &&
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT !== "ca-pub-your-publisher-id"
    ? process.env.NEXT_PUBLIC_ADSENSE_CLIENT
    : ADSENSE_CLIENT_FALLBACK;

export default function TestPage() {
  return (
    <AdminOnlyNotFound>
      <AppShell
        title={TEST_TITLE}
        description={TEST_DESCRIPTION}
        footerSlot={
          <AdsenseBanner
            client={ADSENSE_CLIENT}
            slot={process.env.NEXT_PUBLIC_ADSENSE_TEST_SLOT}
            label=""
            className="max-w-[640px]"
          />
        }
      >
        <section className="rounded-[28px] border border-(--border) bg-(--surface) p-6 text-sm font-semibold text-(--foreground) shadow-(--shadow)">
          {TEST_READY}
        </section>
      </AppShell>
    </AdminOnlyNotFound>
  );
}
