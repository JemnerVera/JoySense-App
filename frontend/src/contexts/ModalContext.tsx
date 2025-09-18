import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  showModal: (type: 'subtab' | 'parameter', currentContext: string, targetContext: string, onConfirm: () => void, onCancel: () => void) => void;
  hideModal: () => void;
  modalState: {
    isOpen: boolean;
    type: 'subtab' | 'parameter';
    currentContext: string;
    targetContext: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [modalState, setModalState] = useState<ModalContextType['modalState']>(null);

  const showModal = (type: 'subtab' | 'parameter', currentContext: string, targetContext: string, onConfirm: () => void, onCancel: () => void) => {
    setModalState({
      isOpen: true,
      type,
      currentContext,
      targetContext,
      onConfirm,
      onCancel
    });
  };

  const hideModal = () => {
    setModalState(null);
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal, modalState }}>
      {children}
    </ModalContext.Provider>
  );
};
