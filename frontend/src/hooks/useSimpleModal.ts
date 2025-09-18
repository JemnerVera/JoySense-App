import { useState, useCallback } from 'react';

interface ModalState {
  isOpen: boolean;
  type: 'subtab' | 'parameter';
  currentContext: string;
  targetContext: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const useSimpleModal = () => {
  const [modalState, setModalState] = useState<ModalState | null>(null);

  const showModal = useCallback((
    type: 'subtab' | 'parameter',
    currentContext: string,
    targetContext: string,
    onConfirm: () => void,
    onCancel: () => void
  ) => {
    setModalState({
      isOpen: true,
      type,
      currentContext,
      targetContext,
      onConfirm,
      onCancel
    });
  }, []);

  const hideModal = useCallback(() => {
    setModalState(null);
  }, []);

  const confirmAction = useCallback(() => {
    if (modalState) {
      modalState.onConfirm();
      hideModal();
    }
  }, [modalState, hideModal]);

  const cancelAction = useCallback(() => {
    if (modalState) {
      modalState.onCancel();
      hideModal();
    }
  }, [modalState, hideModal]);

  return {
    modalState,
    showModal,
    hideModal,
    confirmAction,
    cancelAction
  };
};
