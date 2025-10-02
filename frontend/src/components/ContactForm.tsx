import React, { useState, useEffect } from 'react'
import { JoySenseService } from '../services/backend-api'

interface ContactFormProps {
  userId: number
  onSuccess?: () => void
  onCancel?: () => void
}

interface CodigoTelefonico {
  codigotelefonoid: number
  codigotelefono: string
  paistelefono: string
}

export const ContactForm: React.FC<ContactFormProps> = ({
  userId,
  onSuccess,
  onCancel
}) => {
  const [contactType, setContactType] = useState<'telefono' | 'correo' | null>(null)
  const [codigosTelefonicos, setCodigosTelefonicos] = useState<CodigoTelefonico[]>([])
  const [selectedCodigo, setSelectedCodigo] = useState<number | null>(null)
  const [numeroTelefono, setNumeroTelefono] = useState('')
  const [correo, setCorreo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar códigos telefónicos al montar el componente
  useEffect(() => {
    loadCodigosTelefonicos()
  }, [])

  const loadCodigosTelefonicos = async () => {
    try {
      const data = await JoySenseService.getCodigosTelefonicos()
      setCodigosTelefonicos(data)
    } catch (err) {
      console.error('Error cargando códigos telefónicos:', err)
      setError('Error cargando códigos telefónicos')
    }
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhoneNumber = (phone: string): boolean => {
    // Validar que sea un número válido (solo dígitos, espacios, guiones y paréntesis)
    const phoneRegex = /^[\d\s\-\(\)]+$/
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 7
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      if (contactType === 'correo') {
        if (!validateEmail(correo)) {
          setError('Formato de correo inválido')
          setLoading(false)
          return
        }

        // Insertar correo primero
        const correoData = {
          correo: correo,
          statusid: 1,
          usercreatedid: userId,
          datecreated: new Date().toISOString(),
          datemodified: new Date().toISOString()
        }

        const correoResult = await JoySenseService.insertCorreo(correoData)
        
        // Insertar contacto
        const contactoData = {
          usuarioid: userId,
          tipo_contacto: 'correo',
          correoid: correoResult[0].correoid,
          statusid: 1,
          usercreatedid: userId,
          datecreated: new Date().toISOString(),
          datemodified: new Date().toISOString()
        }

        await JoySenseService.insertContacto(contactoData)

      } else if (contactType === 'telefono') {
        if (!selectedCodigo) {
          setError('Selecciona un país')
          setLoading(false)
          return
        }

        if (!validatePhoneNumber(numeroTelefono)) {
          setError('Número de teléfono inválido')
          setLoading(false)
          return
        }

        // Insertar contacto con teléfono
        const contactoData = {
          usuarioid: userId,
          tipo_contacto: 'telefono',
          codigotelefonoid: selectedCodigo,
          numero_telefono: numeroTelefono,
          statusid: 1,
          usercreatedid: userId,
          datecreated: new Date().toISOString(),
          datemodified: new Date().toISOString()
        }

        await JoySenseService.insertContacto(contactoData)
      }

      onSuccess?.()
    } catch (err: any) {
      console.error('Error guardando contacto:', err)
      setError(err.message || 'Error guardando contacto')
    } finally {
      setLoading(false)
    }
  }

  if (contactType === null) {
    return (
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Selecciona tu método de contacto preferido
        </h3>
        <p className="text-neutral-400 mb-6">
          Elige cómo quieres recibir las notificaciones del sistema
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => setContactType('telefono')}
            className="w-full p-4 border border-neutral-600 rounded-lg hover:border-green-500 hover:bg-neutral-700 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="text-2xl">📱</div>
              <div>
                <div className="text-white font-medium">Teléfono</div>
                <div className="text-neutral-400 text-sm">Recibir notificaciones por SMS</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setContactType('correo')}
            className="w-full p-4 border border-neutral-600 rounded-lg hover:border-green-500 hover:bg-neutral-700 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="text-2xl">📧</div>
              <div>
                <div className="text-white font-medium">Correo Electrónico</div>
                <div className="text-neutral-400 text-sm">Recibir notificaciones por email</div>
              </div>
            </div>
          </button>
        </div>

        {onCancel && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">
          {contactType === 'telefono' ? '📱 Configurar Teléfono' : '📧 Configurar Correo'}
        </h3>
        <button
          onClick={() => setContactType(null)}
          className="text-neutral-400 hover:text-white transition-colors"
        >
          ← Volver
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {contactType === 'telefono' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              País
            </label>
            <select
              value={selectedCodigo || ''}
              onChange={(e) => setSelectedCodigo(Number(e.target.value))}
              className="w-full p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
            >
              <option value="">Selecciona un país</option>
              {codigosTelefonicos.map((codigo) => (
                <option key={codigo.codigotelefonoid} value={codigo.codigotelefonoid}>
                  {codigo.paistelefono} ({codigo.codigotelefono})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Número de Teléfono
            </label>
            <div className="flex">
              <div className="px-3 py-3 bg-neutral-600 border border-neutral-500 rounded-l-lg text-neutral-300 text-sm">
                {selectedCodigo ? codigosTelefonicos.find(c => c.codigotelefonoid === selectedCodigo)?.codigotelefono : '+XX'}
              </div>
              <input
                type="tel"
                value={numeroTelefono}
                onChange={(e) => setNumeroTelefono(e.target.value)}
                placeholder="123456789"
                className="flex-1 p-3 bg-neutral-700 border border-neutral-600 rounded-r-lg text-white focus:border-green-500 focus:outline-none"
              />
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Ingresa tu número sin el código de país
            </p>
          </div>
        </div>
      )}

      {contactType === 'correo' && (
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Correo Electrónico
          </label>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="usuario@ejemplo.com"
            className="w-full p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Formato: usuario@dominio.com
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-3 mt-6">
        <button
          onClick={() => setContactType(null)}
          className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || (contactType === 'telefono' && (!selectedCodigo || !numeroTelefono)) || (contactType === 'correo' && !correo)}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
