"use client";
import { useState } from "react";
import { useApp } from "./context";
import { Button, Notice, Field } from "./ui";
import { api } from "@/lib/client";
import { Lightbulb, Check } from "lucide-react";
export default function Reinforcement({ enrollment }: { enrollment: any }) {
  const { t, l, locale, setState, toast } = useApp();
  const [text, setText] = useState("");
  const [answer, setAnswer] = useState<number>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const reinforcement = enrollment.adaptation?.reinforcement;
  if (!reinforcement || reinforcement.status === "completed") return null;
  return (
    <section className="reinforcement">
      <div className="section-heading">
        <h2>
          <Lightbulb size={20} /> {t("reinforcement")}
        </h2>
        <span className="tag">
          {reinforcement.minutes} {t("minutes")} · +{reinforcement.xp} XP
        </span>
      </div>
      <h3>{l(reinforcement.title)}</h3>
      <p>{l(reinforcement.description)}</p>
      <ol className="instructions">
        {reinforcement.instructions?.[locale]?.map(
          (line: string, i: number) => (
            <li key={i}>{line}</li>
          ),
        )}
      </ol>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const r = await api("/tasks/reinforcement", {
              enrollmentId: enrollment.id,
              answer,
              text,
            });
            setState(r.state);
            toast(t("saved"));
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {reinforcement.question && (
          <fieldset>
            <legend>{l(reinforcement.question.prompt)}</legend>
            {reinforcement.question.options[locale].map(
              (option: string, i: number) => (
                <label className="option" key={i}>
                  <input
                    type="radio"
                    name="reinforce-answer"
                    required
                    checked={answer === i}
                    onChange={() => setAnswer(i)}
                  />
                  {option}
                </label>
              ),
            )}
          </fieldset>
        )}
        <Field label={t("answer")}>
          <textarea
            minLength={10}
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
          />
        </Field>
        {error && <Notice type="error">{error}</Notice>}
        <Button busy={busy}>
          <Check size={17} />
          {t("finishReinforcement")}
        </Button>
      </form>
    </section>
  );
}
