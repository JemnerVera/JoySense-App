import React, { useState, useEffect } from 'react';
import { JoySenseService } from '../services/backend-api';

interface ContactTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: 'phone' | 'email', data: any) => void;
  userId: number;
}

const ContactTypeModal: React.FC<ContactTypeModalProps> = ({
  isOpen,
  onClose,
  onSelectType,
  userId
}) => {
  const [contactType, setContactType] = useState<'phone' | 'email'>('email');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [countryCodes, setCountryCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Cargar códigos de país al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadCountryCodes();
    }
  }, [isOpen]);

  const loadCountryCodes = async () => {
    try {
      setLoading(true);
      const data = await JoySenseService.getCodigosTelefonicos();
      setCountryCodes(data || []);
    } catch (error) {
      console.error('Error cargando códigos telefónicos:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError('Formato de correo inválido (ejemplo: usuario@dominio.com)');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = () => {
    if (contactType === 'email') {
      if (!email || !validateEmail(email)) {
        setEmailError('Ingrese un correo válido');
        return;
      }
      onSelectType('email', { email });
    } else {
      if (!selectedCountryCode || !phoneNumber) {
        return;
      }
      const selectedCountry = countryCodes.find(c => c.codigotelefonoid.toString() === selectedCountryCode);
      const fullPhoneNumber = `${selectedCountry.codigotelefono}${phoneNumber}`;
      onSelectType('phone', { 
        celular: fullPhoneNumber,
        codigotelefonoid: parseInt(selectedCountryCode)
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-neutral-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-white mb-6">Seleccionar Tipo de Contacto</h2>
        
        {/* Selector de tipo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-300 mb-3">
            Tipo de contacto:
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setContactType('email')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                contactType === 'email'
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
              }`}
            >
              Correo Electrónico
            </button>
            <button
              type="button"
              onClick={() => setContactType('phone')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                contactType === 'phone'
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
              }`}
            >
              Teléfono
            </button>
          </div>
        </div>

        {/* Formulario de correo */}
        {contactType === 'email' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Correo Electrónico:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="usuario@dominio.com"
              className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {emailError && (
              <p className="text-red-400 text-sm mt-1">{emailError}</p>
            )}
          </div>
        )}

        {/* Formulario de teléfono */}
        {contactType === 'phone' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              País:
            </label>
            <select
              value={selectedCountryCode || ''}
              onChange={(e) => setSelectedCountryCode(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">Seleccionar país...</option>
              {countryCodes.map((country) => (
                <option key={country.codigotelefonoid} value={country.codigotelefonoid}>
                  {country.paistelefono} ({country.codigotelefono})
                </option>
              ))}
            </select>
            
            {selectedCountryCode && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Número de Teléfono:
                </label>
                <div className="flex">
                  <span className="px-3 py-2 bg-neutral-600 border border-neutral-500 rounded-l-md text-neutral-300">
                    {countryCodes.find(c => c.codigotelefonoid.toString() === selectedCountryCode)?.codigotelefono}
                  </span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="123456789"
                    className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 border-l-0 rounded-r-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-600 text-white rounded-md hover:bg-neutral-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              (contactType === 'email' && (!email || !validateEmail(email))) ||
              (contactType === 'phone' && (!selectedCountryCode || !phoneNumber))
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-neutral-600 disabled:cursor-not-allowed"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactTypeModal;
