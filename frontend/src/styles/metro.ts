// Couleurs inspirées du métro de New York
export const METRO_COLORS = {
  // Ligne 1 (Red)
  red: "#EE352E",
  // Ligne 2 (Red)
  red2: "#F32C27",
  // Ligne 3 (Red)
  red3: "#F65F4B",
  // Ligne A/C (Blue)
  blue: "#0039A6",
  // Ligne E (Blue)
  blue2: "#4D5DB8",
  // Ligne 4/5 (Green)
  green: "#00933C",
  // Ligne 6 (Green)
  green2: "#00B050",
  // Ligne 7 (Purple)
  purple: "#B933AD",
  // Ligne N/Q/R/W (Yellow)
  yellow: "#FCCC0A",
  // Ligne B/D (Orange)
  orange: "#FF6319",
  // Ligne F/M (Orange)
  orange2: "#F97316",
  // Ligne J/Z (Brown)
  brown: "#996633",
  // Ligne L (Gray)
  gray: "#A7A9AC",
  // Ligne G (Light Green)
  lightGreen: "#6CBE45",
  // Ligne S (Gray)
  silver: "#999999",
} as const;

export const METRO_LINES = [
  METRO_COLORS.red,
  METRO_COLORS.blue,
  METRO_COLORS.green,
  METRO_COLORS.purple,
  METRO_COLORS.yellow,
  METRO_COLORS.orange,
];

export const METRO_THEMES = {
  light: {
    bg: "#F5F5F5",
    bgAlt: "#FFFFFF",
    text: "#1A1A1A",
    textSecondary: "#666666",
    border: "#CCCCCC",
    borderLight: "#EEEEEE",
  },
  dark: {
    bg: "#1A1A1A",
    bgAlt: "#2A2A2A",
    text: "#F5F5F5",
    textSecondary: "#AAAAAA",
    border: "#444444",
    borderLight: "#333333",
  },
} as const;
