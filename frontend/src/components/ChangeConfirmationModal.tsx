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
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-orange-500 font-mono tracking-wider">
            PÉRDIDA DE DATOS
          </h3>
        </div>
        
        <div className="mb-6">
          <p className="text-white font-mono text-sm leading-relaxed">
            Tienes datos sin guardar en la pestaña <span className="text-orange-400 font-bold">{currentContext}</span>.
          </p>
          <p className="text-white font-mono text-sm leading-relaxed mt-2">
            Si cambias a <span className="text-orange-400 font-bold">{targetContext}</span>, se perderá toda la información ingresada.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-neutral-600 hover:bg-neutral-500 text-white font-mono tracking-wider rounded-lg transition-colors"
          >
            CANCELAR
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-mono tracking-wider rounded-lg transition-colors"
          >
            CONTINUAR
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeConfirmationModal;