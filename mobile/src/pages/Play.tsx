import PlayClient from "@/components/game/PlayClient";
import { useT } from "@/components/I18nProvider";
import { store, transport, useSettings } from "../app-state";

export function PlayPage({ gameId }: { gameId: string }) {
  const t = useT();
  const { sound, music } = useSettings();
  if (!store.getGame(gameId)) return <p role="alert" className="p-6 text-center">{t("mob.notfound")} <a className="underline" href="#/">{t("mob.back")}</a></p>;
  return <PlayClient gameId={gameId} soundDefault={sound} musicDefault={music} transport={transport} />;
}
