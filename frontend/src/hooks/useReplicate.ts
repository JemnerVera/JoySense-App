import { useState, useCallback } from 'react';

interface ReplicateOptions {
  tableName: string;
  tableData: any[];
  visibleColumns: any[];
  relatedData?: any[];
  relatedColumns?: any[];
  nodosData?: any[];
  tiposData?: any[];
  metricasData?: any[];
  originalTable?: string;
  selectedEntidad?: string;
  onReplicate: (selectedEntry: any) => void;
}

export const useReplicate = () => {
  const [showModal, setShowModal] = useState(false);
  const [replicateOptions, setReplicateOptions] = useState<ReplicateOptions | null>(null);

  const openReplicateModal = useCallback((options: ReplicateOptions) => {
    setReplicateOptions(options);
    setShowModal(true);
  }, []);

  const closeReplicateModal = useCallback(() => {
    setShowModal(false);
    setReplicateOptions(null);
  }, []);

  const handleReplicate = useCallback((selectedEntry: any) => {
    if (replicateOptions?.onReplicate) {
      replicateOptions.onReplicate(selectedEntry);
    }
    closeReplicateModal();
  }, [replicateOptions, closeReplicateModal]);

  return {
    showModal,
    replicateOptions,
    openReplicateModal,
    closeReplicateModal,
    handleReplicate
  };
};
