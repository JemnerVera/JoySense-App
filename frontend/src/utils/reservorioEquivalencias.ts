export interface Equivalencia {
  min: number
  max: number
  area: number
  volumen: number
}

export const EQUIVALENCIAS: Equivalencia[] = [
  { min: 0.00, max: 1.00, area: 526.31, volumen: 5918.60 },
  { min: 1.00, max: 2.00, area: 526.43, volumen: 5389.57 },
  { min: 2.00, max: 3.00, area: 549.21, volumen: 4861.23 },
  { min: 3.00, max: 4.00, area: 665.39, volumen: 4263.63 },
  { min: 4.00, max: 5.00, area: 1713.18, volumen: 3389.18 },
  { min: 5.00, max: 5.52, area: 2202.23, volumen: 404.36 },
]

export function nivelToAreaVolumen(nivel: number): { area: number; volumen: number } | null {
  if (nivel < 0 || isNaN(nivel)) return null

  const last = EQUIVALENCIAS[EQUIVALENCIAS.length - 1]
  if (nivel >= last.max) {
    return { area: last.area, volumen: last.volumen }
  }

  for (let i = 0; i < EQUIVALENCIAS.length; i++) {
    const row = EQUIVALENCIAS[i]
    if (nivel >= row.min && nivel < row.max) {
      const t = (nivel - row.min) / (row.max - row.min)
      const nextRow = EQUIVALENCIAS[Math.min(i + 1, EQUIVALENCIAS.length - 1)]
      return {
        area: row.area + (nextRow.area - row.area) * t,
        volumen: row.volumen + (nextRow.volumen - row.volumen) * t,
      }
    }
  }

  return null
}
