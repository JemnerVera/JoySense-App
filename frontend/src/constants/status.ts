export const STATUS = {
  ACTIVO: 1,
  INACTIVO: 0,
} as const;

export type StatusId = typeof STATUS[keyof typeof STATUS];

// Para uso en UI (fallback si no hay i18n disponible)
export const STATUS_LABELS = {
  [STATUS.ACTIVO]: 'ACTIVO',
  [STATUS.INACTIVO]: 'INACTIVO',
} as const;
