import { AdminOnlyNotFound } from "@/components/auth/admin-only-not-found";
import { AdsenseBanner } from "@/components/ads/adsense-banner";
import { AppShell } from "@/components/devtalk/app-shell";

const TEST_TITLE = "\uAD00\uB9AC\uC790 \uD14C\uC2A4\uD2B8";
const TEST_DESCRIPTION = "\uAD00\uB9AC\uC790 \uACC4\uC815\uC73C\uB85C \uC811\uC18D\uD588\uC744 \uB54C\uB9CC \uBCFC \uC218 \uC788\uB294 \uD398\uC774\uC9C0\uC785\uB2C8\uB2E4.";
const TEST_READY = "\uD14C\uC2A4\uD2B8 \uD398\uC774\uC9C0\uAC00 \uC900\uBE44\uB418\uC5C8\uC2B5\uB2C8\uB2E4.";
const TEST_AD_LABEL = "\uD14C\uC2A4\uD2B8 \uAD11\uACE0 \uBC30\uB108";

export default function TestPage() {
  return (
    <AdminOnlyNotFound>
      <AppShell title={TEST_TITLE} description={TEST_DESCRIPTION}>
        <div className="grid gap-4">
          <section className="rounded-[28px] border border-(--border) bg-(--surface) p-6 text-sm font-semibold text-(--foreground) shadow-(--shadow)">
            {TEST_READY}
          </section>
          <AdsenseBanner
            client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
            slot={process.env.NEXT_PUBLIC_ADSENSE_TEST_SLOT}
            label={TEST_AD_LABEL}
          />
        </div>
      </AppShell>
    </AdminOnlyNotFound>
  );
}
