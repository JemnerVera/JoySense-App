import { useState, useCallback } from 'react';

export interface DataLossModalState {
  isOpen: boolean;
  contextType: 'subtab' | 'parameter' | 'tab';
  currentContext: string;
  targetContext: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const useDataLossModal = () => {
  const [modalState, setModalState] = useState<DataLossModalState | null>(null);

  const showModal = useCallback((
    contextType: 'subtab' | 'parameter' | 'tab',
    currentContext: string,
    targetContext: string,
    onConfirm: () => void,
    onCancel: () => void
  ) => {
    setModalState({
      isOpen: true,
      contextType,
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
