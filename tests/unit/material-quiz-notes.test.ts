import { describe, expect, it } from "vitest";
import { parseMaterial } from "@/lib/game/material/parse";
import { generateOffline } from "@/lib/offline/generate";
import { request } from "./helpers";

const QUIZ = `Quiz – the solar system
1. Which planet is closest to the Sun?
A. Venus
B. Mercury
C. Mars
Answer: B
2. Which planet is known as the Red Planet?
A. Mars
B. Jupiter
C. Saturn
Answer: A
3. What is the largest planet? Jupiter
4. How many planets are in the solar system? 8
5. Which planet has the most famous rings? Saturn`;

describe("a numbered quiz is questions, not steps", () => {
  it("every question is read with its answer, without its number", () => {
    const k = parseMaterial(QUIZ);
    expect(k.qa.map((q) => [q.question, q.answer])).toEqual([
      ["Which planet is closest to the Sun?", "Mercury"],
      ["Which planet is known as the Red Planet?", "Mars"],
      ["What is the largest planet?", "Jupiter"],
      ["How many planets are in the solar system?", "8"],
      ["Which planet has the most famous rings?", "Saturn"],
    ]);
    expect(k.steps).toEqual([]);
  });

  it("so the quiz makes a game", () => {
    const { spec } = generateOffline(request({ material: QUIZ, subject: "Solar system", mode: "FAST" }));
    expect(spec.challenges.length).toBeGreaterThanOrEqual(3);
    for (const c of spec.challenges) expect(c.prompt, c.id).not.toMatch(/^\d+\.\s/);
  });

  it("a list of steps with one question in it stays a list of steps", () => {
    const k = parseMaterial("How to pick fruit:\n1. Look at the colour of the fruit.\n2. Ask yourself: is it ripe? If yes, pick it.\n3. Put it gently in the basket.\n4. Wash it before you eat it.");
    expect(k.steps.flat().length).toBe(4);
    expect(k.qa).toEqual([]);
  });
});
