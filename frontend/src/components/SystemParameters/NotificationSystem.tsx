import React, { useState, useEffect, useCallback } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onRemoveNotification: (id: string) => void;
  onClearAll: () => void;
}

/**
 * Sistema de notificaciones para SystemParameters
 * Maneja alertas de éxito, error, advertencia e información
 */
export function NotificationSystem({
  notifications,
  onRemoveNotification,
  onClearAll
}: NotificationSystemProps) {
  
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);

  // Sincronizar notificaciones visibles
  useEffect(() => {
    setVisibleNotifications(notifications);
  }, [notifications]);

  // Auto-remover notificaciones no persistentes
  useEffect(() => {
    const timers: number[] = [];

    notifications.forEach(notification => {
      if (!notification.persistent && notification.duration !== 0) {
        const duration = notification.duration || 5000; // 5 segundos por defecto
        const timer = setTimeout(() => {
          onRemoveNotification(notification.id);
        }, duration);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications, onRemoveNotification]);

  // Obtener icono según el tipo de notificación
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Obtener clases CSS según el tipo de notificación
  const getNotificationClasses = (type: Notification['type']) => {
    const baseClasses = "rounded-md p-4 shadow-lg border-l-4";
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-50 border-green-400`;
      case 'error':
        return `${baseClasses} bg-red-50 border-red-400`;
      case 'warning':
        return `${baseClasses} bg-yellow-50 border-yellow-400`;
      case 'info':
        return `${baseClasses} bg-blue-50 border-blue-400`;
      default:
        return `${baseClasses} bg-gray-50 border-gray-400`;
    }
  };

  // Obtener clases de texto según el tipo
  const getTextClasses = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return "text-green-800";
      case 'error':
        return "text-red-800";
      case 'warning':
        return "text-yellow-800";
      case 'info':
        return "text-blue-800";
      default:
        return "text-gray-800";
    }
  };

  // Renderizar notificación individual
  const renderNotification = (notification: Notification) => (
    <div
      key={notification.id}
      className={`${getNotificationClasses(notification.type)} mb-4 transition-all duration-300 ease-in-out`}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${getTextClasses(notification.type)}`}>
            {notification.title}
          </h3>
          <div className={`mt-1 text-sm ${getTextClasses(notification.type)}`}>
            {notification.message}
          </div>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={() => onRemoveNotification(notification.id)}
              className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                notification.type === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-600' :
                notification.type === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-600' :
                notification.type === 'warning' ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600' :
                'text-blue-500 hover:bg-blue-100 focus:ring-blue-600'
              }`}
            >
              <span className="sr-only">Cerrar</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Renderizar contador de notificaciones
  const renderNotificationCounter = () => {
    if (notifications.length === 0) return null;

    return (
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">
          {notifications.length} notificación{notifications.length !== 1 ? 'es' : ''}
        </div>
        {notifications.length > 1 && (
          <button
            onClick={onClearAll}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Limpiar todas
          </button>
        )}
      </div>
    );
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 w-96 max-w-full z-50">
      <div className="bg-white rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
        {renderNotificationCounter()}
        <div className="space-y-2">
          {notifications.map(renderNotification)}
        </div>
      </div>
    </div>
  );
}

// Hook para manejar notificaciones
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      id,
      duration: 5000,
      persistent: false,
      ...notification
    };
    
    setNotifications(prev => [...prev, newNotification]);
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const showSuccess = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'success', title, message, ...options });
  }, [addNotification]);

  const showError = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'error', title, message, persistent: true, ...options });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'warning', title, message, ...options });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'info', title, message, ...options });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};
