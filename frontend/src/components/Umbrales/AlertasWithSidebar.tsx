import React from 'react';
import EstadoActualSensores from './EstadoActualSensores';
import { useAlertasFilter } from '../../contexts/AlertasFilterContext';

const AlertasWithSidebar: React.FC = () => {
  // Hook que ahora retorna valores por defecto si no hay contexto
  const {
    filtroCriticidad,
    setFiltroCriticidad,
    filtroUbicacion,
    setFiltroUbicacion,
    setCriticidadesDisponibles,
    setUbicacionesDisponibles
  } = useAlertasFilter();

  const handleDataLoaded = (criticidades: string[], ubicaciones: string[]) => {
    if (setCriticidadesDisponibles && setUbicacionesDisponibles) {
      setCriticidadesDisponibles(criticidades);
      setUbicacionesDisponibles(ubicaciones);
    }
  };

  return (
    <EstadoActualSensores
      filtroCriticidad={filtroCriticidad}
      setFiltroCriticidad={setFiltroCriticidad}
      filtroUbicacion={filtroUbicacion}
      setFiltroUbicacion={setFiltroUbicacion}
      onDataLoaded={handleDataLoaded}
    />
  );
};

export default AlertasWithSidebar;
