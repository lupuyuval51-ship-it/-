"use client";

import { useState } from "react";
import { useT } from "@/components/I18nProvider";
import { Input } from "@/components/ui";
import { GameCardView, type GameCardData } from "./GameCardView";

/** A search box only appears once the library is long enough to need one. */
const SEARCH_FROM = 6;

/** The library grid with an instant title/subject filter (client-side only: the whole library is already on the page). */
export function LibraryGrid({ games }: { games: GameCardData[] }) {
  const t = useT();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLocaleLowerCase();
  const shown = needle ? games.filter((g) => `${g.title} ${g.subject}`.toLocaleLowerCase().includes(needle)) : games;
  return (
    <div className="space-y-4">
      {games.length >= SEARCH_FROM && (
        <div className="space-y-1.5">
          <label htmlFor="lib-search" className="sr-only">{t("lib.search")}</label>
          <Input id="lib-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("lib.search")} autoComplete="off" className="max-w-sm" data-testid="lib-search" />
          <p role="status" className="min-h-4 text-xs text-muted">{needle ? t("lib.search.count", { n: shown.length, total: games.length }) : ""}</p>
        </div>
      )}
      {shown.length === 0 ? (
        <p className="py-8 text-center text-muted" data-testid="lib-no-match">{t("lib.search.none")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="lib-grid">
          {shown.map((g) => <GameCardView key={g.id} game={g} t={t} />)}
        </div>
      )}
    </div>
  );
}
