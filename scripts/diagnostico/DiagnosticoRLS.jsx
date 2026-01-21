/**
 * Componente de Diagnóstico RLS
 *
 * Componente React para ejecutar diagnósticos de políticas RLS
 * desde el frontend sin afectar datos en producción.
 */

import React, { useState } from 'react'
import { diagnosticoRLS, diagnosticoTablaIndividual } from '../utils/diagnostico-rls'

const DiagnosticoRLS = () => {
  const [resultados, setResultados] = useState('')
  const [cargando, setCargando] = useState(false)
  const [tablaSeleccionada, setTablaSeleccionada] = useState('')

  const ejecutarDiagnosticoCompleto = async () => {
    setCargando(true)
    setResultados('')

    try {
      // Redirigir console.log a nuestro estado
      const logsOriginal = console.log
      const logs = []

      console.log = (...args) => {
        logs.push(args.join(' '))
        logsOriginal(...args)
      }

      // Ejecutar diagnóstico
      await diagnosticoRLS()

      // Restaurar console.log
      console.log = logsOriginal

      // Mostrar resultados
      setResultados(logs.join('\n'))

    } catch (error) {
      setResultados(`❌ Error en diagnóstico: ${error.message}`)
    } finally {
      setCargando(false)
    }
  }

  const ejecutarDiagnosticoTabla = async () => {
    if (!tablaSeleccionada) {
      alert('Selecciona una tabla primero')
      return
    }

    setCargando(true)
    setResultados('')

    try {
      const logsOriginal = console.log
      const logs = []

      console.log = (...args) => {
        logs.push(args.join(' '))
        logsOriginal(...args)
      }

      await diagnosticoTablaIndividual(tablaSeleccionada)

      console.log = logsOriginal
      setResultados(logs.join('\n'))

    } catch (error) {
      setResultados(`❌ Error en diagnóstico de tabla: ${error.message}`)
    } finally {
      setCargando(false)
    }
  }

  const limpiarResultados = () => {
    setResultados('')
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          🔍 Diagnóstico de Políticas RLS
        </h1>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>⚠️ Solo para diagnóstico:</strong> Este componente ejecuta consultas SELECT únicamente.
                No modifica datos y es seguro para usar en producción.
              </p>
            </div>
          </div>
        </div>

        {/* Controles de diagnóstico */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Diagnóstico completo */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Diagnóstico Completo</h3>
            <p className="text-sm text-gray-600 mb-4">
              Ejecuta diagnóstico completo de todas las tablas geográficas
            </p>
            <button
              onClick={ejecutarDiagnosticoCompleto}
              disabled={cargando}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {cargando ? '🔄 Ejecutando...' : '🚀 Ejecutar Diagnóstico Completo'}
            </button>
          </div>

          {/* Diagnóstico por tabla */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Diagnóstico por Tabla</h3>
            <p className="text-sm text-gray-600 mb-4">
              Diagnostica solo una tabla específica
            </p>
            <select
              value={tablaSeleccionada}
              onChange={(e) => setTablaSeleccionada(e.target.value)}
              className="w-full mb-3 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar tabla...</option>
              <option value="pais">País</option>
              <option value="empresa">Empresa</option>
              <option value="fundo">Fundo</option>
              <option value="ubicacion">Ubicación</option>
              <option value="nodo">Nodo</option>
              <option value="localizacion">Localización</option>
            </select>
            <button
              onClick={ejecutarDiagnosticoTabla}
              disabled={cargando || !tablaSeleccionada}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {cargando ? '🔄 Ejecutando...' : '🔍 Diagnosticar Tabla'}
            </button>
          </div>
        </div>

        {/* Botón limpiar */}
        {resultados && (
          <div className="mb-4">
            <button
              onClick={limpiarResultados}
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              🗑️ Limpiar Resultados
            </button>
          </div>
        )}

        {/* Resultados */}
        {resultados && (
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
            <pre className="whitespace-pre-wrap">{resultados}</pre>
          </div>
        )}

        {/* Información de ayuda */}
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">💡 Información de Debugging</h4>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>✅ Consulta exitosa:</strong> La tabla es accesible</li>
                  <li><strong>❌ ERROR:</strong> Problema con políticas RLS o permisos</li>
                  <li><strong>0 registros:</strong> Tabla vacía o completamente bloqueada</li>
                  <li><strong>Comparar con empresa:</strong> Si empresa funciona pero otras no, problema en políticas complejas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Información técnica */}
        <div className="mt-4 text-xs text-gray-500">
          <p>
            <strong>Archivos relacionados:</strong> frontend/src/utils/diagnostico-rls.js |
            Consulta solo tablas geográficas con SELECT |
            No modifica datos - Seguro para producción
          </p>
        </div>
      </div>
    </div>
  )
}

export default DiagnosticoRLS