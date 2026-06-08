"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useAuthStatus } from "@/lib/auth/session";

export function RequireLogin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { ready, loggedIn } = useAuthStatus();

  if (loggedIn) return <>{children}</>;

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <section className="h-[178px] w-full max-w-md rounded-[28px] border border-(--border) bg-(--surface) p-6 shadow-(--shadow)" />
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center px-5">
      <section className="grid w-full max-w-md gap-4 rounded-[28px] border border-(--border) bg-(--surface) p-6 text-center shadow-(--shadow)">
        <h1 className="text-2xl font-semibold">로그인이 필요합니다.</h1>
        <p className="text-sm leading-6 text-(--muted-strong)">
          이 기능은 로그인한 사용자만 사용할 수 있습니다. <br/>로그인 후 다시 시도해 주세요.
        </p>
        <Button type="button" variant="primary" onClick={() => router.push("/login")}>
          로그인
        </Button>
      </section>
    </main>
  );
}
