import type { Reward } from "@/services/data/reducers";

export type ToastKind = "success" | "error" | "info";
export interface ToastMsg {
  id: number;
  kind: ToastKind;
  title: string;
  detail?: string;
  action?: { label: string; onClick: () => void };
}

type Handler<T> = (v: T) => void;

class Bus<T> {
  private hs = new Set<Handler<T>>();
  on(h: Handler<T>) {
    this.hs.add(h);
    return () => {
      this.hs.delete(h);
    };
  }
  emit(v: T) {
    this.hs.forEach((h) => h(v));
  }
}

export const toastBus = new Bus<ToastMsg>();
export const rewardBus = new Bus<Reward[]>();

let counter = 0;
const push = (kind: ToastKind, title: string, detail?: string, action?: ToastMsg["action"]) => toastBus.emit({ id: ++counter, kind, title, detail, action });

export const toast = {
  success: (title: string, detail?: string) => push("success", title, detail),
  error: (title: string, detail?: string) => push("error", title, detail),
  info: (title: string, detail?: string, action?: ToastMsg["action"]) => push("info", title, detail, action),
};
