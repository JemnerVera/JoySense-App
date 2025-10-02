import React, { useState } from 'react';

interface ContactTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: 'phone' | 'email') => void;
}

const ContactTypeModal: React.FC<ContactTypeModalProps> = ({
  isOpen,
  onClose,
  onSelectType
}) => {
  const [contactType, setContactType] = useState<'phone' | 'email'>('email');

  const handleSubmit = () => {
    onSelectType(contactType);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-neutral-800 rounded-lg p-8 w-full max-w-lg mx-4 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">Seleccionar Medio de Contacto</h2>
        
        {/* Selector de tipo */}
        <div className="mb-8">
          <label className="block text-lg font-medium text-neutral-300 mb-6 text-center">
            ¿Cómo desea que se le contacte?
          </label>
          <div className="flex flex-col space-y-4">
            <button
              type="button"
              onClick={() => setContactType('phone')}
              className={`px-6 py-4 rounded-lg font-medium transition-all duration-200 text-center ${
                contactType === 'phone'
                  ? 'bg-orange-600 text-white shadow-lg transform scale-105'
                  : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600 hover:scale-102'
              }`}
            >
              📞 Teléfono
            </button>
            <button
              type="button"
              onClick={() => setContactType('email')}
              className={`px-6 py-4 rounded-lg font-medium transition-all duration-200 text-center ${
                contactType === 'email'
                  ? 'bg-orange-600 text-white shadow-lg transform scale-105'
                  : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600 hover:scale-102'
              }`}
            >
              📧 Correo Electrónico
            </button>
          </div>
        </div>

        {/* Descripción */}
        <div className="mb-8">
          <p className="text-sm text-neutral-400 text-center leading-relaxed">
            {contactType === 'email' 
              ? 'Se le pedirá ingresar su dirección de correo electrónico en el siguiente paso.'
              : 'Se le pedirá seleccionar su país y número de teléfono en el siguiente paso.'
            }
          </p>
        </div>

        {/* Botones */}
        <div className="flex justify-center space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium shadow-lg"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactTypeModal;
