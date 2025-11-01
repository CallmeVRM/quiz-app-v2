import type { ContentIndex } from "../domain/indexTypes";

export interface IndexStore {
  current: ContentIndex;
  timestamps: Map<string, number>; // mtime(ns) par chemin de fichier
}

export function createIndexStore(initial: ContentIndex): IndexStore {
  return { current: initial, timestamps: new Map() };
}
