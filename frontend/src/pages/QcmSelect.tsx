import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  listThemes, getTheme, getCategory,
  type ThemeItem, type CategoryItem, type SubcategoryItem
} from "../lib/api";
import useReviewSession from "../store/sessionReview";
import MultiSelect from "../components/MultiSelect";
import ContentCard from "../components/ContentCard";

type SubWithCat = { category: string; sub: SubcategoryItem };

export default function QcmSelect() {
  const nav = useNavigate();
  const session = useReviewSession();
  const prevThemeRef = useRef<string>("");

  const [themes, setThemes] = useState<ThemeItem[]>([]);
  const [theme, setTheme] = useState<string>("");
  const [cats, setCats] = useState<CategoryItem[]>([]);
  const [selCats, setSelCats] = useState<string[]>([]);
  const [subs, setSubs] = useState<SubWithCat[]>([]);
  const [selSubs, setSelSubs] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Thèmes
  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const j = await listThemes();
        if (stop) return;
        setThemes(j.themes ?? []);
        
        // Restaurer SEULEMENT si le flag localStorage est activé
        const shouldRestore = session.shouldRestore();
        console.log('[QcmSelect] shouldRestore:', shouldRestore, 'theme:', session.selection.theme, 'subcats:', session.selection.subcategories);
        
        if (shouldRestore && session.selection.theme) {
          console.log('[QcmSelect] Restoring from session');
          setTheme(session.selection.theme);
          
          // Extraire les catégories parentes
          const parentCats = new Set<string>();
          session.selection.subcategories.forEach(tok => {
            const [cat] = tok.split("::");
            parentCats.add(cat);
          });
          setSelCats(Array.from(parentCats));
          setSelSubs(session.selection.subcategories);
          
          // Marquer comme restauré
          session.markRestored();
        } else {
          // Sinon, prendre le premier thème
          console.log('[QcmSelect] No restore, using first theme');
          if (j.themes && j.themes.length > 0) setTheme(j.themes[0].slug);
        }
      } catch (e) { if (!stop) setErr(e instanceof Error ? e.message : String(e)); }
      finally { if (!stop) setLoading(false); }
    })();
    return () => { stop = true; };
  }, []);

    // Catégories du thème
  useEffect(() => {
    if (!theme) { setCats([]); return; }
    
    // Si le thème a vraiment changé (pas le premier chargement)
    const themeChanged = prevThemeRef.current !== "" && prevThemeRef.current !== theme;
    if (themeChanged) {
      setSelCats([]); setSubs([]); setSelSubs([]);
      session.reset();
    }
    prevThemeRef.current = theme;
    
    let stop = false;
    (async () => {
      try {
        const j = await getTheme(theme);
        if (stop) return;
        setCats(j.categories ?? []);
      } catch (e) { if (!stop) setErr(e instanceof Error ? e.message : String(e)); }
    })();
    return () => { stop = true; };
  }, [theme]);

  // Sous-catégories des catégories choisies
  useEffect(() => {
    if (!theme || selCats.length === 0) { 
      setSubs([]);
      setSelSubs([]);
      return; 
    }
    let stop = false;
    (async () => {
      try {
        const acc: SubWithCat[] = [];
        for (const c of selCats) {
          const j = await getCategory(theme, c);
          for (const s of (j.subcategories ?? [])) acc.push({ category: c, sub: s });
        }
        if (!stop) {
          const seen = new Set<string>();
          const unique = acc.filter(x => { const k = `${x.category}::${x.sub.slug}`; if (seen.has(k)) return false; seen.add(k); return true; });
          setSubs(unique);
        }
      } catch (e) { if (!stop) setErr(e instanceof Error ? e.message : String(e)); }
    })();
    return () => { stop = true; };
  }, [theme, selCats]);

  function onStart() {
    if (!theme || selSubs.length === 0) return;
    session.setSelection({ theme, subcategories: selSubs });
    session.lock();
    nav("/qcm/start");
  }

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Chargement…</div>;
  if (err) return <div style={{ padding: "2rem", color: "var(--error, crimson)", textAlign: "center" }}>Erreur: {err}</div>;

  return (
    <div style={{ 
      maxWidth: 900, 
      margin: "0 auto", 
      padding: "1rem",
      paddingBottom: "100px"
    }}>
      <h1 style={{ 
        fontSize: "1.75rem", 
        fontWeight: 700, 
        marginBottom: "1.5rem",
        color: "var(--text)"
      }}>
        QCM — Sélection
      </h1>

      {/* Theme Selection */}
      <ContentCard title="Thème" style={{ marginBottom: "1.5rem" }}>
        <select 
          value={theme} 
          onChange={e => {
            setTheme(e.target.value);
            // Effacer le flag si l'utilisateur change manuellement de thème
            session.markRestored();
          }}
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "var(--radius, 8px)",
            border: "2px solid var(--border)",
            background: "var(--bg)",
            color: "var(--text)",
            fontSize: "1rem",
            cursor: "pointer",
            outline: "none",
            transition: "border-color 0.2s"
          }}
        >
          {themes.map(t => <option key={t.slug} value={t.slug}>{t.title ?? t.slug}</option>)}
        </select>
      </ContentCard>

      {/* Categories Selection */}
      <ContentCard title="Catégories" style={{ marginBottom: "1.5rem" }}>
        <MultiSelect
          options={cats.map(c => ({
            value: c.slug,
            label: c.title ?? c.slug,
            badge: c.counts ? `${c.counts.questions ?? 0} Q` : undefined
          }))}
          selected={selCats}
          onChange={setSelCats}
          placeholder="Sélectionne une ou plusieurs catégories"
        />
      </ContentCard>

      {/* Subcategories Selection */}
      <ContentCard 
        title="Sous-catégories"
        subtitle={selCats.length === 0 ? "Sélectionne au moins une catégorie" : undefined}
        style={{ marginBottom: "1.5rem" }}
      >
        {selCats.length > 0 ? (
          <MultiSelect
            options={subs.map(su => {
              const token = `${su.category}::${su.sub.slug}`;
              const q = su.sub.counts?.questions ?? 0;
              return {
                value: token,
                label: su.sub.title ?? su.sub.slug,
                badge: `${q} Q`,
                group: su.category
              };
            })}
            selected={selSubs}
            onChange={setSelSubs}
            placeholder="Sélectionne les sous-catégories"
          />
        ) : (
          <div style={{ 
            padding: "2rem", 
            textAlign: "center", 
            color: "var(--muted)",
            fontSize: "0.875rem"
          }}>
            Choisis d'abord des catégories
          </div>
        )}
      </ContentCard>

      {/* Bouton Suivant sous la card */}
      <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={onStart}
          disabled={!theme || selSubs.length === 0}
          style={{
            padding: "0.875rem 2rem",
            background: (!theme || selSubs.length === 0) ? "var(--muted)" : "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius, 10px)",
            fontSize: "0.9375rem",
            fontWeight: 600,
            cursor: (!theme || selSubs.length === 0) ? "not-allowed" : "pointer",
            opacity: (!theme || selSubs.length === 0) ? 0.5 : 1,
            transition: "all 0.2s ease",
            boxShadow: (!theme || selSubs.length === 0) ? "none" : "0 2px 8px rgba(0, 0, 0, 0.1)"
          }}
          onMouseEnter={(e) => {
            if (theme && selSubs.length > 0) {
              e.currentTarget.style.background = "var(--accent-600)";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
            }
          }}
          onMouseLeave={(e) => {
            if (theme && selSubs.length > 0) {
              e.currentTarget.style.background = "var(--accent)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
            }
          }}
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
