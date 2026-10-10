import "./app.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { startAccount } from "./cloud/account";
import { installBackButton } from "./native";

installBackButton();
startAccount();

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
