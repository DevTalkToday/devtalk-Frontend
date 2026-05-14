"use client";

import Link from "next/link";
import { AppShell } from "@/components/devtalk/app-shell";
import { ArrowLeftIcon } from "@/components/devtalk/icons";
import { buttonClassName } from "@/components/ui";
import { PostForm } from "@/components/devtalk/post-form";

export default function WritePage() {
  return (
    <AppShell
      title="에러 해결 기록 작성"
      description="증상, 환경, 재현 절차, 시도한 방법, 최종 해결책을 한곳에 남겨 다음 디버깅 시간을 줄입니다."
      actions={
        <Link href="/" className={buttonClassName()}>
          <ArrowLeftIcon className="size-4" />
          피드로
        </Link>
      }
      sidebar={
        <div className="grid gap-3 pt-2">
          <div className="grid gap-1 rounded-3xl border border-(--border) bg-(--surface-raised) p-4">
            <span className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-(--muted)">Fix Log</span>
            <strong className="text-lg">원인 + 해결책</strong>
            <span className="text-sm text-(--muted-strong)">같은 에러를 다시 만났을 때 바로 참고할 기록</span>
          </div>
          <div className="grid gap-1 rounded-3xl border border-(--border) bg-(--surface-raised) p-4">
            <span className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-(--muted)">Error Report</span>
            <strong className="text-lg">상태 + 우선순위 + 재현 절차</strong>
            <span className="text-sm text-(--muted-strong)">분석 중인 문제를 이슈처럼 관리합니다.</span>
          </div>
        </div>
      }
    >
      <PostForm mode="create" />
    </AppShell>
  );
}
