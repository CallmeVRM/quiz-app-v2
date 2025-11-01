import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./ErrorBoundary";
import { notify } from "./store/toast";

import Home from "./pages/Home";
import QcmSelect from "./pages/QcmSelect";
import FlashSelect from "./pages/FlashSelect";
import ReviewStart from "./pages/review/Start";
import ReviewQuiz from "./pages/review/Quiz";
import LearnStart from "./pages/learn/Start";
import LearnFlashcards from "./pages/learn/Flashcards";
import ProgressPage from "./pages/Progress";
import LabsPage from "./pages/Labs";
import TestNewQuestions from "./pages/TestNewQuestions";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "qcm", element: <QcmSelect /> },
      { path: "qcm/start", element: <ReviewStart /> },
      { path: "qcm/run", element: <ReviewQuiz /> },
      { path: "flashcards", element: <FlashSelect /> },
      { path: "flashcards/start", element: <LearnStart /> },
      { path: "flashcards/run", element: <LearnFlashcards /> },
      { path: "progress", element: <ProgressPage /> },
      { path: "labs", element: <LabsPage /> },
      { path: "test-questions", element: <TestNewQuestions /> },
    ]
  },
  { path: "*", element: <div style={{ padding: 16 }}>404 Not Found</div> }
]);

window.addEventListener("error", (e) => {
  if (!(e as any).__handled) notify.error("Erreur d’exécution. Consulte la console.");
  (e as any).__handled = true;
});
window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => {
  const msg =
    (e.reason && (e.reason.message || e.reason.statusText || String(e.reason))) ||
    "Erreur réseau ou requête échouée.";
  notify.error(msg);
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </React.StrictMode>
);
