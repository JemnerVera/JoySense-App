import UmbralesMain from '../components/Umbrales/UmbralesMain';

// Configuración de rutas para el sistema de umbrales
export const umbralesRoutes = [
  {
    path: '/umbrales',
    element: <UmbralesMain />,
    title: 'Umbrales',
    description: 'Gestión de umbrales y alertas automáticas',
    icon: '⚠️',
    requiresAuth: true
  }
];

// Componente de navegación para el menú principal
export const UmbralesNavigationItem = {
  id: 'umbrales',
  label: 'Umbrales',
  icon: '⚠️',
  path: '/umbrales',
  description: 'Gestión de umbrales y alertas automáticas',
  children: [
    {
      id: 'umbrales-estado-actual',
      label: 'Registro de Alertas',
      icon: '📊',
      path: '/umbrales?tab=estado-actual',
      description: 'Estado actual de todos los sensores por criticidad'
    },
    {
      id: 'umbrales-dashboard',
      label: 'Dashboard de Alertas',
      icon: '📈',
      path: '/umbrales?tab=dashboard',
      description: 'Gráficos históricos y análisis temporal'
    },
    {
      id: 'umbrales-gestion',
      label: 'Gestión de Umbrales',
      icon: '⚠️',
      path: '/umbrales?tab=umbrales',
      description: 'Crear y editar umbrales de alerta'
    }
  ]
};

export default UmbralesMain;
