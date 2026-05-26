"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buttonClassName } from "@/components/ui";
import { FetchGetAuth, FetchPostAuth } from "@/lib/api/fetch";
import { clearAuthSession, getAuthUser, issueFreshGuestToken, useAuthStatus } from "@/lib/auth/session";

type AppShellProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  sidebar?: ReactNode;
  showPageHeader?: boolean;
  compactRadius?: boolean;
  children: ReactNode;
};

type ShellAuthUser = {
  username?: string | null;
  nickname?: string | null;
  avatarUrl?: string | null;
};

type ProfileMeResponse = {
  user: ShellAuthUser | null;
};

const primaryNavItems = [
  { href: "/", label: "홈", icon: "/home.svg" },
  { href: "/posts", label: "목록", icon: "/list.svg" },
  { href: "/friends", label: "친구", icon: "/friend.svg" },
  { href: "/messages", label: "메시지", icon: "/chat.svg" },
  { href: "/notifications", label: "알림", icon: "/bell.svg" },
];

const isActivePath = (pathname: string, href: string) => {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
};

const asShellAuthUser = (value: unknown): ShellAuthUser | null => {
  if (!value || typeof value !== "object") return null;
  return value as ShellAuthUser;
};

export function AppShell({
  title,
  description,
  actions,
  sidebar,
  showPageHeader = true,
  compactRadius = true,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [shellUser, setShellUser] = useState<ShellAuthUser | null>(null);
  const { ready: authReady, loggedIn } = useAuthStatus();
  const authUser = shellUser ?? (authReady && loggedIn ? asShellAuthUser(getAuthUser()) : null);
  const profileName = authUser?.nickname?.trim() || authUser?.username?.trim() || "U";
  const profileAvatarUrl = authUser?.avatarUrl?.trim() || "";
  const profileInitial = profileName.slice(0, 1).toUpperCase() || "U";

  useEffect(() => {
    let alive = true;

    const syncProfile = async () => {
      if (!authReady || !loggedIn) {
        setShellUser(null);
        return;
      }

      setShellUser(asShellAuthUser(getAuthUser()));

      try {
        const profile = (await FetchGetAuth("/profile/me")) as ProfileMeResponse;
        if (alive) setShellUser(asShellAuthUser(profile.user));
      } catch {
        if (alive) setShellUser(asShellAuthUser(getAuthUser()));
      }
    };

    syncProfile();
    window.addEventListener("storage", syncProfile);
    window.addEventListener("devtalk-auth-changed", syncProfile);

    return () => {
      alive = false;
      window.removeEventListener("storage", syncProfile);
      window.removeEventListener("devtalk-auth-changed", syncProfile);
    };
  }, [authReady, loggedIn]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    const keyword = search.trim();

    if (keyword) params.set("q", keyword);
    params.set("sort", "latest");
    params.set("page", "1");

    router.push(params.toString() ? `/?${params.toString()}` : "/");
  };

  const handleAuthButton = async () => {
    if (!loggedIn) {
      router.push("/login");
      return;
    }

    try {
      await FetchPostAuth("/auth/logout");
    } catch {
      // The local session should still be cleared even if the server token is already gone.
    } finally {
      clearAuthSession();
      await issueFreshGuestToken().catch(() => undefined);
      router.push("/");
    }
  };

  return (
    <div className={["min-h-screen overflow-x-clip px-4 py-4 md:px-6 lg:px-8", compactRadius ? "compact-radius" : ""].join(" ")}>
      <div className="mx-auto grid max-w-[1500px] gap-6">
        <div className="sticky top-4 z-20">
          <div className="pointer-events-none absolute bottom-[-1rem] left-1/2 top-[-1rem] z-0 w-screen -translate-x-1/2 bg-transparent backdrop-blur-[14px] backdrop-saturate-150" />
          <header
            className={[
              "relative z-10 border border-(--border) bg-(--surface) px-4 py-3 shadow-(--shadow) backdrop-blur-[18px]",
              compactRadius ? "rounded-[14px]" : "rounded-[28px]",
            ].join(" ")}
          >
          <div className="grid gap-3 xl:grid-cols-[auto_minmax(260px,1fr)_auto] xl:items-center">
            <nav aria-label="주요 메뉴" className="flex flex-wrap items-center gap-2">
              {primaryNavItems.map((item) => {
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    aria-label={item.label}
                    className={[
                      "inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border px-3 text-sm font-semibold transition duration-150",
                      active
                        ? "border-(--accent) bg-(--accent-soft) text-(--foreground)"
                        : "border-(--border) bg-(--surface-raised) text-(--muted-strong) hover:-translate-y-px hover:border-(--accent) hover:text-(--foreground)",
                    ].join(" ")}
                  >
                    <Image src={item.icon} alt="" width={16} height={16} className="theme-icon size-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}

              <Link
                href="/profile"
                title="프로필"
                aria-label="프로필"
                className={[
                  "inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-(--border) bg-(--surface-raised) text-sm font-bold text-(--foreground) transition duration-150 hover:-translate-y-px hover:border-(--accent)",
                  isActivePath(pathname, "/profile") ? "border-(--accent) bg-(--accent-soft)" : "",
                ].join(" ")}
              >
                {profileAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profileAvatarUrl} alt="" className="size-7 rounded-full object-cover" />
                ) : (
                  <span className="grid size-7 place-items-center rounded-full bg-(--accent) text-xs text-(--primary-foreground)">
                    {profileInitial}
                  </span>
                )}
              </Link>
            </nav>

            <form onSubmit={submitSearch} className="relative">
              <Image
                src="/search.svg"
                alt=""
                width={16}
                height={16}
                className="theme-icon pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 opacity-70"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="게시글 검색"
                aria-label="게시글 검색"
                className="h-12 w-full rounded-full border border-(--border) bg-(--surface-raised) px-11 text-sm text-(--foreground) outline-none transition focus:border-(--accent) focus:bg-(--surface-soft)"
              />
            </form>

            <div className="flex flex-wrap items-center justify-start gap-2 xl:justify-end">
              <ThemeToggle />
              <Link
                href="/settings"
                title="설정"
                aria-label="설정"
                className="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-(--border) bg-(--surface-raised) transition duration-150 hover:-translate-y-px hover:border-(--accent)"
              >
                <Image src="/config.svg" alt="" width={16} height={16} className="theme-icon size-4" />
              </Link>
              <button type="button" onClick={handleAuthButton} className={buttonClassName({ size: "sm" })}>
                {authReady ? (loggedIn ? "로그아웃" : "로그인") : "로그인"}
              </button>
            </div>
          </div>
          </header>
        </div>

        <main className="space-y-6">
          {showPageHeader && title ? (
            <section className="grid gap-4 rounded-[28px] border border-(--border) bg-(--surface) p-6 shadow-(--shadow) backdrop-blur-[18px] md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold md:text-4xl">{title}</h1>
                {description ? <p className="max-w-3xl text-sm leading-6 text-(--muted-strong)">{description}</p> : null}
              </div>
              {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
            </section>
          ) : null}

          {sidebar ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
              <div className="space-y-6">{children}</div>
              <aside className="space-y-4 xl:sticky xl:top-24">{sidebar}</aside>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
