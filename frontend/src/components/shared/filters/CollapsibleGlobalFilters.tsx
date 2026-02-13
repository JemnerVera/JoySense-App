import React, { useState, useEffect } from 'react';

/** Objeto ubicación según tabla joysense.ubicacion (geografia.sql) */
type UbicacionOption = { ubicacionid?: number; ubicacion?: string; fundoid?: number };

interface CollapsibleGlobalFiltersProps {
  paisSeleccionado: string;
  empresaSeleccionada: string;
  fundoSeleccionado: string;
  /** ID (string) o objeto ubicación cuando viene del contexto sincronizado desde dashboard */
  ubicacionSeleccionada: string | UbicacionOption | null;
  onPaisChange: (value: string) => void;
  onEmpresaChange: (value: string) => void;
  onFundoChange: (value: string) => void;
  onUbicacionChange: (value: string) => void;
  paisesOptions: Array<{ id: string | number; name: string }>;
  empresasOptions: Array<{ id: string | number; name: string }>;
  fundosOptions: Array<{ id: string | number; name: string }>;
  ubicacionesOptions: Array<{ id: string | number; name: string }>;
  isDisabled?: boolean;
}

const CollapsibleGlobalFilters: React.FC<CollapsibleGlobalFiltersProps> = ({
  paisSeleccionado,
  empresaSeleccionada,
  fundoSeleccionado,
  ubicacionSeleccionada,
  onPaisChange,
  onEmpresaChange,
  onFundoChange,
  onUbicacionChange,
  paisesOptions,
  empresasOptions,
  fundosOptions,
  ubicacionesOptions,
  isDisabled = false
}) => {
  const [openLevel, setOpenLevel] = useState<string | null>(null);

  // Cerrar menús si se deshabilita
  useEffect(() => {
    if (isDisabled && openLevel) {
      setOpenLevel(null);
    }
  }, [isDisabled, openLevel]);

  // Colores de la plantilla
  const TEMPLATE_COLORS = {
    textColor: '#b3b8d4',
    secondaryTextColor: '#dee2ec',
    bgColor: '#0c1e35',
    secondaryBgColor: '#0b1a2c',
    borderColor: 'rgba(83, 93, 125, 0.3)',
  };

  // Obtener nombres seleccionados
  const selectedPaisName = paisesOptions.find(p => p.id.toString() === paisSeleccionado)?.name || '';
  const selectedEmpresaName = empresasOptions.find(e => e.id.toString() === empresaSeleccionada)?.name || '';
  const selectedFundoName = fundosOptions.find(f => f.id.toString() === fundoSeleccionado)?.name || '';

  // Ubicación: puede ser string (ID) desde sidebar o objeto { ubicacionid, ubicacion } desde sync dashboard
  const ubicacionId = typeof ubicacionSeleccionada === 'string'
    ? ubicacionSeleccionada
    : (ubicacionSeleccionada && 'ubicacionid' in ubicacionSeleccionada)
      ? String(ubicacionSeleccionada.ubicacionid ?? '')
      : '';
  const nameFromOptions = ubicacionId
    ? ubicacionesOptions.find(u => u.id.toString() === ubicacionId)?.name ?? ''
    : '';
  const nameFromObject = typeof ubicacionSeleccionada === 'object' && ubicacionSeleccionada != null && ubicacionSeleccionada?.ubicacion;
  const selectedUbicacionName = nameFromOptions || nameFromObject || '';

  const handlePaisClick = (e: React.MouseEvent) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    setOpenLevel(openLevel === 'pais' ? null : 'pais');
  };

  const handleEmpresaClick = (e: React.MouseEvent) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    setOpenLevel(openLevel === 'empresa' ? null : 'empresa');
  };

  const handleFundoClick = (e: React.MouseEvent) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    setOpenLevel(openLevel === 'fundo' ? null : 'fundo');
  };

  const handleUbicacionClick = (e: React.MouseEvent) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    setOpenLevel(openLevel === 'ubicacion' ? null : 'ubicacion');
  };

  const handleSelectPais = (paisId: string) => {
    if (isDisabled) return;
    onPaisChange(paisId);
    setOpenLevel(null);
  };

  const handleSelectEmpresa = (empresaId: string) => {
    if (isDisabled) return;
    onEmpresaChange(empresaId);
    setOpenLevel(null);
  };

  const handleSelectFundo = (fundoId: string) => {
    if (isDisabled) return;
    onFundoChange(fundoId);
    setOpenLevel(null);
  };

  const handleSelectUbicacion = (ubicacionId: string) => {
    if (isDisabled) return;
    onUbicacionChange(ubicacionId);
    setOpenLevel(null);
  };

  return (
    <div className="space-y-1">
      {/* PAÍS */}
      <div className="space-y-1 relative group">
        <button
          onClick={handlePaisClick}
          disabled={isDisabled}
          className={`flex items-center w-full h-12 px-5 transition-all duration-200 ${
            isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          }`}
          style={{
            color: paisSeleccionado ? TEMPLATE_COLORS.secondaryTextColor : TEMPLATE_COLORS.textColor,
            backgroundColor: !isDisabled && openLevel === 'pais' ? TEMPLATE_COLORS.secondaryBgColor : 'transparent',
            pointerEvents: isDisabled ? 'none' : 'auto'
          }}
          onMouseEnter={(e) => {
            if (!isDisabled && openLevel !== 'pais') e.currentTarget.style.backgroundColor = TEMPLATE_COLORS.secondaryBgColor;
          }}
          onMouseLeave={(e) => {
            if (!isDisabled && openLevel !== 'pais') e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span className="text-xs font-semibold mr-2" style={{ minWidth: '15px' }}>
            {selectedPaisName ? '▼' : '▶'}
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
            {selectedPaisName || 'PAÍS'}
          </span>
        </button>
        
        {/* Tooltip cuando está deshabilitado */}
        {isDisabled && (
          <div className="absolute bottom-full left-0 mb-2 px-2 py-1 text-xs bg-gray-900 text-yellow-300 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
            Volver al Mapa primero.
          </div>
        )}

        {openLevel === 'pais' && (
          <div className="ml-4 space-y-1">
            {paisesOptions.map((pais) => (
              <button
                key={pais.id}
                onClick={() => handleSelectPais(pais.id.toString())}
                className="flex items-center w-full h-10 px-4 transition-all duration-200"
                style={{
                  color: paisSeleccionado === pais.id.toString() ? TEMPLATE_COLORS.secondaryTextColor : TEMPLATE_COLORS.textColor,
                  backgroundColor: paisSeleccionado === pais.id.toString() ? TEMPLATE_COLORS.borderColor : 'transparent',
                  borderLeft: paisSeleccionado === pais.id.toString() ? `2px solid ${TEMPLATE_COLORS.secondaryTextColor}` : '2px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = TEMPLATE_COLORS.borderColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = paisSeleccionado === pais.id.toString() ? TEMPLATE_COLORS.borderColor : 'transparent';
                }}
              >
                <span style={{ fontSize: '0.8rem' }}>
                  {pais.name.toUpperCase()}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* EMPRESA */}
      {paisSeleccionado && (
        <div className="ml-4 space-y-1 relative group">
          <button
            onClick={handleEmpresaClick}
            disabled={isDisabled}
            className={`flex items-center w-full h-12 px-5 transition-all duration-200 ${
              isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
            style={{
              color: empresaSeleccionada ? TEMPLATE_COLORS.secondaryTextColor : TEMPLATE_COLORS.textColor,
              backgroundColor: !isDisabled && openLevel === 'empresa' ? TEMPLATE_COLORS.secondaryBgColor : 'transparent',
              borderLeft: `2px solid ${TEMPLATE_COLORS.borderColor}`,
              pointerEvents: isDisabled ? 'none' : 'auto'
            }}
            onMouseEnter={(e) => {
              if (!isDisabled && openLevel !== 'empresa') e.currentTarget.style.backgroundColor = TEMPLATE_COLORS.secondaryBgColor;
            }}
            onMouseLeave={(e) => {
              if (!isDisabled && openLevel !== 'empresa') e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span className="text-xs font-semibold mr-2" style={{ minWidth: '15px' }}>
              {selectedEmpresaName ? '▼' : '▶'}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
              {selectedEmpresaName || 'EMPRESA'}
            </span>
          </button>
          
          {/* Tooltip cuando está deshabilitado */}
          {isDisabled && (
            <div className="absolute bottom-full left-0 mb-2 px-2 py-1 text-xs bg-gray-900 text-yellow-300 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
              Volver al Mapa primero.
            </div>
          )}

          {openLevel === 'empresa' && (
            <div className="ml-4 space-y-1">
              {empresasOptions.map((empresa) => (
                <button
                  key={empresa.id}
                  onClick={() => handleSelectEmpresa(empresa.id.toString())}
                  className="flex items-center w-full h-10 px-4 transition-all duration-200"
                  style={{
                    color: empresaSeleccionada === empresa.id.toString() ? TEMPLATE_COLORS.secondaryTextColor : TEMPLATE_COLORS.textColor,
                    backgroundColor: empresaSeleccionada === empresa.id.toString() ? TEMPLATE_COLORS.borderColor : 'transparent',
                    borderLeft: empresaSeleccionada === empresa.id.toString() ? `2px solid ${TEMPLATE_COLORS.secondaryTextColor}` : '2px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = TEMPLATE_COLORS.borderColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = empresaSeleccionada === empresa.id.toString() ? TEMPLATE_COLORS.borderColor : 'transparent';
                  }}
                >
                  <span style={{ fontSize: '0.8rem' }}>
                    {empresa.name.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FUNDO */}
      {empresaSeleccionada && (
        <div className="ml-8 space-y-1 relative group">
          <button
            onClick={handleFundoClick}
            disabled={isDisabled}
            className={`flex items-center w-full h-12 px-5 transition-all duration-200 ${
              isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
            style={{
              color: fundoSeleccionado ? TEMPLATE_COLORS.secondaryTextColor : TEMPLATE_COLORS.textColor,
              backgroundColor: !isDisabled && openLevel === 'fundo' ? TEMPLATE_COLORS.secondaryBgColor : 'transparent',
              borderLeft: `2px solid ${TEMPLATE_COLORS.borderColor}`,
              pointerEvents: isDisabled ? 'none' : 'auto'
            }}
            onMouseEnter={(e) => {
              if (!isDisabled && openLevel !== 'fundo') e.currentTarget.style.backgroundColor = TEMPLATE_COLORS.secondaryBgColor;
            }}
            onMouseLeave={(e) => {
              if (!isDisabled && openLevel !== 'fundo') e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span className="text-xs font-semibold mr-2" style={{ minWidth: '15px' }}>
              {selectedFundoName ? '▼' : '▶'}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
              {selectedFundoName || 'FUNDO'}
            </span>
          </button>
          
          {/* Tooltip cuando está deshabilitado */}
          {isDisabled && (
            <div className="absolute bottom-full left-0 mb-2 px-2 py-1 text-xs bg-gray-900 text-yellow-300 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
              Volver al Mapa primero.
            </div>
          )}

          {openLevel === 'fundo' && (
            <div className="ml-4 space-y-1">
              {fundosOptions.map((fundo) => (
                <button
                  key={fundo.id}
                  onClick={() => handleSelectFundo(fundo.id.toString())}
                  className="flex items-center w-full h-10 px-4 transition-all duration-200"
                  style={{
                    color: fundoSeleccionado === fundo.id.toString() ? TEMPLATE_COLORS.secondaryTextColor : TEMPLATE_COLORS.textColor,
                    backgroundColor: fundoSeleccionado === fundo.id.toString() ? TEMPLATE_COLORS.borderColor : 'transparent',
                    borderLeft: fundoSeleccionado === fundo.id.toString() ? `2px solid ${TEMPLATE_COLORS.secondaryTextColor}` : '2px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = TEMPLATE_COLORS.borderColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = fundoSeleccionado === fundo.id.toString() ? TEMPLATE_COLORS.borderColor : 'transparent';
                  }}
                >
                  <span style={{ fontSize: '0.8rem' }}>
                    {fundo.name.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* UBICACIÓN */}
      {fundoSeleccionado && (
        <div className="ml-12 space-y-1 relative group">
          <button
            onClick={handleUbicacionClick}
            disabled={isDisabled}
            className={`flex items-center w-full h-12 px-5 transition-all duration-200 ${
              isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
            style={{
              color: ubicacionSeleccionada ? TEMPLATE_COLORS.secondaryTextColor : TEMPLATE_COLORS.textColor,
              backgroundColor: !isDisabled && openLevel === 'ubicacion' ? TEMPLATE_COLORS.secondaryBgColor : 'transparent',
              borderLeft: `2px solid ${TEMPLATE_COLORS.borderColor}`,
              pointerEvents: isDisabled ? 'none' : 'auto'
            }}
            onMouseEnter={(e) => {
              if (!isDisabled && openLevel !== 'ubicacion') e.currentTarget.style.backgroundColor = TEMPLATE_COLORS.secondaryBgColor;
            }}
            onMouseLeave={(e) => {
              if (!isDisabled && openLevel !== 'ubicacion') e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span className="text-xs font-semibold mr-2" style={{ minWidth: '15px' }}>
              {selectedUbicacionName ? '▼' : '▶'}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
              {selectedUbicacionName || 'UBICACIÓN'}
            </span>
          </button>
          
          {/* Tooltip cuando está deshabilitado */}
          {isDisabled && (
            <div className="absolute bottom-full left-0 mb-2 px-2 py-1 text-xs bg-gray-900 text-yellow-300 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
              Volver al Mapa primero.
            </div>
          )}

          {openLevel === 'ubicacion' && (
            <div className="ml-4 space-y-1">
              {ubicacionesOptions.map((ubicacion) => {
                const isSelected = ubicacionId === ubicacion.id.toString();
                return (
                  <button
                    key={ubicacion.id}
                    onClick={() => handleSelectUbicacion(ubicacion.id.toString())}
                    className="flex items-center w-full h-10 px-4 transition-all duration-200"
                    style={{
                      color: isSelected ? TEMPLATE_COLORS.secondaryTextColor : TEMPLATE_COLORS.textColor,
                      backgroundColor: isSelected ? TEMPLATE_COLORS.borderColor : 'transparent',
                      borderLeft: isSelected ? `2px solid ${TEMPLATE_COLORS.secondaryTextColor}` : '2px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = TEMPLATE_COLORS.borderColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isSelected ? TEMPLATE_COLORS.borderColor : 'transparent';
                    }}
                  >
                    <span style={{ fontSize: '0.8rem' }}>
                      {ubicacion.name.toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CollapsibleGlobalFilters;
