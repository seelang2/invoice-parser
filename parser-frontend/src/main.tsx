import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./app/App.tsx";

// Adjusted for strict null checks
const rootElem = document.getElementById("root");
if (rootElem)
  createRoot(rootElem).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
