import React from 'react';
import { useModal } from '../contexts/ModalContext';

const SimpleAlertModal: React.FC = () => {
  const { modalState, hideModal } = useModal();

  if (!modalState || !modalState.isOpen) return null;

  const getContextNames = () => {
    switch (modalState.type) {
      case 'subtab':
        // Si currentContext ya es un nombre legible (como 'Crear', 'Actualizar'), usarlo directamente
        // Si es un código (como 'insert', 'update'), convertirlo
        const getSubTabName = (context: string) => {
          if (context === 'insert' || context === 'Crear') return 'Crear';
          if (context === 'update' || context === 'Actualizar') return 'Actualizar';
          if (context === 'massive' || context === 'Masivo') return 'Masivo';
          if (context === 'status' || context === 'Estado') return 'Estado';
          return context;
        };
        return {
          current: getSubTabName(modalState.currentContext),
          target: getSubTabName(modalState.targetContext)
        };
      case 'parameter':
        return {
          current: modalState.currentContext.charAt(0).toUpperCase() + modalState.currentContext.slice(1),
          target: modalState.targetContext.charAt(0).toUpperCase() + modalState.targetContext.slice(1)
        };
      default:
        return { current: modalState.currentContext, target: modalState.targetContext };
    }
  };

  const { current, target } = getContextNames();

  const handleConfirm = () => {
    modalState.onConfirm();
    hideModal();
  };

  const handleCancel = () => {
    modalState.onCancel();
    hideModal();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-neutral-800 border border-orange-500 rounded-lg p-6 max-w-md mx-4">
        {/* Solo el icono centrado */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        
        {/* Mensaje centrado */}
        <div className="mb-6 text-center">
          <p className="text-white font-mono text-sm leading-relaxed">
            Tienes datos sin guardar en <span className="text-orange-400 font-bold">{current}</span>.
          </p>
          <p className="text-white font-mono text-sm leading-relaxed mt-2">
            {modalState.type === 'subtab' && target === 'Estado' && current === 'Actualizar' 
              ? 'Si cancelas, se perderán los cambios realizados.'
              : <>Si cambias a <span className="text-orange-400 font-bold">{target}</span>, se perderá toda la información ingresada.</>
            }
          </p>
        </div>

        {/* Botones centrados */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-mono tracking-wider rounded-lg transition-colors"
          >
            CONTINUAR
          </button>
          <button
            onClick={handleCancel}
            className="px-6 py-2 bg-neutral-600 hover:bg-neutral-500 text-white font-mono tracking-wider rounded-lg transition-colors"
          >
            CANCELAR
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleAlertModal;
