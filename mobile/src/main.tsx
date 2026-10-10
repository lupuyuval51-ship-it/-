import "./app.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { installBackButton } from "./native";

installBackButton();

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
