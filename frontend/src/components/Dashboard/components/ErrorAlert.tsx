import React from 'react'

interface ErrorAlertProps {
  message: string
  onDismiss?: () => void
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onDismiss }) => {
  return (
    <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg animate-in fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-red-700 dark:text-red-300 flex-1">
          <div className="w-5 h-5 flex-shrink-0">⚠️</div>
          <span className="text-sm font-medium">{message}</span>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors flex-shrink-0"
            aria-label="Cerrar alerta"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
