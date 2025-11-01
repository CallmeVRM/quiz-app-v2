import { useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import Toaster from "./components/Toaster";


function useTheme() {
  useEffect(() => {
    // Force le thème violet
    document.documentElement.setAttribute("data-theme", "metro-purple");
  }, []);
}

export default function App() {
  useTheme();

  return (
    <div>
      <a href="#content" className="hidden-visually">Aller au contenu</a>

      <header className="topbar">
        <div className="container topbar-row">
          <div className="brand" aria-label="EduLabs">
            <span className="dot" />
            <span>EduLabs</span>
          </div>

          <nav className="nav" aria-label="Navigation principale">
            <NavLink to="/" end className={({isActive}) => isActive ? "active" : undefined}>Accueil</NavLink>
            <NavLink to="/qcm" className={({isActive}) => isActive ? "active" : undefined}>QCM</NavLink>
            <NavLink to="/flashcards" className={({isActive}) => isActive ? "active" : undefined}>Flashcards</NavLink>
            <NavLink to="/progress" className={({isActive}) => isActive ? "active" : undefined}>Progression</NavLink>
            <NavLink to="/labs" className={({isActive}) => isActive ? "active" : undefined}>Labs</NavLink>
          </nav>
        </div>
      </header>

      <main id="content" className="container" style={{ padding: 16 }}>
        <Outlet />
      </main>
    <Toaster />
   </div>
  );
}
