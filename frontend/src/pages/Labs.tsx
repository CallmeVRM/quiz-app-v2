import { Link } from "react-router-dom";
import ContentCard from "../components/ContentCard";

export default function Labs() {
  return (
    <div style={{ 
      maxWidth: 1000, 
      margin: "0 auto", 
      padding: "3rem 2rem",
      minHeight: "80vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <ContentCard style={{ 
        textAlign: "center",
        padding: "4rem 3rem",
        background: "linear-gradient(135deg, var(--accent-50) 0%, var(--bg-elev) 100%)",
        border: "2px solid var(--accent)",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)"
      }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ 
            margin: 0,
            fontSize: "4rem",
            fontWeight: 900,
            color: "var(--accent)",
            marginBottom: "0.5rem",
            letterSpacing: "-0.02em"
          }}>
            Labs
          </h1>
          <div style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "var(--muted)",
            letterSpacing: "0.1em"
          }}>
            (Work in Progress)
          </div>
        </div>

        <div style={{
          fontSize: "1.25rem",
          fontWeight: 600,
          color: "var(--text)",
          marginBottom: "1.5rem",
          lineHeight: 1.6
        }}>
          Cette section est en cours de développement
        </div>

        <p style={{ 
          color: "var(--muted)", 
          fontSize: "1rem",
          lineHeight: 1.8,
          marginBottom: "2.5rem",
          maxWidth: "550px",
          margin: "0 auto 2.5rem"
        }}>
          Nous travaillons sur des fonctionnalités innovantes pour vous offrir une meilleure expérience d'apprentissage. De nouvelles capacités arrivent très bientôt !
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2.5rem"
        }}>
          {["Nouvelles Features", "Beta Testing", "Labs Avancés", "Outils"].map((item, i) => (
            <div key={i} style={{
              padding: "1.5rem",
              background: "rgba(92, 45, 145, 0.1)",
              borderRadius: "12px",
              border: "1px solid rgba(92, 45, 145, 0.3)",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "var(--text)",
              transition: "all 0.3s ease",
              cursor: "default"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(92, 45, 145, 0.2)";
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 5px 15px rgba(92, 45, 145, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(92, 45, 145, 0.1)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}>
              {item}
            </div>
          ))}
        </div>

        <div style={{
          display: "flex",
          gap: "1.5rem",
          justifyContent: "center",
          flexWrap: "wrap",
          marginBottom: "2rem"
        }}>
          <Link 
            to="/" 
            style={{
              padding: "1rem 2.5rem",
              background: "var(--accent)",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.95rem",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 12px rgba(92, 45, 145, 0.3)",
              display: "inline-block"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(92, 45, 145, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(92, 45, 145, 0.3)";
            }}
          >
            Retour à l'accueil
          </Link>
          
          <a 
            href="https://www.linkedin.com/in/lotfi-hamadene-81836b24b/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              padding: "1rem 2.5rem",
              background: "#0077b5",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.95rem",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 12px rgba(0, 119, 181, 0.3)",
              display: "inline-block"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 119, 181, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 119, 181, 0.3)";
            }}
          >
            Connect on LinkedIn
          </a>
        </div>

        <div style={{
          marginTop: "2.5rem",
          padding: "1.75rem",
          background: "rgba(92, 45, 145, 0.05)",
          borderRadius: "12px",
          border: "2px solid var(--border)"
        }}>
          <p style={{ 
            fontSize: "0.9375rem", 
            color: "var(--text)",
            margin: 0,
            lineHeight: 1.7,
            fontWeight: 500
          }}>
            Des suggestions ou des idées ? Contactez-moi sur LinkedIn pour en discuter !
          </p>
        </div>
      </ContentCard>
    </div>
  );
}
