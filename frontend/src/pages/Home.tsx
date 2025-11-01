import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listThemes } from "../lib/api";
import ContentCard from "../components/ContentCard";

type ThemeItem = { slug: string; title?: string | null };

export default function Home() {
  const [themes, setThemes] = useState<ThemeItem[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    listThemes()
      .then((j) => !stop && setThemes(j.themes ?? []))
      .catch((e) => !stop && setErr(e instanceof Error ? e.message : String(e)));
    return () => { stop = true; };
  }, []);

  return (
    <div className="stack-lg" style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <ContentCard style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Bienvenue 👋</h1>
        <p style={{ color: "var(--muted)", marginTop: 8 }}>
          Choisis un mode d’apprentissage : <b>QCM</b> pour réviser, <b>Flashcards</b> pour apprendre, 
          <b>Progression</b> pour suivre tes scores. Interface propre, mobile-first.
        </p>
        {err && <div style={{ color: "crimson", marginTop: 8 }}>Erreur: {err}</div>}
      </ContentCard>

      <section className="tiles" style={{ marginBottom: 16 }}>
        <Link to="/qcm" className="tile c1" aria-label="QCM - Réviser par quiz">
          <div className="title">QCM</div>
          <div className="desc">Réviser par quiz</div>
        </Link>

        <Link to="/flashcards" className="tile c2" aria-label="Flashcards - Apprendre par cartes">
          <div className="title">Flashcards</div>
          <div className="desc">Apprendre par cartes</div>
        </Link>

        <Link to="/progress" className="tile c3" aria-label="Progression - Vue d’ensemble">
          <div className="title">Progression</div>
          <div className="desc">Vue d’ensemble + reset</div>
        </Link>

        <Link to="/labs" className="tile c4" aria-label="Labs (WIP)">
          <div className="title">Labs (WIP)</div>
          <div className="desc">Bientôt disponible</div>
        </Link>
      </section>

      <ContentCard>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Thèmes disponibles</h2>
        {themes.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>Aucun thème pour le moment.</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {themes.map(t => <li key={t.slug}>{t.title ?? t.slug}</li>)}
          </ul>
        )}
      </ContentCard>
    </div>
  );
}
