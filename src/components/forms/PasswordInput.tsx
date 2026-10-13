"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";
import { useT } from "@/components/I18nProvider";
import { Input } from "@/components/ui";

/**
 * A password field with a show/hide button (typing 10+ characters on a phone keyboard is error-prone). The field is
 * always left-to-right, so the button sits on the right in both languages. `Field` passes id/aria props straight through.
 */
export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "dir">) {
  const t = useT();
  const [shown, setShown] = useState(false);
  return (
    <div dir="ltr" className="relative">
      <Input {...props} type={shown ? "text" : "password"} dir="ltr" className="pe-12" />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-pressed={shown}
        aria-label={shown ? t("auth.password.hide") : t("auth.password.show")}
        className="absolute end-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-text"
      >
        {shown ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
      </button>
    </div>
  );
}
