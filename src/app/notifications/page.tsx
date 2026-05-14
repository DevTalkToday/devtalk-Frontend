"use client";

import { useState } from "react";
import { AppShell } from "@/components/devtalk/app-shell";

type NotificationKind = "comment" | "like" | "accepted" | "mention";

type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  preview: string;
  body: string;
  actor: string;
  target: string;
  time: string;
  unread: boolean;
};

const kindLabel: Record<NotificationKind, string> = {
  comment: "댓글",
  like: "공감",
  accepted: "해결 채택",
  mention: "멘션",
};

const notifications: NotificationItem[] = [
  {
    id: "n1",
    kind: "comment",
    title: "새 댓글이 달렸습니다",
    preview: "김민재님이 라우트 캐시 기록에 댓글을 남겼습니다.",
    body: "김민재님이 `Next.js 배포 후 라우트 캐시가 갱신되지 않은 기록`에 재현 조건을 추가로 남겼습니다. 캐시 무효화 범위와 배포 직후 요청 타이밍을 함께 확인해 달라는 내용입니다.",
    actor: "김민재",
    target: "Next.js 배포 후 라우트 캐시가 갱신되지 않은 기록",
    time: "5분 전",
    unread: true,
  },
  {
    id: "n2",
    kind: "like",
    title: "공감이 추가되었습니다",
    preview: "이서연님 외 2명이 메모리 증가 에러 기록에 공감했습니다.",
    body: "이서연님, 박현우님, 최지윤님이 `Markdown 이미지 미리보기에서 메모리가 계속 증가한 에러` 기록에 공감했습니다. 비슷한 blob URL 해제 문제를 겪은 팀원이 있어 참고용으로 저장했습니다.",
    actor: "이서연",
    target: "Markdown 이미지 미리보기에서 메모리가 계속 증가한 에러",
    time: "32분 전",
    unread: true,
  },
  {
    id: "n3",
    kind: "accepted",
    title: "해결 댓글이 채택되었습니다",
    preview: "작성한 답변이 인증 에러 회고의 해결 댓글로 채택되었습니다.",
    body: "`같은 인증 에러가 반복되지 않도록 남긴 팀 회고`에서 작성한 답변이 해결 댓글로 채택되었습니다. 토큰 만료 처리 누락을 방지하는 체크리스트가 본문에 연결되었습니다.",
    actor: "하린",
    target: "같은 인증 에러가 반복되지 않도록 남긴 팀 회고",
    time: "어제",
    unread: false,
  },
  {
    id: "n4",
    kind: "mention",
    title: "댓글에서 멘션되었습니다",
    preview: "오준님이 API 응답 지연 기록에서 당신을 언급했습니다.",
    body: "오준님이 API 응답 지연 기록의 댓글에서 프론트엔드 재시도 정책 확인을 요청했습니다. 네트워크 탭 캡처와 서버 로그 시간을 맞춰보자는 내용입니다.",
    actor: "오준",
    target: "API 응답 지연 기록",
    time: "월요일",
    unread: false,
  },
];

export default function NotificationsPage() {
  const [selectedId, setSelectedId] = useState(notifications[0].id);
  const selected = notifications.find((item) => item.id === selectedId) ?? notifications[0];

  return (
    <AppShell showPageHeader={false}>
      <section className="grid h-[calc(100vh-8.5rem)] min-h-0 gap-5 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] border border-(--border) bg-(--surface) p-4 shadow-(--shadow)">
          <h1 className="px-2 pb-4 text-3xl font-semibold">알림</h1>
          <div className="themed-scrollbar grid min-h-0 gap-3 overflow-y-auto pr-1">
            {notifications.map((item) => {
              const selectedItem = item.id === selected.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={[
                    "grid min-h-[104px] min-w-0 gap-2 overflow-hidden border p-4 text-left transition duration-150",
                    selectedItem
                      ? "border-(--accent) bg-(--accent-soft)"
                      : "border-(--border) bg-(--surface-raised) hover:border-(--accent)",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="border border-(--border) bg-(--surface-soft) px-2 py-0.5 text-xs font-semibold text-(--muted-strong)">
                      {kindLabel[item.kind]}
                    </span>
                    {item.unread ? <span className="size-2 rounded-full bg-(--accent)" /> : null}
                  </div>
                  <strong className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-base">
                    {item.title}
                  </strong>
                  <p className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm leading-5 text-(--muted-strong)">
                    {item.preview}
                  </p>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="themed-scrollbar min-h-0 overflow-y-auto border border-(--border) bg-(--surface) p-6 shadow-(--shadow)">
          <div className="grid gap-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-(--border) pb-5">
              <div>
                <span className="border border-(--border) bg-(--surface-soft) px-2 py-0.5 text-xs font-semibold text-(--muted-strong)">
                  {kindLabel[selected.kind]}
                </span>
                <h2 className="mt-3 text-2xl font-semibold">{selected.title}</h2>
              </div>
              <span className="text-sm text-(--muted-strong)">{selected.time}</span>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-1 border border-(--border) bg-(--surface-raised) p-4">
                <span className="text-xs font-semibold text-(--muted-strong)">알림 대상</span>
                <strong>{selected.target}</strong>
              </div>

              <div className="grid gap-1 border border-(--border) bg-(--surface-raised) p-4">
                <span className="text-xs font-semibold text-(--muted-strong)">발신자</span>
                <strong>{selected.actor}</strong>
              </div>

              <article className="border border-(--border) bg-(--surface-raised) p-5">
                <p className="text-sm leading-7 text-(--muted-strong)">{selected.body}</p>
              </article>
            </div>
          </div>
        </main>
      </section>
    </AppShell>
  );
}
