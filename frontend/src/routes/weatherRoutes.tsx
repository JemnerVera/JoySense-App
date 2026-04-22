import { WeatherMain } from '../features/weather';

export const weatherRoutes = [
  {
    path: '/meteorologia',
    element: <WeatherMain />,
    title: 'Meteorología',
    description: 'Dashboard de estaciones meteorológicas WeatherLink',
    icon: '🌤️',
    requiresAuth: true
  }
];

export const WeatherNavigationItem = {
  id: 'meteorologia',
  label: 'Meteorología',
  icon: '🌤️',
  path: '/meteorologia',
  description: 'Dashboard de estaciones meteorológicas WeatherLink',
  children: [
    {
      id: 'weather-current',
      label: 'Condiciones Actuales',
      icon: '📊',
      path: '/meteorologia?tab=current',
      description: 'Condiciones meteorológicas actuales'
    },
    {
      id: 'weather-historical',
      label: 'Histórico',
      icon: '📈',
      path: '/meteorologia?tab=historical',
      description: 'Gráficos históricos'
    }
  ]
};

export default WeatherMain;