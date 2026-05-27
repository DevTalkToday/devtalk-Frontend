"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RequireLogin } from "@/components/auth/require-login";
import { AppShell } from "@/components/devtalk/app-shell";
import { Button } from "@/components/ui";
import { FetchGetAuth, FetchPatchAuth } from "@/lib/api/fetch";

type NotificationKind =
  | "POST_COMMENT"
  | "ADMIN_NOTICE"
  | "REPORT_SUBMITTED"
  | "REPORT_REVIEWED"
  | "COMMENT_ACCEPTED";

type NotificationItem = {
  id: number;
  type: NotificationKind;
  title: string;
  preview: string;
  body: string;
  actorName: string;
  targetType: string | null;
  targetId: string | null;
  targetUrl: string | null;
  createdAt: string;
  readAt: string | null;
  unread: boolean;
};

const kindLabel: Record<NotificationKind, string> = {
  POST_COMMENT: "댓글",
  ADMIN_NOTICE: "공지",
  REPORT_SUBMITTED: "신고 접수",
  REPORT_REVIEWED: "신고 확인",
  COMMENT_ACCEPTED: "댓글 채택",
};

function formatNotificationTime(value: string) {
  const target = new Date(value);
  const now = new Date();
  const diffMs = Math.max(now.getTime() - target.getTime(), 0);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "방금";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}분 전`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}시간 전`;

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(target);
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const selected = useMemo(
    () => notifications.find((item) => item.id === selectedId) ?? notifications[0] ?? null,
    [notifications, selectedId],
  );
  const unreadCount = notifications.filter((item) => item.unread).length;
  const hasNotifications = notifications.length > 0;

  const loadNotifications = async () => {
    const data = (await FetchGetAuth("/notifications?limit=100")) as NotificationItem[];
    setNotifications(data);
    setSelectedId((current) => (current && data.some((item) => item.id === current) ? current : data[0]?.id ?? null));
    return data;
  };

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setLoading(true);
      try {
        const data = (await FetchGetAuth("/notifications?limit=100")) as NotificationItem[];
        if (!alive) return;
        setNotifications(data);
        setSelectedId(data[0]?.id ?? null);
      } catch {
        if (alive) {
          setNotifications([]);
          setSelectedId(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, []);

  const selectNotification = async (item: NotificationItem) => {
    setSelectedId(item.id);
    if (!item.unread) return;

    setNotifications((current) =>
      current.map((candidate) =>
        candidate.id === item.id ? { ...candidate, unread: false, readAt: new Date().toISOString() } : candidate,
      ),
    );

    try {
      const updated = (await FetchPatchAuth(`/notifications/${item.id}/read`)) as NotificationItem;
      setNotifications((current) => current.map((candidate) => (candidate.id === updated.id ? updated : candidate)));
    } catch {
      await loadNotifications().catch(() => undefined);
    }
  };

  const markAllRead = async () => {
    setNotifications((current) =>
      current.map((item) => ({ ...item, unread: false, readAt: item.readAt ?? new Date().toISOString() })),
    );
    await FetchPatchAuth("/notifications/read-all").catch(() => loadNotifications().catch(() => undefined));
  };

  return (
    <RequireLogin>
      <AppShell showPageHeader={false}>
        <section className="rounded-[28px] border border-(--border) bg-white/88 p-5 shadow-(--shadow) backdrop-blur-[18px] dark:bg-(--surface)">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold">알림</h1>
              <span className="rounded-full border border-(--border) bg-(--surface-soft) px-3 py-1 text-xs font-semibold text-(--muted-strong)">
                {unreadCount}개 미읽음
              </span>
            </div>

            <Button type="button" size="sm" disabled={loading || unreadCount === 0} onClick={markAllRead}>
              모두 읽음
            </Button>
          </div>

          <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="min-h-[420px] border border-(--border) bg-white p-4 shadow-[0_18px_50px_rgba(51,94,180,0.08)] dark:bg-(--surface-raised)">
              <div className="mb-4 flex items-center justify-between gap-3 px-1">
                <h2 className="text-lg font-semibold">받은 알림</h2>
                <span className="text-xs font-semibold text-(--muted-strong)">{notifications.length}개</span>
              </div>

              <div className="themed-scrollbar grid max-h-[560px] min-h-[320px] auto-rows-max content-start gap-3 overflow-y-auto pr-1">
                {loading ? (
                  <div className="border border-(--border) bg-(--surface-raised) p-5 text-sm text-(--muted-strong)">
                    알림을 불러오는 중입니다.
                  </div>
                ) : null}
                {!loading && !hasNotifications ? (
                  <div className="grid min-h-[180px] place-items-center border border-(--border) bg-(--surface-raised) p-6 text-center">
                    <p className="text-sm leading-6 text-(--muted-strong)">아직 받은 알림이 없습니다.</p>
                  </div>
                ) : null}
                {notifications.map((item) => {
                  const selectedItem = selected != null && item.id === selected.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectNotification(item)}
                      className={[
                        "grid h-[116px] min-w-0 content-start gap-2 overflow-hidden border p-4 text-left transition duration-150",
                        selectedItem
                          ? "border-(--accent) bg-(--accent-soft)"
                          : "border-(--border) bg-(--surface-raised) hover:border-(--accent)",
                      ].join(" ")}
                    >
                      <div className="flex min-w-0 items-center justify-between gap-3">
                        <span className="border border-(--border) bg-(--surface-soft) px-2 py-0.5 text-xs font-semibold text-(--muted-strong)">
                          {kindLabel[item.type]}
                        </span>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-xs text-(--muted-strong)">{formatNotificationTime(item.createdAt)}</span>
                          {item.unread ? <span className="size-2 rounded-full bg-(--accent)" /> : null}
                        </div>
                      </div>
                      <strong className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-base">
                        {item.title}
                      </strong>
                      <p className="line-clamp-2 min-w-0 text-sm leading-5 text-(--muted-strong)">{item.preview}</p>
                    </button>
                  );
                })}
              </div>
            </aside>

            <main className="min-h-[520px] border border-(--border) bg-white shadow-[0_18px_50px_rgba(51,94,180,0.08)] dark:bg-(--surface)">
              {selected ? (
                <article className="grid min-h-[520px] grid-rows-[auto_minmax(0,1fr)]">
                  <header className="border-b border-(--border) p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="border border-(--border) bg-(--surface-soft) px-2 py-0.5 text-xs font-semibold text-(--muted-strong)">
                        {kindLabel[selected.type]}
                      </span>
                      <span className="text-sm text-(--muted-strong)">{formatNotificationTime(selected.createdAt)}</span>
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold">{selected.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-(--muted-strong)">{selected.preview}</p>
                  </header>

                  <div className="themed-scrollbar min-h-0 overflow-y-auto p-5">
                    <dl className="grid border-y border-(--border)">
                      <div className="grid gap-1 border-b border-(--border) py-4 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-4">
                        <dt className="text-xs font-semibold text-(--muted-strong)">알림 대상</dt>
                        <dd className="min-w-0 font-semibold">
                          {selected.targetUrl ? (
                            <Link href={selected.targetUrl} className="text-(--accent)">
                              {selected.targetType ?? "대상"} {selected.targetId ? `#${selected.targetId}` : ""}
                            </Link>
                          ) : (
                            <>
                              {selected.targetType ?? "대상 없음"} {selected.targetId ? `#${selected.targetId}` : ""}
                            </>
                          )}
                        </dd>
                      </div>

                      <div className="grid gap-1 py-4 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-4">
                        <dt className="text-xs font-semibold text-(--muted-strong)">발신자</dt>
                        <dd className="font-semibold">{selected.actorName}</dd>
                      </div>
                    </dl>

                    <div className="mt-5 border border-(--border) bg-(--surface-raised) p-5">
                      <p className="text-sm leading-7 text-(--muted-strong)">{selected.body}</p>
                    </div>
                  </div>
                </article>
              ) : (
                <div className="grid min-h-[520px] place-items-center p-6 text-center">
                  <div>
                    <h2 className="text-xl font-semibold">선택된 알림이 없습니다.</h2>
                    <p className="mt-2 text-sm text-(--muted-strong)">
                      {hasNotifications ? "왼쪽 목록에서 알림을 선택해 주세요." : "아직 받은 알림이 없습니다."}
                    </p>
                  </div>
                </div>
              )}
            </main>
          </div>
        </section>
      </AppShell>
    </RequireLogin>
  );
}
