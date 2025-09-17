import React from 'react';

interface DataLossModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  currentContext: string;
  targetContext: string;
  contextType: 'subtab' | 'parameter' | 'tab';
}

const DataLossModal: React.FC<DataLossModalProps> = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  currentContext, 
  targetContext, 
  contextType 
}) => {
  if (!isOpen) return null;

  const getTitle = () => {
    switch (contextType) {
      case 'subtab':
        return 'Pérdida de Datos en Subpestaña';
      case 'parameter':
        return 'Pérdida de Datos en Parámetro';
      case 'tab':
        return 'Pérdida de Datos en Pestaña';
      default:
        return 'Pérdida de Datos';
    }
  };

  const getMessage = () => {
    switch (contextType) {
      case 'subtab':
        return `Tienes datos sin guardar en la subpestaña **${currentContext}**.\nSi cambias a **${targetContext}**, se perderá toda la información ingresada.`;
      case 'parameter':
        return `Tienes datos sin guardar en el parámetro **${currentContext}**.\nSi cambias a **${targetContext}**, se perderá toda la información ingresada.`;
      case 'tab':
        return `Tienes datos sin guardar en la pestaña **${currentContext}**.\nSi cambias a **${targetContext}**, se perderá toda la información ingresada.`;
      default:
        return `Tienes datos sin guardar en **${currentContext}**.\nSi cambias a **${targetContext}**, se perderá toda la información ingresada.`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-md">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white text-opacity-90 mb-2">{getTitle()}</h3>
            <p className="text-gray-300 text-opacity-80 mb-6 whitespace-pre-line">
              {getMessage()}
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onConfirm}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Sí, cambiar
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              No, continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataLossModal;