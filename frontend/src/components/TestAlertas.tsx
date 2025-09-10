import React from 'react';
import { useAlertasFilter } from '../contexts/AlertasFilterContext';

const TestAlertas: React.FC = () => {
  const alertasFilter = useAlertasFilter();
  
  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-white mb-2">Test Alertas Context</h3>
      <div className="text-gray-300">
        <p>Criticidad: {alertasFilter.filtroCriticidad}</p>
        <p>Ubicación: {alertasFilter.filtroUbicacion}</p>
        <p>Criticidades disponibles: {alertasFilter.criticidadesDisponibles.length}</p>
        <p>Ubicaciones disponibles: {alertasFilter.ubicacionesDisponibles.length}</p>
      </div>
    </div>
  );
};

export default TestAlertas;
