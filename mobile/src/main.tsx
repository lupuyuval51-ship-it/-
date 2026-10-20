import "./app.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { startAccount } from "./cloud/account";
import { installGoogleDeepLink } from "./cloud/google-native";
import { installNativeShell } from "./native";
import { refreshPlan } from "./billing/play";
import { setDefaultOfflinePlan } from "@/lib/offline/entitlement";

// A real install is Free until Google Play says otherwise; the test build keeps everything open.
setDefaultOfflinePlan(import.meta.env.MODE === "e2e" ? "PRO" : "FREE");
installNativeShell();
void refreshPlan();
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") void refreshPlan(); });
startAccount();
installGoogleDeepLink();

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
