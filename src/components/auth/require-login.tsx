"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useAuthStatus } from "@/lib/auth/session";

export function RequireLogin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { ready, loggedIn } = useAuthStatus();

  useEffect(() => {
    if (ready && !loggedIn) router.replace("/login");
  }, [ready, loggedIn, router]);

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
      <section className="grid max-w-md gap-4 rounded-[28px] border border-(--border) bg-(--surface) p-6 text-center shadow-(--shadow)">
        <h1 className="text-2xl font-semibold">로그인이 필요합니다</h1>
        <p className="text-sm leading-6 text-(--muted-strong)">게시글 목록은 볼 수 있지만 이 기능은 로그인 후 사용할 수 있습니다.</p>
        <Button type="button" variant="primary" onClick={() => router.replace("/login")}>
          로그인
        </Button>
      </section>
    </main>
  );
}
