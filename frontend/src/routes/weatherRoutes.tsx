import { WeatherMain } from '../features/weather';
import { WeatherDetailsPage } from '../features/weather/WeatherDetailsPage';

export const weatherRoutes = [
  {
    path: '/meteorologia',
    element: <WeatherMain />,
    title: 'Meteorología',
    description: 'Dashboard de estaciones meteorológicas WeatherLink',
    icon: '🌤️',
    requiresAuth: true
  },
  {
    path: '/meteorologia/details',
    element: <WeatherDetailsPage />,
    title: 'Meteorología - Detalles',
    description: 'Detalles de estaciones meteorológicas',
    icon: '📊',
    requiresAuth: true
  }
];

export const WeatherNavigationItem = {
  id: 'meteorologia',
  label: 'Meteorología',
  icon: '🌤️',
  path: '/meteorologia',
  description: 'Dashboard de estaciones meteorológicas WeatherLink',
};

export default WeatherMain;