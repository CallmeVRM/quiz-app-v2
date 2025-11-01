import { create } from "zustand";

type UserState = { uuid: string };

// Génère un hash simple à partir d'une chaîne
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Crée un fingerprint du navigateur/machine
function getBrowserFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    navigator.platform
  ];
  
  const fingerprint = components.join("|");
  return simpleHash(fingerprint);
}

// Génère un UUID stable basé sur le fingerprint
function generateOrRetrieveUUID(): string {
  const STORAGE_KEY = "quiz.user.uuid";
  
  // 1. Essayer de récupérer l'UUID existant depuis localStorage
  try {
    const existingUUID = localStorage.getItem(STORAGE_KEY);
    if (existingUUID) {
      return existingUUID;
    }
  } catch (e) {
    console.warn("localStorage non accessible:", e);
  }
  
  // 2. Créer un nouvel UUID permanent
  const fingerprint = getBrowserFingerprint();
  const randomPart = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now().toString(36);
  const uuid = `${fingerprint}-${timestamp}-${randomPart}`;
  
  // 3. Sauvegarder immédiatement
  try {
    localStorage.setItem(STORAGE_KEY, uuid);
  } catch (e) {
    console.warn("Impossible de sauvegarder l'UUID:", e);
  }
  
  return uuid;
}

const initialUUID = generateOrRetrieveUUID();

// Store simple sans persist (UUID géré manuellement dans localStorage)
export const useUser = create<UserState>()(() => ({ 
  uuid: initialUUID 
}));

export default useUser;
