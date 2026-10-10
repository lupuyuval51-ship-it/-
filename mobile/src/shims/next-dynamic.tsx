import { lazy, Suspense, type ComponentType } from "react";

/** `next/dynamic` for the offline app (client-only anyway). */
export default function dynamic<P extends object>(loader: () => Promise<{ default: ComponentType<P> } | ComponentType<P>>, _opts?: unknown): ComponentType<P> {
  const Lazy = lazy(async () => {
    const m = await loader();
    return "default" in (m as object) ? (m as { default: ComponentType<P> }) : { default: m as ComponentType<P> };
  });
  return function Dynamic(props: P) {
    return <Suspense fallback={null}><Lazy {...props} /></Suspense>;
  };
}
