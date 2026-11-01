import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface ToastItem { id: number; text: string; tone?: 'ok' | 'error' }
const Ctx = createContext<{ push: (text: string, tone?: 'ok' | 'error') => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }): ReactNode {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((text: string, tone?: 'ok' | 'error') => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x.slice(-2), { id, text, ...(tone ? { tone } : {}) }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 4000);
  }, []);
  const v = useMemo(() => ({ push }), [push]);
  return (
    <Ctx.Provider value={v}>
      {children}
      <div className="toasts" aria-live="polite">{items.map((i) => <div key={i.id} className={`toast ${i.tone ?? ''}`} role="status">{i.text}</div>)}</div>
    </Ctx.Provider>
  );
}
export function useToast(): (text: string, tone?: 'ok' | 'error') => void { const c = useContext(Ctx); return c ? c.push : () => undefined; }
