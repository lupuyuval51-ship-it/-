import { useEffect } from "react";
import { PracticeClient } from "@/components/game/PracticeClient";
import { ResultsView } from "@/components/games/ResultsView";
import { ReviewView } from "@/components/games/ReviewView";
import { useT } from "@/components/I18nProvider";
import { primaryLink, StateView } from "@/components/ui/StateView";
import { store, transport } from "../app-state";
import { navigate } from "../router";

function useResults(gameId: string, sessionId: string) {
  const r = store.results(sessionId);
  return r && r.game.id === gameId ? r : null;
}

/** A deleted game or a stale link: say so, and offer the way back as a proper 44px button. */
function Missing() {
  const t = useT();
  return (
    <StateView
      kind="notfound"
      data-testid="results-missing"
      title={t("mob.notfound")}
      text={t("mob.notfound.text")}
      actions={<a href="#/" className={primaryLink}>{t("res.library")}</a>}
    />
  );
}

export function ResultsPage({ gameId, sessionId }: { gameId: string; sessionId: string }) {
  const t = useT();
  const r = useResults(gameId, sessionId);
  if (!r) return <Missing />;
  return <ResultsView t={t} s={r.summary} game={{ id: r.game.id, title: r.game.title }} sessionId={sessionId} conclusion={r.game.spec.learning.conclusion} review={r.review} libraryHref="/" />;
}

export function ReviewPage({ gameId, sessionId }: { gameId: string; sessionId: string }) {
  const t = useT();
  const r = useResults(gameId, sessionId);
  if (!r) return <Missing />;
  return <ReviewView t={t} id={gameId} sessionId={sessionId} review={r.review} />;
}

export function PracticePage({ gameId, sessionId }: { gameId: string; sessionId: string }) {
  const r = useResults(gameId, sessionId);
  const empty = !r || r.review.length === 0;
  useEffect(() => { if (r && empty) navigate(`/games/${gameId}/results/${sessionId}/review`, true); }, [r, empty, gameId, sessionId]);
  if (!r) return <Missing />;
  if (empty) return null;
  return <PracticeClient gameId={gameId} sessionId={sessionId} transport={transport} />;
}
