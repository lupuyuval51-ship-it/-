"use client";

import { useEffect, useState } from "react";
import { keyboardInset } from "./hudLayout";

/** Pixels of the page covered by the on-screen keyboard (0 when there is none, or when the page itself resizes for it). */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setInset(keyboardInset(window.innerHeight, vv));
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    // The inset is measured against the layout viewport (`innerHeight`), so its changes count too: when the page itself shrinks
    // to the visible part after the keyboard is up (a WebView that resizes late), the visual viewport keeps its height and fires
    // nothing, and the sheet would stay lifted over an empty band.
    window.addEventListener("resize", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return inset;
}
