import { hash32, mulberry32 } from "./random";

/** mélange un tableau avec Math.random (non déterministe) */
export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

/** mélange déterministe si seed fournie (string), sinon aléatoire */
export function shuffleSeeded<T>(arr: T[], seed?: string): T[] {
  const a = arr.slice();
  if (!seed) return shuffle(a);
  const rnd = mulberry32(hash32(seed));
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}
