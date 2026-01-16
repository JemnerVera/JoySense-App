import React from 'react'
import { useSidebar } from '../../contexts/SidebarContext'

/**
 * Modal de confirmación integrado con el sistema de sidebars
 * Se muestra automáticamente cuando hay cambios sin guardar
 */
export function SidebarConfirmModal() {
  const { showModal, pendingTransition, confirmLeave, cancelLeave, activeTab } = useSidebar()
  
  if (!showModal || !pendingTransition) return null
  
  // Determinar el color según la sección activa
  // SOLO para AGRUPACIÓN y CONFIGURACIÓN
  const getThemeColor = () => {
    // AGRUPACIÓN - usa verde
    if (activeTab === 'agrupacion' || activeTab?.startsWith('agrupacion-')) {
      return {
        text: 'text-green-600 dark:text-green-400',
        buttonClasses: 'bg-green-500 hover:bg-green-600'
      }
    }
    // CONFIGURACIÓN - Todas las secciones usan naranja
    // Dispositivos, Usuarios, Parámetros Geo, Notificaciones, Permisos, Reportes Administrador
    else if (activeTab?.startsWith('configuracion-dispositivos') ||
             activeTab?.startsWith('configuracion-usuarios') ||
             activeTab?.startsWith('configuracion-parametros-geo') ||
             activeTab?.startsWith('configuracion-notificaciones') ||
             activeTab?.startsWith('configuracion-permisos') ||
             activeTab?.startsWith('configuracion-reportes-administrador')) {
      return {
        text: 'text-orange-600 dark:text-orange-400',
        buttonClasses: 'bg-orange-500 hover:bg-orange-600'
      }
    }
    // Por defecto (gray) - para otras secciones que no deberían mostrar el modal
    else {
      return {
        text: 'text-gray-600 dark:text-gray-400',
        buttonClasses: 'bg-gray-500 hover:bg-gray-600'
      }
    }
  }
  
  const theme = getThemeColor()
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className={`text-lg font-semibold mb-4 text-center uppercase ${theme.text}`}>
          ¡Cambios sin guardar!
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
          ¿Estás seguro de que quieres continuar? Tienes cambios sin guardar.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={confirmLeave}
            className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-neutral-700 rounded hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors uppercase font-medium"
          >
            Continuar
          </button>
          <button
            onClick={cancelLeave}
            className={`px-6 py-2 text-white rounded transition-colors uppercase font-medium ${theme.buttonClasses}`}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

