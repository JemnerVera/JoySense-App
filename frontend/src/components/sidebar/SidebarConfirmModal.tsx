import React from 'react'
import { useSidebar } from '../../contexts/SidebarContext'

/**
 * Modal de confirmación integrado con el sistema de sidebars
 * Se muestra automáticamente cuando hay cambios sin guardar
 */
export function SidebarConfirmModal() {
  const { showModal, pendingTransition, confirmLeave, cancelLeave } = useSidebar()
  
  if (!showModal || !pendingTransition) return null
  
  // Determinar mensaje según el tipo de transición
  const getMessage = () => {
    switch (pendingTransition.type) {
      case 'navigate':
        return '¿Estás seguro de que quieres cambiar de pestaña? Tienes cambios sin guardar.'
      case 'push':
        return '¿Estás seguro de que quieres cambiar de panel? Tienes cambios sin guardar.'
      case 'pop':
        return '¿Estás seguro de que quieres cerrar este panel? Tienes cambios sin guardar.'
      default:
        return '¿Estás seguro de que quieres continuar? Tienes cambios sin guardar.'
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Cambios sin guardar
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {getMessage()}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={cancelLeave}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-neutral-700 rounded hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={confirmLeave}
            className="px-4 py-2 text-white bg-orange-500 rounded hover:bg-orange-600 transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}

