"use client";

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RequireLogin } from "@/components/auth/require-login";
import { AppShell } from "@/components/devtalk/app-shell";
import { FetchGetAuth, FetchPatchAuth, FetchPostAuth } from "@/lib/api/fetch";

type MessageUser = {
  id: number;
  username: string;
  nickname: string;
  description: string | null;
  majors: string[];
};

type ApiMessage = {
  id: number;
  sender: MessageUser;
  recipient: MessageUser;
  body: string;
  createdAt: string;
  readAt: string | null;
  mine: boolean;
};

type Conversation = {
  user: MessageUser;
  lastMessage: ApiMessage | null;
  unreadCount: number;
};

const accentColors = ["#2563ff", "#14b8a6", "#f97316", "#7c3aed", "#0891b2", "#db2777", "#16a34a"];
const MESSAGE_POLL_INTERVAL_MS = 1000;
const CONVERSATION_POLL_INTERVAL_MS = 5_000;

function getAccent(id: number) {
  return accentColors[id % accentColors.length];
}

function getMajor(user: MessageUser) {
  return user.majors.length > 0 ? user.majors.join(", ") : "전공 미입력";
}

function getDescription(user: MessageUser) {
  return user.description?.trim() || `@${user.username}`;
}

function formatMessageTime(value: string) {
  const target = new Date(value);
  const now = new Date();
  const sameDay = target.toDateString() === now.toDateString();

  if (sameDay) {
    return new Intl.DateTimeFormat("ko-KR", {
      hour: "numeric",
      minute: "2-digit",
    }).format(target);
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(target);
}

function hasUnreadIncomingMessages(items: ApiMessage[]) {
  return items.some((message) => !message.mine && message.readAt == null);
}

function areMessagesEqual(current: ApiMessage[], next: ApiMessage[]) {
  return (
    current.length === next.length &&
    current.every(
      (message, index) =>
        message.id === next[index]?.id &&
        message.readAt === next[index]?.readAt &&
        message.body === next[index]?.body
    )
  );
}

function areConversationsEqual(current: Conversation[], next: Conversation[]) {
  return (
    current.length === next.length &&
    current.every((conversation, index) => {
      const nextConversation = next[index];
      return (
        conversation.user.id === nextConversation?.user.id &&
        conversation.unreadCount === nextConversation.unreadCount &&
        conversation.lastMessage?.id === nextConversation.lastMessage?.id &&
        conversation.lastMessage?.readAt === nextConversation.lastMessage?.readAt &&
        conversation.lastMessage?.body === nextConversation.lastMessage?.body
      );
    })
  );
}

function Avatar({ user, size = "md" }: { user: MessageUser; size?: "md" | "lg" }) {
  return (
    <div
      className={[
        "grid flex-none place-items-center rounded-full font-bold text-white",
        size === "lg" ? "size-16 text-xl" : "size-12 text-base",
      ].join(" ")}
      style={{ backgroundColor: getAccent(user.id) }}
    >
      {user.nickname.slice(0, 1).toUpperCase()}
    </div>
  );
}

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get("userId");
  const requestedUserId = userIdParam ? Number(userIdParam) : null;
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const markingReadIdsRef = useRef<Set<number>>(new Set());

  const [selectedId, setSelectedId] = useState<number | null>(Number.isFinite(requestedUserId) ? requestedUserId : null);
  const [draft, setDraft] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.user.id === selectedId) ?? null,
    [conversations, selectedId],
  );
  const selectedUser = selectedConversation?.user ?? null;

  const refreshConversations = useCallback(async () => {
    const data = (await FetchGetAuth("/messages/conversations")) as Conversation[];
    setConversations((current) => (areConversationsEqual(current, data) ? current : data));
    return data;
  }, []);

  const fetchConversationMessages = useCallback(
    async (userId: number) => (await FetchGetAuth(`/messages/conversations/${userId}?limit=100`)) as ApiMessage[],
    [],
  );

  const markConversationReadIfNeeded = useCallback(
    async (userId: number, items: ApiMessage[]) => {
      if (!hasUnreadIncomingMessages(items)) return;
      if (markingReadIdsRef.current.has(userId)) return;

      markingReadIdsRef.current.add(userId);
      try {
        await FetchPatchAuth(`/messages/conversations/${userId}/read`);
        await refreshConversations().catch(() => undefined);
      } finally {
        markingReadIdsRef.current.delete(userId);
      }
    },
    [refreshConversations],
  );

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setLoadingConversations(true);
      try {
        const data = await refreshConversations();
        if (!alive) return;

        const fromUrl = Number.isFinite(requestedUserId) ? requestedUserId : null;
        const hasRequestedUser = fromUrl != null && data.some((conversation) => conversation.user.id === fromUrl);
        const nextSelectedId = hasRequestedUser ? fromUrl : data[0]?.user.id ?? null;

        setSelectedId(nextSelectedId);
        if (!hasRequestedUser && nextSelectedId != null) {
          router.replace(`/messages?userId=${nextSelectedId}`, { scroll: false });
        }
      } catch {
        if (alive) {
          setConversations([]);
          setSelectedId(null);
        }
      } finally {
        if (alive) setLoadingConversations(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [refreshConversations, requestedUserId, router]);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      if (document.hidden) return;

      try {
        await refreshConversations();
      } catch {
        // Keep the current list visible during transient polling failures.
      }
    }, CONVERSATION_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [refreshConversations]);

  useEffect(() => {
    if (selectedId == null) {
      setMessages([]);
      return;
    }

    let alive = true;

    const run = async () => {
      setLoadingMessages(true);
      try {
        const data = await fetchConversationMessages(selectedId);
        if (!alive) return;

        setMessages((current) => (areMessagesEqual(current, data) ? current : data));
        void markConversationReadIfNeeded(selectedId, data);
      } catch {
        if (alive) {
          setMessages([]);
        }
      } finally {
        if (alive) setLoadingMessages(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [selectedId, fetchConversationMessages, markConversationReadIfNeeded]);

  useEffect(() => {
    if (selectedId == null) return;

    let alive = true;
    const interval = window.setInterval(async () => {
      if (document.hidden) return;

      try {
        const data = await fetchConversationMessages(selectedId);
        if (!alive) return;

        setMessages((current) => (areMessagesEqual(current, data) ? current : data));
        void markConversationReadIfNeeded(selectedId, data);
      } catch {
        // Keep the current chat visible during transient polling failures.
      }
    }, MESSAGE_POLL_INTERVAL_MS);

    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, [selectedId, fetchConversationMessages, markConversationReadIfNeeded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages.length, selectedId]);

  const selectConversation = (userId: number) => {
    if (selectedId === userId) return;
    setSelectedId(userId);
    router.replace(`/messages?userId=${userId}`, { scroll: false });
  };

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || selectedId == null || sending) return;

    setSending(true);
    try {
      const message = (await FetchPostAuth("/messages", { recipientId: selectedId, body })) as ApiMessage;
      setMessages((current) => [...current, message]);
      setDraft("");
      await refreshConversations().catch(() => undefined);
    } catch {
    } finally {
      setSending(false);
    }
  };

  return (
    <RequireLogin>
      <AppShell showPageHeader={false}>
        <section className="grid h-[calc(100vh-8.5rem)] min-h-0 gap-5 overflow-hidden lg:grid-cols-[300px_minmax(0,1fr)_280px]">
          <aside className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] border border-(--border) bg-(--surface) p-4 shadow-(--shadow)">
            <h1 className="px-2 pb-4 text-3xl font-semibold">메시지</h1>
            <div className="themed-scrollbar grid min-h-0 auto-rows-max content-start gap-3 overflow-x-hidden overflow-y-auto pr-1">
              {loadingConversations ? <p className="px-2 text-sm text-(--muted-strong)">대화 목록을 불러오는 중입니다.</p> : null}
              {!loadingConversations && conversations.length === 0 ? (
                <p className="px-2 text-sm leading-6 text-(--muted-strong)">친구 목록에서 채팅 버튼을 눌러 대화를 시작해 주세요.</p>
              ) : null}
              {conversations.map((conversation) => {
                const friend = conversation.user;
                const selected = friend.id === selectedId;

                return (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => selectConversation(friend.id)}
                    className={[
                      "grid h-[112px] gap-3 overflow-hidden border p-4 text-left transition duration-150",
                      selected
                        ? "border-(--accent) bg-(--accent-soft)"
                        : "border-(--border) bg-(--surface-raised) hover:border-(--accent)",
                    ].join(" ")}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar user={friend} />
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                          <strong className="min-w-0 truncate text-base">{friend.nickname}</strong>
                          <span className="shrink-0 border border-(--border) bg-(--surface-soft) px-2 py-0.5 text-xs text-(--muted-strong)">
                            {getMajor(friend)}
                          </span>
                          {conversation.unreadCount > 0 ? (
                            <span className="shrink-0 rounded-full bg-(--accent) px-2 py-0.5 text-xs font-semibold text-(--primary-foreground)">
                              {conversation.unreadCount}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 w-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap pr-1 text-sm leading-5 text-(--muted-strong)">
                          {conversation.lastMessage?.body ?? getDescription(friend)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden border border-(--border) bg-(--surface) shadow-(--shadow)">
            <header className="border-b border-(--border) p-5">
              {selectedUser ? (
                <div className="flex items-center gap-3">
                  <Avatar user={selectedUser} />
                  <div>
                    <h2 className="text-xl font-semibold">{selectedUser.nickname}</h2>
                    <p className="text-sm text-(--muted-strong)">{getMajor(selectedUser)}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-semibold">대화 선택</h2>
                  <p className="text-sm text-(--muted-strong)">채팅할 친구를 선택해 주세요.</p>
                </div>
              )}
            </header>

            <div className="themed-scrollbar min-h-0 space-y-3 overflow-x-hidden overflow-y-auto p-5">
              {loadingMessages ? <p className="text-sm text-(--muted-strong)">메시지를 불러오는 중입니다.</p> : null}
              {!loadingMessages && selectedUser && messages.length === 0 ? (
                <p className="text-sm text-(--muted-strong)">아직 주고받은 메시지가 없습니다.</p>
              ) : null}
              {messages.map((message) => (
                <div key={message.id} className={["flex min-w-0", message.mine ? "justify-end" : "justify-start"].join(" ")}>
                  <div
                    className={[
                      "min-w-0 max-w-[72%] overflow-hidden border px-4 py-3 text-sm leading-6",
                      message.mine
                        ? "border-(--accent) bg-(--accent) text-(--primary-foreground)"
                        : "border-(--border) bg-(--surface-raised) text-(--foreground)",
                    ].join(" ")}
                  >
                    <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{message.body}</p>
                    <p className="mt-1 text-xs opacity-70">{formatMessageTime(message.createdAt)}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={submitMessage} className="flex gap-2 border-t border-(--border) p-4">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={selectedUser ? "메시지 입력" : "대화를 선택해 주세요"}
                disabled={!selectedUser || sending}
                className="h-12 min-w-0 flex-1 rounded-full border border-(--border) bg-(--surface-raised) px-4 text-sm outline-none focus:border-(--accent) disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!selectedUser || !draft.trim() || sending}
                className="h-12 border border-(--accent) bg-(--accent) px-5 text-sm font-semibold text-(--primary-foreground) disabled:cursor-not-allowed disabled:opacity-50"
              >
                전송
              </button>
            </form>
          </main>

          <aside className="themed-scrollbar min-h-0 overflow-y-auto border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
            {selectedUser ? (
              <div className="grid gap-4">
                <Avatar user={selectedUser} size="lg" />
                <div>
                  <h2 className="text-2xl font-semibold">{selectedUser.nickname}</h2>
                  <p className="mt-1 text-sm font-semibold text-(--accent)">{getMajor(selectedUser)}</p>
                </div>
                <p className="text-sm leading-6 text-(--muted-strong)">{getDescription(selectedUser)}</p>
              </div>
            ) : (
              <p className="text-sm leading-6 text-(--muted-strong)">선택된 대화가 없습니다.</p>
            )}
          </aside>
        </section>
      </AppShell>
    </RequireLogin>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesContent />
    </Suspense>
  );
}
