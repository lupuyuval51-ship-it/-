import "./app.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { startAccount } from "./cloud/account";
import { installGoogleDeepLink } from "./cloud/google-native";
import { installNativeShell } from "./native";

installNativeShell();
startAccount();
installGoogleDeepLink();

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
