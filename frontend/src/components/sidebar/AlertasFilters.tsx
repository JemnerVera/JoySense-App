import React from 'react';
import { useAlertasFilterSafe } from '../../contexts/AlertasFilterContext';
import { ALERTAS_CONFIG } from '../../config/alertasConfig';
import { useLanguage } from '../../contexts/LanguageContext';

interface AlertasFiltersProps {
  isExpanded: boolean;
}

const AlertasFilters: React.FC<AlertasFiltersProps> = ({ isExpanded }) => {
  const { t } = useLanguage();
  // Hook seguro que no lanza error si no hay contexto
  const alertasFilter = useAlertasFilterSafe();

  // Si no hay contexto disponible o no está expandido, no mostrar los filtros
  if (!alertasFilter || !isExpanded) {
    return null;
  }

  const {
    filtroCriticidad = ALERTAS_CONFIG.DEFAULT_FILTERS.CRITICIDAD,
    setFiltroCriticidad,
    filtroUbicacion = ALERTAS_CONFIG.DEFAULT_FILTERS.UBICACION,
    setFiltroUbicacion,
    criticidadesDisponibles = [],
    ubicacionesDisponibles = []
  } = alertasFilter;

  // Verificar que las funciones estén disponibles
  if (!setFiltroCriticidad || !setFiltroUbicacion) {
    return null;
  }

  return (
    <div className={ALERTAS_CONFIG.STYLES.FILTER_CONTAINER}>
      <h4 className={ALERTAS_CONFIG.STYLES.FILTER_TITLE}>
        {t('alerts.filters.title')}
      </h4>
      
      {/* Filtro de Criticidad */}
      <div className="mb-4">
        <label className={ALERTAS_CONFIG.STYLES.FILTER_LABEL}>
          {t('alerts.filters.criticality')}
        </label>
        <select
          value={filtroCriticidad}
          onChange={(e) => setFiltroCriticidad(e.target.value)}
          className={ALERTAS_CONFIG.STYLES.FILTER_SELECT}
        >
          <option value={ALERTAS_CONFIG.DEFAULT_FILTERS.CRITICIDAD}>
            {t('alerts.filters.all')}
          </option>
          {Array.isArray(criticidadesDisponibles) && criticidadesDisponibles.map(criticidad => (
            <option key={criticidad} value={criticidad} className={ALERTAS_CONFIG.STYLES.FILTER_OPTION}>
              {criticidad}
            </option>
          ))}
        </select>
      </div>

      {/* Filtro de Ubicación */}
      <div className="mb-4">
        <label className={ALERTAS_CONFIG.STYLES.FILTER_LABEL}>
          {t('alerts.filters.location')}
        </label>
        <select
          value={filtroUbicacion}
          onChange={(e) => setFiltroUbicacion(e.target.value)}
          className={ALERTAS_CONFIG.STYLES.FILTER_SELECT}
        >
          <option value={ALERTAS_CONFIG.DEFAULT_FILTERS.UBICACION}>
            {t('alerts.filters.all')}
          </option>
          {Array.isArray(ubicacionesDisponibles) && ubicacionesDisponibles.map(ubicacion => (
            <option key={ubicacion} value={ubicacion} className={ALERTAS_CONFIG.STYLES.FILTER_OPTION}>
              {ubicacion}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default AlertasFilters;
