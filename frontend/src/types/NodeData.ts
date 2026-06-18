export interface NodeData {
  nodoid: number
  nodo: string
  deveui: string
  ubicacionid: number
  latitud: number
  longitud: number
  referencia: string
  localizacion?: string  // "LOTE T1 HILERA 6" (tabla localizacion)
  tipoid?: number  // Tipo de sensor (1=LoRaWAN Temp, 2=LoRaWAN Humedad, 3=PLC Ambiente, 4=PLC Pulpa)
  ubicacion: {
    ubicacion: string
    ubicacionabrev: string
    zona: {
      zonaid: number
      zona: string
      fundoid: number
      fundo: {
        fundoid: number
        fundo: string
        fundoabrev: string
        empresaid: number | null
        empresa: {
          empresaid: number | null
          empresa: string
          empresabrev: string
          pais: {
            paisid: number | null
            pais: string
            paisabrev: string
          } | null
        } | null
      } | null
    } | null
  }
  entidad: {
    entidadid: number
    entidad: string
  }
}
