import React from 'react';

interface ReplicateButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

const ReplicateButton: React.FC<ReplicateButtonProps> = ({
  onClick,
  disabled = false,
  className = "px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 shadow-lg"
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title="Replicar una entrada existente. Selecciona una entrada de la lista para copiar sus datos."
    >
      <span>🔄</span>
      <span>Replicar</span>
    </button>
  );
};

export default ReplicateButton;
