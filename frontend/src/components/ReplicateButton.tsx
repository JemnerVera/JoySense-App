import React from 'react';

interface ReplicateButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

const ReplicateButton: React.FC<ReplicateButtonProps> = ({
  onClick,
  disabled = false,
  className = "px-6 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors flex items-center space-x-2 font-mono tracking-wider"
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title="Replicar una entrada existente. Selecciona una entrada de la lista para copiar sus datos."
    >
      <span>🔄</span>
      <span>REPLICAR</span>
    </button>
  );
};

export default ReplicateButton;
