export const ORIGEN = {
  GEOGRAFIA: 1,
  TABLA: 2,
} as const;

export type OrigenId = typeof ORIGEN[keyof typeof ORIGEN];
