"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { pref, set } = useTheme();
  const next = pref === "light" ? "dark" : pref === "dark" ? "system" : "light";
  const label = pref === "light" ? "מצב בהיר – לחץ למצב כהה" : pref === "dark" ? "מצב כהה – לחץ למצב אוטומטי" : "מצב אוטומטי – לחץ למצב בהיר";
  return (
    <Button variant="ghost" size="icon-sm" aria-label={label} title={label} onClick={() => set(next)}>
      {pref === "light" ? <Sun /> : pref === "dark" ? <Moon /> : <Monitor />}
    </Button>
  );
}
