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
};

export default WeatherMain;