import React from 'react'

interface LoadingStateProps {
  message?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Cargando datos...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <p className="text-gray-600 dark:text-neutral-400 text-sm font-medium">{message}</p>
    </div>
  )
}
