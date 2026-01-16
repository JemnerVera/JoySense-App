import React from 'react';
import { useSidebar } from '../contexts/SidebarContext';

interface ProtectedSubTabButtonProps {
  children: React.ReactNode;
  targetTab: 'status' | 'insert' | 'update' | 'massive' | 'asignar';
  currentTab: 'status' | 'insert' | 'update' | 'massive' | 'asignar';
  selectedTable: string;
  formData: Record<string, any>;
  multipleData: any[];
  massiveFormData?: Record<string, any>;
  onTabChange: (tab: 'status' | 'insert' | 'update' | 'massive' | 'asignar') => void;
  onTabChangeFromProtectedButton?: (tab: 'status' | 'insert' | 'update' | 'massive' | 'asignar') => void;
  className?: string;
  onClick?: () => void;
}

const ProtectedSubTabButton: React.FC<ProtectedSubTabButtonProps> = ({
  children,
  targetTab,
  currentTab,
  selectedTable,
  onTabChange,
  onTabChangeFromProtectedButton,
  className,
  onClick
}) => {
  const sidebar = useSidebar();

  const handleClick = (e: React.MouseEvent) => {
    // Prevenir el comportamiento por defecto del botón
    e.preventDefault();
    e.stopPropagation();

    // Si hay un onClick personalizado, ejecutarlo primero
    if (onClick) {
      onClick();
    }

    // IMPORTANTE: NO ejecutar el cambio directamente aquí
    // Siempre delegar a onTabChange, que llamará a handleSubTabChangeInternal
    // que tiene la lógica completa de verificación de cambios
    // Esto asegura que la verificación de cambios se haga ANTES de ejecutar el cambio
    
    // SIEMPRE usar onTabChange (que llama a handleSubTabChangeInternal)
    // NO usar onTabChangeFromProtectedButton aquí porque eso saltaría la verificación
    // onTabChangeFromProtectedButton solo debe usarse DESPUÉS de confirmar el cambio
    onTabChange(targetTab);
  };

  return (
    <button
      className={className}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

export default ProtectedSubTabButton;
