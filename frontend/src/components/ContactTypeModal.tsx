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
      <div className="bg-neutral-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-white mb-6">Seleccionar Medio de Contacto</h2>
        
        {/* Selector de tipo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-300 mb-3">
            ¿Cómo desea que se le contacte?
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

        {/* Descripción */}
        <div className="mb-6">
          <p className="text-sm text-neutral-400">
            {contactType === 'email' 
              ? 'Se le pedirá ingresar su dirección de correo electrónico en el siguiente paso.'
              : 'Se le pedirá seleccionar su país y número de teléfono en el siguiente paso.'
            }
          </p>
        </div>

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
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactTypeModal;
