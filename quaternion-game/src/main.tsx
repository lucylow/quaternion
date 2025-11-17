import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Enable mock replay API if env var is set
if (import.meta.env.VITE_USE_REPLAY_MOCK === 'true') {
  import('./mocks/replayMockServer').then(({ setupMockReplayAPI }) => {
    setupMockReplayAPI();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
