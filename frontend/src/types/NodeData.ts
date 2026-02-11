export interface NodeData {
  nodoid: number
  nodo: string
  deveui: string
  ubicacionid: number
  latitud: number
  longitud: number
  referencia: string
  localizacion?: string  // "LOTE T1 HILERA 6" (tabla localizacion)
  ubicacion: {
    ubicacion: string
    ubicacionabrev: string
    fundoid: number
    fundo: {
      fundo: string
      fundoabrev: string
      empresa: {
        empresaid: number | null
        empresa: string
        empresabrev: string
        pais: {
          paisid: number | null
          pais: string
          paisabrev: string
        }
      }
    }
  }
  entidad: {
    entidadid: number
    entidad: string
  }
}
