import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { syncBootId } from "./lib/boot";
import "./index.css";

// The store reads localStorage on mount, so the API restart check runs first.
syncBootId().then((result) => {
  if (result === "offline") console.warn("API'ye ulaşılamadı; mockup verisiyle devam ediliyor.");
  createRoot(document.getElementById("root")!).render(<App />);
});
