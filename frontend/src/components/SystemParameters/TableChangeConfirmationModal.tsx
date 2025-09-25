import React from 'react';

interface TableChangeConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TableChangeConfirmationModal({ 
  isOpen, 
  onConfirm, 
  onCancel 
}: TableChangeConfirmationModalProps) {
  if (!isOpen) return null;

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
            <h3 className="text-xl font-bold text-white text-opacity-90 mb-2">
              ¿Confirmar cambio de parámetro?
            </h3>
            <p className="text-gray-300 text-opacity-80 mb-6">
              Los cambios que has realizado se perderán al cambiar de parámetro. ¿Estás seguro que deseas continuar?
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onConfirm}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Sí, continuar
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              No, cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
