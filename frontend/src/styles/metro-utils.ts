// Couleurs des lignes du métro
export const LINE_COLORS = {
  RED: "#EE352E",      // Ligne 1, 2, 3
  BLUE: "#0039A6",     // Ligne A/C, E
  GREEN: "#00933C",    // Ligne 4, 5
  LIGHT_GREEN: "#6CBE45", // Ligne G
  PURPLE: "#B933AD",   // Ligne 7
  YELLOW: "#FCCC0A",   // Ligne N/Q/R/W
  ORANGE: "#FF6319",   // Ligne B/D
  BROWN: "#996633",    // Ligne J/Z
  GRAY: "#A7A9AC",     // Ligne L
  SILVER: "#999999",   // Ligne S
} as const;

// Styles réutilisables
export const METRO_STYLES = {
  heading1: {
    fontSize: "2.4em",
    fontWeight: 900,
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    color: "#1A1A1A",
  },
  heading2: {
    fontSize: "1.6em",
    fontWeight: 800,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    color: "#1A1A1A",
  },
  heading3: {
    fontSize: "1.2em",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.3px",
    color: "#1A1A1A",
  },
  label: {
    fontSize: "0.75em",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    color: "#666666",
  },
  code: {
    fontFamily: "monospace",
    backgroundColor: "#F5F5F5",
    border: "1px solid #CCC",
    padding: "2px 6px",
    borderRadius: 0,
    fontSize: "0.9em",
  },
};

// Grille responsive
export const METRO_GRID = {
  responsive2: {
    display: "grid" as const,
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 24,
  },
  responsive3: {
    display: "grid" as const,
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 20,
  },
};
