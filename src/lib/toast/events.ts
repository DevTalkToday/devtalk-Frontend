"use client";

export type ToastTone = "error" | "success" | "info";

export type ToastPayload = {
  title?: string;
  message: string;
  tone?: ToastTone;
};

export const TOAST_EVENT = "devtalk-toast";

export const showToast = (payload: ToastPayload) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastPayload>(TOAST_EVENT, { detail: payload }));
};

export const showErrorToast = (message: string, title = "요청 실패") => {
  showToast({ title, message, tone: "error" });
};
