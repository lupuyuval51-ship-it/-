import "./app.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { getAccountSnapshot, onAccountReady, startAccount } from "./cloud/account";
import { installGoogleDeepLink } from "./cloud/google-native";
import { installNativeShell } from "./native";
import { refreshPlan, setSessionProvider } from "./billing/play";
import { setDefaultOfflinePlan } from "@/lib/offline/entitlement";

// A real install is Free until Google Play says otherwise; the test build keeps everything open.
setDefaultOfflinePlan(import.meta.env.MODE === "e2e" ? "PRO" : "FREE");
installNativeShell();
// Ask the WebView to keep the learner's games and progress: the system may then not clear them when the phone is low on space.
void navigator.storage?.persist?.().catch(() => undefined);
setSessionProvider(() => getAccountSnapshot().session);
void refreshPlan();
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") void refreshPlan(); });
// a sign-in that appears after the start (or is restored a moment later) lets the server check the purchases Play already listed
onAccountReady(() => void refreshPlan());
startAccount();
installGoogleDeepLink();

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
