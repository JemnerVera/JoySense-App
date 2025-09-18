import React from 'react';

interface ChangeConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  currentContext: string;
  targetContext: string;
  contextType: 'subtab' | 'parameter' | 'tab';
}

const ChangeConfirmationModal: React.FC<ChangeConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  currentContext,
  targetContext,
  contextType,
}) => {
  if (!isOpen) return null;

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
            Tienes datos sin guardar en la pestaña actual.
          </p>
          <p className="text-white font-mono text-sm leading-relaxed mt-2">
            Si cambias a <span className="text-orange-400 font-bold">{targetContext}</span>, se perderá toda la información ingresada.
          </p>
        </div>

        {/* Botones centrados */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-mono tracking-wider rounded-lg transition-colors"
          >
            CONTINUAR
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-neutral-600 hover:bg-neutral-500 text-white font-mono tracking-wider rounded-lg transition-colors"
          >
            CANCELAR
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeConfirmationModal;