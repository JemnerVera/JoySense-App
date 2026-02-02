import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationSystem, useNotifications } from '../NotificationSystem';

describe('NotificationSystem', () => {
  const mockNotifications = [
    {
      id: '1',
      type: 'success' as const,
      title: 'Éxito',
      message: 'Operación completada exitosamente',
      duration: 5000
    },
    {
      id: '2',
      type: 'error' as const,
      title: 'Error',
      message: 'Ha ocurrido un error',
      persistent: true
    },
    {
      id: '3',
      type: 'warning' as const,
      title: 'Advertencia',
      message: 'Verifique los datos ingresados'
    }
  ];

  const mockProps = {
    notifications: mockNotifications,
    onRemoveNotification: jest.fn(),
    onClearAll: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe renderizar todas las notificaciones', () => {
    render(<NotificationSystem {...mockProps} />);
    
    expect(screen.getByText('Éxito')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Advertencia')).toBeInTheDocument();
  });

  it('debe mostrar mensajes de notificaciones', () => {
    render(<NotificationSystem {...mockProps} />);
    
    expect(screen.getByText('Operación completada exitosamente')).toBeInTheDocument();
    expect(screen.getByText('Ha ocurrido un error')).toBeInTheDocument();
    expect(screen.getByText('Verifique los datos ingresados')).toBeInTheDocument();
  });

  it('debe mostrar contador de notificaciones', () => {
    render(<NotificationSystem {...mockProps} />);
    
    expect(screen.getByText('3 notificaciones')).toBeInTheDocument();
  });

  it('debe mostrar botón de limpiar todas cuando hay múltiples notificaciones', () => {
    render(<NotificationSystem {...mockProps} />);
    
    expect(screen.getByText('Limpiar todas')).toBeInTheDocument();
  });

  it('debe manejar eliminación de notificaciones individuales', () => {
    render(<NotificationSystem {...mockProps} />);
    
    const closeButtons = screen.getAllByRole('button', { name: /cerrar/i });
    fireEvent.click(closeButtons[0]);
    
    expect(mockProps.onRemoveNotification).toHaveBeenCalledWith('1');
  });

  it('debe manejar limpieza de todas las notificaciones', () => {
    render(<NotificationSystem {...mockProps} />);
    
    const clearAllButton = screen.getByText('Limpiar todas');
    fireEvent.click(clearAllButton);
    
    expect(mockProps.onClearAll).toHaveBeenCalled();
  });

  it('debe mostrar iconos correctos según el tipo de notificación', () => {
    render(<NotificationSystem {...mockProps} />);
    
    // Los iconos se renderizan como SVGs, verificamos que estén presentes
    const svgElements = screen.getAllByRole('img', { hidden: true });
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it('debe aplicar clases CSS correctas según el tipo de notificación', () => {
    render(<NotificationSystem {...mockProps} />);
    
    // Verificar que las notificaciones tengan las clases correctas
    const successNotification = screen.getByText('Éxito').closest('div');
    const errorNotification = screen.getByText('Error').closest('div');
    const warningNotification = screen.getByText('Advertencia').closest('div');
    
    expect(successNotification).toHaveClass('bg-green-50', 'border-green-400');
    expect(errorNotification).toHaveClass('bg-red-50', 'border-red-400');
    expect(warningNotification).toHaveClass('bg-yellow-50', 'border-yellow-400');
  });

  it('debe ocultar el sistema cuando no hay notificaciones', () => {
    render(<NotificationSystem {...mockProps} notifications={[]} />);
    
    expect(screen.queryByText('notificaciones')).not.toBeInTheDocument();
  });

  it('debe mostrar singular cuando hay una sola notificación', () => {
    const singleNotification = [mockNotifications[0]];
    render(<NotificationSystem {...mockProps} notifications={singleNotification} />);
    
    expect(screen.getByText('1 notificación')).toBeInTheDocument();
  });

  it('debe no mostrar botón de limpiar todas cuando hay una sola notificación', () => {
    const singleNotification = [mockNotifications[0]];
    render(<NotificationSystem {...mockProps} notifications={singleNotification} />);
    
    expect(screen.queryByText('Limpiar todas')).not.toBeInTheDocument();
  });
});

describe('useNotifications', () => {
  it('debe inicializar con array vacío', () => {
    const { result } = renderHook(() => useNotifications());
    
    expect(result.current.notifications).toEqual([]);
  });

  it('debe agregar notificaciones', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.addNotification({
        type: 'success',
        title: 'Test',
        message: 'Test message'
      });
    });
    
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].type).toBe('success');
    expect(result.current.notifications[0].title).toBe('Test');
  });

  it('debe eliminar notificaciones', () => {
    const { result } = renderHook(() => useNotifications());
    
    let notificationId: string;
    act(() => {
      notificationId = result.current.addNotification({
        type: 'success',
        title: 'Test',
        message: 'Test message'
      });
    });
    
    expect(result.current.notifications).toHaveLength(1);
    
    act(() => {
      result.current.removeNotification(notificationId);
    });
    
    expect(result.current.notifications).toHaveLength(0);
  });

  it('debe limpiar todas las notificaciones', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.addNotification({
        type: 'success',
        title: 'Test 1',
        message: 'Test message 1'
      });
      result.current.addNotification({
        type: 'error',
        title: 'Test 2',
        message: 'Test message 2'
      });
    });
    
    expect(result.current.notifications).toHaveLength(2);
    
    act(() => {
      result.current.clearAll();
    });
    
    expect(result.current.notifications).toHaveLength(0);
  });

  it('debe proporcionar métodos de conveniencia', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.showSuccess('Success', 'Success message');
      result.current.showError('Error', 'Error message');
      result.current.showWarning('Warning', 'Warning message');
      result.current.showInfo('Info', 'Info message');
    });
    
    expect(result.current.notifications).toHaveLength(4);
    expect(result.current.notifications[0].type).toBe('success');
    expect(result.current.notifications[1].type).toBe('error');
    expect(result.current.notifications[2].type).toBe('warning');
    expect(result.current.notifications[3].type).toBe('info');
  });
});
