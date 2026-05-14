"use client";

import { FormEvent, useState } from "react";
import { AppShell } from "@/components/devtalk/app-shell";

type Friend = {
  id: string;
  name: string;
  major: string;
  description: string;
  accent: string;
};

type Message = {
  id: string;
  friendId: string;
  sender: "me" | "friend";
  body: string;
  time: string;
};

const friends: Friend[] = [
  {
    id: "minjae",
    name: "김민재",
    major: "프론트엔드",
    description: "Next.js 배포와 라우트 캐시 문제를 자주 정리하는 개발자입니다. UI 상태와 API 응답 사이에서 발생하는 엇갈림을 꼼꼼하게 기록합니다.",
    accent: "#2563ff",
  },
  {
    id: "seoyeon",
    name: "이서연",
    major: "백엔드",
    description: "API 에러 로그, 재현 절차, 데이터 정합성 문제를 중심으로 해결 과정을 공유합니다.",
    accent: "#14b8a6",
  },
  {
    id: "hyunwoo",
    name: "박현우",
    major: "DevOps",
    description: "운영 환경 장애 대응과 배포 자동화 이슈를 정리합니다.",
    accent: "#f97316",
  },
  {
    id: "jiyun",
    name: "최지윤",
    major: "QA 엔지니어링",
    description: "회귀 테스트와 사용자 흐름 검증에서 발견한 문제를 기록합니다.",
    accent: "#7c3aed",
  },
];

const initialMessages: Message[] = [
  {
    id: "m1",
    friendId: "minjae",
    sender: "friend",
    body: "어제 말한 라우트 캐시 문제는 재현 조건을 찾았어요.",
    time: "오전 10:12",
  },
  {
    id: "m2",
    friendId: "minjae",
    sender: "me",
    body: "좋아요. 수정 범위랑 무효화 타이밍을 같이 볼게요.",
    time: "오전 10:15",
  },
  {
    id: "m3",
    friendId: "seoyeon",
    sender: "friend",
    body: "500 응답 로그를 정리해서 보냈습니다.",
    time: "어제",
  },
  {
    id: "m4",
    friendId: "hyunwoo",
    sender: "friend",
    body: "배포 전 헬스체크를 하나 더 추가해보면 어떨까요?",
    time: "월요일",
  },
];

function Avatar({ friend, size = "md" }: { friend: Friend; size?: "md" | "lg" }) {
  return (
    <div
      className={[
        "grid flex-none place-items-center rounded-full font-bold text-white",
        size === "lg" ? "size-16 text-xl" : "size-12 text-base",
      ].join(" ")}
      style={{ backgroundColor: friend.accent }}
    >
      {friend.name.slice(0, 1)}
    </div>
  );
}

export default function MessagesPage() {
  const [selectedId, setSelectedId] = useState(friends[0].id);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const selectedFriend = friends.find((friend) => friend.id === selectedId) ?? friends[0];
  const selectedMessages = messages.filter((message) => message.friendId === selectedFriend.id);

  const submitMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;

    setMessages((current) => [
      ...current,
      {
        id: `local-${Date.now()}`,
        friendId: selectedFriend.id,
        sender: "me",
        body,
        time: "방금",
      },
    ]);
    setDraft("");
  };

  return (
    <AppShell showPageHeader={false}>
      <section className="grid h-[calc(100vh-8.5rem)] min-h-0 gap-5 overflow-hidden lg:grid-cols-[300px_minmax(0,1fr)_280px]">
        <aside className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] border border-(--border) bg-(--surface) p-4 shadow-(--shadow)">
          <h1 className="px-2 pb-4 text-3xl font-semibold">메시지</h1>
          <div className="themed-scrollbar grid min-h-0 gap-3 overflow-y-auto pr-1">
            {friends.map((friend) => {
              const selected = friend.id === selectedFriend.id;

              return (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => setSelectedId(friend.id)}
                  className={[
                    "grid min-h-[112px] gap-3 border p-4 text-left transition duration-150",
                    selected
                      ? "border-(--accent) bg-(--accent-soft)"
                      : "border-(--border) bg-(--surface-raised) hover:border-(--accent)",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <Avatar friend={friend} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-base">{friend.name}</strong>
                        <span className="border border-(--border) bg-(--surface-soft) px-2 py-0.5 text-xs text-(--muted-strong)">
                          {friend.major}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-(--muted-strong)">{friend.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden border border-(--border) bg-(--surface) shadow-(--shadow)">
          <header className="border-b border-(--border) p-5">
            <div className="flex items-center gap-3">
              <Avatar friend={selectedFriend} />
              <div>
                <h2 className="text-xl font-semibold">{selectedFriend.name}</h2>
                <p className="text-sm text-(--muted-strong)">{selectedFriend.major}</p>
              </div>
            </div>
          </header>

          <div className="themed-scrollbar min-h-0 space-y-3 overflow-y-auto p-5">
            {selectedMessages.map((message) => (
              <div
                key={message.id}
                className={["flex", message.sender === "me" ? "justify-end" : "justify-start"].join(" ")}
              >
                <div
                  className={[
                    "max-w-[72%] border px-4 py-3 text-sm leading-6",
                    message.sender === "me"
                      ? "border-(--accent) bg-(--accent) text-(--primary-foreground)"
                      : "border-(--border) bg-(--surface-raised) text-(--foreground)",
                  ].join(" ")}
                >
                  <p>{message.body}</p>
                  <p className="mt-1 text-xs opacity-70">{message.time}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={submitMessage} className="flex gap-2 border-t border-(--border) p-4">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="메시지 입력"
              className="h-12 min-w-0 flex-1 rounded-full border border-(--border) bg-(--surface-raised) px-4 text-sm outline-none focus:border-(--accent)"
            />
            <button
              type="submit"
              className="h-12 border border-(--accent) bg-(--accent) px-5 text-sm font-semibold text-(--primary-foreground)"
            >
              전송
            </button>
          </form>
        </main>

        <aside className="themed-scrollbar min-h-0 overflow-y-auto border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
          <div className="grid gap-4">
            <Avatar friend={selectedFriend} size="lg" />
            <div>
              <h2 className="text-2xl font-semibold">{selectedFriend.name}</h2>
              <p className="mt-1 text-sm font-semibold text-(--accent)">{selectedFriend.major}</p>
            </div>
            <p className="text-sm leading-6 text-(--muted-strong)">{selectedFriend.description}</p>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
